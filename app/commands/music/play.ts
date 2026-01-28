import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction, TextChannel, VoiceBasedChannel, InteractionResponse, MessageFlags } from 'discord.js';
import { DiscordGatewayAdapterCreator, joinVoiceChannel } from '@discordjs/voice';
import { video_basic_info } from 'play-dl';
import { exec } from 'child_process'
import YouTube from 'youtube-sr';
import { join } from "path";
import { promises as fs } from 'fs';
import puppeteer from 'puppeteer';
import SongEntity from '../../models/entities/songEntity';
import { MusicPlayer } from '../../models/musicPlayer';
import { isYoutubeVideo, isSoundcloud, isMobileSoundcloud, isSpotifyURL } from '../../utils/patterns';
import { Song } from '../../models/interfaces/song';
import embedReply, { embedSend, getDuration } from '../../utils/embedReply';
import { Bot } from '../../models/bot';
import { config } from '../../utils/config';

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
        ).sort((a, b) => b.timesPlayed - a.timesPlayed);

        const filteredObjects = filtered.map(choice => (
            {
                name: ((choice.title + ' - ' + choice.artist).slice(0, 90) + ' | ' + getDuration(choice.duration)).slice(0, 99),
                value: choice.ytId
            }
        ));

		await interaction.respond(filteredObjects.slice(0, 25));
	},
    async execute(bot: Bot, interaction: ChatInputCommandInteraction) {
        const deferMessage: void|InteractionResponse<boolean> = await interaction.deferReply({ flags: MessageFlags.Ephemeral }).catch(console.error);
        const guildMember = interaction.guild!.members.cache.get(interaction.user.id);
        const voiceChannel = guildMember!.voice.channel;

        if (!voiceChannel) {
            return await embedReply(interaction, 'You need to be in a voice channel to play a song!');
        }

        const song = interaction.options.getString('song');
        let fetchedSong = bot.availableSongs.get(song ?? '');

        if (!fetchedSong) {
            let newSongDetails = await fetchSongMetadata(song ?? '', interaction.user.username);
            if (newSongDetails) {
                fetchedSong = bot.availableSongs.get(newSongDetails.ytId);
                if (fetchedSong) {
                    await saveAndPlaySong(fetchedSong, interaction, bot, voiceChannel, deferMessage);
                    return;
                }
                console.log("Downloading " + newSongDetails.title + " from " + newSongDetails.source);
                const songPath = config.mountPath + newSongDetails.path + ".ogg";
                const command = `yt-dlp -x --audio-format ogg -o "${songPath}" "${newSongDetails.source}"`;
                try {
                    const { stdout, stderr } = await execPromise(command);
                    console.log(`stdout: ${stdout}`);
                    if (stderr) console.warn(`yt-dlp stderr: ${stderr}`);
                } catch (error) {
                    console.error('Error executing command (yt-dlp):', error);
                }

                const downloadValid = await verifyDownloadFile(songPath, 10000);
                if (!downloadValid) {
                    console.error(`Download not valid or file missing: ${songPath}`);
                    return embedReply(interaction, 'Failed to download the song.');
                }

                fetchMusicPlayerAndPlay(bot, interaction, voiceChannel, newSongDetails!);
                console.log("Downloading to " + config.mountPath + newSongDetails!.path);
                await newSongDetails.save()
                    .catch((error) => {
                        console.error('Error saving song to database:', error);
                        return embedReply(interaction, 'Failed to save song to database.');
                    });
                return await deferMessage?.delete().catch(console.error);
            } else {
                return await embedReply(interaction, 'Nothing found from query - ' + song);
            }
        }
        await saveAndPlaySong(fetchedSong, interaction, bot, voiceChannel, deferMessage);
	},
};

async function saveAndPlaySong(fetchedSong: Song, interaction: ChatInputCommandInteraction, bot: Bot, voiceChannel: VoiceBasedChannel, deferMessage: void|InteractionResponse<boolean>) {
    await updateSong(fetchedSong, bot);

    await fetchMusicPlayerAndPlay(bot, interaction, voiceChannel, fetchedSong!);
    await deferMessage?.delete().catch(console.error);
}

