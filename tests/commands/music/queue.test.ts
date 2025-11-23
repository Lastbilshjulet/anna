/// <reference types="jest" />

let _origSetTimeout: any;

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();

  // save original and replace setTimeout so long-running timers execute immediately
  _origSetTimeout = (global as any).setTimeout;
  (global as any).setTimeout = jest.fn((fn: any, _ms?: number, ...args: any[]) => {
    try { fn(...args); } catch (e) { /* swallow */ }
    return 0;
  });
});

afterEach(() => {
  // restore original setTimeout so other tests aren't affected
  (global as any).setTimeout = _origSetTimeout;
});

function mockEmbedReplyModule() {
  jest.doMock('../../../app/utils/embedReply', () => ({
    __esModule: true,
    default: jest.fn(), // mocked embedReply default export
    getDuration: (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
    },
  }));
}

function mockVoiceChannelCheck(value: any) {
  jest.doMock('../../../app/utils/voiceChannelCheck', () => ({
    __esModule: true,
    default: jest.fn().mockResolvedValue(value),
  }));
}

function mockDiscordEmbedBuilder() {
  // Provide a lightweight stub for EmbedBuilder to avoid @sapphire/shapeshift validation errors in tests
  jest.doMock('discord.js', () => {
    const actual = jest.requireActual('discord.js');
    class StubEmbed {
      private fields: any[] = [];
      setColor() { return this; }
      setTitle() { return this; }
      setDescription() { return this; }
      addFields(fields: any) { this.fields = Array.isArray(fields) ? fields : [fields]; return this; }
      setTimestamp() { return this; }
      setFooter() { return this; }
      toJSON() { return { fields: this.fields }; }
    }
    return {
      ...actual,
      EmbedBuilder: StubEmbed,
    };
  });
}

describe('queue command', () => {
  it('replies "No queue could be found" when no musicPlayer is returned', async () => {
    mockEmbedReplyModule();
    mockVoiceChannelCheck({});
    mockDiscordEmbedBuilder();

    let result: any;
    await jest.isolateModulesAsync(async () => {
      const queueCommand = (await import('../../../app/commands/music/queue')).default;
      const embedReply = (await import('../../../app/utils/embedReply')).default as jest.Mock;
      const fakeInteraction = {
        deferReply: jest.fn().mockResolvedValue(undefined),
        editReply: jest.fn(),
        member: { user: { username: 'tester' } },
        user: { displayAvatarURL: jest.fn().mockReturnValue('avatar-url') },
      } as any;
      const fakeBot = {} as any;

      (embedReply as jest.Mock).mockResolvedValue('embed-sent');
      result = await (queueCommand as any).execute(fakeBot, fakeInteraction);
      expect(embedReply).toHaveBeenCalledWith(fakeInteraction, 'No queue could be found');
      expect(result).toBe('embed-sent');
      expect(fakeInteraction.deferReply).toHaveBeenCalled();
      expect(fakeInteraction.editReply).not.toHaveBeenCalled();
    });
  });

  it('replies "The queue is empty." when musicPlayer queue has no upcoming songs', async () => {
    mockEmbedReplyModule();
    mockVoiceChannelCheck({ musicPlayer: { queue: { getUpcomingTenSongs: jest.fn().mockReturnValue([]) } } });
    mockDiscordEmbedBuilder();

    let result: any;
    await jest.isolateModulesAsync(async () => {
      const queueCommand = (await import('../../../app/commands/music/queue')).default;
      const embedReply = (await import('../../../app/utils/embedReply')).default as jest.Mock;

      const fakeInteraction = {
        deferReply: jest.fn().mockResolvedValue(undefined),
        editReply: jest.fn(),
        member: { user: { username: 'tester' } },
        user: { displayAvatarURL: jest.fn().mockReturnValue('avatar-url') },
      } as any;
      const fakeBot = {} as any;

      (embedReply as jest.Mock).mockResolvedValue('embed-empty');
      result = await (queueCommand as any).execute(fakeBot, fakeInteraction);
      expect(embedReply).toHaveBeenCalledWith(fakeInteraction, 'The queue is empty.');
      expect(result).toBe('embed-empty');
      expect(fakeInteraction.deferReply).toHaveBeenCalled();
      expect(fakeInteraction.editReply).not.toHaveBeenCalled();
    });
  });

  it('edits the deferred reply with an embed when upcoming songs exist', async () => {
    mockEmbedReplyModule();
    const song = { title: 'T', artist: 'A', source: 'url', duration: 120, requestedBy: 'u' } as any;
    const mockQueue = {
      getUpcomingTenSongs: jest.fn().mockReturnValue([song]),
      getQueueSize: jest.fn().mockReturnValue(1),
    };
    mockVoiceChannelCheck({ musicPlayer: { queue: mockQueue } });
    mockDiscordEmbedBuilder();

    await jest.isolateModulesAsync(async () => {
      const queueCommand = (await import('../../../app/commands/music/queue')).default;

      const fakeMsg = { delete: jest.fn() };
      const fakeInteraction = {
        deferReply: jest.fn().mockResolvedValue(undefined),
        editReply: jest.fn().mockResolvedValue(fakeMsg),
        member: { user: { username: 'tester' } },
        user: { displayAvatarURL: jest.fn().mockReturnValue('avatar-url') },
      } as any;

      const fakeBot = {} as any;

      const result = await (queueCommand as any).execute(fakeBot, fakeInteraction);

      expect(fakeInteraction.deferReply).toHaveBeenCalled();
      expect(fakeInteraction.editReply).toHaveBeenCalledWith(expect.objectContaining({
        embeds: expect.any(Array),
      }));
      // embedReply (default) should not be used in the success path
      const embedReply = (await import('../../../app/utils/embedReply')).default as jest.Mock;
      expect(embedReply).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
});
