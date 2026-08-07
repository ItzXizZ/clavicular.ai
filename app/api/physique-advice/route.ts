import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { prisma } from '@/lib/db';
import OpenAI from 'openai';
import { isPremiumUser } from '@/lib/subscription';
import { uploadUserImage } from '@/lib/uploadUserImage';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function amazon(term: string): string {
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
    const { physiqueImage, overallScore, categoryScores, features } = body;

    if (!physiqueImage || typeof physiqueImage !== 'string') {
      return NextResponse.json({ error: 'Physique image is required' }, { status: 400 });
    }

    const flawNames = Array.isArray(features)
      ? features
          .filter((f: { isStrength?: boolean }) => !f.isStrength)
          .map((f: { name: string }) => f.name)
          .slice(0, 5)
          .join(', ')
      : 'none listed';

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an elite physique aesthetics coach for Clavicular Protocol (looksmaxxing-oriented).

Write comprehensive natural prose (4-6 short paragraphs separated by blank lines). No bullet lists, no numbered steps, no em dashes, no emoji.

You MUST:
1. Open with a direct assessment of their CURRENT physique from the photo (leanness, shoulder width, arm development, chest/back balance, posture, what is already working and what is lagging).
2. Prioritize shoulders and arms as the highest-ROI aesthetic muscles for attractiveness (lateral delts, rear delts, traps balance, biceps/triceps). Give a concrete weekly training emphasis (sets, frequency, example lifts like lateral raises, overhead press variations, face pulls, curls, pushdowns).
3. Recommend specific supplements with doses when appropriate, especially creatine monohydrate (5g/day), protein targets, and optionally vitamin D / fish oil if relevant.
4. Address body composition / leanmaxxing for facial angularity and how it pairs with their face scores.
5. Comment on skin presentation: whether a cautious tan (sun or quality self-tanner) would improve contrast and vascularity for their tone, or if they should skip it.
6. Optionally mention research-interest peptides (e.g. BPC-157, CJC/Ipamorelin, glow compounds) ONLY as topics to research with a licensed clinician, never as a prescription or instruction to source grey-market drugs. Keep this brief and cautious.
7. End with posture and recovery notes that support both face and frame.

Also return specific shoppable recommendations and link topics.

Return JSON:
{
  "advice": "4-6 paragraphs separated by blank lines",
  "physique_summary": "one sentence current-state snapshot",
  "recommendations": [
    { "name": "Creatine monohydrate", "why": "why for them", "search_term": "creatine monohydrate powder", "price_range": "$15-$30" }
  ],
  "link_topics": ["creatine", "lateral raise guide", "protein calculator", "self tanner"]
}`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Face score ${typeof overallScore === 'number' ? overallScore.toFixed(1) : 'n/a'}/10. Category scores: harmony ${categoryScores?.harm ?? '?'}, angularity ${categoryScores?.angu ?? '?'}, dimorphism ${categoryScores?.dimo ?? '?'}. Facial priorities: ${flawNames}.

Review this physique photo in detail. Be specific about what you see. Prioritize shoulder/arm aesthetics and give actionable training, supplement, tanning, and (if relevant) peptide-research guidance tied to their facial goals.`,
            },
            {
              type: 'image_url',
              image_url: { url: physiqueImage },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.65,
      max_tokens: 1600,
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('No response');

    const parsed = JSON.parse(content) as {
      advice?: string;
      physique_summary?: string;
      recommendations?: Array<{
        name: string;
        why: string;
        search_term?: string;
        price_range?: string;
      }>;
      link_topics?: string[];
    };

    const catalog: Record<string, { title: string; url: string }> = {
      creatine: { title: 'Creatine monohydrate', url: amazon('creatine monohydrate powder micronized') },
      protein: { title: 'Protein needs calculator', url: 'https://www.calculator.net/protein-calculator.html' },
      'lateral': {
        title: 'Lateral raise form guide',
        url: 'https://www.strengthlog.com/lateral-raise/',
      },
      shoulder: {
        title: 'Shoulder hypertrophy overview',
        url: 'https://www.strongerbyscience.com/shoulder-anatomy/',
      },
      hypertrophy: {
        title: 'Evidence-based hypertrophy guide',
        url: 'https://www.strongerbyscience.com/hypertrophy-range-fact-or-fiction/',
      },
      tanner: {
        title: 'Quality self-tanner options',
        url: amazon('mens self tanner lotion natural'),
      },
      tan: {
        title: 'Self-tanner options',
        url: amazon('mens self tanner lotion natural'),
      },
      'body fat': {
        title: 'Body fat estimation overview',
        url: 'https://examine.com/outcomes/body-fat/',
      },
      calorie: { title: 'TDEE calculator', url: 'https://tdeecalculator.net/' },
      examine: { title: 'Creatine research (Examine)', url: 'https://examine.com/supplements/creatine/' },
      peptide: {
        title: 'Peptide research overview (educational)',
        url: 'https://examine.com/',
      },
    };

    const recommendations = (parsed.recommendations || []).slice(0, 6).map((r) => ({
      name: r.name,
      why: r.why,
      price: r.price_range,
      url: r.search_term ? amazon(r.search_term) : undefined,
    }));

    // Ensure creatine is always present if model omitted it
    if (!recommendations.some((r) => r.name.toLowerCase().includes('creatine'))) {
      recommendations.unshift({
        name: 'Creatine monohydrate (5g daily)',
        why: 'Most evidence-backed supplement for training output and lean mass support, which helps shoulder and arm growth over time.',
        price: '$15-$30',
        url: amazon('creatine monohydrate powder micronized'),
      });
    }

    const links: { title: string; url: string }[] = [];
    for (const topic of parsed.link_topics || []) {
      const key = Object.keys(catalog).find((k) => topic.toLowerCase().includes(k));
      if (key && !links.some((l) => l.url === catalog[key].url)) links.push(catalog[key]);
    }
    if (links.length === 0) {
      links.push(catalog.creatine, catalog.lateral, catalog.protein, catalog.tanner);
    }

    // Persist the photo as a durable URL so the account keeps the image
    let physiqueImageUrl: string | null = null;
    if (physiqueImage.startsWith('http')) {
      physiqueImageUrl = physiqueImage;
    } else {
      physiqueImageUrl = await uploadUserImage(physiqueImage, user.id, 'physique');
    }

    const advice = (parsed.advice || '').replace(/—/g, '. ').replace(/–/g, '-');

    return NextResponse.json({
      advice,
      summary: parsed.physique_summary || null,
      recommendations,
      links: links.slice(0, 5),
      physiqueImageUrl,
    });
  } catch (err) {
    console.error('[Physique advice]', err);
    return NextResponse.json({ error: 'Failed to analyze physique' }, { status: 500 });
  }
}
