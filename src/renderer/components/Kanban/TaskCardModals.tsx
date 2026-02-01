import React from 'react';
import { Task } from '../../../shared/types';

interface ModalProps {
  onClose: (e: React.MouseEvent) => void;
}

// Feedback Modal
interface FeedbackModalProps extends ModalProps {
  feedbackText: string;
  setFeedbackText: (text: string) => void;
  onSubmit: (e: React.MouseEvent) => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  feedbackText, setFeedbackText, onSubmit, onClose,
}) => (
  <div
    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    onClick={onClose}
  >
    <div
      className="bg-hive-surface border border-hive-border rounded-lg p-4 w-96 max-w-[90vw]"
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className="text-white font-medium mb-3">レビューフィードバック</h3>
      <textarea
        value={feedbackText}
        onChange={(e) => setFeedbackText(e.target.value)}
        placeholder="フィードバックを入力..."
        className="w-full h-32 bg-hive-bg border border-hive-border rounded p-2 text-white text-sm resize-none focus:outline-none focus:border-hive-accent"
      />
      <div className="flex justify-end gap-2 mt-3">
        <button onClick={onClose} className="px-3 py-1.5 text-sm text-hive-muted hover:text-white transition-colors">
          キャンセル
        </button>
        <button onClick={onSubmit} className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-500 transition-colors">
          保存
        </button>
      </div>
    </div>
  </div>
);

// Subtask Modal
interface SubtaskModalProps extends ModalProps {
  subtaskText: string;
  setSubtaskText: (text: string) => void;
  onSubmit: (e: React.MouseEvent) => void;
}

export const SubtaskModal: React.FC<SubtaskModalProps> = ({
  subtaskText, setSubtaskText, onSubmit, onClose,
}) => (
  <div
    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    onClick={onClose}
  >
    <div
      className="bg-hive-surface border border-hive-border rounded-lg p-4 w-96 max-w-[90vw]"
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className="text-white font-medium mb-3">サブタスク作成</h3>
      <p className="text-hive-muted text-xs mb-2">1行に1つのサブタスクを入力</p>
      <textarea
        value={subtaskText}
        onChange={(e) => setSubtaskText(e.target.value)}
        placeholder="サブタスク1&#10;サブタスク2&#10;サブタスク3"
        className="w-full h-32 bg-hive-bg border border-hive-border rounded p-2 text-white text-sm resize-none focus:outline-none focus:border-hive-accent"
      />
      <div className="flex justify-end gap-2 mt-3">
        <button onClick={onClose} className="px-3 py-1.5 text-sm text-hive-muted hover:text-white transition-colors">
          キャンセル
        </button>
        <button onClick={onSubmit} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors">
          作成
        </button>
      </div>
    </div>
  </div>
);

// Dependency Modal
interface DependencyModalProps extends ModalProps {
  availableTasks: Task[];
  selectedDependencies: string[];
  setSelectedDependencies: (deps: string[]) => void;
  onSubmit: (e: React.MouseEvent) => void;
}

