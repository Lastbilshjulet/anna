import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import embedReply from '../../utils/embedReply';
import { Bot } from '../../models/bot';
import voiceChannelCheck from '../../utils/voiceChannelCheck';

export default {
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('Skipping currently playing song.'),
    async execute(bot: Bot, interaction: ChatInputCommandInteraction) {
        const result = await voiceChannelCheck(bot, interaction);
        if ('musicPlayer' in result) {
            const { musicPlayer } = result;

            musicPlayer.stopPlaying();
            return await embedReply(interaction, 'Skipping currently playing song!');
        }
        return result;
	},
};
