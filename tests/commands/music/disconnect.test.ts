/// <reference types="jest" />

jest.mock('../../../app/utils/voiceChannelCheck', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../../app/utils/embedReply', () => ({ __esModule: true, default: jest.fn() }));

import disconnectCommand from '../../../app/commands/music/disconnect';
import voiceChannelCheck from '../../../app/utils/voiceChannelCheck';
import embedReply from '../../../app/utils/embedReply';

describe('disconnect command', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('calls musicPlayer.stopAndDisconnect, deletes musicPlayer and replies when voiceChannel and musicPlayer are present', async () => {
    const mockMusicPlayer = { stopAndDisconnect: jest.fn() };
    const mockVoiceChannel = { guild: { id: 'guild-123' } };
    (voiceChannelCheck as unknown as jest.Mock).mockResolvedValue({ voiceChannel: mockVoiceChannel, musicPlayer: mockMusicPlayer });
    (embedReply as unknown as jest.Mock).mockResolvedValue('embed-sent');

    const fakeBot = { musicPlayers: { delete: jest.fn() } } as any;
    const fakeInteraction = {} as any;

    const result = await (disconnectCommand as any).execute(fakeBot, fakeInteraction);

    expect(mockMusicPlayer.stopAndDisconnect).toHaveBeenCalledTimes(1);
    expect(fakeBot.musicPlayers.delete).toHaveBeenCalledWith('guild-123');
    expect((embedReply as unknown as jest.Mock)).toHaveBeenCalledWith(fakeInteraction, 'Stopped playing, cleared the queue and disconnected!');
    expect(result).toBe('embed-sent');
  });

  it('returns whatever voiceChannelCheck returns when voiceChannel/musicPlayer are not present', async () => {
    const expected = { error: 'not-in-channel' };
    (voiceChannelCheck as unknown as jest.Mock).mockResolvedValue(expected);

    const fakeBot = { musicPlayers: { delete: jest.fn() } } as any;
    const fakeInteraction = {} as any;

    const result = await (disconnectCommand as any).execute(fakeBot, fakeInteraction);

    expect(result).toBe(expected);
    expect((embedReply as unknown as jest.Mock)).not.toHaveBeenCalled();
  });
});
