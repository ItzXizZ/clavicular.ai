import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { analyzeFace } from '@/lib/scoring';
import { calculateMeasurements } from '@/lib/ratios';
import type { Landmark, FacialMeasurements, AnalysisResult, ProtocolRecommendation, Product } from '@/lib/types';

// Types for API response
interface AnalyzeResponse {
  analysis: AnalysisResult;
  protocols: ProtocolRecommendation[];
}

interface AnalyzeRequest {
  image: string;
  profileMode: 'front' | 'side';
  landmarks: Landmark[]; // Required - real MediaPipe landmarks from client
}

export async function POST(request: NextRequest): Promise<NextResponse<AnalyzeResponse | { error: string }>> {
  try {
    const body: AnalyzeRequest = await request.json();
    const { profileMode, landmarks } = body;

    // Validate landmarks - they are REQUIRED for real analysis
    if (!landmarks || !Array.isArray(landmarks) || landmarks.length === 0) {
      return NextResponse.json(
        { error: 'Face landmarks are required. Please ensure your face is clearly visible and try again.' },
        { status: 400 }
      );
    }

    // Validate landmark count (MediaPipe Face Mesh returns 478 landmarks)
    if (landmarks.length !== 478) {
      console.warn(`[API] Received ${landmarks.length} landmarks, expected 478. Proceeding with analysis.`);
    }

    // Validate landmark structure
    const validLandmarks = landmarks.every(lm => 
      typeof lm.x === 'number' && 
      typeof lm.y === 'number' && 
      (lm.z === undefined || typeof lm.z === 'number')
    );

    if (!validLandmarks) {
      return NextResponse.json(
        { error: 'Invalid landmark data format. Please try capturing your face again.' },
        { status: 400 }
      );
    }

    // Ensure z values exist (default to 0 if not present)
    const normalizedLandmarks: Landmark[] = landmarks.map(lm => ({
      x: lm.x,
      y: lm.y,
      z: lm.z ?? 0
    }));

    console.log(`[API] Processing ${normalizedLandmarks.length} real landmarks for ${profileMode} profile`);

    // Calculate measurements from REAL landmarks
    const measurements: FacialMeasurements = calculateMeasurements(normalizedLandmarks);

    console.log('[API] Calculated measurements:', {
      ipd: measurements.ipd.toFixed(2),
      fwhr: measurements.fwhr.toFixed(3),
      canthalTilt: measurements.canthalTilt.toFixed(2),
      gonialAngle: measurements.gonialAngle.toFixed(2),
      symmetryScore: measurements.symmetryScore.toFixed(3)
    });

    // Run facial analysis scoring
    const analysis = analyzeFace(measurements);

    console.log(`[API] Analysis complete - Score: ${analysis.overallScore.toFixed(1)}/10, Rarity: ${analysis.rarity}`);

    // Get protocol recommendations from database
    const protocols = await getProtocolRecommendations(analysis);

    // Save analysis session to database
    try {
      await prisma.analysisSession.create({
        data: {
          overallScore: analysis.overallScore,
          harmScore: analysis.categoryScores.harm,
          miscScore: analysis.categoryScores.misc,
          anguScore: analysis.categoryScores.angu,
          dimoScore: analysis.categoryScores.dimo,
          measurements: JSON.stringify(measurements),
          features: JSON.stringify(analysis.features),
          recommendations: JSON.stringify(protocols),
          profileMode,
        },
      });
      console.log('[API] Analysis session saved to database');
    } catch (dbError) {
      // Don't fail the request if session save fails
      console.warn('[API] Failed to save analysis session:', dbError);
    }

    return NextResponse.json({ analysis, protocols });
  } catch (error) {
    console.error('[API] Analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed. Please ensure your face is clearly visible and try again.' },
      { status: 500 }
    );
  }
}

/**
 * Get protocol recommendations based on detected flaws
 */
