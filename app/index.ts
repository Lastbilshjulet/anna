import { Client, GatewayIntentBits } from 'discord.js';
import { Bot } from './models/bot.js';

export const bot = new Bot(new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
	],
}));
