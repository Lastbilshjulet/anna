import { Snowflake, CommandInteraction, TextChannel } from "discord.js";
import { VoiceConnectionState, VoiceConnectionStatus, createAudioResource, AudioPlayer, createAudioPlayer, VoiceConnection, NoSubscriberBehavior, AudioPlayerState, AudioPlayerStatus } from "@discordjs/voice";
import { Queue } from "./queue.js";
import { Song } from "./interfaces/song.js";

export class MusicPlayer {
    public guildId: Snowflake;
    public interaction: CommandInteraction;
    public connection: VoiceConnection;
    public player: AudioPlayer;
    public textChannel: TextChannel;
    public queue: Queue;
    public shouldLeave: boolean = false;

    public constructor(
        guildId: Snowflake,
        interaction: CommandInteraction,
        textChannel: TextChannel,
        connection: VoiceConnection,
    ) {
        this.guildId = guildId;
        this.interaction = interaction;
        this.textChannel = textChannel;
        this.connection = connection;
        this.player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Pause,
            }
        });
        this.queue = new Queue(); // TODO: Store and fetch queue from db

        this.connection.subscribe(this.player);

        this.connection.on('stateChange', (oldState: VoiceConnectionState, newState: VoiceConnectionState) => {
            console.log(`Connection transitioned from ${oldState.status} to ${newState.status}`);
        });

        this.player.on('stateChange', (oldState: AudioPlayerState, newState: AudioPlayerState) => {
            console.log(`Audio player transitioned from ${oldState.status} to ${newState.status}`);
            if (oldState.status !== AudioPlayerStatus.Idle && newState.status === AudioPlayerStatus.Idle) {
                this.processQueue();
            }
        });

        setInterval(() => {
            if (this.shouldLeave && this.connection.state.status === VoiceConnectionStatus.Ready && this.player.state.status === AudioPlayerStatus.Idle) {
                this.textChannel.send('Queue is empty! Leaving voice channel...')
                    .then((msg) => setTimeout(() => msg.delete(), 30_000))
                    .catch(console.error);
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

    public stopPlaying() {
        this.player.stop(true);
        this.shouldLeave = true;
        console.log('Stopped playing, cleared queue and disconnected!');
    }

    private processQueue() {
        if (this.queue.isEmpty()) {
            this.shouldLeave = true;
            return;
        }
        if (this.player.state.status === AudioPlayerStatus.Idle) {
            const newSong = this.queue.pop();
            this.player.play(createAudioResource(newSong!.path));
            console.log(`Playing: ${newSong!.title}`);
            this.textChannel.send(`Now playing: ${newSong!.title}`)
                .then((msg) => setTimeout(() => msg.delete(), 120_000))
                .catch(console.error);
            return;
        }
        this.textChannel.send('Already playing a song! Adding to queue...')
                .then((msg) => setTimeout(() => msg.delete(), 30_000))
                .catch(console.error);
    }
}
