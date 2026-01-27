import React, { useState, useEffect, useRef } from 'react';

export interface Command {
  id: string;
  label: string;
  description?: string;
  category: string;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
}

export function CommandPalette({ isOpen, onClose, commands }: CommandPaletteProps): React.ReactElement | null {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter commands based on search query
  const filteredCommands = commands.filter(cmd => {
    const query = searchQuery.toLowerCase();
    const labelMatch = cmd.label.toLowerCase().includes(query);
    const descMatch = cmd.description?.toLowerCase().includes(query);
    const keywordMatch = cmd.keywords?.some(k => k.toLowerCase().includes(query));
    return labelMatch || descMatch || keywordMatch;
  });

  // Reset selected index when filtered commands change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Auto-scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = [];
    }
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-start justify-center pt-32 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-hive-surface border border-hive-border rounded-lg shadow-2xl w-[600px] max-h-[500px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-hive-border">
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="コマンドを検索..."
            className="w-full bg-hive-bg border border-hive-border rounded px-4 py-2 text-hive-text placeholder-hive-muted focus:outline-none focus:ring-2 focus:ring-hive-accent"
          />
        </div>

        {/* Command List */}
        <div 
          ref={listRef}
          className="flex-1 overflow-y-auto p-2"
        >
          {Object.entries(groupedCommands).length === 0 ? (
            <div className="text-center py-8 text-hive-muted">
              <p>コマンドが見つかりません</p>
              <p className="text-sm mt-2">別のキーワードで検索してください</p>
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, cmds]) => (
              <div key={category} className="mb-4">
                <div className="px-3 py-1 text-xs font-semibold text-hive-muted uppercase tracking-wider">
                  {category}
                </div>
                {cmds.map((cmd, idx) => {
                  const globalIndex = filteredCommands.indexOf(cmd);
                  const isSelected = globalIndex === selectedIndex;
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => {
                        cmd.action();
                        onClose();
                      }}
                      className={`
                        w-full text-left px-3 py-2 rounded flex items-center justify-between
                        transition-colors
                        ${isSelected 
                          ? 'bg-hive-accent text-black' 
                          : 'text-hive-text hover:bg-hive-bg'
                        }
                      `}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{cmd.label}</div>
                        {cmd.description && (
                          <div className={`text-sm truncate ${isSelected ? 'text-black/70' : 'text-hive-muted'}`}>
                            {cmd.description}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <div className="ml-2 text-sm font-mono">↵</div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer Hints */}
        <div className="px-4 py-2 border-t border-hive-border flex items-center justify-between text-xs text-hive-muted">
          <div className="flex gap-4">
            <span><kbd className="px-1.5 py-0.5 bg-hive-bg rounded">↑↓</kbd> 移動</span>
            <span><kbd className="px-1.5 py-0.5 bg-hive-bg rounded">↵</kbd> 実行</span>
            <span><kbd className="px-1.5 py-0.5 bg-hive-bg rounded">Esc</kbd> 閉じる</span>
          </div>
          <div>
            {filteredCommands.length} / {commands.length}
          </div>
        </div>
      </div>
    </div>
  );
}
