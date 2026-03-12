import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags, EmbedBuilder } from 'discord.js';
import { Bot } from '../../models/bot';
import SongEntity from '../../models/entities/songEntity';

export default {
	data: new SlashCommandBuilder()
		.setName('toplist')
		.setDescription('Shows the top played songs.')
		.addStringOption((option) =>
			option
				.setName('type')
				.setDescription('The type of top list to show')
				.setRequired(true)
				.addChoices(
					{ name: 'Auto', value: 'AUTO' },
					{ name: 'Manual', value: 'MANUAL' },
                ),
            ),
    async execute(bot: Bot, interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral }).catch(console.error);
		
        const type = interaction.options.getString('type') ?? 'AUTO';
        
        const column = type === 'AUTO' ? 'timesAutoPlayed' : 'timesPlayed';
        const topSongs = await SongEntity.findAll({
            order: [[column, 'DESC']],
            limit: 10,
        });

        const embed = new EmbedBuilder()
            .setColor(0x0600ff)
            .setTitle("Top list")
            .setDescription(`Top 10 most ${type === 'AUTO' ? 'automatically' : 'manually'} played songs.`)
            .addFields(
                topSongs.map((song, index) => ({
                    name: "",
                    value: `${index + 1}. [${song.title} - ${song.artist}](${song.source}) has been played ${song[column]} times`,
                }))
            )
            .setTimestamp()
            .setFooter({ text: `By ${interaction.member?.user.username}`, iconURL: interaction.user.displayAvatarURL() });

        return await interaction.editReply({
            embeds: [embed],
        }).then((msg) => setTimeout(() => msg.delete().catch(console.error), 300_000));
	},
};
