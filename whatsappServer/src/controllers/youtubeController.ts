import { Request, Response } from 'express';
import { YoutubeService } from '../services/youtubeService';


// Use singleton pattern
const getYoutubeService = async (): Promise<YoutubeService> => {
    return await YoutubeService.getInstance();
};

export const youtubeController = {
    async getPlaylists(req: Request, res: Response): Promise<void> {
        try {
            const playlists = await (await getYoutubeService()).GetPlaylists();
            res.status(200).json(playlists);
        } catch (error) {
            console.error('Error fetching playlists:', error);
            res.status(500).json({ error: (error as Error).message });
        }
    },
    async getPlaylistSongs(req: Request, res: Response): Promise<void> {
        try {
            const playlistId = req.params.playlistId;
            const songs = await (await getYoutubeService()).GetPlaylistSongs(playlistId);
            res.status(200).json(songs);
        } catch (error) {
            console.error('Error fetching playlist songs:', error);
            res.status(500).json({ error: (error as Error).message });
        }
    },
    async createPlaylist(req: Request, res: Response): Promise<void> {
        try {
            // Placeholder logic for creating a playlist
            console.log("In the youtube controller")
            var result = await (await getYoutubeService()).CreatePlaylist(req.body.playlistName, req.body.description);
            res.status(200).json({ message: result });
        } catch (error) {
            console.error('Error creating playlist:', error);
            res.status(500).json({ error: (error as Error).message });
        }
    },
    async addSong(req: Request, res: Response): Promise<void> {
        try {
            const playlistId = req.params.playlistId;
            const { songName } = req.body;
            const youtubeService = await getYoutubeService();
            const result = await youtubeService.AddSong(playlistId, songName);
            res.status(200).json({ message: result });
        } catch (error) {
            console.error('Error adding song to playlist:', error);
            res.status(500).json({ error: (error as Error).message });
        }
    }
}
