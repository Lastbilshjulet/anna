/// <reference types="jest" />

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

describe('togglefromautoplay command', () => {
  it('replies "Could not find song." when the song is not in bot.availableSongs', async () => {
    jest.doMock('../../../app/utils/embedReply', () => ({
      __esModule: true,
      default: jest.fn().mockResolvedValue('embed-sent'),
    }));

    await jest.isolateModulesAsync(async () => {
      const cmd = (await import('../../../app/commands/music/togglefromautoplay')).default;
      const embedReply = (await import('../../../app/utils/embedReply')).default as jest.Mock;

      const fakeBot = {
        availableSongs: {
          get: (_: string) => undefined,
        },
      } as any;

      const fakeInteraction: any = {
        deferReply: jest.fn().mockResolvedValue(undefined),
        options: { getString: jest.fn().mockReturnValue('yt-123') },
      };

      const res = await (cmd as any).execute(fakeBot, fakeInteraction);

      expect(embedReply).toHaveBeenCalledWith(fakeInteraction, 'Could not find song.');
      expect(res).toBe('embed-sent');
    });
  });

  it('toggles autoplay: updates DB entity, updates bot.availableSongs and replies with toggled value', async () => {
    // mock embedReply
    jest.doMock('../../../app/utils/embedReply', () => ({
      __esModule: true,
      default: jest.fn().mockResolvedValue('embed-sent'),
    }));

    // mock SongEntity module (default export) before importing the command
    const mockSave = jest.fn().mockResolvedValue(undefined);
    const songEntityMock = {
      ytId: 'yt-123',
      title: 'Test Title',
      autoplay: true,
      save: mockSave,
    };
    jest.doMock('../../../app/models/entities/songEntity', () => ({
      __esModule: true,
      default: {
        findOne: jest.fn().mockResolvedValue(songEntityMock),
      },
    }));

    await jest.isolateModulesAsync(async () => {
      const cmd = (await import('../../../app/commands/music/togglefromautoplay')).default;
      const embedReply = (await import('../../../app/utils/embedReply')).default as jest.Mock;
      const SongEntity = (await import('../../../app/models/entities/songEntity')).default;

      // bot.availableSongs must expose get and set
      const updatedSet = jest.fn();
      const fakeSong = { ytId: 'yt-123', title: 'Test Title', autoplay: true } as any;
      const fakeBot = {
        availableSongs: {
          get: jest.fn().mockReturnValue(fakeSong),
          set: updatedSet,
        },
      } as any;

      const fakeInteraction: any = {
        deferReply: jest.fn().mockResolvedValue(undefined),
        options: { getString: jest.fn().mockReturnValue('yt-123') },
      };

      const res = await (cmd as any).execute(fakeBot, fakeInteraction);

      // ensure DB was queried for the ytId
      expect(SongEntity.findOne).toHaveBeenCalledWith({ where: { ytId: 'yt-123' } });
      // ensure save was called on returned entity
      expect(mockSave).toHaveBeenCalled();
      // ensure bot.availableSongs was updated with the DB entity
      expect(updatedSet).toHaveBeenCalledWith(songEntityMock.ytId, songEntityMock);
      // embedReply replies with toggled value (original autoplay was true -> toggled to false)
      expect(embedReply).toHaveBeenCalledWith(fakeInteraction, `Song ${fakeSong.title} has been toggled to ${!fakeSong.autoplay}.`);
      expect(res).toBe('embed-sent');
    });
  });
});
