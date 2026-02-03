import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockListen, mockClose, mockUse, mockGet, mockPost, mockJson, mockUrlencoded } = vi.hoisted(() => ({
  mockListen: vi.fn((_port: number, _host: string, cb: () => void) => { cb(); return { on: vi.fn() }; }),
  mockClose: vi.fn((cb: () => void) => cb()),
  mockUse: vi.fn(),
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockJson: vi.fn(),
  mockUrlencoded: vi.fn(),
}));

vi.mock('express', () => {
  const app = {
    use: mockUse,
    get: mockGet,
    post: mockPost,
    listen: mockListen,
  };
  const expressFn = () => app;
  expressFn.json = () => mockJson;
  expressFn.urlencoded = () => mockUrlencoded;
  return { default: expressFn };
});

vi.mock('./WorkflowEngine', () => ({
  getWorkflowEngine: () => ({
    getWorkflow: vi.fn(),
    getAllWorkflows: vi.fn(() => []),
    execute: vi.fn(),
  }),
}));

let WebhookServer: any;

beforeEach(async () => {
  vi.clearAllMocks();
  vi.resetModules();
  vi.doMock('express', () => {
    const app = {
      use: mockUse,
      get: mockGet,
      post: mockPost,
      listen: mockListen,
    };
    const expressFn = () => app;
    expressFn.json = () => mockJson;
    expressFn.urlencoded = () => mockUrlencoded;
    return { default: expressFn };
  });
  vi.doMock('./WorkflowEngine', () => ({
    getWorkflowEngine: () => ({
      getWorkflow: vi.fn(),
      getAllWorkflows: vi.fn(() => []),
      execute: vi.fn(),
    }),
  }));
  const mod = await import('./WebhookServer');
  WebhookServer = mod.WebhookServer;
});

describe('WebhookServer', () => {
  it('creates with default port', () => {
    const server = new WebhookServer();
    expect(server.getPort()).toBe(3100);
    expect(server.isRunning()).toBe(false);
  });

  it('creates with custom port', () => {
    const server = new WebhookServer(4000);
    expect(server.getPort()).toBe(4000);
  });

  it('start resolves on listen', async () => {
    const server = new WebhookServer();
    await server.start();
    expect(server.isRunning()).toBe(true);
  });

  it('start does nothing if already running', async () => {
    const server = new WebhookServer();
    await server.start();
    await server.start(); // second call
    expect(mockListen).toHaveBeenCalledTimes(1);
  });

  it('stop resolves when no server', async () => {
    const server = new WebhookServer();
    await server.stop(); // no error
  });

  it('stop closes running server', async () => {
    const mockServerObj = { on: vi.fn(), close: mockClose };
    mockListen.mockImplementation((_port: number, _host: string, cb: () => void) => {
      cb();
      return mockServerObj;
    });

    const server = new WebhookServer();
    await server.start();
    await server.stop();
    expect(mockClose).toHaveBeenCalled();
    expect(server.isRunning()).toBe(false);
  });

  it('registers routes on creation', () => {
    new WebhookServer();
    expect(mockGet).toHaveBeenCalled();
    expect(mockPost).toHaveBeenCalled();
    expect(mockUse).toHaveBeenCalled();
  });

  it('handles EADDRINUSE error', async () => {
    const mockServerObj = { on: vi.fn() };
    mockListen.mockImplementation((_port: number, _host: string, _cb: () => void) => {
      return mockServerObj;
    });

    const server = new WebhookServer();
    const startPromise = server.start();

    // Simulate error
    const errorHandler = mockServerObj.on.mock.calls.find((call: any) => call[0] === 'error');
    if (errorHandler) {
      const error = new Error('Port in use') as NodeJS.ErrnoException;
      error.code = 'EADDRINUSE';
      errorHandler[1](error);
    }

    await expect(startPromise).rejects.toThrow('Port 3100 is already in use');
  });

  it('handles other server errors', async () => {
    const mockServerObj = { on: vi.fn() };
    mockListen.mockImplementation((_port: number, _host: string, _cb: () => void) => {
      return mockServerObj;
    });

    const server = new WebhookServer();
    const startPromise = server.start();

    // Simulate error
    const errorHandler = mockServerObj.on.mock.calls.find((call: any) => call[0] === 'error');
    if (errorHandler) {
      errorHandler[1](new Error('Other error'));
    }

    await expect(startPromise).rejects.toThrow('Other error');
  });
});

describe('getWebhookServer', () => {
  it('returns singleton instance', async () => {
    vi.resetModules();
    vi.doMock('express', () => {
      const app = {
        use: vi.fn(),
        get: vi.fn(),
        post: vi.fn(),
        listen: vi.fn(),
      };
      const expressFn = () => app;
      expressFn.json = () => vi.fn();
      expressFn.urlencoded = () => vi.fn();
      return { default: expressFn };
    });
    vi.doMock('./WorkflowEngine', () => ({
      getWorkflowEngine: () => ({
        getWorkflow: vi.fn(),
        getAllWorkflows: vi.fn(() => []),
        execute: vi.fn(),
      }),
    }));
    const mod = await import('./WebhookServer');
    const instance1 = mod.getWebhookServer();
    const instance2 = mod.getWebhookServer();
    expect(instance1).toBe(instance2);
  });
});
