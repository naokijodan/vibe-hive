import { describe, it, expect } from 'vitest';
import { IPC_CHANNELS } from './channels';

describe('IPC_CHANNELS', () => {
  it('is defined', () => {
    expect(IPC_CHANNELS).toBeDefined();
  });

  it('has session channels', () => {
    expect(IPC_CHANNELS.SESSION_CREATE).toBe('session:create');
    expect(IPC_CHANNELS.SESSION_LIST).toBe('session:list');
  });

  it('has org channels', () => {
    expect(IPC_CHANNELS.ORG_GET).toBe('org:get');
  });

  it('has all expected keys', () => {
    const keys = Object.keys(IPC_CHANNELS);
    expect(keys.length).toBeGreaterThan(5);
  });
});