export const DependencyModal: React.FC<DependencyModalProps> = ({
  availableTasks, selectedDependencies, setSelectedDependencies, onSubmit, onClose,
}) => (
  <div
    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    onClick={onClose}
  >
    <div
      className="bg-hive-surface border border-hive-border rounded-lg p-4 w-96 max-w-[90vw] max-h-[80vh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className="text-white font-medium mb-3">依存関係設定</h3>
      <p className="text-hive-muted text-xs mb-3">このタスクの開始前に完了が必要なタスクを選択</p>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {availableTasks.length === 0 ? (
          <p className="text-hive-muted text-sm">他のタスクがありません</p>
        ) : (
          availableTasks.map((t) => (
            <label
              key={t.id}
              className="flex items-center gap-2 p-2 bg-hive-bg rounded hover:bg-hive-accent/10 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedDependencies.includes(t.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedDependencies([...selectedDependencies, t.id]);
                  } else {
                    setSelectedDependencies(selectedDependencies.filter((id) => id !== t.id));
                  }
                }}
                className="rounded border-hive-border"
              />
              <span className="text-white text-sm flex-1">{t.title}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                t.status === 'done' ? 'bg-green-900 text-green-300' :
                t.status === 'in_progress' ? 'bg-blue-900 text-blue-300' :
                'bg-gray-800 text-gray-400'
              }`}>
                {t.status}
              </span>
            </label>
          ))
        )}
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onClose} className="px-3 py-1.5 text-sm text-hive-muted hover:text-white transition-colors">
          キャンセル
        </button>
        <button onClick={onSubmit} className="px-3 py-1.5 text-sm bg-hive-accent text-white rounded hover:bg-hive-accent/80 transition-colors">
          保存
        </button>
      </div>
    </div>
  </div>
);

// Role Modal
interface RoleModalProps extends ModalProps {
  roleText: string;
  setRoleText: (text: string) => void;
  onSubmit: (e: React.MouseEvent) => void;
}

export const RoleModal: React.FC<RoleModalProps> = ({
  roleText, setRoleText, onSubmit, onClose,
}) => (
  <div
    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    onClick={onClose}
  >
    <div
      className="bg-hive-surface border border-hive-border rounded-lg p-4 w-[500px] max-w-[90vw]"
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className="text-white font-medium mb-3">🎭 エージェントの役割設定</h3>
      <p className="text-hive-muted text-xs mb-3">
        このタスクを実行するClaude Codeに与える役割・システムプロンプトを設定します。
        例：「あなたはTypeScriptの専門家です」「コードレビューを行うシニアエンジニアとして振る舞ってください」
      </p>
      <textarea
        value={roleText}
        onChange={(e) => setRoleText(e.target.value)}
        placeholder="あなたはReactとTypeScriptの専門家です。コードの品質と型安全性を重視してください。"
        className="w-full h-40 bg-hive-bg border border-hive-border rounded p-2 text-white text-sm resize-none focus:outline-none focus:border-hive-accent"
      />
      <div className="flex justify-end gap-2 mt-3">
        <button onClick={onClose} className="px-3 py-1.5 text-sm text-hive-muted hover:text-white transition-colors">
          キャンセル
        </button>
        <button onClick={onSubmit} className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-500 transition-colors">
          保存
        </button>
      </div>
    </div>
  </div>
);

// Save Template Modal
interface SaveTemplateModalProps extends ModalProps {
  templateName: string;
  setTemplateName: (name: string) => void;
  templateDescription: string;
  setTemplateDescription: (desc: string) => void;
  templateCategory: string;
  setTemplateCategory: (cat: string) => void;
  onSubmit: (e: React.MouseEvent) => void;
}

export const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({
  templateName, setTemplateName,
  templateDescription, setTemplateDescription,
  templateCategory, setTemplateCategory,
  onSubmit, onClose,
}) => (
  <div
    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    onClick={onClose}
  >
    <div
      className="bg-hive-surface border border-hive-border rounded-lg p-4 w-[500px] max-w-[90vw]"
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className="text-white font-medium mb-3">💾 テンプレートとして保存</h3>
      <p className="text-hive-muted text-xs mb-3">
        このタスクをテンプレートとして保存し、後で再利用できます
      </p>
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-hive-muted mb-1">テンプレート名 *</label>
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="テンプレート名を入力"
            className="w-full bg-hive-bg border border-hive-border rounded p-2 text-white text-sm focus:outline-none focus:border-hive-accent"
          />
        </div>
        <div>
          <label className="block text-xs text-hive-muted mb-1">説明</label>
          <textarea
            value={templateDescription}
            onChange={(e) => setTemplateDescription(e.target.value)}
            placeholder="テンプレートの説明（オプション）"
            className="w-full h-20 bg-hive-bg border border-hive-border rounded p-2 text-white text-sm resize-none focus:outline-none focus:border-hive-accent"
          />
        </div>
        <div>
          <label className="block text-xs text-hive-muted mb-1">カテゴリ</label>
          <input
            type="text"
            value={templateCategory}
            onChange={(e) => setTemplateCategory(e.target.value)}
            placeholder="例：フロントエンド, バックエンド"
            className="w-full bg-hive-bg border border-hive-border rounded p-2 text-white text-sm focus:outline-none focus:border-hive-accent"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onClose} className="px-3 py-1.5 text-sm text-hive-muted hover:text-white transition-colors">
          キャンセル
        </button>
        <button onClick={onSubmit} className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-500 transition-colors">
          保存
        </button>
      </div>
    </div>
  </div>
);
