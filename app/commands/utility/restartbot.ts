import { ChatInputCommandInteraction, SlashCommandBuilder, MessageFlags } from "discord.js";
import { config } from "../../config.js";
import { Bot } from "../../models/bot.js";

export default {
	data: new SlashCommandBuilder()
		.setName('restartbot')
		.setDescription('Replies with Pong!'),
    async execute(bot: Bot, interaction: ChatInputCommandInteraction) {
		if (interaction.user.id !== config.ownerId) {
			return interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
		}
		console.log('Restarting bot...');
		await interaction.reply({ content: 'Restarting bot...', flags: MessageFlags.Ephemeral });
		process.exit(0);
	},
};
