import { Prisma } from "@prisma/client";
import { Request } from "express";
import { prisma } from "../../config/database";
import {
  buildPaginationMeta,
  parsePagination,
} from "../../utils/pagination.util";

/**
 * Analytics time filter helper
 * Returns date filter for common ranges
 */
const getDateFilter = (
  from?: string,
  to?: string,
): { gte?: Date; lte?: Date } => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (from === "today") {
    return { gte: startOfDay };
  }

  if (from === "7days") {
    const sevenDaysAgo = new Date(startOfDay);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return { gte: sevenDaysAgo };
  }

  if (from === "30days") {
    const thirtyDaysAgo = new Date(startOfDay);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return { gte: thirtyDaysAgo };
  }

  if (from) {
    return { gte: new Date(from) };
  }

  if (to) {
    return { lte: new Date(to) };
  }

  return {};
};

interface TopPoiItem {
  poiId: string;
  poiName: string;
  merchantName: string | null;
  totalPlays: number;
  avgDuration: number | null;
  completionRate: number | null;
}

interface HeatmapPoint {
  lat: number;
  lng: number;
  density: number;
}

interface RouteTrack {
  sessionId: string;
  tracks: Array<{
    latitude: number;
    longitude: number;
    recordedAt: Date;
  }>;
}

interface SummaryAnalytics {
  totalListens: number;
  avgListenDuration: number;
  totalListenDuration: number;
  triggerBreakdown: Array<{ type: string; count: number }>;
}

