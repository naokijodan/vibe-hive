# Vibe Hive - アーキテクチャ設計書

## ディレクトリ構成

```
vibe-hive/
├── docs/                          # ドキュメント
│   ├── ARCHITECTURE.md            # 本ファイル
│   └── API.md                     # API仕様
│
├── src/
│   ├── main/                      # Main Process (Electron)
│   │   ├── index.ts               # エントリーポイント
│   │   ├── preload.ts             # Preload スクリプト
│   │   │
│   │   ├── services/              # バックエンドサービス
│   │   │   ├── pty/
│   │   │   │   ├── IPtyService.ts        # Interface
│   │   │   │   ├── NodePtyService.ts     # node-pty 実装
│   │   │   │   └── PtyManager.ts         # 複数PTY管理
│   │   │   │
│   │   │   ├── session/
│   │   │   │   ├── SessionService.ts     # セッション管理
│   │   │   │   └── SessionStore.ts       # SQLite永続化
│   │   │   │
│   │   │   ├── agent/
│   │   │   │   ├── AgentRunner.ts        # エージェント実行
│   │   │   │   ├── StatusDetector.ts     # ステータス検知
│   │   │   │   └── HooksIntegration.ts   # Claude Code hooks連携
│   │   │   │
│   │   │   ├── organization/
│   │   │   │   ├── OrgManager.ts         # 組織構造管理
│   │   │   │   ├── MessageRouter.ts      # エージェント間通信
│   │   │   │   └── Whiteboard.ts         # 共有コンテキスト
│   │   │   │
│   │   │   ├── git/
│   │   │   │   └── GitService.ts         # Git操作
│   │   │   │
│   │   │   └── db/
│   │   │       ├── Database.ts           # SQLite接続
│   │   │       └── migrations/           # マイグレーション
│   │   │
│   │   └── ipc/
│   │       ├── handlers.ts               # IPCハンドラー登録
│   │       └── channels.ts               # チャンネル定義
│   │
│   ├── renderer/                  # Renderer Process (React)
│   │   ├── index.tsx              # エントリーポイント
│   │   ├── App.tsx                # ルートコンポーネント
│   │   │
│   │   ├── components/
│   │   │   ├── Kanban/
│   │   │   │   ├── KanbanBoard.tsx       # ボード全体
│   │   │   │   ├── KanbanColumn.tsx      # カラム（稼働中等）
│   │   │   │   └── TaskCard.tsx          # タスクカード
│   │   │   │
│   │   │   ├── Terminal/
│   │   │   │   ├── TerminalPanel.tsx     # ターミナル表示
│   │   │   │   ├── TerminalTabs.tsx      # タブ管理
│   │   │   │   └── XTermWrapper.tsx      # xterm.js ラッパー
│   │   │   │
│   │   │   ├── Organization/
│   │   │   │   ├── OrgChart.tsx          # 組織図ビュー
│   │   │   │   ├── AgentNode.tsx         # エージェントノード
│   │   │   │   └── ConnectionLine.tsx    # 接続線
│   │   │   │
│   │   │   ├── CommandPalette/
│   │   │   │   └── CommandPalette.tsx    # Cmd+K パレット
│   │   │   │
│   │   │   └── common/
│   │   │       ├── Button.tsx
│   │   │       ├── Modal.tsx
│   │   │       └── Dropdown.tsx
│   │   │
│   │   ├── stores/
│   │   │   ├── sessionStore.ts           # セッション状態
│   │   │   ├── taskStore.ts              # タスク状態
│   │   │   ├── orgStore.ts               # 組織状態
│   │   │   └── uiStore.ts                # UI状態
│   │   │
│   │   ├── hooks/
│   │   │   ├── useTerminal.ts            # ターミナル操作
│   │   │   ├── useSession.ts             # セッション操作
│   │   │   └── useOrganization.ts        # 組織操作
│   │   │
│   │   ├── bridge/
│   │   │   └── ipcBridge.ts              # IPC抽象化層
│   │   │
│   │   └── styles/
│   │       └── globals.css               # TailwindCSS
│   │
│   └── shared/                    # 共有コード
│       ├── types/
│       │   ├── session.ts                # セッション型
│       │   ├── task.ts                   # タスク型
│       │   ├── agent.ts                  # エージェント型
│       │   └── organization.ts           # 組織型
│       │
│       ├── constants/
│       │   ├── status.ts                 # ステータス定数
│       │   └── channels.ts               # IPCチャンネル
│       │
│       └── utils/
│           └── helpers.ts
│
├── resources/                     # 静的リソース
│   ├── icons/
│   └── templates/
│       └── organization-default.json     # デフォルト組織テンプレート
│
├── scripts/                       # ビルドスクリプト
│   └── build.ts
│
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── electron-builder.yml
└── README.md
```

---

## レイヤー構成

```
┌─────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    React Components                       │   │
│  │  KanbanBoard │ TerminalPanel │ OrgChart │ CommandPalette │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                     Zustand Stores                        │   │
│  │  sessionStore │ taskStore │ orgStore │ uiStore           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                               │
                         IPC Bridge
                               │
┌─────────────────────────────────────────────────────────────────┐
│                        Application Layer                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      IPC Handlers                         │   │
│  │  session:* │ terminal:* │ agent:* │ org:* │ git:*        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────────┐
│                         Domain Layer                             │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │  Session   │ │   Agent    │ │Organization│ │    Git     │   │
│  │  Service   │ │  Runner    │ │  Manager   │ │  Service   │   │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘   │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Status Detector                        │   │
│  │        (hooks連携 / stdout解析 / イベント検知)            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────────┐
│                      Infrastructure Layer                        │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐                  │
│  │ PTY Manager│ │  SQLite    │ │ File System│                  │
│  │ (node-pty) │ │  Database  │ │  Watcher   │                  │
│  └────────────┘ └────────────┘ └────────────┘                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 依存関係（package.json 抜粋）

```json
{
  "dependencies": {
    "electron": "^28.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.0",
    "xterm": "^5.3.0",
    "xterm-addon-fit": "^0.8.0",
    "node-pty": "^1.0.0",
    "better-sqlite3": "^9.2.0",
    "simple-git": "^3.21.0",
    "@tanstack/react-virtual": "^3.0.0",
    "cmdk": "^0.2.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0",
    "electron-builder": "^24.9.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0"
  }
}
```
