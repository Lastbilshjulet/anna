import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import embedReply from "../../utils/embedReply.js";
import { Bot } from "../../models/bot";

export default {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	async execute(bot: Bot, interaction: ChatInputCommandInteraction) {
		await interaction.deferReply();
		const sent = await interaction.fetchReply();
        return await embedReply(interaction, `Roundtrip latency: ${sent.createdTimestamp - interaction.createdTimestamp}ms`);
    },
}