async function getProtocolRecommendations(analysis: AnalysisResult): Promise<ProtocolRecommendation[]> {
  // Find flaws (non-strengths with negative deviation) - use a less strict threshold
  const flaws = analysis.features
    .filter(f => !f.isStrength && f.deviation < 0)
    .sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation))
    .slice(0, 6);

  console.log(`[API] Found ${flaws.length} flaws for recommendations:`, flaws.map(f => f.id));

  const protocols: ProtocolRecommendation[] = [];

  for (const flaw of flaws) {
    let foundDbProtocol = false;
    
    try {
      // Try to find improvements directly by searching for related issues
      const improvements = await prisma.improvement.findMany({
        where: {
          OR: [
            // Match by issue ID patterns
            { issueId: { contains: flaw.id.replace('_', '') } },
            { issueId: flaw.id },
            // Match common mappings
            ...(flaw.id === 'bigonial' || flaw.id === 'gonial_angle' || flaw.id === 'jaw_definition' 
              ? [{ issueId: 'narrow_jaw' }, { issueId: 'obtuse_gonial' }] : []),
            ...(flaw.id === 'fwhr' || flaw.id === 'bizygomatic' 
              ? [{ issueId: 'high_bodyfat' }, { issueId: 'flat_cheekbones' }] : []),
            ...(flaw.id === 'canthal_tilt' 
              ? [{ issueId: 'negative_canthal_tilt' }] : []),
            ...(flaw.id === 'skin_quality' 
              ? [{ issueId: 'poor_skin' }] : []),
            ...(flaw.id === 'eye_depth' || flaw.id === 'under_eye'
              ? [{ issueId: 'shallow_eyes' }, { issueId: 'under_eye_issues' }] : []),
            ...(flaw.id === 'philtrum' || flaw.id === 'chin_philtrum'
              ? [{ issueId: 'long_philtrum' }] : []),
            ...(flaw.id === 'hair_quality'
              ? [{ issueId: 'hair_loss' }] : []),
            ...(flaw.id === 'nose_shape' || flaw.id === 'nasofrontal_angle'
              ? [{ issueId: 'nose_issues' }] : []),
            ...(flaw.id === 'lip_shape'
              ? [{ issueId: 'thin_lips' }] : []),
          ]
        },
        include: {
          issue: true,
          products: true
        },
        take: 3
      });

      console.log(`[API] Found ${improvements.length} improvements for flaw ${flaw.id}`);

      for (const improvement of improvements) {
        foundDbProtocol = true;
        const products: Product[] = improvement.products.map(p => ({
          id: p.id,
          name: p.name,
          price: p.priceMin && p.priceMax 
            ? `$${p.priceMin}-${p.priceMax}` 
            : p.priceMin 
              ? `$${p.priceMin}+` 
              : 'Varies',
          url: p.purchaseUrls ? JSON.parse(p.purchaseUrls)[0] : undefined,
          imageUrl: p.imageUrl || undefined,
          brand: p.brand || undefined
        }));

        protocols.push({
          issue: improvement.issue.displayName,
          fix: {
            title: improvement.name,
            explanation: improvement.description,
            products
          },
          impactScore: calculateImpact(flaw.deviation, improvement.effectiveness)
        });
      }
    } catch (dbError) {
      console.warn(`[API] Database error for ${flaw.id}:`, dbError);
    }

    // If no database results, use fallback
    if (!foundDbProtocol) {
      console.log(`[API] Using fallback for ${flaw.id}`);
      protocols.push(getFallbackProtocol(flaw));
    }
  }

  // Sort by impact and return top protocols
  const sortedProtocols = protocols
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, 6);

  console.log(`[API] Returning ${sortedProtocols.length} protocol recommendations`);
  return sortedProtocols;
}

/**
 * Calculate expected impact score based on flaw severity and fix effectiveness
 */
function calculateImpact(deviation: number, effectiveness?: string | null): number {
  const baseSeverity = Math.abs(deviation);
  let effectivenessMultiplier = 0.5;

  if (effectiveness) {
    const lower = effectiveness.toLowerCase();
    if (lower.includes('very high')) effectivenessMultiplier = 1.0;
    else if (lower.includes('high')) effectivenessMultiplier = 0.8;
    else if (lower.includes('moderate')) effectivenessMultiplier = 0.5;
    else if (lower.includes('low')) effectivenessMultiplier = 0.3;
  }

  return Math.round(baseSeverity * effectivenessMultiplier * 10) / 10;
}

