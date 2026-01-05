import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/authMiddleware';
import type { ProtocolRecommendation, Product } from '@/lib/types';

interface RecommendationsRequest {
  featureIds?: string[];
  issueIds?: string[];
  protocolType?: 'softmax' | 'hardmax'; // softmax = SOFT/SEMI only, hardmax = includes HARD
}

interface RecommendationsResponse {
  protocols: ProtocolRecommendation[];
  improvements: ImprovementDetail[];
}

interface ImprovementDetail {
  id: string;
  issue: string;
  type: string;
  name: string;
  description: string;
  timeline: string | null;
  effectiveness: string | null;
  costRange: string | null;
  risks: string[];
  products: Product[];
}

// POST - Get recommendations (requires auth)
export async function POST(request: NextRequest): Promise<NextResponse<RecommendationsResponse | { error: string }>> {
  // Verify authentication
  const { user, error } = await verifyAuth(request);
  
  if (!user) {
    return NextResponse.json(
      { error: error || 'Authentication required to view recommendations' },
      { status: 401 }
    );
  }

  try {
    const body: RecommendationsRequest = await request.json();
    const { featureIds, issueIds, protocolType = 'softmax' } = body;

    // Determine which improvement types to include
    const typeFilter = protocolType === 'hardmax' 
      ? ['SOFT', 'SEMI', 'HARD'] 
      : ['SOFT', 'SEMI'];

    let improvements;

    if (issueIds && issueIds.length > 0) {
      // Get improvements for specific issues
      improvements = await prisma.improvement.findMany({
        where: {
          issueId: { in: issueIds },
          type: { in: typeFilter }
        },
        include: {
          issue: true,
          products: true
        },
        orderBy: [
          { type: 'asc' }, // SOFT first, then SEMI, then HARD
        ]
      });
    } else if (featureIds && featureIds.length > 0) {
      // Get improvements via features -> issues
      const issues = await prisma.issue.findMany({
        where: {
          features: {
            some: {
              id: { in: featureIds }
            }
          }
        },
        select: { id: true }
      });

      const relevantIssueIds = issues.map(i => i.id);

      improvements = await prisma.improvement.findMany({
        where: {
          issueId: { in: relevantIssueIds },
          type: { in: typeFilter }
        },
        include: {
          issue: true,
          products: true
        },
        orderBy: [
          { type: 'asc' },
        ]
      });
    } else {
      // Return all available improvements
      improvements = await prisma.improvement.findMany({
        where: {
          type: { in: typeFilter }
        },
        include: {
          issue: true,
          products: true
        },
        take: 20,
        orderBy: [
          { type: 'asc' },
        ]
      });
    }

    // Transform to response format
    const improvementDetails: ImprovementDetail[] = improvements.map(imp => ({
      id: imp.id,
      issue: imp.issue.displayName,
      type: imp.type,
      name: imp.name,
      description: imp.description,
      timeline: imp.timeline,
      effectiveness: imp.effectiveness,
      costRange: imp.costMin && imp.costMax 
        ? `$${imp.costMin.toLocaleString()}-$${imp.costMax.toLocaleString()}`
        : imp.costMin 
          ? `$${imp.costMin.toLocaleString()}+`
          : null,
      risks: imp.risks ? JSON.parse(imp.risks) : [],
      products: imp.products.map(p => ({
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
      }))
    }));

    // Also format as protocols for UI compatibility
    const protocols: ProtocolRecommendation[] = improvements.slice(0, 4).map(imp => ({
      issue: imp.issue.displayName,
      fix: {
        title: imp.name,
        explanation: imp.description,
        products: imp.products.map(p => ({
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
        }))
      },
      impactScore: calculateImpactFromEffectiveness(imp.effectiveness)
    }));

    return NextResponse.json({ protocols, improvements: improvementDetails });
  } catch (error) {
    console.error('Recommendations error:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to fetch all available issues and features (public)
 */
export async function GET(): Promise<NextResponse> {
  try {
    const [features, issues] = await Promise.all([
      prisma.feature.findMany({
        select: {
          id: true,
          name: true,
          category: true,
          importance: true,
          idealValue: true
        },
        orderBy: [
          { category: 'asc' },
          { importance: 'desc' }
        ]
      }),
      prisma.issue.findMany({
        select: {
          id: true,
          displayName: true,
          description: true,
          severity: true,
          features: {
            select: { id: true, name: true }
          }
        }
      })
    ]);

    return NextResponse.json({ features, issues });
  } catch (error) {
    console.error('Failed to fetch features/issues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

function calculateImpactFromEffectiveness(effectiveness: string | null): number {
  if (!effectiveness) return 0.3;
  
  const lower = effectiveness.toLowerCase();
  if (lower.includes('very high')) return 0.8;
  if (lower.includes('high')) return 0.6;
  if (lower.includes('moderate')) return 0.4;
  if (lower.includes('low')) return 0.2;
  return 0.3;
}
