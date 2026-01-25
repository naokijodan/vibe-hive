import React from 'react';

function App(): React.ReactElement {
  return (
    <div className="flex h-screen w-screen bg-hive-bg text-hive-text">
      {/* Sidebar */}
      <aside className="w-64 border-r border-hive-border bg-hive-surface flex flex-col">
        <div className="p-4 border-b border-hive-border">
          <h1 className="text-xl font-bold text-hive-accent">Vibe Hive</h1>
          <p className="text-sm text-hive-muted mt-1">Multi-agent Manager</p>
        </div>
        <nav className="flex-1 p-2">
          {/* TODO: Navigation items */}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-12 border-b border-hive-border bg-hive-surface flex items-center px-4">
          <span className="text-hive-muted">Cmd+K でコマンドパレットを開く</span>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex">
          {/* Kanban Board Area */}
          <div className="flex-1 p-4">
            <div className="h-full rounded-lg border border-hive-border bg-hive-surface p-4">
              <h2 className="text-lg font-semibold mb-4">タスクボード</h2>
              <p className="text-hive-muted">セッションを作成してエージェントを起動</p>
            </div>
          </div>

          {/* Terminal Panel Area */}
          <div className="w-96 border-l border-hive-border bg-hive-surface">
            <div className="h-full flex flex-col">
              <div className="p-2 border-b border-hive-border">
                <span className="text-sm text-hive-muted">ターミナル</span>
              </div>
              <div className="flex-1 p-2 font-mono text-sm">
                <p className="text-hive-muted">// 出力がここに表示されます</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
