'use client';

import { useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import type { Landmark } from '@/lib/types';
import { 
  FEATURE_LANDMARK_MAP, 
} from '@/lib/featureLandmarks';

// ~200 key anatomical landmarks for visualization (2x density)
// Selected for comprehensive face coverage with high detail
const KEY_LANDMARKS: number[] = [
  // Face oval / contour (34 points - expanded)
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 152,
  127, 162, 21, 54, 103, 67, 109, 10, 151, 337, 299, 333, 298, 301, 368, 264,
  // Forehead (12 points - expanded)
  67, 109, 108, 69, 104, 68, 71, 139, 70, 63, 105, 66,
  107, 55, 193, 122, 188, 114, 217, 174, 196, 3, 51, 281,
  // Left eyebrow full (10 points)
  70, 63, 105, 66, 107, 55, 65, 52, 53, 46,
  // Right eyebrow full (10 points)  
  300, 293, 334, 296, 336, 285, 295, 282, 283, 276,
  // Left eye expanded (16 points)
  33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246,
  // Right eye expanded (16 points)
  263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466,
  // Nose bridge & tip expanded (14 points)
  168, 6, 197, 195, 5, 4, 1, 19, 94, 370, 462, 250, 309, 392,
  // Nose wings & nostrils (10 points)
  129, 358, 98, 327, 2, 326, 97, 99, 240, 460,
  // Upper lip expanded (14 points)
  61, 185, 40, 39, 37, 267, 269, 270, 0, 13, 14, 312, 311, 310,
  // Lower lip expanded (12 points)
  146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 287,
  // Mouth corners & detail (6 points)
  78, 308, 191, 80, 81, 82,
  // Cheekbones expanded (10 points)
  234, 454, 227, 447, 137, 123, 50, 205, 425, 352,
  // Jaw line expanded (16 points)
  172, 136, 150, 149, 176, 148, 377, 400, 379, 365, 397, 288, 361, 323, 401, 435,
  // Under eyes expanded (8 points)
  111, 117, 346, 340, 118, 119, 347, 348,
  // Chin area expanded (8 points)
  175, 396, 369, 395, 171, 140, 170, 169,
  // Temple area (6 points)
  162, 127, 234, 93, 356, 389,
  // Additional precision points (8 points)
  9, 164, 167, 393, 168, 417, 351, 419,
];

// Connections for the 200-point mesh (expanded)
const KEY_CONNECTIONS: [number, number][] = [
  // Face oval - outer contour
  [10, 338], [338, 297], [297, 332], [332, 284], [284, 251], [251, 389],
  [389, 356], [356, 454], [454, 323], [323, 361], [361, 288], [288, 397],
  [397, 365], [365, 379], [379, 378], [378, 152],
  [152, 148], [148, 176], [176, 149], [149, 150], [150, 136], [136, 172],
  [172, 234], [234, 227], [227, 67], [67, 109], [109, 10],
  // Face oval - inner ring
  [127, 162], [162, 21], [21, 54], [54, 103], [103, 67],
  [151, 337], [337, 299], [299, 333], [333, 298], [298, 301], [301, 368], [368, 264],
  
  // Left eyebrow - full
  [70, 63], [63, 105], [105, 66], [66, 107], [107, 55],
  [65, 52], [52, 53], [53, 46], [46, 55], [70, 65],
  
  // Right eyebrow - full
  [300, 293], [293, 334], [334, 296], [296, 336], [336, 285],
  [295, 282], [282, 283], [283, 276], [276, 285], [300, 295],
  
  // Left eye - expanded
  [33, 7], [7, 163], [163, 144], [144, 145], [145, 153], [153, 154], [154, 155], [155, 33],
  [133, 173], [173, 157], [157, 158], [158, 159], [159, 160], [160, 161], [161, 246], [246, 133],
  [33, 133], [155, 246],
  
  // Right eye - expanded
  [263, 249], [249, 390], [390, 373], [373, 374], [374, 380], [380, 381], [381, 382], [382, 263],
  [362, 398], [398, 384], [384, 385], [385, 386], [386, 387], [387, 388], [388, 466], [466, 362],
  [263, 362], [382, 466],
  
  // Nose - expanded
  [168, 6], [6, 197], [197, 195], [195, 5], [5, 4], [4, 1],
  [1, 19], [1, 129], [1, 358],
  [129, 98], [358, 327], [98, 97], [327, 326],
  [94, 370], [370, 462], [462, 250], [250, 309], [309, 392],
  [2, 326], [2, 97], [99, 240], [240, 460],
  
  // Upper lip - expanded
  [61, 185], [185, 40], [40, 39], [39, 37], [37, 0], [0, 267], [267, 269], [269, 270], [270, 78],
  [13, 14], [14, 312], [312, 311], [311, 310],
  
  // Lower lip - expanded
  [61, 146], [146, 91], [91, 181], [181, 84], [84, 17], [17, 314], [314, 308],
  [405, 321], [321, 375], [375, 291], [291, 409], [409, 287],
  
  // Mouth detail
  [78, 308], [191, 80], [80, 81], [81, 82],
  
  // Forehead connections - expanded
  [67, 108], [108, 69], [69, 104], [104, 109],
  [68, 71], [71, 139], [139, 70],
  [193, 122], [122, 188], [188, 114],
  [217, 174], [174, 196], [196, 3], [3, 51], [51, 281],
  
  // Under eye connections - expanded
  [33, 111], [111, 117], [117, 118], [118, 119],
  [263, 346], [346, 340], [340, 347], [347, 348],
  
  // Cheek structure - expanded
  [234, 172], [454, 356], [227, 136], [447, 365],
  [137, 123], [123, 50], [50, 205],
  [425, 352], [352, 447],
  
  // Jaw definition - expanded
  [172, 136], [136, 150], [150, 149], [149, 176], [176, 148], [148, 152],
  [152, 377], [377, 400], [400, 378], [378, 379], [379, 365], [365, 397],
  [401, 435], [435, 288], [288, 361],
  
  // Chin detail - expanded
  [152, 175], [175, 396], [396, 152], [152, 369], [369, 395], [395, 152],
  [171, 140], [140, 170], [170, 169],
  
  // Temple connections
  [162, 127], [127, 234], [234, 93],
  [356, 389], [389, 127],
  
  // Cross connections for structure
  [168, 9], [9, 164], [164, 1],
  [55, 168], [285, 168],
  [70, 33], [300, 263],
  [167, 393], [393, 168], [417, 351], [351, 419],
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
