export class HealthService {
    private static instance: HealthService;

    private constructor() { }

    public static getInstance(): HealthService {
        if (!HealthService.instance) {
            HealthService.instance = new HealthService();
        }
        return HealthService.instance;
    }

    public async checkHealth(): Promise<HealthCheckResult> {
        const timestamp = new Date().toISOString();

        try {
            // Check system health metrics
            const memoryUsage = process.memoryUsage();
            const uptime = process.uptime();

            // Check if we have enough memory (less than 99% used)
            const memoryHealthy = (memoryUsage.heapUsed / memoryUsage.heapTotal) < 0.99;

            // Check if uptime is reasonable (server has been running)
            const uptimeHealthy = uptime > 0;

            // Overall health status
            const isHealthy = memoryHealthy && uptimeHealthy;

            return {
                status: isHealthy ? 'healthy' : 'unhealthy',
                timestamp,
                uptime: Math.floor(uptime),
                memory: {
                    used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
                    total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
                    usage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100) // percentage
                },
                checks: {
                    memory: memoryHealthy,
                    uptime: uptimeHealthy
                }
            };
        } catch (error) {
            console.error("Health check failed:", error);
            return {
                status: 'unhealthy',
                timestamp,
                error: error instanceof Error ? error.message : 'Unknown error',
                uptime: 0,
                memory: {
                    used: 0,
                    total: 0,
                    usage: 0
                },
                checks: {
                    memory: false,
                    uptime: false
                }
            };
        }
    }

    public async checkWhatsAppHealth(whatsappService: any): Promise<WhatsAppHealthResult> {
        try {
            const status = whatsappService.getStatus();

            return {
                status: status,
                isHealthy: status.isReady && status.hasQR? false : status.isReady,
                lastCheck: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'error',
                isHealthy: false,
                lastCheck: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    public async getDetailedHealth(whatsappService: any): Promise<DetailedHealthResult> {
        const systemHealth = await this.checkHealth();
        const whatsappHealth = await this.checkWhatsAppHealth(whatsappService);

        const overallHealthy = systemHealth.status === 'healthy' && whatsappHealth.isHealthy;

        return {
            status: overallHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            system: systemHealth,
            whatsapp: whatsappHealth,
            overall: {
                healthy: overallHealthy,
                version: process.env.npm_package_version || '1.0.0',
                nodeVersion: process.version,
                platform: process.platform
            }
        };
    }
}

export interface HealthCheckResult {
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    uptime: number;
    memory: {
        used: number;
        total: number;
        usage: number;
    };
    checks: {
        memory: boolean;
        uptime: boolean;
    };
    error?: string;
}

export interface WhatsAppHealthResult {
    status: string;
    isHealthy: boolean;
    lastCheck: string;
    error?: string;
}

export interface DetailedHealthResult {
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    system: HealthCheckResult;
    whatsapp: WhatsAppHealthResult;
    overall: {
        healthy: boolean;
        version: string;
        nodeVersion: string;
        platform: string;
    };
}
