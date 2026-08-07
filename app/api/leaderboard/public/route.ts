import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/** Public top-100 for marketing hero — faces + scores only. */
export async function GET() {
  try {
    const entries = await prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        imageUrl: string;
        overallScore: number;
        rarity: string;
      }>
    >`
      SELECT le."id", le."name", le."imageUrl", le."overallScore", le."rarity"
      FROM "LeaderboardEntry" le
      WHERE le."hidden" = false
      ORDER BY le."overallScore" DESC
      LIMIT 100
    `;

    return NextResponse.json({
      entries: entries.map((e, i) => ({
        ...e,
        rank: i + 1,
        overallScore: Number(e.overallScore),
      })),
    });
  } catch (error) {
    console.error('Error fetching public leaderboard:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
