import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import embedReply from "../../utils/embedReply.js";
import { Bot } from '../../models/bot';

const data = new SlashCommandBuilder()
	.setName('info')
	.setDescription('Get info about a user or a server!')
	.addSubcommand(subcommand =>
		subcommand
			.setName('user')
			.setDescription('Info about a user')
			.addUserOption(option => option.setName('target').setDescription('The user')))
	.addSubcommand(subcommand =>
		subcommand
			.setName('server')
			.setDescription('Info about the server'));

export default {
	data: data,
	async execute(bot: Bot, interaction: ChatInputCommandInteraction) {
		if (interaction.options.getSubcommand() === 'user') {
			const user = interaction.options.getUser('target');

			if (user) {
                return await embedReply(interaction, `Username: ${user.username}\nID: ${user.id}`);
			} else {
                return await embedReply(interaction, `Your username: ${interaction.user.username}\nYour ID: ${interaction.user.id}`);
			}
		}
        else if (interaction.options.getSubcommand() === 'server') {
            return await embedReply(interaction, `Server name: ${interaction.guild!.name}\nTotal members: ${interaction.guild!.memberCount}`);
		}
	},
};
