import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import embedReply from '../../utils/embedReply';
import { Bot } from '../../models/bot';
import voiceChannelCheck from '../../utils/voiceChannelCheck';

export default {
	data: new SlashCommandBuilder()
		.setName('volume')
		.setDescription('Getting or setting the volume for the currently playing song.')
		.addIntegerOption(option =>
			option.setName('volume')
				.setDescription('Volume to set (10-200)')),
    async execute(bot: Bot, interaction: ChatInputCommandInteraction) {
        const result = await voiceChannelCheck(bot, interaction);
        if ('musicPlayer' in result) {
            const { musicPlayer } = result;

            const currentVolume = musicPlayer.volume();

            if (currentVolume  === -1) {
                return await embedReply(interaction, "There is no currently playing song.", true);
            }

            const volumeOption = interaction.options.getInteger('volume');
            if (!volumeOption) {
                return await embedReply(interaction, `Current volume is ${currentVolume * 100}%.`, true);
            }

            if (volumeOption < 10 || volumeOption > 200) {
                return await embedReply(interaction, 'Volume must be a number between 10 and 200.');
            }
            const newVolume = (volumeOption / 100) - currentVolume;

            musicPlayer.volume(newVolume);

            return await embedReply(interaction, `Setting volume to ${volumeOption}%.`);
        }
        return result;
	},
};
