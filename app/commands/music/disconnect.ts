import { SlashCommandBuilder, ChatInputCommandInteraction, VoiceBasedChannel, MessageFlags } from 'discord.js';
import { Bot } from '../../models/bot';

export default {
	data: new SlashCommandBuilder()
		.setName('disconnect')
		.setDescription('Disconnects the bot from voice channel.'),
    async execute(bot: Bot, interaction: ChatInputCommandInteraction) {
        const guildMember = interaction.guild!.members.cache.get(interaction.user.id);
        const voiceChannel = guildMember!.voice.channel;
        
        if (!voiceChannel) {
            return interaction.reply({ content: 'You need to be in a voice channel to disconnect the bot!', flags: MessageFlags.Ephemeral });
        }

        const musicPlayer = bot.getMusicPlayer(voiceChannel.guild.id);
        if (!musicPlayer) {
            return interaction.reply({ content: 'The bot is not connected to any voice channel!', flags: MessageFlags.Ephemeral });
        }

        if (musicPlayer.connection.joinConfig.channelId !== voiceChannel.id) {
            return interaction.reply({ content: 'You need to be connected to the same voice channel as the bot!', flags: MessageFlags.Ephemeral });
        }
        musicPlayer.stopPlaying();
        return interaction.reply({ content: 'Stopped playing, cleared queue and disconnected from the voice channel!' });
	},
};
