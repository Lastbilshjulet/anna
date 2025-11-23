/// <reference types="jest" />

jest.mock('../../../app/utils/voiceChannelCheck', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../../app/utils/embedReply', () => ({ __esModule: true, default: jest.fn() }));

import skipCommand from '../../../app/commands/music/skip';
import voiceChannelCheck from '../../../app/utils/voiceChannelCheck';
import embedReply from '../../../app/utils/embedReply';

describe('skip command', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('calls musicPlayer.stopPlaying and replies when musicPlayer is present', async () => {
    const mockMusicPlayer = { stopPlaying: jest.fn() };
    (voiceChannelCheck as unknown as jest.Mock).mockResolvedValue({ musicPlayer: mockMusicPlayer });
    (embedReply as unknown as jest.Mock).mockResolvedValue('embed-sent');

    const fakeBot = {} as any;
    const fakeInteraction = {} as any;

    const result = await (skipCommand as any).execute(fakeBot, fakeInteraction);

    expect(mockMusicPlayer.stopPlaying).toHaveBeenCalledTimes(1);
    expect((embedReply as unknown as jest.Mock)).toHaveBeenCalledWith(fakeInteraction, 'Skipping currently playing song!');
    expect(result).toBe('embed-sent');
  });

  it('returns whatever voiceChannelCheck returns when no musicPlayer is present', async () => {
    const expected = { error: 'not-in-channel' };
    (voiceChannelCheck as unknown as jest.Mock).mockResolvedValue(expected);

    const fakeBot = {} as any;
    const fakeInteraction = {} as any;

    const result = await (skipCommand as any).execute(fakeBot, fakeInteraction);

    expect(result).toBe(expected);
    expect((embedReply as unknown as jest.Mock)).not.toHaveBeenCalled();
  });
});
