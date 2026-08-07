'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import type { ProtocolRecommendation as ProtocolType, Product } from '@/lib/types';

interface ProtocolRecommendationProps {
  protocols: ProtocolType[];
  mode: 'softmax' | 'hardmax';
}

function ProductLink({ product }: { product: Product }) {
  const label = product.brand ? `${product.brand} ${product.name}` : product.name;
  if (!product.url) {
    return (
      <span className="text-[#22c55e]">
        {label}
        {product.price ? ` (${product.price})` : ''}
      </span>
    );
  }
  return (
    <a
      href={product.url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#22c55e] underline underline-offset-2 decoration-white/20 hover:decoration-[#22c55e] transition-colors"
    >
      {label}
      {product.price ? ` (${product.price})` : ''}
    </a>
  );
}

function AdviceEntry({
  protocol,
  isOpen,
  onToggle,
}: {
  protocol: ProtocolType;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const products = protocol.fix.products;
  const lead = products.length === 1 ? products[0] : null;

  return (
    <article className="border-b border-white/10 py-6 first:pt-0">
      <button type="button" onClick={onToggle} className="w-full text-left group">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-base sm:text-lg font-medium text-white group-hover:text-[#22c55e] transition-colors">
            {protocol.fix.title}
          </h3>
          <span className="text-[11px] tabular-nums text-[#22c55e] flex-shrink-0">
            +{protocol.impactScore.toFixed(1)}
          </span>
        </div>
        <p className="text-sm text-white/45 mt-1.5 leading-relaxed">{protocol.issue}</p>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-3 text-sm text-white/75 leading-[1.7]">
              <p>{protocol.fix.explanation}</p>

              {lead && (
                <p>
                  Start with <ProductLink product={lead} />, which matches this priority most
                  closely.
                </p>
              )}

              {products.length > 1 && (
                <p>
                  Useful options to compare:{' '}
                  {products.map((product, i) => (
                    <span key={product.id}>
                      <ProductLink product={product} />
                      {i < products.length - 2 ? ', ' : i === products.length - 2 ? ', and ' : '.'}
                    </span>
                  ))}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && products.length > 0 && (
        <p className="mt-3 text-xs text-white/35">
          Includes{' '}
          <button type="button" onClick={onToggle} className="text-white/55 hover:text-[#22c55e]">
            {products.length} linked option{products.length !== 1 ? 's' : ''}
          </button>
        </p>
      )}
    </article>
  );
}

export default function ProtocolRecommendation({ protocols, mode }: ProtocolRecommendationProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const sorted = [...protocols].sort((a, b) => b.impactScore - a.impactScore).slice(0, 8);

  if (sorted.length === 0) {
    return (
      <div className="py-12">
        <p className="text-sm text-white/55 leading-relaxed max-w-md">
          No {mode} guidance yet. Use refresh to generate a write-up for this section.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.18em] text-white/35 mb-6">
        {mode === 'softmax' ? 'Non-invasive focus' : 'Full spectrum'} · {sorted.length} priorit
        {sorted.length === 1 ? 'y' : 'ies'}
      </p>

      {sorted.map((protocol, index) => (
        <AdviceEntry
          key={`${protocol.issue}-${index}`}
          protocol={protocol}
          isOpen={openIndex === index}
          onToggle={() => setOpenIndex(openIndex === index ? null : index)}
        />
      ))}
    </div>
  );
}
