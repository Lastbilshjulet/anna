import { Collection } from "discord.js";
import { Song } from "./interfaces/song";

export class Queue {
    songs: Array<Song>;
    current: Song | null;
    history: Array<Song>;
    autoPlayHistory: Array<Song>;
    volume: number;
    loop: boolean;
    paused: boolean;
    playing: boolean;
    textChannelId: string;
    voiceChannelId: string;
    lastUpdate: number;

    constructor() {
        this.songs = [];
        this.history = [];
        this.autoPlayHistory = [];
        this.loop = false;
        this.lastUpdate = Date.now();
    }

    public push(song: Song) {
        this.songs.push(song);
        this.lastUpdate = Date.now();
    }

    public pop() {
        const song = this.songs.shift();
        if (song) {
            this.history.unshift(song);
            this.current = song;
            this.lastUpdate = Date.now();
        }
        return song;
    }

    public isEmpty() {
        return this.songs.length === 0;
    }

    public getLastSong() {
        if (this.isEmpty()) {
            return null;
        }
        return this.songs[this.songs.length - 1];
    }

    public getNotPlayedSong(availableSongs: Collection<string, Song>): Song|undefined {
        const playedIds = new Set(this.history.map(s => s.ytId));
        const autoPlayIds = new Set(this.autoPlayHistory.map(s => s.ytId));
        let candidates = Array.from(availableSongs.values()).filter(s => !playedIds.has(s.ytId) && !autoPlayIds.has(s.ytId));

        if (candidates.length > 0) {
            const rand = Math.floor(Math.random() * candidates.length);
            const chosen = candidates[rand];
            this.autoPlayHistory.push(chosen);
            return chosen;
        }
        
        return undefined
    }
};
