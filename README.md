# Anna - Discord Music Bot

Anna is a feature-rich Discord bot designed to enhance your server with music playback and utility commands. It supports YouTube, Spotify, and SoundCloud, allowing users to play, queue, and manage songs seamlessly.

## Features

- 🎵 **Music Playback**: Play songs from YouTube, Spotify, and SoundCloud.
- 📜 **Queue Management**: Add, remove, and view songs in the queue.
- 🔄 **Loop and History**: Loop songs and view playback history.
- 🛠️ **Utility Commands**: Includes commands like `/ping`, `/info`, and `/restartbot`.
- 💾 **Persistent Storage**: Saves songs and playback data using SQLite.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/anna.git
   cd anna
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your `.env` file:
   ```plaintext
   TOKEN=your-discord-bot-token
   CLIENT_ID=your-discord-client-id
   OWNER_ID=your-discord-user-id
   ```

4. Build the project:
   ```bash
   npm run build
   ```

5. Start the bot:
   ```bash
   npm start
   ```

## Commands

### Music Commands
- `/play [song]`: Plays a song in the voice channel.
- `/disconnect`: Disconnects the bot from the voice channel.

### Utility Commands
- `/ping`: Checks the bot's latency.
- `/info`: Displays information about a user or server.
- `/restartbot`: Restarts the bot (owner-only).

## Development

### Prerequisites
- Node.js v16 or higher
- SQLite3

### Scripts
- `npm run dev`: Runs the bot in development mode.
- `npm run start`: Runs the bot in production mode using pm2 for auto restarts.
- `npm run build`: Compiles TypeScript to JavaScript.

### Project Structure
- `app/commands`: Contains all command implementations.
- `app/models`: Contains core models like `Bot`, `Queue`, and `MusicPlayer`.
- `app/config.ts`: Configuration file for environment variables.
- `songs/`: Directory for downloaded songs.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## License

This project is licensed under the [MIT License](./LICENSE).

## Acknowledgments

- [Discord.js](https://discord.js.org/) for the Discord API wrapper.
- [YouTube-SR](https://github.com/DevSnowflake/youtube-sr) for YouTube search functionality.
- [Play-DL](https://github.com/play-dl/play-dl) for media extraction.

## Future Updates / TODO List

- [ ] 🎶 **Add Support for Spotify and SoundCloud Playback**: Extend the `/play` command to handle Spotify and SoundCloud URLs.
- [x] 🔄 **Improve messages**: Use Embeds and buttons to improve the style and functionality of messages. 
- [ ] 🔄 **Extended functionality**: Add more commands like skipping, volume, pausing, queue viewing etc.
- [ ] 🔄 **Queue Persistence**: Save and restore the queue state across bot restarts.
- [ ] 🗂️ **Playlist Management**: Allow users to create, save, and load playlists.
- [ ] 🧪 **Unit Tests**: Add unit tests for core functionalities.

Feel free to suggest additional features by opening an issue or submitting a pull request!

Enjoy using Anna! 🎶
