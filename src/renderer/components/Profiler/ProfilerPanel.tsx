import React, { useEffect, useState } from 'react';
import { useProfilerStore } from '../../stores/profilerStore';
import type { BottleneckInfo, TaskStats } from '../../../shared/types/profiler';

type Tab = 'overview' | 'tasks' | 'timeline' | 'bottlenecks';

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: 'bg-green-500/20 text-green-400',
    running: 'bg-blue-500/20 text-blue-400',
    failed: 'bg-red-500/20 text-red-400',
    cancelled: 'bg-gray-500/20 text-gray-400',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] || 'bg-gray-500/20 text-gray-400'}`}>
      {status}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: BottleneckInfo['severity'] }) {
  const colors = {
    high: 'bg-red-500/20 text-red-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    low: 'bg-blue-500/20 text-blue-400',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[severity]}`}>
      {severity}
    </span>
  );
}

export function ProfilerPanel(): React.ReactElement {
  const {
    summary,
    taskStats,
    timeline,
    isLoading,
    error,
    refresh,
    sessionStats,
    loadSessionStats,
  } = useProfilerStore();

  const [activeTab, setActiveTab] = useState<Tab>('overview');

  useEffect(() => {
    refresh();
    loadSessionStats();
  }, [refresh, loadSessionStats]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: '概要' },
    { id: 'tasks', label: 'タスク分析' },
    { id: 'timeline', label: 'タイムライン' },
    { id: 'bottlenecks', label: 'ボトルネック' },
  ];

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Performance Profiler</h2>
            <p className="text-sm text-hive-muted mt-1">実行時間分析・ボトルネック検出</p>
          </div>
          <button
            onClick={() => { refresh(); loadSessionStats(); }}
            disabled={isLoading}
            className="px-4 py-2 bg-hive-accent text-black font-medium rounded-md hover:bg-hive-accent/90 transition-colors disabled:opacity-50 text-sm"
          >
            {isLoading ? '更新中...' : '更新'}
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-md">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-hive-border">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-hive-accent border-b-2 border-hive-accent'
                  : 'text-hive-muted hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'overview' && <OverviewTab summary={summary} sessionStats={sessionStats} />}
        {activeTab === 'tasks' && <TasksTab taskStats={taskStats} />}
        {activeTab === 'timeline' && <TimelineTab timeline={timeline} />}
        {activeTab === 'bottlenecks' && <BottlenecksTab bottlenecks={summary?.bottlenecks || []} />}
      </div>
    </div>
  );
}

