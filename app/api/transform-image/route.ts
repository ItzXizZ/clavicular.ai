import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { prisma } from '@/lib/db';
import { isPremiumUser } from '@/lib/subscription';
import OpenAI, { toFile } from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface TransformRequest {
  image: string; // base64 data URL
  features?: Array<{ name: string; isStrength: boolean; deviation?: number; value?: number }>;
  fixes?: string[];
  promptOverride?: string;
  analysisSessionId?: string;
  source?: 'protocol' | 'beauty_bot' | 'rescan';
  forceRegenerate?: boolean;
}

function buildTransformPrompt(
  features: TransformRequest['features'],
  fixes: string[] | undefined,
  promptOverride?: string
): string {
  if (promptOverride) return promptOverride;

  const flaws = (features || [])
    .filter((f) => !f.isStrength)
    .slice(0, 6)
    .map((f) => f.name);

  const fixList = fixes && fixes.length > 0 ? fixes.slice(0, 8) : flaws;

  return [
    'Edit this exact photo of this exact person to show a CLEAR, convincing improvement in looks. Someone comparing before and after should immediately notice the difference.',
    'Preserve identity: same person, age, gender, ethnicity, skin tone family, hair color/style family, expression, pose, camera angle, framing, and background.',
    'Keep photorealism and similar lighting/quality to the original (no magazine photoshoot swap, no different person).',
    fixList.length
      ? `Visibly improve these areas in a realistic way: ${fixList.join(', ')}.`
      : 'Visibly improve skin clarity, jawline definition, midface support, eye openness, and overall facial harmony.',
    'Make the improvements obvious but still believable as 3-12 months of dedicated Softmax/Hardmax progress: sharper jaw/cheek definition where relevant, clearer skin, better facial balance, healthier look.',
    'Do not leave the face looking unchanged. Do not add unrelated props, text, or a different identity.',
  ].join(' ');
}

async function uploadAfterImage(base64: string, userId: string): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !serviceKey) {
    // Fallback: return data URL (works for display; not ideal for persistence)
    return `data:image/png;base64,${base64}`;
  }

  try {
    const supabase = createClient(supabaseUrl, serviceKey);
    const buffer = Buffer.from(base64, 'base64');
    const fileName = `transforms/${userId}/${Date.now()}.png`;

    const { data, error } = await supabase.storage
      .from('leaderboard-faces')
      .upload(fileName, buffer, { contentType: 'image/png', upsert: true });

    if (error) {
      console.error('[Transform] Upload error:', error);
      return `data:image/png;base64,${base64}`;
    }

    const { data: urlData } = supabase.storage
      .from('leaderboard-faces')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (err) {
    console.error('[Transform] Upload failed:', err);
    return `data:image/png;base64,${base64}`;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { user, error } = await verifyAuth(request);

  // Allow unauthenticated preview generation is expensive — require auth
  if (!user) {
    return NextResponse.json(
      { error: error || 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const body: TransformRequest = await request.json();
    const {
      image,
      features,
      fixes,
      promptOverride,
      analysisSessionId,
      source = 'protocol',
      forceRegenerate = false,
    } = body;

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        accessTier: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        currentPeriodEnd: true,
      },
    });

    const premium = isPremiumUser(dbUser);

    // Cache hit
    if (analysisSessionId && !forceRegenerate) {
      const session = await prisma.analysisSession.findUnique({
        where: { id: analysisSessionId },
        select: {
          afterImageUrl: true,
          beforeImageUrl: true,
          afterPrompt: true,
        },
      });
      if (session?.afterImageUrl) {
        return NextResponse.json({
          beforeImageUrl: session.beforeImageUrl || image,
          afterImageUrl: session.afterImageUrl,
          afterPrompt: session.afterPrompt,
          locked: !premium,
          cached: true,
        });
      }
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Image generation not configured' },
        { status: 503 }
      );
    }

    const prompt = buildTransformPrompt(features, fixes, promptOverride);

    // Prepare image file for edits API
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    const file = await toFile(imageBuffer, 'face.png', { type: 'image/png' });

    const result = await openai.images.edit({
      // gpt-image-2 (OpenAI's newest image model) — stronger identity
      // preservation on edits, always processes inputs at high fidelity
      // (input_fidelity isn't a valid param for this model).
      model: 'gpt-image-2',
      image: file,
      prompt,
      quality: 'high',
      size: '1024x1024',
    });

    const b64 = result.data?.[0]?.b64_json;
    if (!b64) {
      return NextResponse.json(
        { error: 'No image returned from AI' },
        { status: 502 }
      );
    }

    const afterImageUrl = await uploadAfterImage(b64, user.id);
    if (!afterImageUrl) {
      return NextResponse.json({ error: 'Failed to store after image' }, { status: 500 });
    }

    // Persist on session + transformation history
    if (analysisSessionId) {
      try {
        await prisma.analysisSession.update({
          where: { id: analysisSessionId },
          data: {
            beforeImageUrl: image.startsWith('http') ? image : undefined,
            afterImageUrl,
            afterPrompt: prompt,
            afterGeneratedAt: new Date(),
          },
        });
      } catch (e) {
        console.warn('[Transform] Session update skipped:', e);
      }
    }

    try {
      await prisma.transformation.create({
        data: {
          userId: user.id,
          analysisSessionId: analysisSessionId || null,
          beforeImageUrl: image.startsWith('data:') ? afterImageUrl : image,
          afterImageUrl,
          afterPrompt: prompt,
          source,
        },
      });
    } catch (e) {
      console.warn('[Transform] History create skipped:', e);
    }

    return NextResponse.json({
      beforeImageUrl: image,
      afterImageUrl,
      afterPrompt: prompt,
      locked: !premium,
      cached: false,
    });
  } catch (err) {
    console.error('[Transform] Error:', err);
    const message = err instanceof Error ? err.message : 'Transform failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
