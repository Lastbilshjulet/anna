import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import embedReply from '../../utils/embedReply';
import { Bot } from '../../models/bot';

export default {
	data: new SlashCommandBuilder()
		.setName('disconnect')
		.setDescription('Disconnects the bot from voice channel.'),
    async execute(bot: Bot, interaction: ChatInputCommandInteraction) {
        const guildMember = interaction.guild!.members.cache.get(interaction.user.id);
        const voiceChannel = guildMember!.voice.channel;
        
        if (!voiceChannel) {
            return await embedReply(interaction, 'You need to be in a voice channel to disconnect the bot!', true);
        }

        const musicPlayer = bot.getMusicPlayer(voiceChannel.guild.id);
        if (!musicPlayer) {
            return await embedReply(interaction, 'The bot is not connected to any voice channel!', true);
        }

        if (musicPlayer.connection.joinConfig.channelId !== voiceChannel.id) {
            return await embedReply(interaction, 'You need to be connected to the same voice channel as the bot!', true);
        }
        musicPlayer.stopPlaying();
        return await embedReply(interaction, 'Stopped playing and cleared queue!');
	},
};
