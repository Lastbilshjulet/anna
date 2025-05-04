import { Song } from "./interfaces/song";

export class Queue {
    songs: Array<Song>;
    current: Song | null;
    history: Array<Song>;
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
};
