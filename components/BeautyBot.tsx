'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { authFetch } from '@/lib/apiClient';

interface Rec {
  title: string;
  type: string;
  timeline?: string;
  cost?: string;
  link?: string;
}

interface Msg {
  role: 'user' | 'assistant' | 'system';
  content: string;
  imageUrl?: string;
}

interface BeautyBotProps {
  image: string | null;
  features?: Array<{ name: string; isStrength: boolean; value?: number; deviation?: number }>;
  overallScore?: number;
  onAfterGenerated?: (url: string) => void;
}

export default function BeautyBot({
  image,
  features,
  overallScore,
  onAfterGenerated,
}: BeautyBotProps) {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'assistant',
      content:
        'Ask about Softmax routines, Hardmax options, products, or a new after photo. Specific questions get better answers.',
    },
  ]);
  const [input, setInput] = useState('');
  const [chatId, setChatId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [recs, setRecs] = useState<Rec[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const res = await authFetch('/api/beauty-chat', {
        method: 'POST',
        body: JSON.stringify({
          message: text,
          chatId,
          image,
          features,
          overallScore,
          generateAfter: /show|visual|after|before/i.test(text),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed');
      }

      const data = await res.json();
      setChatId(data.chatId);
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: data.reply,
          imageUrl: data.afterImageUrl || undefined,
        },
      ]);
      if (data.recommendations?.length) setRecs(data.recommendations);
      if (data.afterImageUrl) onAfterGenerated?.(data.afterImageUrl);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: err instanceof Error ? err.message : 'Something went wrong.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-white/10 bg-white/[0.02] flex flex-col h-[420px] max-h-[60vh]">
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
        <h3 className="text-sm font-medium text-white">Beauty Bot</h3>
        <span className="text-[10px] text-white/35 ml-auto">Subscriber</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-3 py-2 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#22c55e] text-black'
                  : 'bg-white/5 text-white/80'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={msg.imageUrl}
                  alt="AI after"
                  className="mt-2 w-full max-w-[180px]"
                />
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-xs text-white/35 px-1">Thinking…</div>
        )}
        <div ref={bottomRef} />
      </div>

      {recs.length > 0 && (
        <div className="px-4 pb-2 flex gap-3 overflow-x-auto text-xs">
          {recs.slice(0, 4).map((r, i) => (
            <a
              key={i}
              href={r.link || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 text-[#22c55e] underline underline-offset-2 decoration-white/20 hover:decoration-[#22c55e]"
            >
              {r.title}
            </a>
          ))}
        </div>
      )}

      <div className="p-3 border-t border-white/10 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Ask about routines, procedures, or after photos…"
          className="flex-1 bg-black border border-white/15 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#22c55e]/60"
        />
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={send}
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-[#22c55e] hover:bg-white disabled:opacity-40 text-black text-sm font-medium"
        >
          Send
        </motion.button>
      </div>
    </div>
  );
}
