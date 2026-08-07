import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { prisma } from '@/lib/db';
import OpenAI, { toFile } from 'openai';
import { isPremiumUser } from '@/lib/subscription';
import { uploadUserImage } from '@/lib/uploadUserImage';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function amazonSearch(term: string): string {
  return `https://www.amazon.com/s?k=${encodeURIComponent(term)}`;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { user, error } = await verifyAuth(request);
  if (!user) {
    return NextResponse.json({ error: error || 'Authentication required' }, { status: 401 });
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

  if (!isPremiumUser(dbUser)) {
    return NextResponse.json({ error: 'Subscription required' }, { status: 403 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const {
      faceImage,
      fullBodyImage,
      clothingImages = [],
      overallScore,
      features,
      generateFit = false,
    } = body as {
      faceImage?: string;
      fullBodyImage?: string;
      clothingImages?: string[];
      overallScore?: number;
      features?: Array<{ name: string; isStrength: boolean; value?: number }>;
      generateFit?: boolean;
    };

    if (generateFit && !fullBodyImage) {
      return NextResponse.json(
        { error: 'A full-body photo is required to generate fit combinations' },
        { status: 400 }
      );
    }

    const strengths = (features || [])
      .filter((f) => f.isStrength)
      .map((f) => f.name)
      .slice(0, 4)
      .join(', ');

    const contentParts: OpenAI.Chat.ChatCompletionContentPart[] = [
      {
        type: 'text',
        text: `You are styling this person for Clavicular Protocol.

Face score ${typeof overallScore === 'number' ? overallScore.toFixed(1) : 'n/a'}/10. Facial strengths: ${strengths || 'balanced features'}.
${fullBodyImage ? 'A full-body photo is included. Read proportions, posture, and skin tone from it.' : 'No full-body photo; use the face photo for skin tone if available.'}
${clothingImages.length ? `They uploaded ${clothingImages.length} wardrobe item photo(s). Build recommendations around those pieces first, then suggest complementary items.` : 'No wardrobe photos yet. Recommend a starter wardrobe that flatters face and skin tone.'}

Write 2-3 short prose paragraphs (no bullets, no em dashes, no emoji). Estimate skin tone / undertone. Recommend specific garments that match skin tone AND work with their existing wardrobe when provided.

Return JSON:
{
  "advice": "prose paragraphs separated by blank lines",
  "skin_tone": "e.g. light-medium warm olive",
  "recommendations": [
    { "name": "Item name", "why": "one sentence why it matches skin tone and wardrobe", "search_term": "amazon search", "price_range": "$XX-$XX" }
  ],
  "fit_prompts": [
    "Prompt to edit the FULL BODY photo into outfit combo 1 using wardrobe pieces and/or recommended colors",
    "Prompt for combo 2",
    "Prompt for combo 3"
  ],
  "link_topics": ["olive tees", "earth tone jacket"]
}

Provide 3-5 recommendations and exactly 3 fit_prompts when a full-body image is present.`,
      },
    ];

    if (fullBodyImage) {
      contentParts.push({ type: 'image_url', image_url: { url: fullBodyImage } });
    } else if (faceImage) {
      contentParts.push({ type: 'image_url', image_url: { url: faceImage } });
    }

    for (const img of clothingImages.slice(0, 4)) {
      contentParts.push({ type: 'image_url', image_url: { url: img } });
    }

    const adviceResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a menswear consultant specializing in color analysis and wardrobe building. Prefer natural prose. Never use em dashes.',
        },
        { role: 'user', content: contentParts },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.65,
      max_tokens: 1400,
    });

    const raw = adviceResponse.choices[0].message.content;
    if (!raw) throw new Error('No fashion response');

    const parsed = JSON.parse(raw) as {
      advice?: string;
      skin_tone?: string;
      recommendations?: Array<{
        name: string;
        why: string;
        search_term?: string;
        price_range?: string;
      }>;
      fit_prompts?: string[];
      link_topics?: string[];
    };

    const recommendations = (parsed.recommendations || []).slice(0, 5).map((r) => ({
      name: r.name,
      why: r.why,
      price: r.price_range,
      url: r.search_term ? amazonSearch(r.search_term) : undefined,
    }));

    const links = (parsed.link_topics || []).slice(0, 4).map((topic) => ({
      title: topic,
      url: amazonSearch(topic),
    }));

    // Persist full-body photo for the account
    let fullBodyImageUrl: string | null = null;
    if (fullBodyImage) {
      fullBodyImageUrl = fullBodyImage.startsWith('http')
        ? fullBodyImage
        : await uploadUserImage(fullBodyImage, user.id, 'fashion');
    }

    const fitImages: string[] = [];

    if (generateFit && fullBodyImage) {
      const prompts = (parsed.fit_prompts || []).slice(0, 3);
      const fallbackPrompts = [
        'Restyle this full-body photo into a clean everyday outfit that flatters skin tone. Preserve identity and body exactly.',
        'Restyle this full-body photo into a sharper elevated casual look using complementary colors for their skin tone. Preserve identity.',
        'Restyle this full-body photo into a weekend look built from wardrobe-adjacent pieces. Preserve identity and proportions.',
      ];
      const toRun = prompts.length > 0 ? prompts : fallbackPrompts;

      const base64Data = fullBodyImage.replace(/^data:image\/\w+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');

      for (let i = 0; i < toRun.length; i++) {
        const prompt = [
          toRun[i],
          'This is a FULL BODY photo. Keep the same person, face, skin tone, hair, body, and pose.',
          clothingImages.length
            ? 'Incorporate the uploaded wardrobe pieces where they fit; fill gaps with skin-tone-friendly complementary items.'
            : 'Use colors and fabrics that flatter the detected skin tone.',
          'Photorealistic. No text overlays. No face swap.',
        ].join(' ');

        const file = await toFile(imageBuffer, 'body.png', { type: 'image/png' });
        const result = await openai.images.edit({
          model: 'gpt-image-1',
          image: file,
          prompt,
          input_fidelity: 'high',
          quality: 'high',
          size: '1024x1024',
        });
        const b64 = result.data?.[0]?.b64_json;
        if (b64) {
          const url = await uploadUserImage(
            `data:image/png;base64,${b64}`,
            user.id,
            'fashion'
          );
          if (url) fitImages.push(url);
        }
      }
    }

    return NextResponse.json({
      advice: (parsed.advice || '').replace(/—/g, '. ').replace(/–/g, '-'),
      skinTone: parsed.skin_tone || null,
      recommendations,
      links,
      fitImages,
      fitImageUrl: fitImages[0] || null,
      fullBodyImageUrl,
    });
  } catch (err) {
    console.error('[Fashion advice]', err);
    const message = err instanceof Error ? err.message : 'Failed to generate fashion advice';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
