import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import embedReply from '../../utils/embedReply';
import { Bot } from '../../models/bot';
import voiceChannelCheck from '../../utils/voiceChannelCheck';
import { Queue } from '../../models/queue';

export default {
	data: new SlashCommandBuilder()
		.setName('stop')
		.setDescription('Stops and clears the queue.'),
    async execute(bot: Bot, interaction: ChatInputCommandInteraction) {
        const result = await voiceChannelCheck(bot, interaction);
        if ('musicPlayer' in result) {
            const { musicPlayer } = result;

            musicPlayer.stopAndClear();
            return await embedReply(interaction, 'Stopped playing and cleared queue!');
        }
        return result;
	},
};
