import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { uploadLeaderboardImage } from '@/lib/supabase';
import { verifyAuth } from '@/lib/authMiddleware';

// Generate a cuid-like ID
function generateId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `cl${timestamp}${randomPart}`;
}

// GET - Fetch all leaderboard entries (requires auth)
export async function GET(request: NextRequest) {
  // Verify authentication
  const { user, error } = await verifyAuth(request);
  
  if (!user) {
    return NextResponse.json(
      { error: error || 'Authentication required to view leaderboard' },
      { status: 401 }
    );
  }

  try {
    // Use raw query since Prisma client may not be regenerated yet
    // Filter out hidden entries from public leaderboard
    const entries = await prisma.$queryRaw`
      SELECT 
        "id", "name", "age", "imageUrl", "overallScore", 
        "harmScore", "miscScore", "anguScore", "dimoScore",
        "rarity", "features", "createdAt"
      FROM "LeaderboardEntry"
      WHERE "hidden" = false
      ORDER BY "overallScore" DESC
      LIMIT 100
    `;

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}

// PATCH - Toggle leaderboard visibility (requires auth)
export async function PATCH(request: NextRequest) {
  // Verify authentication
  const { user, error } = await verifyAuth(request);
  
  if (!user) {
    return NextResponse.json(
      { error: error || 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    // Check if user has a leaderboard entry and get current hidden status
    const existingEntries = await prisma.$queryRaw<Array<{ id: string; hidden: boolean }>>`
      SELECT "id", "hidden" FROM "LeaderboardEntry" WHERE "userId" = ${user.id}
    `;

    if (!existingEntries || existingEntries.length === 0) {
      return NextResponse.json(
        { error: 'No leaderboard entry found' },
        { status: 404 }
      );
    }

    const existingEntry = existingEntries[0];
    const newHiddenStatus = !existingEntry.hidden;

    // Toggle the hidden status using raw query
    await prisma.$executeRaw`
      UPDATE "LeaderboardEntry" 
      SET "hidden" = ${newHiddenStatus}, "updatedAt" = ${new Date()}
      WHERE "userId" = ${user.id}
    `;

    return NextResponse.json({
      success: true,
      hidden: newHiddenStatus,
      message: newHiddenStatus ? 'Hidden from leaderboard' : 'Visible on leaderboard',
    });
  } catch (error) {
    console.error('Error toggling leaderboard visibility:', error);
    return NextResponse.json(
      { error: 'Failed to update leaderboard visibility' },
      { status: 500 }
    );
  }
}

// POST - Submit a new leaderboard entry (requires auth)
export async function POST(request: NextRequest) {
  // Verify authentication
  const { user, error } = await verifyAuth(request);
  
  if (!user) {
    return NextResponse.json(
      { error: error || 'Authentication required to submit to leaderboard' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    let {
      name,
      age,
      imageData, // base64 image
      overallScore,
      harmScore,
      miscScore,
      anguScore,
      dimoScore,
      rarity,
      features, // Array of top features
    } = body;

    // If name is not provided, get user's name from the database
    if (!name) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { name: true, displayName: true }
      });
      name = dbUser?.displayName || dbUser?.name;
    }

    // Validate required fields
    if (!name || !age || !imageData || overallScore === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields. Name is required - please update your profile or enter a display name.' },
        { status: 400 }
      );
    }

    // Validate age
    const ageNum = parseInt(age);
    if (ageNum < 13 || ageNum > 120) {
      return NextResponse.json(
        { error: 'Invalid age' },
        { status: 400 }
      );
    }

    // Check if user already has a leaderboard entry
    const existingEntry = await prisma.leaderboardEntry.findUnique({
      where: { userId: user.id }
    });

    if (existingEntry) {
      // Always update profile info (name, age, photo) and update score if higher
      const shouldUpdateScore = overallScore > existingEntry.overallScore;
      
      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const fileName = `${sanitizedName}-${timestamp}.jpg`;

      // Upload new image to Supabase
      const imageUrl = await uploadLeaderboardImage(imageData, fileName);
      
      if (!imageUrl) {
        return NextResponse.json(
          { error: 'Failed to upload image' },
          { status: 500 }
        );
      }

      // Update the entry - always update profile, only update score if higher
      const updatedEntry = await prisma.leaderboardEntry.update({
        where: { userId: user.id },
        data: {
          name: name.trim(),
          age: ageNum,
          imageUrl,
          // Only update scores if new score is higher
          ...(shouldUpdateScore && {
            overallScore: parseFloat(overallScore),
            harmScore: parseFloat(harmScore) || 0,
            miscScore: parseFloat(miscScore) || 0,
            anguScore: parseFloat(anguScore) || 0,
            dimoScore: parseFloat(dimoScore) || 0,
            rarity: rarity || 'Unknown',
            features: JSON.stringify(features || []),
          }),
        }
      });

      // Get the user's rank based on their current score
      const currentScore = shouldUpdateScore ? parseFloat(overallScore) : existingEntry.overallScore;
      const rankResult = await prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM "LeaderboardEntry"
        WHERE "overallScore" > ${currentScore}
      `;
      
      const rank = Number(rankResult[0].count) + 1;

      return NextResponse.json({
        success: true,
        entry: updatedEntry,
        rank,
        updated: true,
        scoreUpdated: shouldUpdateScore,
        message: shouldUpdateScore ? 'Profile and score updated!' : 'Profile updated! (Previous score was higher)',
      });
    }

    // Generate unique filename for new entry
    const timestamp = Date.now();
    const sanitizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const fileName = `${sanitizedName}-${timestamp}.jpg`;

    // Upload image to Supabase
    const imageUrl = await uploadLeaderboardImage(imageData, fileName);
    
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      );
    }

    // Create leaderboard entry using raw query
    const id = generateId();
    const trimmedName = name.trim();
    const parsedOverallScore = parseFloat(overallScore);
    const parsedHarmScore = parseFloat(harmScore) || 0;
    const parsedMiscScore = parseFloat(miscScore) || 0;
    const parsedAnguScore = parseFloat(anguScore) || 0;
    const parsedDimoScore = parseFloat(dimoScore) || 0;
    const entryRarity = rarity || 'Unknown';
    const featuresJson = JSON.stringify(features || []);
    const now = new Date();

    await prisma.$executeRaw`
      INSERT INTO "LeaderboardEntry" (
        "id", "userId", "name", "age", "imageUrl", "overallScore",
        "harmScore", "miscScore", "anguScore", "dimoScore",
        "rarity", "features", "consentedAt", "createdAt", "updatedAt"
      ) VALUES (
        ${id}, ${user.id}, ${trimmedName}, ${ageNum}, ${imageUrl}, ${parsedOverallScore},
        ${parsedHarmScore}, ${parsedMiscScore}, ${parsedAnguScore}, ${parsedDimoScore},
        ${entryRarity}, ${featuresJson}, ${now}, ${now}, ${now}
      )
    `;

    // Get the user's rank using raw query
    const rankResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM "LeaderboardEntry"
      WHERE "overallScore" > ${parsedOverallScore}
    `;
    
    const rank = Number(rankResult[0].count) + 1;

    return NextResponse.json({
      success: true,
      entry: {
        id,
        userId: user.id,
        name: trimmedName,
        age: ageNum,
        imageUrl,
        overallScore: parsedOverallScore,
        harmScore: parsedHarmScore,
        miscScore: parsedMiscScore,
        anguScore: parsedAnguScore,
        dimoScore: parsedDimoScore,
        rarity: entryRarity,
        features: featuresJson,
      },
      rank,
    });
  } catch (error) {
    console.error('Error creating leaderboard entry:', error);
    return NextResponse.json(
      { error: 'Failed to create leaderboard entry' },
      { status: 500 }
    );
  }
}
