import { google, youtube_v3 } from "googleapis";
import fs from "fs";

export class YoutubeService {
    private static instance: YoutubeService;
    private static youtube: youtube_v3.Youtube;

    private static authenticate = async () => {

        console.log("getting the auth token")
        var keys: any[] = JSON.parse(process.env.YOUTUBE_KEYS!);
        const KEY:number = parseInt(process.env.YOUTUBE_KEY!);
        const URLKEY = 1;
        const oauth2Client = new google.auth.OAuth2(
            keys[KEY].client_id,
            keys[KEY].client_secret,
            keys[KEY].redirect_uris[URLKEY]
        );
        var t = fs.readFileSync('./secrets/token.json', { "encoding": "utf-8" });
        var authToken = JSON.parse(t);
        oauth2Client.setCredentials(authToken);
        return oauth2Client;
    }

    private constructor() { }

    public static async getInstance(): Promise<YoutubeService> {
        if (!YoutubeService.instance) {
            YoutubeService.instance = new YoutubeService();
            const auth = await YoutubeService.authenticate();
            YoutubeService.youtube = new youtube_v3.Youtube({ auth });
        }
        return YoutubeService.instance;
    }

    public async GetPlaylists(): Promise<any> {
        const response = await YoutubeService.youtube.playlists.list({
            part: ['snippet'],
            mine: true,
            maxResults: 50
        });
        return Promise.resolve(response.data.items);
    }

    public async GetPlaylistSongs(playlistId: string): Promise<any> {
        const response = await YoutubeService.youtube.playlistItems.list({
            part: ['snippet'],
            playlistId: playlistId,
            maxResults: 50
        });

        if (!response.data.items || response.data.items.length === 0) {
            return Promise.reject(new Error('Playlist not found'));
        }

        return Promise.resolve(response.data.items);
    }

    public async CreatePlaylist(playlistName: string, description: string): Promise<string> {

        const response = await YoutubeService.youtube.playlists.insert({
            part: ['snippet'],
            requestBody: {
                snippet: {
                    title: playlistName,
                    description: description,
                },
            },
        });
        return Promise.resolve(`Playlist created. PlaylistId is : ${response.data.id}`);
    }

    public async AddSong(playlistId: string, songName: string): Promise<string> {
        const searchResponse = await YoutubeService.youtube.search.list({
            part: ['snippet'],
            q: songName,
            type: ['video'],
            maxResults: 1,
        });
        if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
            return Promise.reject(new Error('Song not found'));
        }

        const songId = searchResponse.data.items[0].id?.videoId;

        const response = await YoutubeService.youtube.playlistItems.insert({
            part: ['snippet'],
            requestBody: {
                snippet: {
                    playlistId: playlistId,
                    resourceId: {
                        kind: 'youtube#video',
                        videoId: songId,
                    },
                },
            },
        });
        return Promise.resolve(`Song added to playlist. PlaylistItemId is : ${response.data.id}`);
    }
}