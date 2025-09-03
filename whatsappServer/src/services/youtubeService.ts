import { google, youtube_v3 } from "googleapis";
import fs from "fs";

export class YoutubeService {
    private static instance: YoutubeService;
    private static youtube: youtube_v3.Youtube;

    private static authenticate = async () => {

        console.log("getting the auth token")
        var keys: any[] = JSON.parse(process.env.YOUTUBE_KEYS!);
        const KEY: number = parseInt(process.env.YOUTUBE_KEY!);
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
        var myItems: Array<any> = [];
        var nextPageToken = undefined;
        do {
            const response: any = await YoutubeService.youtube.playlists.list({
                part: ['snippet'],
                mine: true,
                maxResults: 50,
                pageToken: nextPageToken
            });
            myItems = [...myItems, ...response.data.items!];
            nextPageToken = response.data.nextPageToken;
        } while (nextPageToken);
        return Promise.resolve(myItems);
    }

    public async GetPlaylistSongs(playlistId: string): Promise<any> {
        var myItems: Array<any> = [];
        var nextPageToken = undefined;
        do {
            // Fetch the next page of results
            const nextPageResponse: any = await YoutubeService.youtube.playlistItems.list({
                part: ['snippet'],
                playlistId: playlistId,
                maxResults: 50,
                pageToken: nextPageToken
            });
            if (!nextPageResponse.data.items || nextPageResponse.data.items.length === 0) {
                return Promise.reject(new Error('Playlist not found'));
            }
            // Combine the results from both pages
            myItems = [...myItems, ...nextPageResponse.data.items!];
            nextPageToken = nextPageResponse.data.nextPageToken;
        } while (nextPageToken);
        return Promise.resolve(myItems);
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

    // create a new function that will delete a song from a specific playlist by name
    public async DeleteSong(playlistId: string, songName: string): Promise<string> {
       var songs = await this.GetPlaylistSongs(playlistId);
       var song = songs.find((s: any) => s.snippet.title === songName);
       if (!song) {
           return Promise.reject(new Error('Song not found in playlist'));
       }

       const response = await YoutubeService.youtube.playlistItems.delete({
           id: song.id,
       });
       return Promise.resolve(`Song deleted from playlist. PlaylistItemId was : ${song.id}`);
    }
}