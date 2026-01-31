# 🐝 Vibe Hive

> "Vibe with your AI swarm"

AIエージェント並列作業環境アプリ。複数のClaude Code / Codex CLI / Terminalを1画面で統合管理。

## 特徴

### コア機能

- **📋 Kanban UI** - ドラッグ&ドロップでタスク管理、優先度・ステータス可視化
- **🤖 マルチエージェント** - 複数のAIエージェントを並列実行、リアルタイム出力表示
- **🏢 組織構造** - React Flowで階層型エージェント構造を可視化・管理
- **⚡ リアルタイム実行** - Claude Code / Codex CLIをバックグラウンド実行
- **📜 実行履歴** - 全タスクの実行ログを永続化・検索可能
- **💾 タスクテンプレート** - よく使うタスクをテンプレート化して再利用

### 高度な機能

- **🔗 タスク依存関係** - タスク間の依存関係を定義、実行順序を自動制御
- **🎯 Ready状態検知** - 依存関係を満たしたタスクを自動検出
- **🎭 エージェント役割設定** - タスクごとにAIの役割・プロンプトを設定
- **📊 実行管理** - 実行中タスクのステータス監視、ログ閲覧
- **⌨️ コマンドパレット** - ⌘K で全機能に高速アクセス
- **🔧 Git統合** - アプリ内でGit操作（status, add, commit, push）
- **💻 ターミナルパネル** - エージェント出力 / Bash Terminal切り替え
- **🔄 セッション管理** - 複数プロジェクトをセッションで分離管理

## クイックスタート

### 前提条件

- macOS (Apple Silicon推奨、Intel対応)
- Node.js 20+
- Claude Code または Codex CLI

### インストール

```bash
git clone https://github.com/your-username/vibe-hive.git
cd vibe-hive
npm install
npm run dev
```

アプリが起動したら：
1. 右下の「+ 新規セッション」でプロジェクトを作成
2. タスクボードで「+ 新規タスク」を追加
3. タスクカードの「▶ 実行」ボタンでClaude Codeを起動

## 主な使い方

### 1. タスク作成とテンプレート

```bash
# タスクボードで新規作成
1. 「+ 新規タスク」をクリック
2. タイトル、説明、優先度を入力
3. 「🎭 役割」ボタンでAIの役割を設定（任意）

# テンプレートから作成
1. 「📋 テンプレート」ボタンをクリック
2. テンプレートを選択して「使用」

# タスクをテンプレート化
1. タスクカードの「💾 保存」ボタン
2. テンプレート名・カテゴリを入力
```

### 2. タスク依存関係

```bash
# 依存関係を設定
1. タスクカードの「🔗 依存」ボタン
2. 前提となるタスクを選択
3. 依存が解決されると「✓」マークが表示

# 依存関係ビューで確認
1. サイドバーの「🔗 依存関係」を選択
2. タスクをクリックで依存ツリー表示
```

### 3. 並列実行

```bash
# 複数タスクを同時実行
1. Ready状態のタスク（✓マーク）を複数選択
2. それぞれの「▶ 実行」ボタンをクリック
3. 右側パネルのタブで切り替えて確認

# 完了確認
- タスクが完了すると黄色で「確認待ち」表示
- クリックして出力を確認後、ステータスを変更
```

### 4. 組織構造モード

```bash
# エージェント階層を可視化
1. サイドバーの「🏢 組織構造」を選択
2. ノードをドラッグして配置
3. エージェントをクリックで担当タスク表示

# エージェントをタスクに割り当て
1. タスクカードのエージェント名をクリック
2. ドロップダウンからエージェントを選択
```

## 開発

### 技術スタック

| 項目 | 技術 |
|------|------|
| フレームワーク | Electron 28+ |
| フロントエンド | React 18 + TypeScript |
| スタイル | TailwindCSS |
| 状態管理 | Zustand |
| DB | SQLite (better-sqlite3) |
| ターミナル | node-pty + xterm.js |
| 組織構造 | React Flow |
| ドラッグ&ドロップ | @dnd-kit |

### ディレクトリ構成

