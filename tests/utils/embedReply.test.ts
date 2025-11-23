/// <reference types="jest" />

let _origSetTimeoutEmbedReply: any;

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();

  // stub setTimeout so scheduled deletes run immediately and do not keep the worker alive
  _origSetTimeoutEmbedReply = (global as any).setTimeout;
  (global as any).setTimeout = jest.fn((fn: any, _ms?: number, ...args: any[]) => {
    try { fn(...args); } catch (e) { /* swallow */ }
    return 0;
  });
});

afterEach(() => {
  (global as any).setTimeout = _origSetTimeoutEmbedReply;
});

function mockDiscordMinimal() {
  jest.doMock('discord.js', () => {
    class StubEmbedBuilder {
      setColor() { return this; }
      setTitle() { return this; }
      setTimestamp() { return this; }
      setFooter() { return this; }
      setDescription() { return this; }
      toJSON() { return {}; }
    }
    return {
      __esModule: true,
      EmbedBuilder: StubEmbedBuilder,
      MessageFlags: { Ephemeral: 64 },
    };
  });
}

describe('embedReply utils', () => {
  it('editReply path: calls editReply and schedules delete when interaction is deferred/replied', async () => {
    mockDiscordMinimal();

    await jest.isolateModulesAsync(async () => {
      const { default: embedReply } = await import('../../app/utils/embedReply');
      const fakeMsg = { delete: jest.fn().mockResolvedValue(undefined) };
      const fakeInteraction: any = {
        deferred: true,
        replied: false,
        member: { user: { username: 'tester' } },
        user: { displayAvatarURL: () => 'avatar-url' },
        editReply: jest.fn().mockResolvedValue(fakeMsg),
      };

      const res = await embedReply(fakeInteraction, 'Test edit', false);
      expect(fakeInteraction.editReply).toHaveBeenCalledWith(expect.objectContaining({
        embeds: expect.any(Array),
      }));
      // our stubbed setTimeout runs immediately so delete should have been called
      expect(fakeMsg.delete).toHaveBeenCalled();
      // embedReply resolves (the then returns whatever setTimeout returned; our stub returns 0)
      expect(res).toBe(0);
    });
  });

  it('reply path: calls reply with ephemeral flag when not deferred/replied', async () => {
    mockDiscordMinimal();

    await jest.isolateModulesAsync(async () => {
      const { default: embedReply } = await import('../../app/utils/embedReply');
      const fakeMsg = { delete: jest.fn().mockResolvedValue(undefined) };
      const fakeInteraction: any = {
        deferred: false,
        replied: false,
        member: { user: { username: 'tester' } },
        user: { displayAvatarURL: () => 'avatar-url' },
        reply: jest.fn().mockResolvedValue(fakeMsg),
      };

      const res = await embedReply(fakeInteraction, 'Test reply', true);
      expect(fakeInteraction.reply).toHaveBeenCalledWith(expect.objectContaining({
        embeds: expect.any(Array),
        flags: 64, // MessageFlags.Ephemeral
      }));
      expect(fakeMsg.delete).toHaveBeenCalled();
      expect(res).toBe(0);
    });
  });

  it('embedSend: sends to textChannel and schedules delete (no song)', async () => {
    mockDiscordMinimal();

    await jest.isolateModulesAsync(async () => {
      const { embedSend } = await import('../../app/utils/embedReply');
      const fakeMsg = { delete: jest.fn().mockResolvedValue(undefined) };
      const fakeTextChannel: any = {
        send: jest.fn().mockResolvedValue(fakeMsg),
      };

      const res = await embedSend(fakeTextChannel, 'Hello', null);
      expect(fakeTextChannel.send).toHaveBeenCalledWith(expect.objectContaining({
        embeds: expect.any(Array),
      }));
      expect(fakeMsg.delete).toHaveBeenCalled();
      expect(res).toBe(0);
    });
  });

  it('embedSend: sends Now playing... with song and uses song.duration for delete timeout', async () => {
    mockDiscordMinimal();

    await jest.isolateModulesAsync(async () => {
      const { embedSend } = await import('../../app/utils/embedReply');
      const fakeMsg = { delete: jest.fn().mockResolvedValue(undefined) };
      const fakeTextChannel: any = {
        send: jest.fn().mockResolvedValue(fakeMsg),
      };
      const song = { title: 'T', artist: 'A', source: 'url', duration: 2, requestedBy: 'u' } as any;

      const res = await embedSend(fakeTextChannel, 'Now playing...', song);
      expect(fakeTextChannel.send).toHaveBeenCalledWith(expect.objectContaining({
        embeds: expect.any(Array),
      }));
      expect(fakeMsg.delete).toHaveBeenCalled();
      expect(res).toBe(0);
    });
  });

  it('getDuration returns mm:ss formatted string', async () => {
    const { getDuration } = await import('../../app/utils/embedReply');
    expect(getDuration(65)).toBe('1:05');
    expect(getDuration(5)).toBe('0:05');
    expect(getDuration(120)).toBe('2:00');
  });
});