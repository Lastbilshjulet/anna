import { REST, ApplicationCommandDataResolvable, Client, Collection, Events, Routes, MessageFlags, Snowflake } from "discord.js";
import { config } from "../utils/config.js";
import { Command } from "./interfaces/command.js";
import { readdirSync } from "fs";
import { join } from "path";
import { MusicPlayer } from "./musicPlayer.js";
import { Song } from "./interfaces/song.js";
import { Sequelize } from "sequelize-typescript";
import SongEntity from "./entities/songEntity.js";

export class Bot {
    public slashCommands = new Array<ApplicationCommandDataResolvable>();
    public slashCommandsMap = new Collection<string, Command>();
    public musicPlayers: Collection<Snowflake, MusicPlayer> = new Collection<Snowflake, MusicPlayer>();
    public availableSongs: Collection<string, Song> = new Collection<string, Song>();
    private sequelize: Sequelize;

	public constructor(public readonly client: Client) {
        this.client = client;

		this.client.login(config.token);

		this.client.once(Events.ClientReady, readyClient => {
            console.log(`Ready! Logged in as ${readyClient.user.tag}`);
            
            this.registerSlashCommands();
        });
        
        this.client.on("warn", console.warn);
        this.client.on("error", console.error);

        this.isChatInputCommandListener();
        this.isAutocompleteListener();
        this.instantiateSequelize();
    }
    
    private async instantiateSequelize() {
        this.sequelize = new Sequelize({
            database: 'annabot_db',
            dialect: 'sqlite',
            storage: 'database.sqlite',
            username: 'root',
            password: '',
            models: [SongEntity],
            logging: false,
        });
        await this.sequelize.sync({ alter: true });
        console.log("Database synchronized successfully (alter applied).");
        await this.fetchStoredSongs();
    }

	getClient() {
		return this.client;
    }

    getMusicPlayer(guildId: Snowflake) {
        const musicPlayer = this.musicPlayers.get(guildId)
        return musicPlayer?.hasActiveConnection() ? musicPlayer : null;
    }

    private async fetchStoredSongs() {
        const songs = await SongEntity.findAll();
        console.log("Fetched songs from db: " + songs.length);
        console.log("----------------------------------------");
        for (const song of songs) {
            this.availableSongs.set(song.ytId, song);
            console.log(song.toString());
        }
        console.log("----------------------------------------");
    }

    private async registerSlashCommands() {
        const rest = new REST().setToken(config.token);

        const commandsDir = readdirSync(join(__dirname, "..", "commands"));
        for (const dir of commandsDir) {
            const path = join(__dirname, "..", "commands", dir);
            const files = readdirSync(path).filter((file) => file.endsWith(".js"));
            for (const file of files) {
                const command = await import(join(path, file));

                this.slashCommands.push(command.default.data);
                this.slashCommandsMap.set(command.default.data.name, command.default);
            };
        };

        console.log(`Registering ${this.slashCommands.length} slash commands. ${Array.from(this.slashCommandsMap.keys()).join(", ")}`);
        try {
            const response = await rest.put(
                Routes.applicationCommands(config.clientId),
                { body: this.slashCommands }
            );
            if (Array.isArray(response)) {
                console.log(`Successfully registered ${response.length} application commands.`);
            } else {
                console.error("Unexpected response type while registering application commands.");
            }
        } catch (error) {
            console.error("Error registering application commands:", error);
        }
    }
    
    private isChatInputCommandListener() {
        this.client.on(Events.InteractionCreate, async (interaction) => {
            if (!interaction.isChatInputCommand()) return;

            const command = this.slashCommandsMap.get(interaction.commandName);

            if (!command) return;

            try {
                await command.execute(this, interaction);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: "There was an error while executing this command!", flags: MessageFlags.SuppressNotifications });
            }
        });
    }
    
    private isAutocompleteListener() {
        this.client.on(Events.InteractionCreate, async (interaction) => {
            if (!interaction.isAutocomplete()) return;

            const command = this.slashCommandsMap.get(interaction.commandName);

            if (!command) return;

            try {
                if (!command.isAutocomplete) return;
                await command.autocomplete(this, interaction);
            } catch (error) {
                console.error(error);
            }
        });
    }
}
