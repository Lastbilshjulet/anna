/// <reference types="jest" />

/**
 * Unit tests for app/commands/music/play.ts
 *
 * Covers:
 * - autocomplete (filter/sort + getDuration usage)
 * - execute: no voice channel -> reply
 * - execute: fetchSongMetadata failure -> "Nothing found from query - <song>"
 */

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  // ensure any module that would import ./queue.js is mocked so tests don't try to resolve .js output files
  jest.doMock('../../../app/models/musicPlayer', () => ({
    __esModule: true,
    // export a simple stub (constructor/class or object) — tests only need the module to exist
    MusicPlayer: class {},
    default: {},
  }));
  jest.doMock('../../../app/models/queue', () => ({
    __esModule: true,
    Queue: class {},
  }));
});

import { Collection } from 'discord.js';

it('autocomplete responds with filtered & sorted songs using getDuration', async () => {
  // mock embedReply module (provide getDuration named export)
  jest.doMock('../../../app/utils/embedReply', () => ({
    __esModule: true,
    default: jest.fn(),
    getDuration: (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
    },
  }));

  await jest.isolateModulesAsync(async () => {
    const playCommand = (await import('../../../app/commands/music/play')).default;

    const songA = { ytId: 'a', title: 'Alpha', artist: 'ArtistA', source: 'u', duration: 65, timesPlayed: 1 } as any;
    const songB = { ytId: 'b', title: 'Beta', artist: 'ArtistB', source: 'v', duration: 5, timesPlayed: 10 } as any;

    const bot: any = {
      availableSongs: new Collection<string, any>([
        [songA.ytId, songA],
        [songB.ytId, songB],
      ]),
    };

    const interaction: any = {
      options: { getFocused: () => 'a' },
      respond: jest.fn().mockResolvedValue(undefined),
    };

    await playCommand.autocomplete(bot, interaction);

    expect(interaction.respond).toHaveBeenCalledTimes(1);
    const arg = (interaction.respond as jest.Mock).mock.calls[0][0];
    expect(Array.isArray(arg)).toBe(true);
    // sorted by timesPlayed desc -> songB first
    expect(arg[0].value).toBe('b');
    // name includes title/artist and duration formatted by our getDuration
    expect(arg[0].name).toMatch(/Beta - ArtistB/);
    expect(arg[0].name).toMatch(/0:05/);
  });
});

it('execute replies when user is not in a voice channel', async () => {
  jest.doMock('../../../app/utils/embedReply', () => ({
    __esModule: true,
    default: jest.fn().mockResolvedValue('replied'),
  }));

  await jest.isolateModulesAsync(async () => {
    const playCommand = (await import('../../../app/commands/music/play')).default;

    const fakeInteraction: any = {
      deferReply: jest.fn().mockResolvedValue(undefined),
      guild: {
        members: {
          cache: {
            get: (_id: string) => ({ voice: { channel: null } }), // user not in VC
          },
        },
      },
      user: { id: 'u1', username: 'tester' } as any,
      options: { getString: jest.fn().mockReturnValue('some-song') },
    };

    const bot: any = { availableSongs: new Collection<string, any>() };

    const res = await playCommand.execute(bot, fakeInteraction);
    expect(res).toBe('replied');

    const embedReply = (await import('../../../app/utils/embedReply')).default as jest.Mock;
    expect(embedReply).toHaveBeenCalledWith(fakeInteraction, 'You need to be in a voice channel to play a song!');
  });
});

it('execute replies "Nothing found from query - <song>" when fetchSongMetadata fails', async () => {
  // mock embedReply
  jest.doMock('../../../app/utils/embedReply', () => ({
    __esModule: true,
    default: jest.fn().mockResolvedValue('replied'),
    getDuration: jest.fn(),
  }));
  // ensure patterns treat our test string as a youtube url (so play-dl video_basic_info will be called)
  jest.doMock('../../../app/utils/patterns', () => ({
    __esModule: true,
    isYoutubeVideo: /youtube\.com|youtu\.be/,
    isSoundcloud: /$^/,
    isMobileSoundcloud: /$^/,
    isSpotifyURL: /$^/,
  }));
  // make video_basic_info throw so fetchSongMetadata returns null
  jest.doMock('play-dl', () => ({
    __esModule: true,
    video_basic_info: jest.fn(async () => { throw new Error('fail'); }),
  }));

  await jest.isolateModulesAsync(async () => {
    const playCommand = (await import('../../../app/commands/music/play')).default;

    const songQuery = 'https://youtube.com/watch?v=abc';
    const fakeInteraction: any = {
      deferReply: jest.fn().mockResolvedValue(undefined),
      guild: {
        members: {
          cache: {
            get: (_id: string) => ({ voice: { channel: { id: 'vc1', guild: { id: 'g1', voiceAdapterCreator: {} } } } }),
          },
        },
      },
      user: { id: 'u1', username: 'tester' } as any,
      options: { getString: jest.fn().mockReturnValue(songQuery) },
      channel: {} as any,
    };

    const bot: any = {
      availableSongs: new Collection<string, any>(), // no cached song
      getMusicPlayer: jest.fn().mockReturnValue(null),
      musicPlayers: new Collection(),
    };

    const res = await playCommand.execute(bot, fakeInteraction);
    expect(res).toBe('replied');

    const embedReply = (await import('../../../app/utils/embedReply')).default as jest.Mock;
    expect(embedReply).toHaveBeenCalledWith(fakeInteraction, 'Nothing found from query - ' + songQuery);
  });
});
