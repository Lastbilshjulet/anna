import { SlashCommandBuilder } from "discord.js";

export interface Command {
    data: SlashCommandBuilder;
    execute(...args: any): Promise<void>;
    isAutocomplete?: boolean;
    autocomplete(...args: any): Promise<void>;
}