async function updateSong(fetchedSong: Song, bot: Bot) {
    const songEntity = await SongEntity.findOne({ where: { ytId: fetchedSong.ytId } });
    if (songEntity) {
        songEntity.timesPlayed += 1;
        await songEntity.save();
        bot.availableSongs.set(fetchedSong.ytId, songEntity);
        console.log(`Updated song: ${songEntity.title} | ${songEntity.title}, Times Played: ${songEntity.timesPlayed}`);
    } else {
        console.error(`Song with ytId ${fetchedSong.ytId} not found in the database.`);
    }
}

async function execPromise(command: string): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
        exec(
            command,
            {windowsHide: true},
            (error, stdout, stderr) => {
                if (error) {
                    return reject(error);
                }
                resolve({ stdout, stderr });
            }
        );
    });
}

async function verifyDownloadFile(filePath: string, minBytes = 10000): Promise<boolean> {
    try {
        const stats = await fs.stat(filePath);
        if (!stats.isFile()) return false;
        if (stats.size < minBytes) {
            console.warn(`Downloaded file too small (${stats.size} bytes): ${filePath}`);
            return false;
        }
        return true;
    } catch (err) {
        return false;
    }
}

async function fetchMusicPlayerAndPlay(bot: Bot, interaction: ChatInputCommandInteraction, voiceChannel: VoiceBasedChannel, fetchedSong: Song) {
    const guildId = voiceChannel.guild.id
    let musicPlayer = bot.getMusicPlayer(guildId);

    if (musicPlayer) {
        if (musicPlayer.connection.joinConfig.channelId !== voiceChannel.id) {
            return embedReply(interaction, 'You need to be connected to the same voice channel as the bot!');
        }
        bot.availableSongs.set(fetchedSong!.ytId, fetchedSong!);
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
        }),
        bot
    );
    bot.musicPlayers.set(guildId, musicPlayer);
    bot.availableSongs.set(fetchedSong!.ytId, fetchedSong!);
    musicPlayer.play(fetchedSong!);
}

async function fetchSongMetadata(song: string, requestedBy: string) {
    try {
        if (isSoundcloud.test(song) || isMobileSoundcloud.test(song) || isSpotifyURL.test(song)) {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.goto(song, { waitUntil: 'domcontentloaded' });
        
            await page.waitForSelector('.soundTitle__usernameHeroContainer .sc-link-secondary');
            await page.waitForSelector('.playbackTimeline__duration [aria-hidden]');

            const metadata = await page.evaluate(() => {
                const idText = document.querySelector('meta[property="al:android:url"]')?.getAttribute('content');
                const id = idText ? idText.split(':')[1] : '';
                const title = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
                const artistElement = document.querySelector('.soundTitle__usernameHeroContainer .sc-link-secondary');
                const artist = artistElement && artistElement.textContent ? artistElement.textContent.trim() : 'Unknown artist';
                const thumbnail = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
                const durationElement = document.querySelector('.playbackTimeline__duration [aria-hidden]');
                const duration = durationElement && durationElement.textContent ? durationElement.textContent.split(':').reduce((acc, time) => (60 * acc) + +time, 0) : 0;
                return { id, title, artist, thumbnail, duration };
            });
            await browser.close();

            const formattedTitle = (metadata.title ?? '').replace(/[^a-zA-Z0-9]/g, "_");
            return SongEntity.build({
                ytId: metadata.id ?? '',
                title: metadata.title ?? '',
                artist: metadata.artist ?? '',
                source: song ?? '',
                path: join(formattedTitle),
                thumbnail: metadata.thumbnail ?? '',
                duration: metadata.duration,
                requestedBy: requestedBy,
                timesPlayed: 0,
                autoplay: true
            });
        } else {
            let ytInfo;
            if (isYoutubeVideo.test(song)) {
                ytInfo = await video_basic_info(song);
            } else {
                const searchResult = await YouTube.searchOne(song);
                ytInfo = await video_basic_info(searchResult.id ?? '');
            }
            const title = (ytInfo.video_details.title ?? '').replace(/[^a-zA-Z0-9]/g, "_");
            return SongEntity.build({
                ytId: ytInfo.video_details.id ?? '',
                title: ytInfo.video_details.title ?? '',
                artist: ytInfo.video_details.channel?.name ?? '',
                source: ytInfo.video_details.url ?? '',
                path: title,
                thumbnail: ytInfo.video_details.thumbnails[0]?.url ?? '',
                duration: ytInfo.video_details.durationInSec ?? 0,
                requestedBy: requestedBy,
                timesPlayed: 0,
                autoplay: true
            });
        }
    } catch (error) {
        console.error('Error fetching song metadata:', error);
        return null;
    }
}
