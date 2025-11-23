import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction, InteractionResponse } from 'discord.js';
import embedReply, { getDuration } from '../../utils/embedReply';
import { Bot } from '../../models/bot';
import { Song } from '../../models/interfaces/song';
import SongEntity from '../../models/entities/songEntity';

export default {
	data: new SlashCommandBuilder()
		.setName('togglefromautoplay')
        .setDescription('Toggles selected song from autoplay.')
        .addStringOption(option =>
            option.setName('song')
                .setDescription('The song to toggle autoplay on.')
                .setRequired(true)
                .setAutocomplete(true)),
    isAutocomplete: true,
    async autocomplete(bot: Bot, interaction: AutocompleteInteraction) {
        const focusedValue = interaction.options.getFocused();
        const filtered = bot.availableSongs.filter(choice =>
            choice.title.toLowerCase().includes(focusedValue.toLowerCase()) ||
            choice.artist.toLowerCase().includes(focusedValue.toLowerCase()) ||
            focusedValue.toLowerCase().includes(choice.source.toLowerCase())
        ).sort();

        const filteredObjects = filtered.map(choice => (
            {
                name: ((choice.title + ' - ' + choice.artist).slice(0, 90) + ' | ' + getDuration(choice.duration)).slice(0, 99),
                value: choice.ytId
            }
        ));

        await interaction.respond(filteredObjects.slice(0, 25));
    },
    async execute(bot: Bot, interaction: ChatInputCommandInteraction) {
        await interaction.deferReply().catch(console.error);

        const song = interaction.options.getString('song');
        let songToRemove: Song | undefined = bot.availableSongs.get(song ?? '');
        if (!songToRemove) {
            return await embedReply(interaction, 'Could not find song.');
        }

        await updateSong(songToRemove, bot)
            .catch((error) => {
                console.error('Error saving song to database:', error);
                return embedReply(interaction, 'Failed to save song to database.');
            });

        return await embedReply(interaction, `Song ${songToRemove.title} has been toggled to ${!songToRemove.autoplay}.`);
	},
};

async function updateSong(song: Song, bot: Bot) {
    const songEntity = await SongEntity.findOne({ where: { ytId: song.ytId } });
    if (songEntity) {
        songEntity.autoplay = !song;
        await songEntity.save();
        bot.availableSongs.set(songEntity.ytId, songEntity);
        console.log(`Updated song: ${songEntity.title} | ${songEntity.title}, autoplay: ${songEntity.autoplay}`);
    } else {
        console.error(`Song with ytId ${song.ytId} not found in the database.`);
    }
}
