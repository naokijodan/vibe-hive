import React from 'react';
import { Session } from '../../../shared/types/session';

interface SessionTabsProps {
  sessions: Session[];
  activeSessionId: string | null;
  onSessionSwitch: (sessionId: string) => void;
}

export function SessionTabs({ sessions, activeSessionId, onSessionSwitch }: SessionTabsProps): React.ReactElement {
  if (sessions.length === 0) {
    return (
      <div className="px-4 py-2 text-sm text-hive-muted">
        セッションがありません
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto">
      {sessions.map(session => {
        const isActive = session.id === activeSessionId;
        const statusColor = {
          idle: 'bg-gray-500',
          running: 'bg-green-500 animate-pulse',
          waiting: 'bg-yellow-500',
          error: 'bg-red-500',
          completed: 'bg-blue-500',
        }[session.status];

        return (
          <button
            key={session.id}
            onClick={() => onSessionSwitch(session.id)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium
              transition-all whitespace-nowrap
              ${isActive
                ? 'bg-hive-accent text-black'
                : 'bg-hive-surface text-hive-muted hover:text-white hover:bg-hive-surface/80'
              }
            `}
          >
            <span className={`w-2 h-2 rounded-full ${statusColor}`} />
            <span>{session.name}</span>
          </button>
        );
      })}
    </div>
  );
}
