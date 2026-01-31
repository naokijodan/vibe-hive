import { useMemo } from 'react';
import { Command } from '../components/CommandPalette';
import { useSessionStore } from '../stores/sessionStore';

type ViewType = 'kanban' | 'organization' | 'dependencies' | 'execution' | 'history' | 'workflow' | 'analytics' | 'export-import' | 'notifications' | 'settings';

interface UseCommandPaletteProps {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  setIsSessionModalOpen: (open: boolean) => void;
  setShowBashTerminal: (show: boolean) => void;
  setIsGitPanelOpen?: (open: boolean) => void;
  setIsSettingsPanelOpen?: (open: boolean) => void;
}

export function useCommandPalette({
  currentView,
  setCurrentView,
  setIsSessionModalOpen,
  setShowBashTerminal,
  setIsGitPanelOpen,
  setIsSettingsPanelOpen,
}: UseCommandPaletteProps): Command[] {
  const { sessions, switchSession } = useSessionStore();

  const commands = useMemo<Command[]>(() => {
    const cmds: Command[] = [];

    // View commands
    cmds.push(
      {
        id: 'view-kanban',
        label: 'タスクボード',
        description: 'カンバンボードを表示',
        category: 'ビュー',
        keywords: ['kanban', 'task', 'board', 'かんばん', 'たすく'],
        action: () => setCurrentView('kanban'),
      },
      {
        id: 'view-organization',
        label: '組織構造',
        description: '組織チャートを表示',
        category: 'ビュー',
        keywords: ['organization', 'org', 'chart', 'そしき'],
        action: () => setCurrentView('organization'),
      },
      {
        id: 'view-history',
        label: '履歴',
        description: '履歴を表示',
        category: 'ビュー',
        keywords: ['history', 'りれき'],
        action: () => setCurrentView('history'),
      },
      {
        id: 'view-analytics',
        label: '分析ダッシュボード',
        description: 'タスク分析・統計を表示',
        category: 'ビュー',
        keywords: ['analytics', 'dashboard', 'stats', 'ぶんせき', 'とうけい'],
        action: () => setCurrentView('analytics'),
      },
      {
        id: 'view-notifications',
        label: '通知設定',
        description: 'デスクトップ通知の設定',
        category: 'ビュー',
        keywords: ['notification', 'つうち', 'desktop'],
        action: () => setCurrentView('notifications'),
      },
      {
        id: 'view-export-import',
        label: 'エクスポート/インポート',
        description: 'データのバックアップと復元',
        category: 'ビュー',
        keywords: ['export', 'import', 'backup', 'えくすぽーと', 'いんぽーと', 'バックアップ'],
        action: () => setCurrentView('export-import'),
      },
      {
        id: 'view-settings',
        label: '設定',
        description: '設定画面を表示',
        category: 'ビュー',
        keywords: ['settings', 'config', 'せってい'],
        action: () => {
          if (setIsSettingsPanelOpen) {
            setIsSettingsPanelOpen(true);
          } else {
            setCurrentView('settings');
          }
        },
      }
    );

    // Session commands
    cmds.push({
      id: 'session-new',
      label: '新規セッション作成',
      description: '新しいセッションを作成',
      category: 'セッション',
      keywords: ['session', 'new', 'create', 'せっしょん', 'しんき'],
      action: () => setIsSessionModalOpen(true),
    });

    // Add session switch commands
    sessions.forEach(session => {
      cmds.push({
        id: `session-switch-${session.id}`,
        label: `セッション: ${session.name}`,
        description: `${session.name} に切り替え`,
        category: 'セッション',
        keywords: ['session', 'switch', 'せっしょん', 'きりかえ', session.name.toLowerCase()],
        action: () => switchSession(session.id),
      });
    });

    // Terminal commands
    cmds.push(
      {
        id: 'terminal-agent',
        label: 'Agentターミナル表示',
        description: 'Agentアウトプットパネルを表示',
        category: 'ターミナル',
        keywords: ['agent', 'terminal', 'えーじぇんと', 'たーみなる'],
        action: () => setShowBashTerminal(false),
      },
      {
        id: 'terminal-bash',
        label: 'Bashターミナル表示',
        description: 'Bashターミナルパネルを表示',
        category: 'ターミナル',
        keywords: ['bash', 'terminal', 'shell', 'ばっしゅ', 'たーみなる'],
        action: () => setShowBashTerminal(true),
      }
    );

    // Git commands
    if (setIsGitPanelOpen) {
      cmds.push(
        {
          id: 'git-open',
          label: 'Git パネルを開く',
          description: 'Git操作パネルを表示',
          category: 'Git',
          keywords: ['git', 'version', 'control', 'commit', 'push', 'ぎっと'],
          action: () => setIsGitPanelOpen(true),
        },
        {
          id: 'git-commit',
          label: 'Git: Commit',
          description: 'ステージされた変更をコミット',
          category: 'Git',
          keywords: ['git', 'commit', 'こみっと'],
          action: () => setIsGitPanelOpen(true),
        },
        {
          id: 'git-push',
          label: 'Git: Push',
          description: 'コミットをリモートにプッシュ',
          category: 'Git',
          keywords: ['git', 'push', 'ぷっしゅ'],
          action: () => setIsGitPanelOpen(true),
        },
        {
          id: 'git-pull',
          label: 'Git: Pull',
          description: 'リモートから変更を取得',
          category: 'Git',
          keywords: ['git', 'pull', 'ぷる'],
          action: () => setIsGitPanelOpen(true),
        }
      );
    }

    return cmds;
  }, [sessions, setCurrentView, setIsSessionModalOpen, setShowBashTerminal, setIsGitPanelOpen, setIsSettingsPanelOpen, switchSession]);

  return commands;
}
