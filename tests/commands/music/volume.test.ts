/// <reference types="jest" />

jest.mock('../../../app/utils/voiceChannelCheck', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../../app/utils/embedReply', () => ({ __esModule: true, default: jest.fn() }));

import volumeCommand from '../../../app/commands/music/volume';
import voiceChannelCheck from '../../../app/utils/voiceChannelCheck';
import embedReply from '../../../app/utils/embedReply';

describe('volume command', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns whatever voiceChannelCheck returns when no musicPlayer is present', async () => {
    const expected = { error: 'not-in-channel' };
    (voiceChannelCheck as unknown as jest.Mock).mockResolvedValue(expected);

    const fakeBot = {} as any;
    const fakeInteraction = {} as any;

    const res = await (volumeCommand as any).execute(fakeBot, fakeInteraction);
    expect(res).toBe(expected);
    expect((embedReply as unknown as jest.Mock)).not.toHaveBeenCalled();
  });

  it('replies when there is no currently playing song (volume() returns -1)', async () => {
    const volumeMock = jest.fn((...args: any[]) => {
      if (args.length === 0) return -1;
      return undefined;
    });
    const mockMusicPlayer = { volume: volumeMock };
    (voiceChannelCheck as unknown as jest.Mock).mockResolvedValue({ musicPlayer: mockMusicPlayer });
    (embedReply as unknown as jest.Mock).mockResolvedValue('no-playing');

    const fakeBot = {} as any;
    const fakeInteraction = {
      options: { getInteger: jest.fn().mockReturnValue(null) },
    } as any;

    const res = await (volumeCommand as any).execute(fakeBot, fakeInteraction);
    expect((embedReply as unknown as jest.Mock)).toHaveBeenCalledWith(fakeInteraction, 'There is no currently playing song.', true);
    expect(res).toBe('no-playing');
  });

  it('replies with current volume when no volume option provided', async () => {
    const current = 0.5;
    const volumeMock = jest.fn((...args: any[]) => {
      if (args.length === 0) return current;
      return undefined;
    });
    const mockMusicPlayer = { volume: volumeMock };
    (voiceChannelCheck as unknown as jest.Mock).mockResolvedValue({ musicPlayer: mockMusicPlayer });
    (embedReply as unknown as jest.Mock).mockResolvedValue('current-vol');

    const fakeBot = {} as any;
    const fakeInteraction = {
      options: { getInteger: jest.fn().mockReturnValue(null) },
    } as any;

    const res = await (volumeCommand as any).execute(fakeBot, fakeInteraction);
    expect((embedReply as unknown as jest.Mock)).toHaveBeenCalledWith(fakeInteraction, `Current volume is ${current * 100}%.`, true);
    expect(res).toBe('current-vol');
  });

  it('rejects out-of-range volume option', async () => {
    const current = 0.3;
    const volumeMock = jest.fn((...args: any[]) => {
      if (args.length === 0) return current;
      return undefined;
    });
    const mockMusicPlayer = { volume: volumeMock };
    (voiceChannelCheck as unknown as jest.Mock).mockResolvedValue({ musicPlayer: mockMusicPlayer });
    (embedReply as unknown as jest.Mock).mockResolvedValue('bad-range');

    const fakeBot = {} as any;
    const fakeInteraction = {
      options: { getInteger: jest.fn().mockReturnValue(5) }, // too low
    } as any;

    const res = await (volumeCommand as any).execute(fakeBot, fakeInteraction);
    expect((embedReply as unknown as jest.Mock)).toHaveBeenCalledWith(fakeInteraction, 'Volume must be a number between 10 and 200.');
    expect(res).toBe('bad-range');
  });

  it('sets new volume and replies when valid volume option provided', async () => {
    const current = 0.25; // 25%
    const volumeMock = jest.fn((...args: any[]) => {
      if (args.length === 0) return current;
      return undefined;
    });
    const mockMusicPlayer = { volume: volumeMock };
    (voiceChannelCheck as unknown as jest.Mock).mockResolvedValue({ musicPlayer: mockMusicPlayer });
    (embedReply as unknown as jest.Mock).mockResolvedValue('set-vol');

    const fakeBot = {} as any;
    const volumeOption = 80;
    const fakeInteraction = {
      options: { getInteger: jest.fn().mockReturnValue(volumeOption) },
    } as any;

    const res = await (volumeCommand as any).execute(fakeBot, fakeInteraction);

    const expectedNewVolume = (volumeOption / 100) - current;
    // ensure setter was called with computed delta
    expect(volumeMock).toHaveBeenCalledWith(expectedNewVolume);
    expect((embedReply as unknown as jest.Mock)).toHaveBeenCalledWith(fakeInteraction, `Setting volume to ${volumeOption}%.`);
    expect(res).toBe('set-vol');
  });
});