/**
 * Fallback protocol when database lookup fails
 */
function getFallbackProtocol(flaw: AnalysisResult['features'][0]): ProtocolRecommendation {
  const fallbacks: Record<string, ProtocolRecommendation> = {
    bigonial: {
      issue: 'Narrow jaw definition',
      fix: {
        title: 'Mewing + Chewing Protocol',
        explanation: 'Proper tongue posture combined with resistance chewing can strengthen masseter muscles and improve jaw definition over 6-12 months.',
        products: [
          { id: 'mastic', name: 'Mastic Gum', price: '$15-30', brand: 'Chios Mastiha', imageUrl: 'https://m.media-amazon.com/images/I/71kJQGLXhAL._AC_SL1500_.jpg', url: 'https://www.amazon.com/dp/B07NQHQ4CC' },
          { id: 'falim', name: 'Falim Gum', price: '$10-15', brand: 'Falim', imageUrl: 'https://m.media-amazon.com/images/I/61LKzSXh-lL._AC_SL1500_.jpg', url: 'https://www.amazon.com/dp/B07BF71F5N' }
        ]
      },
      impactScore: 0.4
    },
    fwhr: {
      issue: 'Suboptimal facial definition',
      fix: {
        title: 'Leanmaxxing Protocol',
        explanation: 'Reducing body fat to 10-14% reveals bone structure and improves facial definition. Creates dramatic improvements in FWHR appearance.',
        products: [
          { id: 'scale', name: 'Food Scale', price: '$15-25', brand: 'OXO', imageUrl: 'https://m.media-amazon.com/images/I/71Zcl-J7oPL._AC_SL1500_.jpg', url: 'https://www.amazon.com/dp/B079D9B82W' },
          { id: 'myfitnesspal', name: 'MyFitnessPal Premium', price: '$20/month', brand: 'MyFitnessPal', imageUrl: 'https://play-lh.googleusercontent.com/YKNhq0Cbo_tPnNSqVKZmPJNkLUwcIvHgZR3_X_d9qVoALl-IQXXI9dCEdwcXQVAF7Pmc=w480-h960-rw' }
        ]
      },
      impactScore: 0.6
    },
    gonial_angle: {
      issue: 'Obtuse gonial angle',
      fix: {
        title: 'Jaw Angle Enhancement',
        explanation: 'Strategic approaches including masseter training and posture optimization to create sharper gonial angle appearance.',
        products: [
          { id: 'chisell', name: 'Chisell Jaw Exerciser', price: '$25-40', brand: 'Chisell', imageUrl: 'https://m.media-amazon.com/images/I/61LN5lPvX+L._AC_SL1500_.jpg', url: 'https://www.amazon.com/dp/B07WW1WNCX' },
          { id: 'jawzrsize', name: 'Jawzrsize', price: '$30-50', brand: 'Jawzrsize', imageUrl: 'https://m.media-amazon.com/images/I/71C-EEkfT4L._AC_SL1500_.jpg', url: 'https://www.amazon.com/dp/B07DGV1T4G' }
        ]
      },
      impactScore: 0.5
    },
    canthal_tilt: {
      issue: 'Neutral or negative canthal tilt',
      fix: {
        title: 'Eye Area Optimization',
        explanation: 'While bone structure is genetic, reducing periorbital puffiness and optimizing skincare can enhance eye area appearance.',
        products: [
          { id: 'caffeine', name: 'Caffeine Eye Serum', price: '$8-15', brand: 'The Ordinary', imageUrl: 'https://m.media-amazon.com/images/I/61fJkgKeCdL._SL1500_.jpg', url: 'https://www.amazon.com/dp/B072XJQWNW' },
          { id: 'retinol', name: 'Retinol Eye Cream', price: '$20-40', brand: 'CeraVe', imageUrl: 'https://m.media-amazon.com/images/I/51JJ7ooAr9L._SL1500_.jpg', url: 'https://www.amazon.com/dp/B08HNMF9GZ' }
        ]
      },
      impactScore: 0.3
    },
    ipd: {
      issue: 'Suboptimal eye spacing',
      fix: {
        title: 'Visual Harmony Protocol',
        explanation: 'Focus on enhancing other facial features to create better overall harmony. Eyebrow shaping can create optical illusions.',
        products: []
      },
      impactScore: 0.2
    },
    facial_thirds: {
      issue: 'Imbalanced facial proportions',
      fix: {
        title: 'Proportion Optimization',
        explanation: 'Hairstyle adjustments, facial hair (if applicable), and posture can significantly alter perceived facial proportions.',
        products: []
      },
      impactScore: 0.4
    },
    symmetry: {
      issue: 'Facial asymmetry detected',
      fix: {
        title: 'Symmetry Enhancement Protocol',
        explanation: 'Sleeping position changes, jaw exercises on the weaker side, and proper posture can gradually improve facial symmetry.',
        products: [
          { id: 'pillow', name: 'Orthopedic Pillow', price: '$30-60' }
        ]
      },
      impactScore: 0.4
    },
    bizygomatic: {
      issue: 'Narrow cheekbone projection',
      fix: {
        title: 'Cheekbone Enhancement',
        explanation: 'Proper tongue posture (mewing) can widen the palate and improve midface projection over time.',
        products: []
      },
      impactScore: 0.3
    },
    philtrum: {
      issue: 'Long philtrum ratio',
      fix: {
        title: 'Upper Lip Enhancement',
        explanation: 'Lip care and subtle makeup techniques can create the appearance of a shorter philtrum.',
        products: [
          { id: 'lipbalm', name: 'Plumping Lip Balm', price: '$10-25' }
        ]
      },
      impactScore: 0.2
    },
    nasofrontal_angle: {
      issue: 'Suboptimal nasofrontal angle',
      fix: {
        title: 'Nasal Profile Optimization',
        explanation: 'Non-surgical options include filler for minor adjustments. Focus on overall facial harmony.',
        products: []
      },
      impactScore: 0.3
    },
    chin_philtrum: {
      issue: 'Chin to philtrum imbalance',
      fix: {
        title: 'Lower Face Optimization',
        explanation: 'Jaw exercises and proper posture can improve chin projection. Facial hair can also enhance chin appearance.',
        products: [
          { id: 'minox', name: 'Minoxidil (for beard)', price: '$15-30' }
        ]
      },
      impactScore: 0.4
    },
    midface_ratio: {
      issue: 'Midface length deviation',
      fix: {
        title: 'Midface Harmony Protocol',
        explanation: 'Improving adjacent features (eyes, mouth) can create better midface harmony and perceived proportions.',
        products: []
      },
      impactScore: 0.3
    },
    pfl: {
      issue: 'Palpebral fissure length deviation',
      fix: {
        title: 'Eye Appearance Enhancement',
        explanation: 'Proper sleep, hydration, and eye care can optimize palpebral fissure appearance and openness.',
        products: [
          { id: 'eyemask', name: 'Silk Sleep Mask', price: '$15-30' }
        ]
      },
      impactScore: 0.2
    },
    esr: {
      issue: 'Eye separation ratio deviation',
      fix: {
        title: 'Facial Balance Optimization',
        explanation: 'Eyebrow grooming and hairstyle can create optical illusions to balance eye separation perception.',
        products: []
      },
      impactScore: 0.2
    }
  };

  return fallbacks[flaw.id] || {
    issue: `${flaw.name} below ideal range`,
    fix: {
      title: 'General Optimization Protocol',
      explanation: 'Focus on overall health: proper sleep, hydration, nutrition, and skincare form the foundation of facial aesthetics.',
      products: [
        { id: 'collagen', name: 'Collagen Peptides', price: '$20-40' },
        { id: 'vitd', name: 'Vitamin D3', price: '$10-20' }
      ]
    },
    impactScore: 0.3
  };
}
