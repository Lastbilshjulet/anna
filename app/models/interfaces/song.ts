export interface Song {
    ytId: string;
    title: string;
    artist: string;
    thumbnail: string;
    source: string;
    path: string;
    requestedBy: string;
    duration: number;
    timesPlayed: number;
    autoplay: boolean;
};
