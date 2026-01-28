import fetch from 'electron-fetch';

interface NotificationConfig {
  discordWebhookUrl?: string;
  slackWebhookUrl?: string;
  emailConfig?: {
    smtpHost: string;
    smtpPort: number;
    from: string;
    username: string;
    password: string;
  };
}

interface SendNotificationParams {
  type: 'discord' | 'slack' | 'email';
  title?: string;
  message: string;
  color?: string;
}

export class NotificationService {
  private config: NotificationConfig = {};

  constructor() {
    // Load config from settings or environment variables
    this.loadConfig();
  }

  private loadConfig() {
    // TODO: Load from app settings or environment variables
    this.config = {
      discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
      slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
    };
  }

  public setWebhookUrl(type: 'discord' | 'slack', url: string) {
    if (type === 'discord') {
      this.config.discordWebhookUrl = url;
    } else if (type === 'slack') {
      this.config.slackWebhookUrl = url;
    }
  }

  public async send(params: SendNotificationParams): Promise<void> {
    switch (params.type) {
      case 'discord':
        await this.sendDiscord(params);
        break;
      case 'slack':
        await this.sendSlack(params);
        break;
      case 'email':
        await this.sendEmail(params);
        break;
      default:
        throw new Error(`Unknown notification type: ${params.type}`);
    }
  }

  private async sendDiscord(params: SendNotificationParams): Promise<void> {
    const webhookUrl = this.config.discordWebhookUrl;
    if (!webhookUrl) {
      throw new Error('Discord webhook URL not configured');
    }

    const color = this.parseColor(params.color || '#5865F2'); // Discord blue

    const payload = {
      content: params.title ? undefined : params.message,
      embeds: params.title
        ? [
            {
              title: params.title,
              description: params.message,
              color,
              timestamp: new Date().toISOString(),
            },
          ]
        : undefined,
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Discord notification failed: ${response.status} ${text}`);
    }
  }

  private async sendSlack(params: SendNotificationParams): Promise<void> {
    const webhookUrl = this.config.slackWebhookUrl;
    if (!webhookUrl) {
      throw new Error('Slack webhook URL not configured');
    }

    const payload = {
      text: params.title || params.message,
      attachments: params.title
        ? [
            {
              title: params.title,
              text: params.message,
              color: params.color || '#36a64f', // Slack green
              ts: Math.floor(Date.now() / 1000),
            },
          ]
        : undefined,
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Slack notification failed: ${response.status} ${text}`);
    }
  }

  private async sendEmail(params: SendNotificationParams): Promise<void> {
    // TODO: Implement email sending with nodemailer
    throw new Error('Email notifications are not implemented yet');
  }

  private parseColor(colorString: string): number {
    // Convert hex color to decimal for Discord
    const hex = colorString.replace('#', '');
    return parseInt(hex, 16);
  }

  public async testNotification(type: 'discord' | 'slack' | 'email'): Promise<void> {
    await this.send({
      type,
      title: 'Test Notification',
      message: 'This is a test notification from Vibe Hive workflow.',
      color: '#0099ff',
    });
  }
}

// Singleton instance
export const notificationService = new NotificationService();
