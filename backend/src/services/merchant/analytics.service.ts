import { Prisma } from "@prisma/client";
import { Request } from "express";
import { prisma } from "../../config/database";

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

interface PoiAnalytics {
  poiId: string;
  poiName: string;
  totalPlays: number;
  avgDuration: number | null;
  uniqueVisitors: number;
}

interface InteractionHistoryItem {
  id: string;
  poiId: string;
  poiName: string;
  triggerType: string;
  triggeredAt: Date;
  playDurationSeconds: number;
  completed: boolean;
  userName: string;
}

export const merchantAnalyticsService = {
  /**
   * Get merchant's POI IDs
   */
  async getMerchantPoiIds(merchantId: string): Promise<string[]> {
    const pois = await prisma.pointOfInterest.findMany({
      where: { merchantId, isDeleted: false },
      select: { id: true },
    });
    console.log(`Merchant ${merchantId} has ${pois.length} POIs`);
    return pois.map((p) => p.id);
  },

  /**
   * Get overview statistics for merchant dashboard
   */
  async getOverview(merchantId: string, req: Request) {
    const { from, to } = req.query as { from?: string; to?: string };
    const dateFilter = getDateFilter(from, to);

    const poiIds = await this.getMerchantPoiIds(merchantId);

    if (poiIds.length === 0) {
      return {
        totalListens: 0,
        avgListenDuration: 0,
        totalPOIs: 0,
        activePOIs: 0,
        completionRate: 0,
        topPOIs: [],
      };
    }

    const whereClause = {
      poiId: { in: poiIds },
      ...(Object.keys(dateFilter).length ? { triggeredAt: dateFilter } : {}),
    };

    // Get stats
    const [totalListens, durationStats, completedStats, poiCount, activeCount] =
      await Promise.all([
        prisma.audioPlayHistory.count({ where: whereClause }),
        prisma.audioPlayHistory.aggregate({
          where: whereClause,
          _avg: { playDurationSeconds: true },
        }),
        prisma.audioPlayHistory.groupBy({
          by: ["completed"],
          where: whereClause,
          _count: { completed: true },
        }),
        prisma.pointOfInterest.count({
          where: { merchantId, isDeleted: false },
        }),
        prisma.pointOfInterest.count({
          where: { merchantId, isDeleted: false, isActive: true },
        }),
      ]);

    const completedCount =
      completedStats.find((s) => s.completed === true)?._count.completed ?? 0;
    const completionRate =
      totalListens > 0
        ? Math.round((completedCount / totalListens) * 100 * 10) / 10
        : 0;

    // Get top 5 POIs
    const topPois = await this.getTopPois(merchantId, { limit: "5", from, to });

    return {
      totalListens,
      avgListenDuration:
        Math.round((durationStats._avg.playDurationSeconds ?? 0) * 10) / 10,
      totalPOIs: poiCount,
      activePOIs: activeCount,
      completionRate,
      topPOIs: topPois.topPois,
    };
  },

  /**
   * Get top performing POIs for merchant
   */
  async getTopPois(
    merchantId: string,
    query: { limit?: string; from?: string; to?: string },
  ) {
    const { limit = "10", from, to } = query;
    const takeLimit = Math.min(parseInt(limit, 10) || 10, 50);
    const dateFilter = getDateFilter(from, to);
    const poiIds = await this.getMerchantPoiIds(merchantId);

    if (poiIds.length === 0) {
      return { topPois: [] };
    }

    const whereClause = {
      poiId: { in: poiIds },
      ...(Object.keys(dateFilter).length ? { triggeredAt: dateFilter } : {}),
    };

    // Group by POI
    const topPois = await prisma.audioPlayHistory.groupBy({
      by: ["poiId"],
      where: whereClause,
      _count: { poiId: true },
      _avg: { playDurationSeconds: true },
      orderBy: { _count: { poiId: "desc" } },
      take: takeLimit,
    });

    // Get POI details and unique visitors
    const poiDetails = await prisma.pointOfInterest.findMany({
      where: { id: { in: poiIds } },
      select: { id: true, name: true, imageUrl: true },
    });

    const poiMap = new Map(poiDetails.map((p) => [p.id, p]));

    // Get unique sessions per POI
    const poiSessions = await prisma.audioPlayHistory.groupBy({
      by: ["poiId", "sessionId"],
      where: whereClause,
    });

    const uniqueVisitorMap = new Map<string, Set<string>>();
    for (const item of poiSessions) {
      if (!uniqueVisitorMap.has(item.poiId)) {
        uniqueVisitorMap.set(item.poiId, new Set());
      }
      uniqueVisitorMap.get(item.poiId)!.add(item.sessionId);
    }

    const result: PoiAnalytics[] = topPois.map((poi) => {
      const poiInfo = poiMap.get(poi.poiId);
      const uniqueVisitors = uniqueVisitorMap.get(poi.poiId)?.size ?? 0;

      return {
        poiId: poi.poiId,
        poiName: poiInfo?.name ?? "Unknown",
        totalPlays: poi._count.poiId,
        avgDuration: Math.round((poi._avg.playDurationSeconds ?? 0) * 10) / 10,
        uniqueVisitors,
      };
    });

    return { topPois: result };
  },

  /**
   * Get interaction history for merchant's POIs
   */
  async getInteractionHistory(
    merchantId: string,
    query: {
      poiId?: string;
      from?: string;
      to?: string;
      page?: string;
      limit?: string;
    },
  ) {
    const { poiId, from, to, page = "1", limit = "20" } = query;
    const takeLimit = Math.min(parseInt(limit, 10) || 20, 100);
    const skip = (parseInt(page, 10) - 1) * takeLimit;
    const dateFilter = getDateFilter(from, to);

    const poiIds = poiId ? [poiId] : await this.getMerchantPoiIds(merchantId);

    if (poiIds.length === 0) {
      return {
        interactions: [],
        pagination: { total: 0, page: 1, limit: takeLimit, totalPages: 0 },
      };
    }

    const whereClause = {
      poiId: { in: poiIds },
      ...(Object.keys(dateFilter).length ? { triggeredAt: dateFilter } : {}),
    };

    const [interactions, total] = await Promise.all([
      prisma.audioPlayHistory.findMany({
        where: whereClause,
        orderBy: { triggeredAt: "desc" },
        skip,
        take: takeLimit,
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
      }),
      prisma.audioPlayHistory.count({ where: whereClause }),
    ]);

    const items: InteractionHistoryItem[] = interactions.map((i) => ({
      id: i.id,
      poiId: i.poiId,
      poiName: i.poi.name,
      triggerType: i.triggerType,
      triggeredAt: i.triggeredAt,
      playDurationSeconds: i.playDurationSeconds ?? 0,
      completed: i.completed,
      userName: i.session?.user?.fullName ?? "Anonymous",
    }));

    return {
      interactions: items,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: takeLimit,
        totalPages: Math.ceil(total / takeLimit),
      },
    };
  },

  /**
   * Get POI-specific analytics
   */
  /**
   * Get user session history for merchant's POIs
   */
  async getSessionHistory(
    merchantId: string,
    query: {
      poiId?: string;
      from?: string;
      to?: string;
      page?: string;
      limit?: string;
    },
  ) {
    const { poiId, from, to, page = "1", limit = "20" } = query;
    const takeLimit = Math.min(parseInt(limit, 10) || 20, 100);
    const skip = (parseInt(page, 10) - 1) * takeLimit;
    const dateFilter = getDateFilter(from, to);

    const poiIds = poiId ? [poiId] : await this.getMerchantPoiIds(merchantId);

    if (poiIds.length === 0) {
      return {
        sessions: [],
        pagination: { total: 0, page: 1, limit: takeLimit, totalPages: 0 },
      };
    }

    const sessionWhere: Prisma.UserSessionWhereInput = {
      audioPlayHistory: { some: { poiId: { in: poiIds } } },
      ...(Object.keys(dateFilter).length ? { startedAt: dateFilter } : {}),
    };

    const [sessions, total] = await Promise.all([
      prisma.userSession.findMany({
        where: sessionWhere,
        orderBy: { startedAt: "desc" },
        skip,
        take: takeLimit,
        include: {
          user: { select: { fullName: true } },
          tour: { select: { name: true } },
          _count: {
            select: {
              audioPlayHistory: {
                where: { poiId: { in: poiIds } },
              },
            },
          },
        },
      }),
      prisma.userSession.count({ where: sessionWhere }),
    ]);

    const items = sessions.map((s) => {
      const durationMs =
        s.endedAt && s.startedAt
          ? s.endedAt.getTime() - s.startedAt.getTime()
          : null;
      return {
        sessionId: s.id,
        userId: s.userId,
        userName: s.user?.fullName ?? "Anonymous",
        tourId: s.tourId ?? null,
        tourName: s.tour?.name ?? null,
        startedAt: s.startedAt,
        endedAt: s.endedAt ?? null,
        durationMinutes:
          durationMs !== null
            ? Math.round((durationMs / 60000) * 10) / 10
            : null,
        deviceInfo: s.deviceInfo ?? null,
        audioPlayCount: s._count.audioPlayHistory,
      };
    });

    return {
      sessions: items,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: takeLimit,
        totalPages: Math.ceil(total / takeLimit),
      },
    };
  },

  async getPoiAnalytics(
    merchantId: string,
    poiId: string,
    query: { from?: string; to?: string },
  ) {
    const { from, to } = query;
    const dateFilter = getDateFilter(from, to);
    const poi = await prisma.pointOfInterest.findFirst({
      where: { id: poiId, merchantId, isDeleted: false },
    });

    if (!poi) {
      throw new Error("POI not found or access denied");
    }

    const whereClause = {
      poiId,
      ...(Object.keys(dateFilter).length ? { triggeredAt: dateFilter } : {}),
    };

    const [totalPlays, durationStats, triggerBreakdown, completedCount] =
      await Promise.all([
        prisma.audioPlayHistory.count({ where: whereClause }),
        prisma.audioPlayHistory.aggregate({
          where: whereClause,
          _avg: { playDurationSeconds: true },
        }),
        prisma.audioPlayHistory.groupBy({
          by: ["triggerType"],
          where: whereClause,
          _count: { triggerType: true },
        }),
        prisma.audioPlayHistory.count({
          where: { ...whereClause, completed: true },
        }),
      ]);

    const completionRate =
      totalPlays > 0
        ? Math.round((completedCount / totalPlays) * 100 * 10) / 10
        : 0;

    const triggers = triggerBreakdown.map((t) => ({
      type: t.triggerType,
      count: t._count.triggerType,
    }));

    return {
      poiId,
      poiName: poi.name,
      totalPlays,
      avgDuration:
        Math.round((durationStats._avg.playDurationSeconds ?? 0) * 10) / 10,
      completionRate,
      triggers,
    };
  },
};
