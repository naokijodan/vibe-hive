// IPC Channel constants (shared between main and renderer)
export const IPC_CHANNELS = {
  // Session channels
  SESSION_CREATE: 'session:create',
  SESSION_GET: 'session:get',
  SESSION_LIST: 'session:list',
  SESSION_DELETE: 'session:delete',

  // Terminal channels
  TERMINAL_WRITE: 'terminal:write',
  TERMINAL_RESIZE: 'terminal:resize',
  TERMINAL_DATA: 'terminal:data',

  // Agent channels
  AGENT_START: 'agent:start',
  AGENT_STOP: 'agent:stop',
  AGENT_INPUT: 'agent:input',
  AGENT_LIST: 'agent:list',
  AGENT_OUTPUT: 'agent:output',
  AGENT_EXIT: 'agent:exit',
  AGENT_ERROR: 'agent:error',
  AGENT_SEND: 'agent:send',
  AGENT_STATUS: 'agent:status',

  // Organization channels
  ORG_GET: 'org:get',
  ORG_UPDATE: 'org:update',

  // Git channels
  GIT_STATUS: 'git:status',
  GIT_COMMIT: 'git:commit',
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
