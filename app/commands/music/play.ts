import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction, TextChannel, VoiceBasedChannel } from 'discord.js';
import { DiscordGatewayAdapterCreator, joinVoiceChannel } from '@discordjs/voice';
import { video_basic_info } from 'play-dl';
import { exec } from 'child_process'
import YouTube from 'youtube-sr';
import { join } from "path";
import SongEntity from '../../models/entities/songEntity';
import { MusicPlayer } from '../../models/musicPlayer';
import { isYoutubeVideo } from '../../utils/patterns';
import { Song } from '../../models/interfaces/song';
import embedReply, { embedSend } from '../../utils/embedReply';
import { Bot } from '../../models/bot';

export default {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Plays a song in the voice channel.')
		.addStringOption(option =>
			option.setName('song')
				.setDescription('The song to play')
				.setRequired(true)
                .setAutocomplete(true)),
    isAutocomplete: true,
	async autocomplete(bot: Bot, interaction: AutocompleteInteraction) {
		const focusedValue = interaction.options.getFocused();
        const filtered = bot.availableSongs.filter(choice =>
            choice.title.toLowerCase().includes(focusedValue.toLowerCase()) || 
            choice.artist.toLowerCase().includes(focusedValue.toLowerCase()) || 
            focusedValue.toLowerCase().includes(choice.source.toLowerCase())
        );
		await interaction.respond(
			filtered.map(choice => ({ name: choice.title + ' - ' + choice.artist, value: choice.ytId })),
		);
	},
    async execute(bot: Bot, interaction: ChatInputCommandInteraction) {
        const deferMessage = await interaction.deferReply().catch(console.error);
        const guildMember = interaction.guild!.members.cache.get(interaction.user.id);
        const voiceChannel = guildMember!.voice.channel;

        if (!voiceChannel) {
            return await embedReply(interaction, 'You need to be in a voice channel to play a song!');
        }

        const song = interaction.options.getString('song');
        let fetchedSong = bot.availableSongs.get(song ?? '');

        if (!fetchedSong) {
            let ytInfo;
            if (!isYoutubeVideo.test(song ?? '')) {
                const searchResult = await YouTube.searchOne(song ?? '');
                ytInfo = await video_basic_info(searchResult.id ?? '');
            } else { // TODO: Add soundcloud and spotify searches
                ytInfo = await video_basic_info(song ?? '');
            }
            if (ytInfo) {
                const songsDir = join(__dirname, "..", "..", "..", "songs");
                const title = (ytInfo.video_details.title ?? '').replace(/[^a-zA-Z0-9]/g, "_") + '.mp3';
                const fetchedSong = SongEntity.build({
                    ytId: ytInfo.video_details.id ?? '',
                    title: ytInfo.video_details.title ?? '',
                    artist: ytInfo.video_details.channel?.name ?? '',
                    source: ytInfo.video_details.url ?? '',
                    path: join(songsDir, title),
                    thumbnail: ytInfo.video_details.thumbnails[0]!.url ?? '',
                    duration: ytInfo.video_details.durationInSec ?? 0,
                    requestedBy: interaction.user.username,
                });
                await fetchedSong.save()
                    .catch((error) => {
                        console.error('Error saving song to database:', error);
                        return embedReply(interaction, 'Failed to save song to database.');
                    });
                console.log("Downloading " + title + " from " + fetchedSong.source);
                const command = `yt-dlp -x --audio-format mp3 -o "${fetchedSong.path}" "${fetchedSong.source}"`;
                await execPromise(command)
                    .then(({ stdout, stderr }) => {
                        if (stderr) {
                            console.error(`stderr: ${stderr}`);
                            return embedReply(interaction, 'Failed to download the song.');
                        }

                        console.log(`stdout: ${stdout}`);

                        fetchMusicPlayerAndPlay(bot, interaction, voiceChannel, fetchedSong!);
                        console.log("Downloading to " + fetchedSong!.path);
                    })
                    .catch((error) => {
                        console.error('Error executing command:', error);
                        return embedReply(interaction, 'Failed to download the song.');
                    });
                await deferMessage?.delete().catch(console.error);
                return;
            } else {
                return await embedReply(interaction, 'Nothing found from query - ' + song);
            }
        }
        fetchedSong.requestedBy = interaction.user.username;

        await fetchMusicPlayerAndPlay(bot, interaction, voiceChannel, fetchedSong!);
        await deferMessage?.delete().catch(console.error);
	},
};

async function execPromise(command: string): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                return reject(error);
            }
            resolve({ stdout, stderr });
        });
    });
}

async function fetchMusicPlayerAndPlay(bot: Bot, interaction: ChatInputCommandInteraction, voiceChannel: VoiceBasedChannel, fetchedSong: Song) {
    const guildId = voiceChannel.guild.id
    let musicPlayer = bot.getMusicPlayer(guildId);

    if (musicPlayer) {
        if (musicPlayer.connection.joinConfig.channelId !== voiceChannel.id) {
            return embedSend(interaction.channel! as TextChannel, 'You need to be connected to the same voice channel as the bot!');
        }
        musicPlayer.play(fetchedSong!);
        return;
    }
    musicPlayer = new MusicPlayer(
        voiceChannel.guild,
        interaction,
        interaction.channel! as TextChannel,
        joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: guildId,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator
        })
    );
    bot.musicPlayers.set(guildId, musicPlayer);
    bot.availableSongs.set(fetchedSong!.ytId, fetchedSong!);
    musicPlayer.play(fetchedSong!);
}