```
src/
├── main/              # Main Process (Electron)
│   ├── services/      # バックエンドサービス
│   │   ├── db/        # SQLite, Repository層
│   │   ├── PtyService.ts       # ターミナル管理
│   │   ├── AgentService.ts     # エージェント管理
│   │   └── ExecutionEngine.ts  # タスク実行エンジン
│   └── ipc/           # IPCハンドラー
│       ├── handlers.ts          # Session, Git, Settings
│       ├── ptyHandlers.ts       # ターミナルIPC
│       ├── dbHandlers.ts        # DB操作IPC
│       ├── agentHandlers.ts     # エージェントIPC
│       ├── executionHandlers.ts # 実行IPC
│       └── templateHandlers.ts  # テンプレートIPC
├── renderer/          # Renderer Process (React)
│   ├── components/    # UIコンポーネント
│   │   ├── Kanban/           # タスクボード
│   │   ├── Organization/     # 組織構造図
│   │   ├── Terminal/         # ターミナルパネル
│   │   ├── Execution/        # 実行管理
│   │   ├── Template/         # テンプレート
│   │   ├── Git/              # Git統合
│   │   └── Settings/         # 設定
│   ├── stores/        # Zustand Stores
│   │   ├── taskStore.ts
│   │   ├── agentStore.ts
│   │   ├── executionStore.ts
│   │   ├── templateStore.ts
│   │   └── ...
│   └── bridge/        # IPC抽象化層
│       └── ipcBridge.ts
└── shared/            # 共有型定義
    └── types/
```

### コマンド

```bash
npm run dev      # 開発サーバー起動（Vite + Electron）
npm run build    # プロダクションビルド
npm run lint     # Lint実行
```

### データベーススキーマ

```sql
-- 主要テーブル
sessions           # セッション（プロジェクト）
tasks              # タスク + 依存関係 + レビューFB
agents             # AIエージェント + 階層構造
execution_history  # 実行履歴 + ログ
task_templates     # タスクテンプレート + サブタスク
terminal_logs      # ターミナル出力
```

## ドキュメント

- [アーキテクチャ設計](./docs/ARCHITECTURE.md)
- [API設計](./docs/API.md)
- [データベース設計](./docs/DATABASE.md)
- [Agent-Task統合](./AGENT_TASK_INTEGRATION.md)

## ロードマップ

- [x] Phase 0: 設計完了
- [x] Phase 1: 基盤構築（Electron + ターミナル）
- [x] Phase 2: Kanban UI
- [x] Phase 3: ステータス自動検知
- [x] Phase 4: セッション永続化
- [x] Phase 5: 組織構造（React Flow）
- [x] Phase 6: Git統合
- [x] Phase 7: Agent-Task統合
- [x] Phase 8: タスク依存関係管理
- [x] Phase 9: Execution Engine（実行エンジン）
- [x] Phase 10: 実行履歴機能
- [x] Phase 11: Task Template機能

### 完了した拡張機能

- [x] Analytics Dashboard（タスク分析・統計）
- [x] Export/Import機能（タスク・テンプレートのバックアップ）
- [x] Notification System（デスクトップ通知）
- [x] Multi-Agent Coordination（エージェント間通信）
- [x] Claude Code Hooks連携強化
- [x] カスタムテーマ機能

### 今後の拡張候補（優先順）

- [x] Phase 12: Workflow Automation（タスク自動実行パイプライン）
- [ ] Phase 13: AI Model Switching（Claude / GPT / Gemini / ローカルLLM切り替え）
- [ ] Phase 14: Plugin System（サードパーティ拡張エコシステム）
- [ ] Phase 15: Performance Profiler（実行時間分析・ボトルネック検出）
- [ ] Phase 16: Collaborative Mode（複数人での共同作業）
- [ ] Phase 17: Voice Command（音声でタスク操作）

## キーボードショートカット

| ショートカット | 機能 |
|--------------|------|
| ⌘K / Ctrl+K | コマンドパレット |
| ⌘1-9 / Ctrl+1-9 | セッション切り替え |

## トラブルシューティング

### Electronが起動しない

```bash
# node_modulesを再インストール
rm -rf node_modules package-lock.json
npm install

# electron-rebuildを実行
npm run rebuild
```

### ターミナルが表示されない

```bash
# node-ptyの再ビルド
npm rebuild node-pty
```

### データベースをリセットしたい

```bash
# Electronのユーザーデータをクリア
rm -rf ~/Library/Application\ Support/vibe-hive/
```

## ライセンス

MIT

## 謝辞

- [AGI Cockpit](https://chatgpt-lab.com/) - インスピレーション
- [Vibe Coding](https://twitter.com/karpathy) - コンセプト
- Claude Code - AI開発環境
