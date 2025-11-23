/// <reference types="jest" />

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

function makeInteraction(voiceChannel: any) {
  return {
    guild: {
      members: {
        cache: {
          get: (_id: string) => ({
            voice: { channel: voiceChannel },
          }),
        },
      },
    },
    user: { id: 'user-1' },
  } as any;
}

describe('voiceChannelCheck', () => {
  it('replies when user is not in a voice channel', async () => {
    // mock embedReply
    jest.doMock('../../app/utils/embedReply', () => ({
      __esModule: true,
      default: jest.fn().mockResolvedValue('no-voice'),
    }));

    const voiceChannelCheck = (await import('../../app/utils/voiceChannelCheck')).default;
    const fakeBot = {} as any;
    const interaction = makeInteraction(undefined);

    const res = await voiceChannelCheck(fakeBot, interaction);
    expect(res).toBe('no-voice');

    const embedReply = (await import('../../app/utils/embedReply')).default as jest.Mock;
    expect(embedReply).toHaveBeenCalledWith(interaction, 'You need to be in a voice channel to disconnect the bot!', true);
  });

  it('replies when bot has no music player for the guild', async () => {
    jest.doMock('../../app/utils/embedReply', () => ({
      __esModule: true,
      default: jest.fn().mockResolvedValue('no-music'),
    }));

    const voiceChannel = { id: 'vc-1', guild: { id: 'g-1' } };
    const interaction = makeInteraction(voiceChannel);

    const fakeBot = { getMusicPlayer: jest.fn().mockReturnValue(null) } as any;
    const voiceChannelCheck = (await import('../../app/utils/voiceChannelCheck')).default;

    const res = await voiceChannelCheck(fakeBot, interaction);
    expect(res).toBe('no-music');

    const embedReply = (await import('../../app/utils/embedReply')).default as jest.Mock;
    expect(embedReply).toHaveBeenCalledWith(interaction, 'The bot is not connected to any voice channel!', true);
    expect(fakeBot.getMusicPlayer).toHaveBeenCalledWith('g-1');
  });

  it('replies when user is not in same channel as bot', async () => {
    jest.doMock('../../app/utils/embedReply', () => ({
      __esModule: true,
      default: jest.fn().mockResolvedValue('not-same'),
    }));

    const voiceChannel = { id: 'vc-user', guild: { id: 'g-1' } };
    const musicPlayer = { connection: { joinConfig: { channelId: 'vc-bot' } } };
    const fakeBot = { getMusicPlayer: jest.fn().mockReturnValue(musicPlayer) } as any;
    const interaction = makeInteraction(voiceChannel);
    const voiceChannelCheck = (await import('../../app/utils/voiceChannelCheck')).default;

    const res = await voiceChannelCheck(fakeBot, interaction);
    expect(res).toBe('not-same');

    const embedReply = (await import('../../app/utils/embedReply')).default as jest.Mock;
    expect(embedReply).toHaveBeenCalledWith(interaction, 'You need to be connected to the same voice channel as the bot!', true);
  });

  it('returns voiceChannel and musicPlayer when checks pass', async () => {
    // no embedReply mock necessary for success path, but provide a stub anyway
    jest.doMock('../../app/utils/embedReply', () => ({
      __esModule: true,
      default: jest.fn(),
    }));

    const voiceChannel = { id: 'vc-1', guild: { id: 'g-1' } };
    const musicPlayer = { connection: { joinConfig: { channelId: 'vc-1' } } };
    const fakeBot = { getMusicPlayer: jest.fn().mockReturnValue(musicPlayer) } as any;
    const interaction = makeInteraction(voiceChannel);

    const voiceChannelCheck = (await import('../../app/utils/voiceChannelCheck')).default;
    const res = await voiceChannelCheck(fakeBot, interaction);

    expect(res).toEqual({ voiceChannel: voiceChannel, musicPlayer: musicPlayer });
    expect(fakeBot.getMusicPlayer).toHaveBeenCalledWith('g-1');
  });
});