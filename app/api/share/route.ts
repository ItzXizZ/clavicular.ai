import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { uploadLeaderboardImage } from '@/lib/supabase';

// POST - Create a new share link
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      imageData,
      overallScore,
      harmScore,
      miscScore,
      anguScore,
      dimoScore,
      rarity,
      features,
    } = body;

    // Validate required fields
    if (!imageData || overallScore === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate unique filename for the share image
    const timestamp = Date.now();
    const fileName = `share-${timestamp}-${Math.random().toString(36).substring(7)}.jpg`;

    // Upload image to Supabase storage
    const imageUrl = await uploadLeaderboardImage(imageData, fileName);
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      );
    }

    // Create share link with 7-day expiration
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const shareLink = await prisma.shareLink.create({
      data: {
        imageUrl,
        overallScore,
        harmScore: harmScore || 0,
        miscScore: miscScore || 0,
        anguScore: anguScore || 0,
        dimoScore: dimoScore || 0,
        rarity: rarity || 'Unknown',
        features: JSON.stringify(features || []),
        expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      shareId: shareLink.id,
      shareUrl: `/share/${shareLink.id}`,
      expiresAt: shareLink.expiresAt,
    });
  } catch (error) {
    console.error('Error creating share link:', error);
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500 }
    );
  }
}

// GET - Fetch a share link by ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Share ID is required' },
        { status: 400 }
      );
    }

    const shareLink = await prisma.shareLink.findUnique({
      where: { id },
    });

    if (!shareLink) {
      return NextResponse.json(
        { error: 'Share link not found' },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date() > shareLink.expiresAt) {
      return NextResponse.json(
        { error: 'This share link has expired' },
        { status: 410 } // Gone
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: shareLink.imageUrl,
        overallScore: shareLink.overallScore,
        harmScore: shareLink.harmScore,
        miscScore: shareLink.miscScore,
        anguScore: shareLink.anguScore,
        dimoScore: shareLink.dimoScore,
        rarity: shareLink.rarity,
        features: JSON.parse(shareLink.features),
        expiresAt: shareLink.expiresAt,
        createdAt: shareLink.createdAt,
      },
    });
  } catch (error) {
    console.error('Error fetching share link:', error);
    return NextResponse.json(
      { error: 'Failed to fetch share link' },
      { status: 500 }
    );
  }
}

