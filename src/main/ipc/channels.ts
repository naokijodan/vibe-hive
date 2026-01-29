// IPC Channel definitions
export const IPC_CHANNELS = {
  // Session channels
  SESSION_CREATE: 'session:create',
  SESSION_GET: 'session:get',
  SESSION_LIST: 'session:list',
  SESSION_DELETE: 'session:delete',
  SESSION_SWITCH: 'session:switch',
  SESSION_GET_ACTIVE: 'session:get-active',

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
  GIT_ADD: 'git:add',
  GIT_UNSTAGE: 'git:unstage',
  GIT_COMMIT: 'git:commit',
  GIT_PUSH: 'git:push',
  GIT_PULL: 'git:pull',
  GIT_LOG: 'git:log',

  // Settings channels
  SETTINGS_GET: 'settings:get',
  SETTINGS_UPDATE: 'settings:update',
  SETTINGS_UPDATE_GIT: 'settings:update-git',
  SETTINGS_UPDATE_APP: 'settings:update-app',
  SETTINGS_RESET: 'settings:reset',

  // Template channels
  TEMPLATE_GET_ALL: 'template:getAll',
  TEMPLATE_GET: 'template:get',
  TEMPLATE_GET_BY_CATEGORY: 'template:getByCategory',
  TEMPLATE_CREATE: 'template:create',
  TEMPLATE_UPDATE: 'template:update',
  TEMPLATE_DELETE: 'template:delete',
  TEMPLATE_APPLY: 'template:apply',
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
