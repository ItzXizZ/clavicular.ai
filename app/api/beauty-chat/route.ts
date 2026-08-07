import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { prisma } from '@/lib/db';
import { isPremiumUser } from '@/lib/subscription';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  imageUrl?: string;
}

interface BeautyChatRequest {
  message: string;
  chatId?: string;
  image?: string;
  features?: Array<{ name: string; isStrength: boolean; value?: number; deviation?: number }>;
  overallScore?: number;
  generateAfter?: boolean;
}

const SYSTEM_PROMPT = `You are Clavicular Beauty Bot, an expert facial aesthetics advisor.
You help users understand Softmax (non-invasive), Semimax (injectables), and Hardmax (surgical) options.
Be direct, specific, and actionable. Recommend procedures and products with realistic timelines and cost ranges.
Never use em dashes. When recommending surgeries, mention RealSelf-style research and board-certified surgeons; never sell surgery directly.
If the user asks to "show" or "visualize" results, set generate_after to true and describe the changes clearly.
Respond in JSON:
{
  "reply": "markdown-friendly advice",
  "recommendations": [{"title":"...","type":"SOFT|SEMI|HARD","timeline":"...","cost":"...","link":"..."}],
  "generate_after": false,
  "after_prompt": "optional edit prompt for their face photo"
}`;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { user, error } = await verifyAuth(request);
  if (!user) {
    return NextResponse.json({ error: error || 'Authentication required' }, { status: 401 });
  }

  const chats = await prisma.beautyChat.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    take: 20,
    select: { id: true, title: true, updatedAt: true, createdAt: true },
  });

  return NextResponse.json({ chats });
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
    return NextResponse.json(
      { error: 'Subscription required for Beauty Bot' },
      { status: 403 }
    );
  }

  try {
    const body: BeautyChatRequest = await request.json();
    const { message, chatId, image, features, overallScore, generateAfter } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    let chat = chatId
      ? await prisma.beautyChat.findFirst({ where: { id: chatId, userId: user.id } })
      : null;

    const history: ChatMessage[] = chat ? JSON.parse(chat.messages) : [];

    const contextBits: string[] = [];
    if (typeof overallScore === 'number') {
      contextBits.push(`Current score: ${overallScore.toFixed(1)}/10`);
    }
    if (features?.length) {
      const flaws = features.filter((f) => !f.isStrength).slice(0, 6);
      contextBits.push(
        `Top flaws: ${flaws.map((f) => f.name).join(', ') || 'none flagged'}`
      );
    }

    const userContent =
      contextBits.length > 0
        ? `${message}\n\n[Context: ${contextBits.join(' | ')}]`
        : message;

    history.push({ role: 'user', content: userContent });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history.slice(-12).map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
      temperature: 0.7,
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    let parsed: {
      reply: string;
      recommendations?: Array<{
        title: string;
        type: string;
        timeline?: string;
        cost?: string;
        link?: string;
      }>;
      generate_after?: boolean;
      after_prompt?: string;
    };

    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { reply: raw };
    }

    const replyText = String(parsed.reply || 'I can help you plan Softmax, Semimax, or Hardmax options.')
      .replace(/—/g, '. ')
      .replace(/–/g, '-');

    const assistantMsg: ChatMessage = {
      role: 'assistant',
      content: replyText,
    };
    history.push(assistantMsg);

    const title =
      chat?.title ||
      message.slice(0, 48) + (message.length > 48 ? '…' : '');

    if (chat) {
      chat = await prisma.beautyChat.update({
        where: { id: chat.id },
        data: { messages: JSON.stringify(history), title },
      });
    } else {
      chat = await prisma.beautyChat.create({
        data: {
          userId: user.id,
          title,
          messages: JSON.stringify(history),
        },
      });
    }

    // Optionally generate after image if bot or user requested
    let afterImageUrl: string | null = null;
    const shouldGenerate =
      generateAfter || parsed.generate_after || /show me|visualize|after|before.?after/i.test(message);

    if (shouldGenerate && image && parsed.after_prompt) {
      try {
        const origin = request.nextUrl.origin;
        const authHeader = request.headers.get('authorization');
        const transformRes = await fetch(`${origin}/api/transform-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authHeader ? { Authorization: authHeader } : {}),
          },
          body: JSON.stringify({
            image,
            promptOverride: parsed.after_prompt,
            features,
            source: 'beauty_bot',
            forceRegenerate: true,
          }),
        });
        if (transformRes.ok) {
          const t = await transformRes.json();
          afterImageUrl = t.afterImageUrl;
          if (afterImageUrl) {
            assistantMsg.imageUrl = afterImageUrl;
            history[history.length - 1] = assistantMsg;
            await prisma.beautyChat.update({
              where: { id: chat.id },
              data: { messages: JSON.stringify(history) },
            });
          }
        }
      } catch (e) {
        console.warn('[BeautyChat] Transform failed:', e);
      }
    }

    return NextResponse.json({
      chatId: chat.id,
      reply: parsed.reply,
      recommendations: parsed.recommendations || [],
      afterImageUrl,
      messages: history,
    });
  } catch (err) {
    console.error('[BeautyChat] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Chat failed' },
      { status: 500 }
    );
  }
}
