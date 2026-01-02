import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

/**
 * Performance Monitoring Plugin
 * PRD 9.1 - API 성능 모니터링 및 지표 수집
 */

interface RequestMetrics {
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
}

interface PerformanceStats {
  totalRequests: number;
  averageResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  requestsByStatusCode: Record<number, number>;
  requestsByEndpoint: Record<string, {
    count: number;
    avgTime: number;
    maxTime: number;
  }>;
  slowRequests: RequestMetrics[];
  startTime: Date;
}

const SLOW_REQUEST_THRESHOLD = 1000; // 1 second
const MAX_SLOW_REQUESTS = 100;

class PerformanceMonitor {
  private stats: PerformanceStats;
  private recentMetrics: RequestMetrics[] = [];
  private readonly maxRecentMetrics = 1000;

  constructor() {
    this.stats = {
      totalRequests: 0,
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      requestsByStatusCode: {},
      requestsByEndpoint: {},
      slowRequests: [],
      startTime: new Date(),
    };
  }

  recordRequest(metrics: RequestMetrics) {
    this.stats.totalRequests++;

    // Update response time stats
    const prevAvg = this.stats.averageResponseTime;
    this.stats.averageResponseTime =
      prevAvg + (metrics.responseTime - prevAvg) / this.stats.totalRequests;

    if (metrics.responseTime > this.stats.maxResponseTime) {
      this.stats.maxResponseTime = metrics.responseTime;
    }
    if (metrics.responseTime < this.stats.minResponseTime) {
      this.stats.minResponseTime = metrics.responseTime;
    }

    // Status code breakdown
    this.stats.requestsByStatusCode[metrics.statusCode] =
      (this.stats.requestsByStatusCode[metrics.statusCode] || 0) + 1;

    // Endpoint breakdown (normalize URL by removing IDs)
    const normalizedUrl = this.normalizeUrl(metrics.url);
    const endpointKey = `${metrics.method} ${normalizedUrl}`;

    if (!this.stats.requestsByEndpoint[endpointKey]) {
      this.stats.requestsByEndpoint[endpointKey] = {
        count: 0,
        avgTime: 0,
        maxTime: 0,
      };
    }

    const endpoint = this.stats.requestsByEndpoint[endpointKey];
    endpoint.count++;
    endpoint.avgTime = endpoint.avgTime + (metrics.responseTime - endpoint.avgTime) / endpoint.count;
    if (metrics.responseTime > endpoint.maxTime) {
      endpoint.maxTime = metrics.responseTime;
    }

    // Track slow requests
    if (metrics.responseTime >= SLOW_REQUEST_THRESHOLD) {
      this.stats.slowRequests.push(metrics);
      if (this.stats.slowRequests.length > MAX_SLOW_REQUESTS) {
        this.stats.slowRequests.shift();
      }
    }

    // Keep recent metrics for detailed analysis
    this.recentMetrics.push(metrics);
    if (this.recentMetrics.length > this.maxRecentMetrics) {
      this.recentMetrics.shift();
    }
  }

  private normalizeUrl(url: string): string {
    // Replace UUIDs and numeric IDs with placeholders
    return url
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
      .replace(/\/\d+/g, '/:id')
      .replace(/\?.*$/, ''); // Remove query params
  }

  getStats(): PerformanceStats & {
    uptime: number;
    requestsPerMinute: number;
  } {
    const uptimeMs = Date.now() - this.stats.startTime.getTime();
    const uptimeMinutes = uptimeMs / 60000;

    return {
      ...this.stats,
      minResponseTime: this.stats.minResponseTime === Infinity ? 0 : this.stats.minResponseTime,
      uptime: Math.round(uptimeMs / 1000), // seconds
      requestsPerMinute: uptimeMinutes > 0 ? Math.round(this.stats.totalRequests / uptimeMinutes * 100) / 100 : 0,
    };
  }

  getRecentMetrics(limit = 100): RequestMetrics[] {
    return this.recentMetrics.slice(-limit);
  }

  getEndpointPerformance() {
    const endpoints = Object.entries(this.stats.requestsByEndpoint)
      .map(([endpoint, stats]) => ({
        endpoint,
        ...stats,
        avgTime: Math.round(stats.avgTime * 100) / 100,
        maxTime: Math.round(stats.maxTime * 100) / 100,
      }))
      .sort((a, b) => b.avgTime - a.avgTime);

    return endpoints;
  }

  reset() {
    this.stats = {
      totalRequests: 0,
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      requestsByStatusCode: {},
      requestsByEndpoint: {},
      slowRequests: [],
      startTime: new Date(),
    };
    this.recentMetrics = [];
  }
}

// Singleton
export const performanceMonitor = new PerformanceMonitor();

async function performancePlugin(app: FastifyInstance) {
  // Add timing hook
  app.addHook('onRequest', async (request: FastifyRequest) => {
    request.startTime = process.hrtime.bigint();
  });

  app.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.startTime) return;

    const endTime = process.hrtime.bigint();
    const responseTime = Number(endTime - request.startTime) / 1_000_000; // Convert to ms

    performanceMonitor.recordRequest({
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime,
      timestamp: new Date(),
    });

    // Add timing header in development
    if (process.env.NODE_ENV === 'development') {
      reply.header('X-Response-Time', `${responseTime.toFixed(2)}ms`);
    }
  });
}

export default fp(performancePlugin, {
  name: 'performance-monitor',
});

// Extend FastifyRequest type
declare module 'fastify' {
  interface FastifyRequest {
    startTime?: bigint;
  }
}
