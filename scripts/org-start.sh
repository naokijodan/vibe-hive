#!/bin/bash
#
# 🐝 Vibe Hive - 組織構造起動スクリプト
#
# 使い方:
#   ./scripts/org-start.sh                    # デフォルト組織で起動
#   ./scripts/org-start.sh ./my-org.json      # カスタム組織で起動
#

set -e

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# デフォルト値
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ORG_FILE="${1:-$PROJECT_DIR/resources/templates/organization-default.json}"
SESSION_NAME="vibe-hive-org"

echo -e "${CYAN}"
echo "  🐝 Vibe Hive - Organization Mode"
echo "  ================================"
echo -e "${NC}"

# 組織ファイルの存在確認
if [ ! -f "$ORG_FILE" ]; then
    echo -e "${RED}Error: Organization file not found: $ORG_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}Organization file: $ORG_FILE${NC}"

# jqがインストールされているか確認
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}Warning: jq not found. Install with: brew install jq${NC}"
    echo "Continuing with basic parsing..."
    USE_JQ=false
else
    USE_JQ=true
fi

# 組織情報を読み取り
if $USE_JQ; then
    ORG_NAME=$(jq -r '.name' "$ORG_FILE")
    AGENTS=$(jq -r '.agents | keys[]' "$ORG_FILE")
else
    ORG_NAME="AI Organization"
    AGENTS="ceo cto engineer_frontend engineer_backend"
fi

echo -e "${BLUE}Organization: $ORG_NAME${NC}"
echo -e "${BLUE}Agents: $AGENTS${NC}"
echo ""

# 既存セッションがあれば終了
tmux kill-session -t "$SESSION_NAME" 2>/dev/null || true

# tmuxセッション作成
echo -e "${YELLOW}Creating tmux session: $SESSION_NAME${NC}"
tmux new-session -d -s "$SESSION_NAME" -n "org"

# ペインのインデックス
PANE_INDEX=0

# 各エージェント用のペインを作成
for AGENT in $AGENTS; do
    if $USE_JQ; then
        AGENT_NAME=$(jq -r ".agents.$AGENT.name" "$ORG_FILE")
        AGENT_ROLE=$(jq -r ".agents.$AGENT.role" "$ORG_FILE")
        SYSTEM_PROMPT=$(jq -r ".agents.$AGENT.systemPrompt" "$ORG_FILE")
    else
        AGENT_NAME="$AGENT"
        AGENT_ROLE="Agent"
        SYSTEM_PROMPT="You are $AGENT"
    fi

    echo -e "${PURPLE}Setting up: $AGENT_NAME ($AGENT_ROLE)${NC}"

    # 最初のペイン以外は分割
    if [ $PANE_INDEX -gt 0 ]; then
        # 偶数なら水平分割、奇数なら垂直分割
        if [ $((PANE_INDEX % 2)) -eq 0 ]; then
            tmux split-window -v -t "$SESSION_NAME:org"
        else
            tmux split-window -h -t "$SESSION_NAME:org"
        fi
    fi

    # エージェント名をペインタイトルに設定
    tmux select-pane -t "$SESSION_NAME:org.$PANE_INDEX" -T "$AGENT_NAME"

    # Claude Codeを起動（システムプロンプト付き）
    # 注: 実際のClaude CLIのオプションに合わせて調整が必要
    tmux send-keys -t "$SESSION_NAME:org.$PANE_INDEX" "echo '🐝 $AGENT_NAME ($AGENT_ROLE)'" C-m
    tmux send-keys -t "$SESSION_NAME:org.$PANE_INDEX" "cd $PROJECT_DIR" C-m
    # tmux send-keys -t "$SESSION_NAME:org.$PANE_INDEX" "claude --system-prompt '$SYSTEM_PROMPT'" C-m

    PANE_INDEX=$((PANE_INDEX + 1))
done

# レイアウトを整える
tmux select-layout -t "$SESSION_NAME:org" tiled

# ペインボーダーにタイトル表示
tmux set -t "$SESSION_NAME" pane-border-status top
tmux set -t "$SESSION_NAME" pane-border-format " #{pane_title} "

echo ""
echo -e "${GREEN}✅ Organization started!${NC}"
echo ""
echo -e "${CYAN}To attach to the session:${NC}"
echo "  tmux attach -t $SESSION_NAME"
echo ""
echo -e "${CYAN}To send a message to CEO:${NC}"
echo "  tmux send-keys -t $SESSION_NAME:org.0 'your message' C-m"
echo ""
echo -e "${CYAN}To kill the session:${NC}"
echo "  tmux kill-session -t $SESSION_NAME"
echo ""

# セッションにアタッチ
read -p "Attach to session now? [Y/n] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
    tmux attach -t "$SESSION_NAME"
fi
