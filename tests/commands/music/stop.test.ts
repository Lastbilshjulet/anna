/// <reference types="jest" />

jest.mock('../../../app/utils/voiceChannelCheck', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../../app/utils/embedReply', () => ({ __esModule: true, default: jest.fn() }));

import stopCommand from '../../../app/commands/music/stop';
import voiceChannelCheck from '../../../app/utils/voiceChannelCheck';
import embedReply from '../../../app/utils/embedReply';

describe('stop command', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('calls musicPlayer.stopAndClear and replies when musicPlayer is present', async () => {
    const mockMusicPlayer = { stopAndClear: jest.fn() };
    (voiceChannelCheck as unknown as jest.Mock).mockResolvedValue({ musicPlayer: mockMusicPlayer });
    (embedReply as unknown as jest.Mock).mockResolvedValue('embed-sent');

    const fakeBot = {} as any;
    const fakeInteraction = {} as any;

    const result = await (stopCommand as any).execute(fakeBot, fakeInteraction);

    expect(mockMusicPlayer.stopAndClear).toHaveBeenCalledTimes(1);
    expect((embedReply as unknown as jest.Mock)).toHaveBeenCalledWith(fakeInteraction, 'Stopped playing and cleared queue!');
    expect(result).toBe('embed-sent');
  });

  it('returns whatever voiceChannelCheck returns when no musicPlayer is present', async () => {
    const expected = { error: 'not-in-channel' };
    (voiceChannelCheck as unknown as jest.Mock).mockResolvedValue(expected);

    const fakeBot = {} as any;
    const fakeInteraction = {} as any;

    const result = await (stopCommand as any).execute(fakeBot, fakeInteraction);

    expect(result).toBe(expected);
    expect((embedReply as unknown as jest.Mock)).not.toHaveBeenCalled();
  });
});
