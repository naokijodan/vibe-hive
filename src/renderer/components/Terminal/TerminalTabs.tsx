import React from 'react';

interface Tab {
  id: string;
  name: string;
  isActive: boolean;
  status: 'running' | 'waiting' | 'idle' | 'error';
}

interface TerminalTabsProps {
  tabs: Tab[];
  activeTabId: string;
  onTabSelect: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
  onNewTab?: () => void;
}

const statusColors = {
  running: 'bg-green-500',
  waiting: 'bg-yellow-500',
  idle: 'bg-gray-500',
  error: 'bg-red-500',
};

export const TerminalTabs: React.FC<TerminalTabsProps> = ({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onNewTab,
}) => {
  return (
    <div className="flex items-center bg-gray-900 border-b border-gray-800 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabSelect(tab.id)}
          className={`
            flex items-center gap-2 px-3 py-2 text-sm border-r border-gray-800
            ${
              tab.id === activeTabId
                ? 'bg-gray-950 text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }
          `}
        >
          <span
            className={`w-2 h-2 rounded-full ${statusColors[tab.status]} ${
              tab.status === 'running' ? 'animate-pulse' : ''
            }`}
          />
          <span className="truncate max-w-[100px]">{tab.name}</span>
          {onTabClose && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              className="ml-1 text-gray-500 hover:text-red-400 cursor-pointer"
            >
              ×
            </span>
          )}
        </button>
      ))}

      {onNewTab && (
        <button
          onClick={onNewTab}
          className="px-3 py-2 text-gray-500 hover:text-gray-200 hover:bg-gray-800"
        >
          +
        </button>
      )}
    </div>
  );
};
