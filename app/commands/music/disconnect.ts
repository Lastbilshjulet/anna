import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import embedReply from '../../utils/embedReply';
import { Bot } from '../../models/bot';
import voiceChannelCheck from '../../utils/voiceChannelCheck';

export default {
	data: new SlashCommandBuilder()
		.setName('disconnect')
		.setDescription('Disconnects the bot from voice channel.'),
    async execute(bot: Bot, interaction: ChatInputCommandInteraction) {
        const result = await voiceChannelCheck(bot, interaction);
        if ('voiceChannel' in result && 'musicPlayer' in result) {
            const { voiceChannel, musicPlayer } = result;

            musicPlayer.stopAndDisconnect();
            bot.musicPlayers.delete(voiceChannel.guild.id);
            return await embedReply(interaction, 'Stopped playing and cleared queue!');
        } else {
            return await embedReply(interaction, 'Failed to disconnect: Invalid voice channel or music player.');
        }
	},
};
