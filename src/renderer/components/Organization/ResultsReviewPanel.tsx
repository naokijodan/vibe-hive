import React, { useState } from 'react';
import type { OrchestrationState } from '../../../shared/types/orchestration';

const PHASE_LABELS: Record<string, { label: string; color: string }> = {
  planning: { label: '計画中', color: 'text-yellow-300' },
  executing: { label: '実行中', color: 'text-blue-300' },
  reviewing: { label: 'レビュー中', color: 'text-purple-300' },
  pending_approval: { label: '承認待ち', color: 'text-amber-300' },
  approved: { label: '承認済み', color: 'text-green-300' },
  rejected: { label: '却下', color: 'text-red-300' },
};

interface ResultsReviewPanelProps {
  state: OrchestrationState;
  onApprove: () => void;
  onReject: (feedback: string) => void;
  onClose: () => void;
}

export const ResultsReviewPanel: React.FC<ResultsReviewPanelProps> = ({
  state,
  onApprove,
  onReject,
  onClose,
}) => {
  const [rejectFeedback, setRejectFeedback] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const phaseInfo = PHASE_LABELS[state.phase] ?? { label: state.phase, color: 'text-gray-300' };
  const isPending = state.phase === 'pending_approval';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-hive-surface border border-hive-border rounded-lg w-[800px] max-w-[95vw] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hive-border">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white">オーケストレーション結果</h3>
            <span className={`text-xs px-2 py-0.5 rounded bg-hive-bg ${phaseInfo.color}`}>
              {phaseInfo.label}
            </span>
          </div>
          <button onClick={onClose} className="text-hive-muted hover:text-white">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Plan */}
          {state.plan && state.plan.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-hive-muted mb-2">実行計画</h4>
              <div className="space-y-2">
                {state.plan.map((p, i) => (
                  <div key={i} className="p-3 bg-hive-bg rounded border border-hive-border">
                    <div className="text-xs text-hive-accent mb-1">{p.childNodeName}</div>
                    <div className="text-sm text-white whitespace-pre-wrap">{p.instruction}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Child Results */}
          {state.childResults && state.childResults.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-hive-muted mb-2">各ノードの結果</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {state.childResults.map((r, i) => (
                  <div key={i} className={`p-3 rounded border ${
                    r.status === 'completed'
                      ? 'bg-green-900/10 border-green-700/30'
                      : 'bg-red-900/10 border-red-700/30'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${
                        r.status === 'completed' ? 'bg-green-400' : 'bg-red-400'
                      }`} />
                      <span className="text-xs text-hive-muted">{r.nodeId.slice(0, 8)}...</span>
                      <span className={`text-xs ${
                        r.status === 'completed' ? 'text-green-300' : 'text-red-300'
                      }`}>
                        {r.status === 'completed' ? '完了' : '失敗'}
                      </span>
                    </div>
                    {r.error && (
                      <div className="text-xs text-red-400 mt-1">{r.error}</div>
                    )}
                    {r.contextId && (
                      <div className="text-[10px] text-hive-muted mt-1">Context: {r.contextId.slice(0, 16)}...</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          {state.summary && (
            <div>
              <h4 className="text-sm font-medium text-hive-muted mb-2">統合レポート</h4>
              <div className="p-4 bg-hive-bg rounded border border-hive-border text-sm text-white whitespace-pre-wrap">
                {state.summary}
              </div>
            </div>
          )}

          {/* Error */}
          {state.error && (
            <div className="p-3 bg-red-900/20 border border-red-700/30 rounded text-sm text-red-300">
              {state.error}
            </div>
          )}

          {/* Loading states */}
          {(state.phase === 'planning' || state.phase === 'executing' || state.phase === 'reviewing') && (
            <div className="flex items-center gap-3 p-4 bg-hive-bg rounded">
              <div className="w-4 h-4 border-2 border-hive-accent border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-hive-muted">{phaseInfo.label}...</span>
            </div>
          )}
        </div>

        {/* Footer: Approve/Reject */}
        {isPending && (
          <div className="px-6 py-4 border-t border-hive-border space-y-3">
            {showRejectInput ? (
              <div className="space-y-2">
                <textarea
                  value={rejectFeedback}
                  onChange={(e) => setRejectFeedback(e.target.value)}
                  placeholder="却下理由・再実行指示を入力..."
                  className="w-full text-sm px-3 py-2 bg-hive-bg border border-hive-border rounded text-white resize-none h-20"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onReject(rejectFeedback);
                      setShowRejectInput(false);
                      setRejectFeedback('');
                    }}
                    className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-500"
                  >
                    却下して送信
                  </button>
                  <button
                    onClick={() => setShowRejectInput(false)}
                    className="px-4 py-2 bg-hive-bg border border-hive-border text-sm text-hive-text rounded hover:bg-hive-surface"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={onApprove}
                  className="flex-1 px-4 py-2 bg-green-600 text-white font-medium rounded hover:bg-green-500"
                >
                  承認
                </button>
                <button
                  onClick={() => setShowRejectInput(true)}
                  className="flex-1 px-4 py-2 bg-red-600/80 text-white font-medium rounded hover:bg-red-500"
                >
                  却下・再指示
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
