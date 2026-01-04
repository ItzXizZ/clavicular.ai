'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import type { ProtocolRecommendation as ProtocolType, Product } from '@/lib/types';

interface ProtocolRecommendationProps {
  protocols: ProtocolType[];
}

// Product card component with image and link
function ProductCard({ product, index }: { product: Product; index: number }) {
  const [imageError, setImageError] = useState(false);
  
  return (
    <motion.a
      href={product.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group flex items-center gap-3 p-2 rounded-lg bg-zinc-900/50 hover:bg-zinc-800/70 border border-zinc-800/50 hover:border-zinc-700 transition-all cursor-pointer"
    >
      {/* Product Image */}
      <div className="relative w-12 h-12 rounded-md overflow-hidden bg-zinc-800 flex-shrink-0">
        {product.imageUrl && !imageError ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        )}
      </div>
      
      {/* Product Info */}
      <div className="flex-1 min-w-0">
        {product.brand && (
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider truncate">{product.brand}</p>
        )}
        <p className="text-xs text-zinc-200 font-medium truncate group-hover:text-white transition-colors">
          {product.name}
        </p>
      </div>
      
      {/* Price and Link Icon */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs font-semibold text-[#22c55e]">{product.price}</span>
        {product.url && (
          <svg 
            className="w-3.5 h-3.5 text-zinc-500 group-hover:text-[#22c55e] transition-colors" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        )}
      </div>
    </motion.a>
  );
}

// Expanded protocol card with more details
function ProtocolCard({ 
  protocol, 
  index, 
  isExpanded, 
  onToggle 
}: { 
  protocol: ProtocolType; 
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -20, opacity: 0 }}
      transition={{ delay: index * 0.1 }}
      className="protocol-card rounded-xl overflow-hidden"
    >
      {/* Header - Always visible */}
      <button
        onClick={onToggle}
        className="w-full p-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        {/* Issue */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
          <span className="text-xs text-zinc-400 uppercase tracking-wide">Issue</span>
        </div>
        <p className="text-sm text-zinc-300 mb-3">{protocol.issue}</p>
        
        {/* Fix Title */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 mb-1">Fix:</p>
            <h4 className="text-sm font-semibold text-white">
              1. {protocol.fix.title}
            </h4>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-zinc-500"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              {/* Explanation */}
              <div className="bg-black/30 rounded-lg p-3 mb-3">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  2. {protocol.fix.explanation}
                </p>
              </div>
              
              {/* Products Grid */}
              {protocol.fix.products.length > 0 && (
                <div>
                  <p className="text-xs text-zinc-500 mb-2 flex items-center gap-2">
                    <span>3. Recommended Products</span>
                    <span className="text-[10px] text-zinc-600">({protocol.fix.products.length})</span>
                  </p>
                  <div className="flex flex-col gap-2">
                    {protocol.fix.products.map((product, i) => (
                      <ProductCard key={product.id} product={product} index={i} />
                    ))}
                  </div>
                </div>
              )}

              {/* Impact score */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800/50">
                <span className="text-[10px] text-zinc-500">Expected impact</span>
                <span className="text-xs font-medium text-[#22c55e]">
                  +{protocol.impactScore.toFixed(1)} pts
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed Impact Preview */}
      {!isExpanded && (
        <div className="px-4 pb-4">
          {/* Compact Product Preview */}
          {protocol.fix.products.length > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex -space-x-2">
                {protocol.fix.products.slice(0, 3).map((product, i) => (
                  <div 
                    key={product.id}
                    className="w-8 h-8 rounded-md bg-zinc-800 border-2 border-zinc-900 overflow-hidden"
                    style={{ zIndex: 3 - i }}
                  >
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt="" 
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {protocol.fix.products.length > 3 && (
                <span className="text-[10px] text-zinc-500">+{protocol.fix.products.length - 3} more</span>
              )}
              <span className="text-[10px] text-zinc-600 ml-auto">Tap to expand</span>
            </div>
          )}
          
          <div className="flex items-center justify-between pt-3 border-t border-zinc-800/50">
            <span className="text-[10px] text-zinc-500">Expected impact</span>
            <span className="text-xs font-medium text-[#22c55e]">
              +{protocol.impactScore.toFixed(1)} pts
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function ProtocolRecommendation({ protocols }: ProtocolRecommendationProps) {
  const { protocolType } = useAppStore();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  
  // Filter protocols based on type (softmax = non-invasive, hardmax = includes surgical)
  const filteredProtocols = protocols
    .filter(p => {
      if (protocolType === 'softmax') {
        // Exclude obvious surgical/invasive procedures
        const title = p.fix.title.toLowerCase();
        const isInvasive = 
          title.includes('surgery') || 
          title.includes('implant') ||
          title.includes('bsso') ||
          title.includes('bimax') ||
          title.includes('osteotomy') ||
          title.includes('rhinoplasty') ||
          title.includes('blepharoplasty') ||
          title.includes('canthoplasty') ||
          title.includes('transplant') ||
          title.includes('genioplasty') ||
          title.includes('removal') ||
          title.includes('co2 laser');
        return !isInvasive;
      }
      return true;
    })
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, 8);

  if (filteredProtocols.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <p className="text-zinc-400 text-sm mb-1">No {protocolType} recommendations</p>
        <p className="text-zinc-600 text-xs">Try switching to {protocolType === 'softmax' ? 'hardmax' : 'softmax'} for more options</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1 mb-1">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${protocolType === 'softmax' ? 'text-blue-400' : 'text-orange-400'}`}>
            {protocolType === 'softmax' ? '🧴 Non-Invasive' : '💉 All Methods'}
          </span>
          <span className="text-[10px] text-zinc-600">
            {filteredProtocols.length} recommendation{filteredProtocols.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Protocol Cards */}
      <AnimatePresence mode="wait">
        {filteredProtocols.map((protocol, index) => (
          <ProtocolCard
            key={`${protocol.issue}-${index}`}
            protocol={protocol}
            index={index}
            isExpanded={expandedIndex === index}
            onToggle={() => setExpandedIndex(expandedIndex === index ? null : index)}
          />
        ))}
      </AnimatePresence>

      {/* Shop All CTA */}
      {filteredProtocols.some(p => p.fix.products.some(prod => prod.url)) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-2 p-3 rounded-lg bg-gradient-to-r from-zinc-900 to-zinc-800/50 border border-zinc-700/30"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-300 font-medium">Quick Shop</p>
              <p className="text-[10px] text-zinc-500">All products link to Amazon or brand sites</p>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-zinc-500">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Verified links</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
