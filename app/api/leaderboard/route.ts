import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { uploadLeaderboardImage } from '@/lib/supabase';

// Generate a cuid-like ID
function generateId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `cl${timestamp}${randomPart}`;
}

// GET - Fetch all leaderboard entries
export async function GET() {
  try {
    // Use raw query since Prisma client may not be regenerated yet
    const entries = await prisma.$queryRaw`
      SELECT 
        "id", "name", "age", "imageUrl", "overallScore", 
        "harmScore", "miscScore", "anguScore", "dimoScore",
        "rarity", "features", "createdAt"
      FROM "LeaderboardEntry"
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

// POST - Submit a new leaderboard entry
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
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

    // Validate required fields
    if (!name || !age || !imageData || overallScore === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Generate unique filename
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
        "id", "name", "age", "imageUrl", "overallScore",
        "harmScore", "miscScore", "anguScore", "dimoScore",
        "rarity", "features", "consentedAt", "createdAt", "updatedAt"
      ) VALUES (
        ${id}, ${trimmedName}, ${ageNum}, ${imageUrl}, ${parsedOverallScore},
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

