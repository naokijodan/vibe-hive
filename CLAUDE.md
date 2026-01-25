# Vibe Hive - プロジェクトルール

## プロジェクト概要

**Vibe Hive** は、AIエージェント並列作業環境アプリ。
複数のClaude Code / Codex CLI / Terminalを1画面で統合管理する。

## 技術スタック

- **フレームワーク**: Electron
- **フロントエンド**: React + TypeScript
- **スタイル**: TailwindCSS
- **状態管理**: Zustand
- **DB**: SQLite (better-sqlite3)
- **ターミナル**: node-pty + xterm.js

## ディレクトリ構成

```
src/
├── main/           # Main Process (Electron)
│   ├── services/   # バックエンドサービス
│   └── ipc/        # IPCハンドラー
├── renderer/       # Renderer Process (React)
│   ├── components/ # UIコンポーネント
│   ├── stores/     # Zustand stores
│   └── bridge/     # IPC抽象化層
└── shared/         # 共有型定義
```

## 重要な設計原則

### 1. IPC Bridge パターン
- Renderer と Main の通信は必ず `src/renderer/bridge/ipcBridge.ts` を経由
- 将来的な Tauri 移行を考慮し、Electron 依存を Bridge 層に閉じ込める

### 2. サービス分離
Main Process のサービスは以下を分離：
- **PTY**: 短命（プロセスライフサイクル）
- **ログ**: 永続（SQLite）
- **メタデータ**: 別テーブル

### 3. 仮想スクロール必須
ターミナル出力やログ表示には必ず `@tanstack/react-virtual` を使用

## コーディング規約

### TypeScript
- 厳格モード (`strict: true`)
- 型は `src/shared/types/` に集約
- `any` 使用禁止、必要なら `unknown` + 型ガード

### React
- 関数コンポーネントのみ
- hooks は `src/renderer/hooks/` に集約
- Props は interface で定義

### ファイル命名
- コンポーネント: PascalCase (`TaskCard.tsx`)
- hooks: camelCase with use prefix (`useTerminal.ts`)
- サービス: PascalCase (`SessionService.ts`)
- 型定義: camelCase (`session.ts`)

## ドキュメント

- `docs/ARCHITECTURE.md` - アーキテクチャ設計
- `docs/API.md` - IPC API設計
- `docs/DATABASE.md` - DBスキーマ

## 組織構造機能

組織定義は JSON で管理：
- スキーマ: `resources/templates/organization-schema.json`
- サンプル: `resources/templates/organization-default.json`

## コミットルール

```
feat: 新機能
fix: バグ修正
docs: ドキュメント
refactor: リファクタリング
test: テスト
chore: その他
```

## 開発時の注意

1. **Electron のセキュリティ**
   - `nodeIntegration: false`
   - `contextIsolation: true`
   - preload スクリプトで API を公開

2. **node-pty の扱い**
   - ネイティブモジュールのため electron-rebuild が必要
   - `postinstall` スクリプトで自動実行

3. **SQLite**
   - WAL モード使用 (`PRAGMA journal_mode = WAL`)
   - マイグレーションは `src/main/services/db/migrations/` に配置
