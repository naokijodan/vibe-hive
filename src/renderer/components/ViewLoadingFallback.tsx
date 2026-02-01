import React from 'react';

export const ViewLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center h-full">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-hive-accent border-t-transparent rounded-full animate-spin" />
      <span className="text-sm text-hive-muted">読み込み中...</span>
    </div>
  </div>
);
