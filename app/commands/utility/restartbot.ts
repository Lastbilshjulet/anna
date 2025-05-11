import { ChatInputCommandInteraction, SlashCommandBuilder, MessageFlags } from "discord.js";
import { config } from "../../utils/config.js";
import { Bot } from "../../models/bot.js";
import embedReply from "../../utils/embedReply.js";

export default {
	data: new SlashCommandBuilder()
		.setName('restartbot')
		.setDescription('Replies with Pong!'),
    async execute(bot: Bot, interaction: ChatInputCommandInteraction) {
		if (interaction.user.id !== config.ownerId) {
			return await embedReply(interaction, 'You are not allowed to use this command!', true);
		}
		console.log('Restarting bot...');
        await embedReply(interaction, 'Restarting bot..', true);
		process.exit(0);
	},
};