function OverviewTab({ summary, sessionStats }: {
  summary: ReturnType<typeof useProfilerStore>['summary'];
  sessionStats: ReturnType<typeof useProfilerStore>['sessionStats'];
}) {
  if (!summary) {
    return (
      <div className="text-center py-12 text-hive-muted">
        <div className="text-4xl mb-4">📊</div>
        <p>データがありません。タスクを実行するとここに分析結果が表示されます。</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-hive-surface border border-hive-border rounded-lg">
          <div className="text-xs text-hive-muted uppercase mb-1">総実行回数</div>
          <div className="text-2xl font-bold text-white">{summary.totalExecutions}</div>
        </div>
        <div className="p-4 bg-hive-surface border border-hive-border rounded-lg">
          <div className="text-xs text-hive-muted uppercase mb-1">総実行時間</div>
          <div className="text-2xl font-bold text-white">{formatDuration(summary.totalDurationMs)}</div>
        </div>
        <div className="p-4 bg-hive-surface border border-hive-border rounded-lg">
          <div className="text-xs text-hive-muted uppercase mb-1">平均実行時間</div>
          <div className="text-2xl font-bold text-white">{formatDuration(summary.avgDurationMs)}</div>
        </div>
        <div className="p-4 bg-hive-surface border border-hive-border rounded-lg">
          <div className="text-xs text-hive-muted uppercase mb-1">成功率</div>
          <div className={`text-2xl font-bold ${summary.successRate >= 80 ? 'text-green-400' : summary.successRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
            {summary.successRate}%
          </div>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="p-4 bg-hive-surface border border-hive-border rounded-lg">
        <h3 className="text-sm font-semibold text-white mb-3">ステータス内訳</h3>
        <div className="flex gap-4">
          {Object.entries(summary.statusBreakdown).map(([status, count]) => (
            <div key={status} className="flex items-center gap-2">
              <StatusBadge status={status} />
              <span className="text-sm text-white font-medium">{count}</span>
            </div>
          ))}
        </div>
        {/* Bar visualization */}
        {summary.totalExecutions > 0 && (
          <div className="mt-3 h-3 rounded-full overflow-hidden flex bg-hive-bg">
            {Object.entries(summary.statusBreakdown).map(([status, count]) => {
              const pct = (count / summary.totalExecutions) * 100;
              const colors: Record<string, string> = {
                completed: 'bg-green-500',
                running: 'bg-blue-500',
                failed: 'bg-red-500',
                cancelled: 'bg-gray-500',
              };
              return (
                <div
                  key={status}
                  className={`${colors[status] || 'bg-gray-500'} transition-all`}
                  style={{ width: `${pct}%` }}
                  title={`${status}: ${count} (${Math.round(pct)}%)`}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Session stats */}
      {sessionStats.length > 0 && (
        <div className="p-4 bg-hive-surface border border-hive-border rounded-lg">
          <h3 className="text-sm font-semibold text-white mb-3">セッション別統計</h3>
          <div className="space-y-2">
            {sessionStats.map(s => (
              <div key={s.sessionId} className="flex items-center justify-between py-2 border-b border-hive-border last:border-b-0">
                <div>
                  <span className="text-sm text-white">{s.sessionName}</span>
                  <span className="text-xs text-hive-muted ml-2">{s.totalExecutions} 回実行</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-hive-muted">平均 {formatDuration(s.avgDurationMs)}</span>
                  <span className={`text-xs font-medium ${s.successRate >= 80 ? 'text-green-400' : 'text-yellow-400'}`}>
                    {s.successRate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TasksTab({ taskStats }: { taskStats: TaskStats[] }) {
  if (taskStats.length === 0) {
    return (
      <div className="text-center py-12 text-hive-muted">
        <p>タスク統計データがありません。</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid grid-cols-8 gap-2 px-4 py-2 text-xs text-hive-muted uppercase font-semibold">
        <div className="col-span-2">タスク</div>
        <div>実行回数</div>
        <div>平均</div>
        <div>最短</div>
        <div>最長</div>
        <div>成功率</div>
        <div>失敗</div>
      </div>
      {taskStats.map(t => (
        <div key={t.taskId} className="grid grid-cols-8 gap-2 px-4 py-3 bg-hive-surface border border-hive-border rounded-lg items-center">
          <div className="col-span-2 text-sm text-white truncate" title={t.taskTitle}>
            {t.taskTitle}
          </div>
          <div className="text-sm text-hive-muted">{t.totalExecutions}</div>
          <div className="text-sm text-white font-mono">{formatDuration(t.avgDurationMs)}</div>
          <div className="text-sm text-hive-muted font-mono">{formatDuration(t.minDurationMs)}</div>
          <div className="text-sm text-hive-muted font-mono">{formatDuration(t.maxDurationMs)}</div>
          <div className={`text-sm font-medium ${t.successRate >= 80 ? 'text-green-400' : t.successRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
            {t.successRate}%
          </div>
          <div className="text-sm text-red-400">{t.failCount}</div>
        </div>
      ))}
    </div>
  );
}

function TimelineTab({ timeline }: { timeline: ReturnType<typeof useProfilerStore>['timeline'] }) {
  if (timeline.length === 0) {
    return (
      <div className="text-center py-12 text-hive-muted">
        <p>タイムラインデータがありません。</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {timeline.map((entry, i) => (
        <div key={entry.executionId || i} className="flex items-center gap-4 px-4 py-3 bg-hive-surface border border-hive-border rounded-lg">
          <StatusBadge status={entry.status} />
          <div className="flex-1 min-w-0">
            <div className="text-sm text-white truncate">{entry.taskTitle}</div>
            <div className="text-xs text-hive-muted">
              {new Date(entry.startedAt).toLocaleString('ja-JP')}
            </div>
          </div>
          <div className="text-sm font-mono text-white">
            {entry.durationMs != null ? formatDuration(entry.durationMs) : '-'}
          </div>
        </div>
      ))}
    </div>
  );
}

function BottlenecksTab({ bottlenecks }: { bottlenecks: BottleneckInfo[] }) {
  if (bottlenecks.length === 0) {
    return (
      <div className="text-center py-12 text-hive-muted">
        <div className="text-4xl mb-4">✅</div>
        <p>ボトルネックは検出されませんでした。</p>
        <p className="text-xs mt-2">2回以上実行されたタスクで平均以上の実行時間やエラー率が高いものを検出します。</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bottlenecks.map(b => (
        <div key={b.taskId} className="p-4 bg-hive-surface border border-hive-border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">{b.taskTitle}</span>
            <SeverityBadge severity={b.severity} />
          </div>
          <div className="flex gap-6 text-xs text-hive-muted">
            <span>平均: <span className="text-white font-mono">{formatDuration(b.avgDurationMs)}</span></span>
            <span>実行回数: <span className="text-white">{b.totalExecutions}</span></span>
            <span>エラー率: <span className={b.failRate > 25 ? 'text-red-400' : 'text-white'}>{b.failRate}%</span></span>
          </div>
        </div>
      ))}
    </div>
  );
}
