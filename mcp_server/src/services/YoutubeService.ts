export class YoutubeService {
    private static instance: YoutubeService;
    private baseUrl: string;
    private availableUrls: string[];
    private secret: string;
    private isInitialized: boolean = false;

    private constructor() {
        this.availableUrls = this.parseServerUrls(process.env.WHATSAPP_SERVER_URL ?? '');
        this.baseUrl = '';
        this.secret = process.env.CHATTERBOX_SECRET ?? "";
    }

    private parseServerUrls(urlString: string): string[] {
        return urlString.split(',').map(url => url.trim()).filter(url => url.length > 0);
    }

    public static async getInstance(): Promise<YoutubeService> {
        if (!YoutubeService.instance) {
            YoutubeService.instance = new YoutubeService();
        }
        if (!YoutubeService.instance.isInitialized) {
            await YoutubeService.instance.initialize();
        }
        return YoutubeService.instance;
    }

    private async initialize(): Promise<void> {
        for (const url of this.availableUrls) {
            var healthy = undefined;
            try {
                healthy = await this.checkServerHealth(url);
            } catch (error) {
                console.error('Error checking YouTube server health:', error);
                continue;
            }
            if (!healthy) continue;
            this.baseUrl = url + '/api/youtube';
            this.isInitialized = true;
            return;
        }
        throw new Error("No available servers found.");
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
                console.log(`Server ${url} health check failed with status: ${response.status}`);
                return false;
            }

            // Parse the response to check the overall.healthy field
            const healthData = await response.json();
            const isHealthy = healthData.overall?.healthy === true;

            if (!isHealthy) {
                console.log(`Server ${url} health details:`, JSON.stringify(healthData, null, 2));
            }

            return isHealthy;
        } catch (error) {
            console.log(`Server ${url} health check failed:`, error instanceof Error ? error.message : 'Unknown error');
            return false;
        }
    }

    public async createPlaylist(title: string, description: string): Promise<any> {
        const endpoint = `/playlist`;
        const url = `${this.baseUrl}${endpoint}`;
        console.log("Calling the API NOW WITH URL: ", url);
        const body = JSON.stringify({
            playlistName: title,
            description: description
        });
        const headers = {
            "x-secret": this.secret,
            'Content-Type': 'application/json',
        };
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body
        });
        if (!response.ok) {
            throw new Error(`YouTube API request failed: ${response.status} ${response.statusText}`);
        }
        var data = await response.json();
        console.log("Response from the server: ", data);
        return data.message;

    }

    public async addSong(playlistId: string, songName: string): Promise<any> {
        const endpoint = `/playlist/${playlistId}/add-song`;
        const url = `${this.baseUrl}${endpoint}`;
        console.log("Adding song to playlist with URL:", url);
        const body = JSON.stringify({
            songName: songName
        });
        const headers = {
            "x-secret": this.secret,
            'Content-Type': 'application/json',
        };
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body
        });
        if (!response.ok) {
            throw new Error(`Failed to add song to playlist: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log("Response from server:", data);
        return data.message;
    }

    public async deleteSong(playlistId: string, songName: string): Promise<any> {
        const endpoint = `/playlist/${playlistId}/delete-song`;
        const url = `${this.baseUrl}${endpoint}`;
        console.log("Deleting song from playlist with URL:", url);
        const body = JSON.stringify({
            songName: songName
        });
        const headers = {
            "x-secret": this.secret,
            'Content-Type': 'application/json',
        };
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body
        });
        if (!response.ok) {
            throw new Error(`Failed to delete song from playlist: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log("Response from server:", data);
        return data.message;
    }

    public async getPlaylists(): Promise<any> {
        const endpoint = `/playlist`;
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            "x-secret": this.secret,
            'Content-Type': 'application/json',
        };
        const response = await fetch(url, {
            method: 'GET',
            headers
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch playlist: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        return data.playlist ?? data;
    }
    public async getPlaylistSongs(playlistId: string): Promise<any> {
        const endpoint = `/playlist/${playlistId}/songs`;
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            "x-secret": this.secret,
            'Content-Type': 'application/json',
        };
        const response = await fetch(url, {
            method: 'GET',
            headers
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch songs for playlist: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        return data.songs ?? data;
    }
}
