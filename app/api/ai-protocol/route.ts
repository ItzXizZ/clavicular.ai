import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { prisma } from '@/lib/db';
import OpenAI from 'openai';
import { isPremiumUser } from '@/lib/subscription';
import { linkForRecommendation } from '@/lib/productLinks';
import type { FeatureAnalysis, ProtocolRecommendation, Product } from '@/lib/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AIProtocolRequest {
  features: FeatureAnalysis[];
  overallScore: number;
  categoryScores: {
    harm: number;
    misc: number;
    angu: number;
    dimo: number;
  };
  protocolType: 'softmax' | 'hardmax';
}

interface AIRecommendation {
  issue: string;
  severity: 'mild' | 'moderate' | 'severe';
  fix: {
    title: string;
    explanation: string;
    timeline: string;
    products: {
      name: string;
      brand?: string;
      price_range: string;
      why: string;
      amazon_search_term?: string;
    }[];
  };
  impact_score: number;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Verify authentication
  const { user, error } = await verifyAuth(request);
  
  if (!user) {
    return NextResponse.json(
      { error: error || 'Authentication required' },
      { status: 401 }
    );
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
    return NextResponse.json(
      { error: 'Subscription required for AI recommendations' },
      { status: 403 }
    );
  }

  try {
    const body: AIProtocolRequest = await request.json();
    const { features, overallScore, categoryScores, protocolType } = body;

    // Get flaws (non-strengths)
    const flaws = features
      .filter(f => !f.isStrength)
      .sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation))
      .slice(0, 6);

    // Get strengths for context
    const strengths = features
      .filter(f => f.isStrength)
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);

    const systemPrompt = `You are an expert facial aesthetics consultant writing for Clavicular Protocol. You provide personalized, science-backed recommendations in natural prose.

Rules:
- Specific and actionable, prioritized by impact
- Include real products with approximate price ranges
- ${protocolType === 'softmax' ? 'Non-invasive only (no surgery, no injectables)' : 'Include all options including surgical and injectable procedures'}
- Write explanations as 2-3 flowing sentences. No bullet lists inside explanations. Never use em dashes. Avoid stiff numbered "step 1 / step 2" language.
- Mention timeline naturally inside the explanation (e.g. "Most people notice changes within 8-12 weeks").

For each issue, provide a clear issue statement, a named fix, a prose explanation, products with real brands when possible, and an impact score (0.1-1.0).`;

    const userPrompt = `Analyze this person's facial features and provide personalized improvement recommendations.

**Overall Score:** ${overallScore.toFixed(1)}/10

**Category Scores:**
- Harmony: ${categoryScores.harm.toFixed(1)}/10
- Angularity: ${categoryScores.angu.toFixed(1)}/10
- Dimorphism: ${categoryScores.dimo.toFixed(1)}/10
- Misc Features: ${categoryScores.misc.toFixed(1)}/10

**Top Flaws to Address:**
${flaws.map(f => `- ${f.name}: ${f.value.toFixed(1)}/10 (Ideal: ${f.ideal}, Category: ${f.category})`).join('\n')}

**Current Strengths:**
${strengths.map(f => `- ${f.name}: ${f.value.toFixed(1)}/10`).join('\n')}

Protocol type: ${protocolType === 'softmax' ? 'NON-INVASIVE ONLY' : 'ALL OPTIONS INCLUDING SURGICAL'}

Provide 4-6 specific, personalized recommendations in this exact JSON format:
{
  "recommendations": [
    {
      "issue": "Clear description of the issue",
      "severity": "mild|moderate|severe",
      "fix": {
        "title": "Name of the fix/protocol",
        "explanation": "2-3 sentence explanation of why and how this works",
        "timeline": "Expected timeframe for results",
        "products": [
          {
            "name": "Product name",
            "brand": "Brand name",
            "price_range": "$XX-$XX",
            "why": "Why this product specifically",
            "amazon_search_term": "search term for finding on Amazon"
          }
        ]
      },
      "impact_score": 0.5
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 2000
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    const aiResponse = JSON.parse(content) as { recommendations: AIRecommendation[] };

    // Transform AI recommendations to our protocol format
    const protocols: ProtocolRecommendation[] = aiResponse.recommendations.map((rec, index) => ({
      issue: rec.issue,
      fix: {
        title: rec.fix.title,
        explanation: rec.fix.explanation + (rec.fix.timeline ? ` Timeline: ${rec.fix.timeline}` : ''),
        products: rec.fix.products.map((p, i) => ({
          id: `ai-product-${index}-${i}`,
          name: p.name,
          brand: p.brand,
          price: p.price_range,
          url: linkForRecommendation(
            p.name,
            protocolType === 'hardmax' ? 'HARD' : 'SOFT',
            p.amazon_search_term
          ),
          imageUrl: undefined,
        }))
      },
      impactScore: rec.impact_score
    }));

    // Sort by impact score
    protocols.sort((a, b) => b.impactScore - a.impactScore);

    console.log(`[AI Protocol] Generated ${protocols.length} recommendations for user ${user.id}`);

    return NextResponse.json({ 
      protocols,
      generatedAt: new Date().toISOString(),
      protocolType
    });
  } catch (err) {
    console.error('AI Protocol error:', err);
    return NextResponse.json(
      { error: 'Failed to generate AI recommendations' },
      { status: 500 }
    );
  }
}

