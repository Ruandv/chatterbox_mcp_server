import { MissedMessages } from "../model/interfaces";
import logger from '../services/logger';

export class WhatsAppService {
    private static instance: WhatsAppService;
    private baseUrl: string;
    private availableUrls: string[];
    private secret: string;
    private isInitialized: boolean = false;

    private constructor() {
        logger.log("info",`Initializing WhatsAppService...`);
        this.secret = process.env.CHATTERBOX_SECRET ?? "";
        this.availableUrls = this.parseServerUrls(process.env.WHATSAPP_SERVER_URL ?? "");
        this.baseUrl = "";
    }

    public static async getInstance(): Promise<WhatsAppService> {
        console.log("Getting WhatsAppService instance...");

        if (!WhatsAppService.instance) {
            WhatsAppService.instance = new WhatsAppService();
        }

        // Initialize the service if not already done
        if (!WhatsAppService.instance.isInitialized) {
            await WhatsAppService.instance.initialize();
        }

        return WhatsAppService.instance;
    }

    private parseServerUrls(urlString: string): string[] {
        return urlString.split(',').map(url => url.trim()).filter(url => url.length > 0);
    }

    private async initialize(): Promise<void> {
        for (const url of this.availableUrls) {
            if (await this.checkServerHealth(url)) {
                this.baseUrl = url;
                this.isInitialized = true;
                logger.log('info',`WhatsApp service initialized with URL: ${this.baseUrl}`);
                return;
            }
        }

        throw new Error("No available WhatsApp servers found. All servers are unreachable.");
    }

    private async checkServerHealth(url: string): Promise<boolean> {
        try {
            const response = await fetch(`${url}/api/health/detailed`, {
                method: "GET",
                headers: {
                    "x-secret": this.secret
                },
                signal: AbortSignal.timeout(5000) // 5 second timeout
            });

            if (!response.ok) {
                logger.log('info', `Server ${url} health check failed with status: ${response.status}`);
                return false;
            }

            // Parse the response to check the overall.healthy field
            const healthData = await response.json();
            const isHealthy = healthData.overall?.healthy === true;

            if (!isHealthy) {
                logger.log('info', `Server ${url} health details: ${JSON.stringify(healthData, null, 2)}`);
            }

            return isHealthy;
        } catch (error) {
            logger.log('info', `Server ${url} health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return false;
        }
    }

    public async switchToNextAvailableServer(): Promise<boolean> {
        logger.log('info', "Attempting to switch to next available server...");

        // Try to find another working server
        for (const url of this.availableUrls) {
            if (url !== this.baseUrl && await this.checkServerHealth(url)) {
                this.baseUrl = url;
                logger.log('info', `Switched to new WhatsApp server: ${this.baseUrl}`);
                return true;
            }
        }

        logger.log('info', "No alternative WhatsApp servers are available");
        return false;
    }

    private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
        const url = `${this.baseUrl}/api/whatsapp${endpoint}`;
        const headers = {
            "x-secret": this.secret,
            ...options.headers
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers,
                signal: AbortSignal.timeout(10000) // 10 second timeout
            });

            if (!response.ok) {
                // If server returns error, try to switch to another server
                if (response.status >= 500) {
                    logger.log('info', `Server error (${response.status}), attempting failover...`);
                    if (await this.switchToNextAvailableServer()) {
                        // Retry the request with the new server
                        const retryUrl = `${this.baseUrl}${endpoint}`;
                        logger.log('info', `Retrying request with new server: ${retryUrl}`);
                        const retryResponse = await fetch(retryUrl, {
                            ...options,
                            headers: {
                                "x-secret": this.secret,
                                ...options.headers
                            },
                            signal: AbortSignal.timeout(10000)
                        });

                        if (!retryResponse.ok) {
                            throw new Error(`WhatsApp API request failed after failover: ${retryResponse.status} ${retryResponse.statusText}`);
                        }

                        return retryResponse;
                    }
                }

                throw new Error(`WhatsApp API request failed: ${response.status} ${response.statusText}`);
            }

            return response;
        } catch (error) {
            // If network error, try to switch to another server
            if (error instanceof TypeError && error.message.includes('fetch')) {
                logger.log('info', `Network error, attempting failover...`);
                if (await this.switchToNextAvailableServer()) {
                    // Retry the request with the new server
                    const retryUrl = `${this.baseUrl}${endpoint}`;
                    logger.log('info', `Retrying request with new server: ${retryUrl}`);
                    const retryResponse = await fetch(retryUrl, {
                        ...options,
                        headers: {
                            "x-secret": this.secret,
                            ...options.headers
                        },
                        signal: AbortSignal.timeout(10000)
                    });

                    if (!retryResponse.ok) {
                        throw new Error(`WhatsApp API request failed after failover: ${retryResponse.status} ${retryResponse.statusText}`);
                    }

                    return retryResponse;
                }
            }

            throw error;
        }
    }

    public async getMessages(phoneNumber: string, numberOfRecords: string): Promise<MissedMessages> {
        const endpoint = `/missedMessages/${phoneNumber}/${numberOfRecords}`;
        const response = await this.makeRequest(endpoint, { method: "GET" });
        var data = await response.text();
        return JSON.parse(data) as MissedMessages;
    }

    public async lookupContact(contactName: string): Promise<string> {
        const endpoint = `/lookupContact/${contactName}`;
        const response = await this.makeRequest(endpoint, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });
        const data = await response.json();
        return data.whatsAppId;
    }

    public async sendMessage(phoneNumber: string, message: string): Promise<string> {
        const endpoint = `/sendMessage/${phoneNumber}`;
        const response = await this.makeRequest(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message })
        });
        return await response.text();
    }

    public async getServerHealth(): Promise<boolean> {
        try {
            return await this.checkServerHealth(this.baseUrl);
        } catch (error) {
            console.error("WhatsApp server health check failed:", error);
            return false;
        }
    }

    public async getAllServersHealth(): Promise<{ url: string; healthy: boolean }[]> {
        const results = [];
        for (const url of this.availableUrls) {
            const healthy = await this.checkServerHealth(url);
            results.push({ url, healthy });
        }
        return results;
    }

    public getCurrentServerUrl(): string {
        return this.baseUrl;
    }

    public getAvailableServerUrls(): string[] {
        return [...this.availableUrls];
    }

    public updateConfiguration(whatsappServerUrls?: string, secret?: string): void {
        if (whatsappServerUrls) {
            this.availableUrls = this.parseServerUrls(whatsappServerUrls);
            this.isInitialized = false; // Force re-initialization
        }
        if (secret) {
            this.secret = secret;
        }
    }

    public async getAllContacts(): Promise<{ contacts: Array<{ name: string; pushname: string; id: string; phone: string }> }> {
        const endpoint = `/getAllContacts`;
        const response = await this.makeRequest(endpoint, { method: "GET" });
        return await response.json();
    }

    public async getAllChats(): Promise<{ chats: Array<{ name: string; id: string; unreadCount: number; lastMessage?: string }> }> {
        const endpoint = `/getAllChats`;
        const response = await this.makeRequest(endpoint, { method: "GET" });
        return await response.json();
    }
}
