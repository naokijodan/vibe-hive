# 🐝 Vibe Hive

> "Vibe with your AI swarm"

AIエージェント並列作業環境アプリ。複数のClaude Code / Codex CLI / Terminalを1画面で統合管理。

## 特徴

- **Kanban UI** - 稼働中 / 確認待ち / 終了 の3カラムでタスク可視化
- **マルチエージェント** - 複数のAIエージェントを並列実行
- **組織構造** - 社長→専務→社員のような階層型指揮系統
- **ステータス自動検知** - Claude Code hooks連携でリアルタイム更新
- **セッション復元** - 過去の作業を検索・再開

## クイックスタート

### 前提条件

- macOS (Apple Silicon)
- Node.js 20+
- Claude Code または Codex CLI

### インストール

```bash
git clone https://github.com/your-username/vibe-hive.git
cd vibe-hive
npm install
npm run dev
```

## 組織モードで使う

```bash
# 組織定義を読み込んで起動
npm run dev -- --org ./resources/templates/organization-default.json
```

### サンプル組織構造

```
         [CEO]
        /     \
    [CTO]     [COO]
    /    \
[Eng1] [Eng2]
```

## 開発

### 技術スタック

| 項目 | 技術 |
|------|------|
| フレームワーク | Electron |
| フロントエンド | React + TypeScript |
| スタイル | TailwindCSS |
| 状態管理 | Zustand |
| DB | SQLite (better-sqlite3) |
| ターミナル | node-pty + xterm.js |

### ディレクトリ構成

```
src/
├── main/           # Main Process (Electron)
│   ├── services/   # PTY, Session, Agent, Git
│   └── ipc/        # IPCハンドラー
├── renderer/       # Renderer Process (React)
│   ├── components/ # UI Components
│   └── stores/     # Zustand Stores
└── shared/         # 共有型定義
```

### コマンド

```bash
npm run dev      # 開発サーバー起動
npm run build    # プロダクションビルド
npm run test     # テスト実行
npm run lint     # Lint実行
```

## ドキュメント

- [アーキテクチャ設計](./docs/ARCHITECTURE.md)
- [API設計](./docs/API.md)
- [データベース設計](./docs/DATABASE.md)

## ロードマップ

- [x] Phase 0: 設計完了
- [ ] Phase 1: 基盤構築（Electron + ターミナル）
- [ ] Phase 2: Kanban UI
- [ ] Phase 3: ステータス自動検知
- [ ] Phase 4: セッション永続化
- [ ] Phase 5: 組織構造
- [ ] Phase 6: Git統合

## ライセンス

MIT

## 謝辞

- [AGI Cockpit](https://chatgpt-lab.com/) - インスピレーション
- [Vibe Coding](https://twitter.com/karpathy) - コンセプト