export const adminAnalyticsService = {
  /**
   * Get admin dashboard overview statistics
   */
  async getOverview() {
    const [
      totalUsers,
      totalMerchants,
      totalPOIs,
      totalTours,
      totalListens,
      totalSessions,
    ] = await Promise.all([
      prisma.user.count({
        where: { isDeleted: false, role: { name: "tourist" } },
      }),
      prisma.merchant.count({
        where: { user: { isDeleted: false } },
      }),
      prisma.pointOfInterest.count({
        where: { isDeleted: false },
      }),
      prisma.tour.count({
        where: { isDeleted: false },
      }),
      prisma.audioPlayHistory.count(),
      prisma.userSession.count(),
    ]);

    // Get total listen duration and avg
    const durationStats = await prisma.audioPlayHistory.aggregate({
      _avg: { playDurationSeconds: true },
      _sum: { playDurationSeconds: true },
    });

    // Get recent activities (last 10 interactions)
    const recentActivities = await prisma.audioPlayHistory.findMany({
      take: 10,
      orderBy: { triggeredAt: "desc" },
      include: {
        poi: {
          select: { name: true },
        },
        session: {
          select: {
            user: {
              select: { fullName: true },
            },
          },
        },
      },
    });

    return {
      totalUsers,
      totalMerchants,
      totalPOIs,
      totalTours,
      totalListens,
      totalSessions,
      avgListenDuration: durationStats._avg.playDurationSeconds ?? 0,
      totalListenDuration: durationStats._sum.playDurationSeconds ?? 0,
      recentActivities: recentActivities.map((a) => ({
        id: a.id,
        poiName: a.poi.name,
        triggerType: a.triggerType,
        triggeredAt: a.triggeredAt,
        userName: a.session?.user?.fullName ?? "Anonymous",
      })),
    };
  },

  /**
   * Get top performing POIs
   */
  async getTopPois(req: Request) {
    const {
      limit = "10",
      from,
      to,
    } = req.query as {
      limit?: string;
      from?: string;
      to?: string;
    };

    const takeLimit = Math.min(parseInt(limit, 10) || 10, 100);
    const dateFilter = getDateFilter(from, to);

    const where = Object.keys(dateFilter).length
      ? { triggeredAt: dateFilter }
      : {};

    // Group by POI and calculate stats
    const topPois = await prisma.audioPlayHistory.groupBy({
      by: ["poiId"],
      where,
      _count: { poiId: true },
      _avg: { playDurationSeconds: true },
      _sum: { playDurationSeconds: true },
      orderBy: { _count: { poiId: "desc" } },
      take: takeLimit,
    });

    // Get POI details
    const poiIds = topPois.map((p) => p.poiId);
    const pois = await prisma.pointOfInterest.findMany({
      where: { id: { in: poiIds } },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        merchant: {
          select: { shopName: true },
        },
      },
    });

    const poiMap = new Map(pois.map((p) => [p.id, p]));

    // Calculate completion rate for each POI
    const result: TopPoiItem[] = await Promise.all(
      topPois.map(async (poi) => {
        const poiInfo = poiMap.get(poi.poiId);
        const totalPlays = Number(poi._count.poiId);
        const avgDuration = poi._avg.playDurationSeconds ?? 0;

        // Calculate completion rate separately
        let completionRate: number | null = null;
        if (totalPlays > 0) {
          const totalPlaysForPoi = await prisma.audioPlayHistory.count({
            where: {
              poiId: poi.poiId,
              ...(Object.keys(dateFilter).length
                ? { triggeredAt: dateFilter }
                : {}),
            },
          });

          completionRate =
            Math.round((totalPlaysForPoi / totalPlays) * 100 * 10) / 10;
        }

        return {
          poiId: poi.poiId,
          poiName: poiInfo?.name ?? "Unknown",
          merchantName: poiInfo?.merchant?.shopName ?? null,
          totalPlays,
          avgDuration: Math.round(avgDuration * 10) / 10,
          completionRate,
        };
      }),
    );

    return { topPois: result };
  },

  /**
   * Get heatmap data for GPS tracks
   * GPS tracking has been removed — returns empty dataset.
   */
  async getHeatmapData(_req: Request) {
    return { heatmap: [] as HeatmapPoint[], totalPoints: 0 };
  },

  /**
   * Get route tracking data for sessions
   */
  async getRouteTracking(req: Request) {
    const {
      from,
      to,
      userId,
      limit = "50",
    } = req.query as {
      from?: string;
      to?: string;
      userId?: string;
      limit?: string;
    };

    const takeLimit = Math.min(parseInt(limit, 10) || 50, 200);
    const dateFilter = getDateFilter(from, to);

    const whereClause: Prisma.UserSessionWhereInput = {
      ...(Object.keys(dateFilter).length ? { startedAt: dateFilter } : {}),
      ...(userId ? { userId } : {}),
    };

    // GPS tracking has been removed — return empty routes.
    return { routes: [] as RouteTrack[], totalSessions: 0 };
  },

  /**
   * Get summary analytics for admin overview page
   */
  async getSummaryAnalytics(req: Request) {
    const { from, to } = req.query as { from?: string; to?: string };
    const dateFilter = getDateFilter(from, to);
    const whereClause = Object.keys(dateFilter).length
      ? { triggeredAt: dateFilter }
      : {};

    const [totalListens, durationStats, triggerBreakdown] = await Promise.all([
      prisma.audioPlayHistory.count({ where: whereClause }),
      prisma.audioPlayHistory.aggregate({
        where: whereClause,
        _avg: { playDurationSeconds: true },
        _sum: { playDurationSeconds: true },
      }),
      prisma.audioPlayHistory.groupBy({
        by: ["triggerType"],
        where: whereClause,
        _count: { triggerType: true },
      }),
    ]);

    console.log(
      "+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++",
    );
    console.log(
      "Summary Analytics - WHERE:",
      JSON.stringify(whereClause, null, 2),
    );
    console.log("Summary Analytics - Total Listens:", totalListens);
    console.log("Summary Analytics - Duration Stats:", durationStats);
    console.log("Summary Analytics - Trigger Breakdown:", triggerBreakdown);
    console.log(
      "+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++",
    );
    const triggerTypes = triggerBreakdown.map((t) => ({
      type: t.triggerType,
      count: t._count.triggerType,
    }));

    return {
      totalListens,
      avgListenDuration:
        Math.round((durationStats._avg.playDurationSeconds ?? 0) * 10) / 10,
      totalListenDuration: durationStats._sum.playDurationSeconds ?? 0,
      triggerBreakdown: triggerTypes,
    };
  },
};
