import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFetch } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
}));

vi.mock('node-fetch', () => ({
  default: mockFetch,
}));

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn().mockResolvedValue({}),
    })),
  },
}));

import { NotificationService } from './NotificationService';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new NotificationService();
  });

  describe('setWebhookUrl', () => {
    it('sets discord webhook', () => {
      service.setWebhookUrl('discord', 'https://discord.com/api/webhooks/test');
      // No assertion needed, just verify no error
    });

    it('sets slack webhook', () => {
      service.setWebhookUrl('slack', 'https://hooks.slack.com/test');
    });
  });

  describe('send - discord', () => {
    it('throws when no webhook configured', async () => {
      await expect(
        service.send({ type: 'discord', message: 'test' })
      ).rejects.toThrow('Discord webhook URL not configured');
    });

    it('sends discord notification', async () => {
      service.setWebhookUrl('discord', 'https://discord.com/api/webhooks/test');
      mockFetch.mockResolvedValue({ ok: true });

      await service.send({ type: 'discord', message: 'hello' });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://discord.com/api/webhooks/test',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('sends with embed when title provided', async () => {
      service.setWebhookUrl('discord', 'https://discord.com/api/webhooks/test');
      mockFetch.mockResolvedValue({ ok: true });

      await service.send({ type: 'discord', title: 'Title', message: 'body' });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.embeds).toBeTruthy();
    });

    it('throws on non-ok response', async () => {
      service.setWebhookUrl('discord', 'https://discord.com/api/webhooks/test');
      mockFetch.mockResolvedValue({ ok: false, status: 400, text: () => Promise.resolve('bad request') });

      await expect(
        service.send({ type: 'discord', message: 'test' })
      ).rejects.toThrow('Discord notification failed');
    });
  });

  describe('send - slack', () => {
    it('throws when no webhook configured', async () => {
      await expect(
        service.send({ type: 'slack', message: 'test' })
      ).rejects.toThrow('Slack webhook URL not configured');
    });

    it('sends slack notification', async () => {
      service.setWebhookUrl('slack', 'https://hooks.slack.com/test');
      mockFetch.mockResolvedValue({ ok: true });

      await service.send({ type: 'slack', message: 'hello' });

      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('send - email', () => {
    it('throws when no email config', async () => {
      await expect(
        service.send({ type: 'email', message: 'test', to: 'x@y.com' })
      ).rejects.toThrow('Email configuration not set');
    });
  });

  describe('send - unknown type', () => {
    it('throws on unknown type', async () => {
      await expect(
        service.send({ type: 'sms' as any, message: 'test' })
      ).rejects.toThrow('Unknown notification type');
    });
  });
});
