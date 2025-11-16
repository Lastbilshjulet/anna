import { Snowflake, CommandInteraction, TextChannel, Guild } from "discord.js";
import { VoiceConnectionState, VoiceConnectionStatus, createAudioResource, AudioPlayer, createAudioPlayer, VoiceConnection, NoSubscriberBehavior, AudioPlayerState, AudioPlayerStatus, AudioResource } from "@discordjs/voice";
import { Queue } from "./queue.js";
import { Song } from "./interfaces/song.js";
import { embedSend } from "../utils/embedReply.js";
import SongEntity from "./entities/songEntity.js";
import { Bot } from "./bot.js";

export class MusicPlayer {
    public guild: Guild;
    public interaction: CommandInteraction;
    public connection: VoiceConnection;
    public bot: Bot;
    public player: AudioPlayer;
    public textChannel: TextChannel;
    public queue: Queue;
    public dcInterval: NodeJS.Timeout;
    public shouldLeave: boolean = false;
    public currentResouce: AudioResource | null = null;

    public constructor(
        guild: Guild,
        interaction: CommandInteraction,
        textChannel: TextChannel,
        connection: VoiceConnection,
        bot: Bot
    ) {
        this.guild = guild;
        this.interaction = interaction;
        this.textChannel = textChannel;
        this.connection = connection;
        this.bot = bot;
        this.player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Pause,
            }
        });
        this.queue = new Queue(); // TODO: Store and fetch queue from db

        this.connection.subscribe(this.player);

        this.connection.on('stateChange', (oldState: VoiceConnectionState, newState: VoiceConnectionState) => {
        });

        this.player.on('stateChange', (oldState: AudioPlayerState, newState: AudioPlayerState) => {
            if (oldState.status !== AudioPlayerStatus.Idle && newState.status === AudioPlayerStatus.Idle) {
                this.processQueue();
            }
        });

        this.dcInterval = setInterval(() => {
            if (this.shouldLeave && this.connection.state.status === VoiceConnectionStatus.Ready && this.player.state.status === AudioPlayerStatus.Idle) {
                embedSend(interaction.channel! as TextChannel, 'Nothing is playing! Leaving voice channel...');
                this.connection.destroy();
                this.player.stop(true);
            }
        }, 1_000_000);
    }

    public hasActiveConnection() {
        return this.connection.state.status === VoiceConnectionStatus.Ready;
    }

    public play(song: Song) {
        this.queue.push(song);
        console.log(`Added to queue: ${song.title}`);
        this.processQueue();
    }

    public volume(volumeDiff: number|null = null) {
        if (this.currentResouce) {
            const currentVolume = this.currentResouce.volume?.volume ?? 0;
            if (volumeDiff) {
                this.currentResouce.volume!.setVolume(currentVolume + volumeDiff);
                console.log(`Volume changed from ${currentVolume} to ${currentVolume + volumeDiff}`);
                return currentVolume + volumeDiff;
            }
            return currentVolume;
        }
        return -1;
    }

    public stopPlaying() {
        this.currentResouce = null;
        this.player.stop(true);
    }

    public stopAndClear() {
        this.queue = new Queue();
        this.stopPlaying();
    }

    public stopAndDisconnect() {
        this.queue = new Queue();
        this.connection.destroy();
        console.log('Stopped playing, cleared queue and disconnected!');
        this.dcInterval.unref();
    }

    private processQueue() {
        if (this.player.state.status !== AudioPlayerStatus.Idle) {
            return;
        }
        
        let song: Song | undefined;
        if (this.queue.isEmpty()) {
            song = this.queue.getNotPlayedSong(this.bot.availableSongs);
        } else {
            song = this.queue.pop();
        }

        if (!song) {
            this.queue = new Queue();
            return embedSend(this.textChannel, `All songs have been played, queue something new to reset.`);
        }
        
        this.currentResouce = createAudioResource(song!.path, { inlineVolume: true });
        this.currentResouce.volume!.setVolume(0.1);
        this.player.play(this.currentResouce);
        console.log(`Playing: ${song!.title} - ${song!.artist}. Duration: ${song!.duration}s. Requested by: ${song!.requestedBy}. Source: ${song!.source}. Path: ${song!.path}. Times played: ${song!.timesPlayed}`);
        return embedSend(this.textChannel, `Now playing...`, song!);
    }
}
