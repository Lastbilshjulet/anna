import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import { Bot } from '../../models/bot';
import voiceChannelCheck from '../../utils/voiceChannelCheck';
import embedReply, { getDuration } from '../../utils/embedReply';
import { Song } from '../../models/interfaces/song';

export default {
	data: new SlashCommandBuilder()
		.setName('queue')
		.setDescription('Prints next ten messages in the queue.'),
    async execute(bot: Bot, interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral }).catch(console.error);
        const result = await voiceChannelCheck(bot, interaction);
        if (!('musicPlayer' in result)) {
            return await embedReply(interaction, 'No queue could be found');
        }
        const musicPlayer = result.musicPlayer;

        const queuedSongs: Song[] = musicPlayer.queue.getUpcomingTenSongs();

        if (queuedSongs.length === 0) {
            return await embedReply(interaction, 'The queue is empty.');
        }
        
        const embed = new EmbedBuilder()
            .setColor(0x0600ff)
            .setTitle("Queue")
            .setDescription(`Next ${queuedSongs.length} song(s) in the queue from ${musicPlayer.queue.getQueueSize()} total.`)
            .addFields(
                queuedSongs.map((song, index) => ({
                    name: `${index + 1}. ${song.title} - ${song.artist}`,
                    value: `Duration: ${getDuration(song.duration)} | Requested by: ${song.requestedBy} | [Source](${song.source})`,
                }))
            )
            .setTimestamp()
            .setFooter({ text: `By ${interaction.member?.user.username}`, iconURL: interaction.user.displayAvatarURL() });

        return await interaction.editReply({
            embeds: [embed],
        }).then((msg) => setTimeout(() => msg.delete().catch(console.error), 300_000));
	},
};
