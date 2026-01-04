'use client';

import { useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import type { Landmark } from '@/lib/types';
import { 
  FEATURE_LANDMARK_MAP, 
} from '@/lib/featureLandmarks';

// 100 key anatomical landmarks for visualization
// Selected for comprehensive face coverage while maintaining clarity
const KEY_LANDMARKS: number[] = [
  // Face oval / contour (17 points)
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 152,
  // Forehead (5 points)
  67, 109, 108, 69, 104,
  // Left eyebrow (6 points)
  70, 63, 105, 66, 107, 55,
  // Right eyebrow (6 points)  
  300, 293, 334, 296, 336, 285,
  // Left eye (8 points)
  33, 7, 163, 144, 145, 153, 154, 155,
  // Right eye (8 points)
  263, 249, 390, 373, 374, 380, 381, 382,
  // Nose bridge & tip (8 points)
  168, 6, 197, 195, 5, 4, 1, 19,
  // Nose wings (4 points)
  129, 358, 98, 327,
  // Upper lip (8 points)
  61, 185, 40, 39, 37, 267, 269, 270,
  // Lower lip (6 points)
  146, 91, 181, 84, 17, 314,
  // Mouth corners (2 points)
  78, 308,
  // Cheekbones (4 points)
  234, 454, 227, 447,
  // Jaw line (8 points)
  172, 136, 150, 149, 176, 148, 377, 400,
  // Under eyes (4 points)
  111, 117, 346, 340,
  // Chin area (4 points)
  175, 396, 369, 395,
  // Additional precision points (2 points)
  9, 164,
];

// Connections for the 100-point mesh
const KEY_CONNECTIONS: [number, number][] = [
  // Face oval
  [10, 338], [338, 297], [297, 332], [332, 284], [284, 251], [251, 389],
  [389, 356], [356, 454], [454, 323], [323, 361], [361, 288], [288, 397],
  [397, 365], [365, 379], [379, 378], [378, 152],
  [152, 148], [148, 176], [176, 149], [149, 150], [150, 136], [136, 172],
  [172, 234], [234, 227], [227, 67], [67, 109], [109, 10],
  
  // Left eyebrow
  [70, 63], [63, 105], [105, 66], [66, 107], [107, 55],
  
  // Right eyebrow
  [300, 293], [293, 334], [334, 296], [296, 336], [336, 285],
  
  // Left eye
  [33, 7], [7, 163], [163, 144], [144, 145], [145, 153], [153, 154], [154, 155], [155, 33],
  
  // Right eye
  [263, 249], [249, 390], [390, 373], [373, 374], [374, 380], [380, 381], [381, 382], [382, 263],
  
  // Nose
  [168, 6], [6, 197], [197, 195], [195, 5], [5, 4], [4, 1],
  [1, 19], [1, 129], [1, 358],
  [129, 98], [358, 327],
  
  // Upper lip
  [61, 185], [185, 40], [40, 39], [39, 37], [37, 267], [267, 269], [269, 270], [270, 78],
  
  // Lower lip
  [61, 146], [146, 91], [91, 181], [181, 84], [84, 17], [17, 314], [314, 308],
  
  // Mouth to jaw
  [78, 308],
  
  // Forehead connections
  [67, 108], [108, 69], [69, 104], [104, 109],
  
  // Under eye connections
  [33, 111], [111, 117], [263, 346], [346, 340],
  
  // Cheek structure
  [234, 172], [454, 356], [227, 136], [447, 365],
  
  // Jaw definition
  [172, 136], [136, 150], [150, 149], [149, 176], [176, 148], [148, 152],
  [152, 377], [377, 400], [400, 378], [378, 379], [379, 365], [365, 397],
  
  // Chin detail
  [152, 175], [175, 396], [396, 152], [152, 369], [369, 395], [395, 152],
  
  // Cross connections for structure
  [168, 9], [9, 164], [164, 1],
  [55, 168], [285, 168],
  [70, 33], [300, 263],
];

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

      // Draw mesh connections
      ctx.strokeStyle = selectedFeatureId ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.3)';
      ctx.lineWidth = 0.75;
      
      for (const [idx1, idx2] of KEY_CONNECTIONS) {
        if (landmarks[idx1] && landmarks[idx2]) {
          const p1 = toCanvasCoords(landmarks[idx1]);
          const p2 = toCanvasCoords(landmarks[idx2]);
          
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }

      // Draw all 100 key landmark points
      for (const idx of KEY_LANDMARKS) {
        if (landmarks[idx]) {
          const pos = toCanvasCoords(landmarks[idx]);
          
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 2, 0, Math.PI * 2);
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
