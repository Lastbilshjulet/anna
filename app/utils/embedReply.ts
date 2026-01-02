import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags, TextChannel } from "discord.js";
import { Song } from "../models/interfaces/song";

export default async function embedReply(interaction: ChatInputCommandInteraction, content: string, ephemeral: boolean = false) {
    const embed = new EmbedBuilder()
        .setColor(0x0600ff)
        .setTitle(content)
        .setTimestamp()
        .setFooter({ text: `By ${interaction.member?.user.username}`, iconURL: interaction.user.displayAvatarURL() });
    if (interaction.deferred || interaction.replied) {
        return await interaction.editReply({
            embeds: [embed],
        }).then((msg) => setTimeout(() => msg.delete().catch(console.error), 60_000));
    }
    return await interaction.reply({
        embeds: [embed],
        flags: ephemeral ? MessageFlags.Ephemeral : undefined,
    }).then((msg) => setTimeout(() => msg.delete().catch(console.error), 60_000));
}

export async function embedSend(textChannel: TextChannel, content: string, song: Song | null = null) {
    const embed = new EmbedBuilder()
        .setColor(0x0600ff)
        .setTitle(content)
        .setTimestamp();
    if (song) {
        embed.setDescription(`:notes: [${song.title} - ${song.artist}](${song.source}) ${getDuration(song.duration)}`);
        embed.setFooter({ text: `By ${song.requestedBy}` });
    }
    return await textChannel.send({
        embeds: [embed],
        flags: MessageFlags.SuppressEmbeds,
    }).then((msg) => setTimeout(() => msg.delete().catch(console.error), song && (content === "Now playing..." || content === "Auto-playing...") ? song.duration * 1_000 : 60_000));
}

export function getDuration(duration: number) {
    return `${Math.floor(duration / 60)}:${Math.floor(duration % 60).toString().padStart(2, '0')}`;
}
