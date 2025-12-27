import 'dotenv/config';
import { Config } from '.././models/interfaces/config.js';

export const config: Config = {
	token: process.env.TOKEN ?? '',
	clientId: process.env.CLIENT_ID ?? '',
	ownerId: process.env.OWNER_ID ?? '',
	mountPath: process.env.MOUNT_PATH ?? '',
};
