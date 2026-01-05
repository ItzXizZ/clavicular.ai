'use client';

import { useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import type { Landmark } from '@/lib/types';
import { 
  FEATURE_LANDMARK_MAP, 
} from '@/lib/featureLandmarks';
import { FACE_MESH_TESSELLATION } from '@/lib/faceMeshConnections';

interface FaceVisualizationProps {
  imageData: string;
  landmarks: Landmark[];
}

export default function FaceVisualization({ imageData, landmarks }: FaceVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { selectedFeatureId } = useAppStore();

  // Get the highlighted landmarks config
  const highlightConfig = useMemo(() => {
    if (!selectedFeatureId) return null;
    return FEATURE_LANDMARK_MAP[selectedFeatureId] || null;
  }, [selectedFeatureId]);

  // Draw the visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !landmarks.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Set canvas size to match container
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const imgAspect = img.width / img.height;
      const containerAspect = containerWidth / containerHeight;

      let drawWidth: number, drawHeight: number, offsetX: number, offsetY: number;

      if (imgAspect > containerAspect) {
        drawHeight = containerHeight;
        drawWidth = drawHeight * imgAspect;
        offsetX = (containerWidth - drawWidth) / 2;
        offsetY = 0;
      } else {
        drawWidth = containerWidth;
        drawHeight = drawWidth / imgAspect;
        offsetX = 0;
        offsetY = (containerHeight - drawHeight) / 2;
      }

      canvas.width = containerWidth;
      canvas.height = containerHeight;

      // Draw the image
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

      // Apply dark overlay for visibility
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Convert normalized landmark coordinates to canvas coordinates
      const toCanvasCoords = (landmark: Landmark) => ({
        x: offsetX + landmark.x * drawWidth,
        y: offsetY + landmark.y * drawHeight,
      });

      // Draw full mesh connections (all tessellation)
      ctx.strokeStyle = selectedFeatureId ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.2)';
      ctx.lineWidth = 0.5;
      
      for (const [idx1, idx2] of FACE_MESH_TESSELLATION) {
        if (landmarks[idx1] && landmarks[idx2]) {
          const p1 = toCanvasCoords(landmarks[idx1]);
          const p2 = toCanvasCoords(landmarks[idx2]);
          
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }

      // Draw ALL landmark points (478 total from MediaPipe)
      for (let idx = 0; idx < landmarks.length; idx++) {
        if (landmarks[idx]) {
          const pos = toCanvasCoords(landmarks[idx]);
          
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = selectedFeatureId ? 'rgba(34, 197, 94, 0.35)' : 'rgba(34, 197, 94, 0.6)';
          ctx.fill();
        }
      }

      // Draw highlighted feature if selected
      if (highlightConfig) {
        const { landmarkIndices, connections, color = '#22c55e' } = highlightConfig;

        // Draw highlighted connections with glow
        if (connections) {
          ctx.strokeStyle = color;
          ctx.lineWidth = 2.5;
          ctx.shadowColor = color;
          ctx.shadowBlur = 8;

          for (const [idx1, idx2] of connections) {
            if (landmarks[idx1] && landmarks[idx2]) {
              const p1 = toCanvasCoords(landmarks[idx1]);
              const p2 = toCanvasCoords(landmarks[idx2]);
              
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }

        // Draw highlighted landmark nodes
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;

        for (const idx of landmarkIndices) {
          if (landmarks[idx]) {
            const pos = toCanvasCoords(landmarks[idx]);
            
            // Outer glow ring
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 7, 0, Math.PI * 2);
            ctx.fillStyle = `${color}30`;
            ctx.fill();
            
            // Main node
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 4.5, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            
            // Center highlight
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
          }
        }

        ctx.shadowBlur = 0;
      }
    };

    img.src = imageData;
  }, [imageData, landmarks, selectedFeatureId, highlightConfig]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
      
    </div>
  );
}
