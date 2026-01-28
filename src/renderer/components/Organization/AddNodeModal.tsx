import React, { useState } from 'react';
import type { OrgNode } from '../../../shared/types/organization';

interface AddNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (node: Omit<OrgNode, 'id'>) => Promise<void>;
  parentNode?: OrgNode;
  availableNodes: OrgNode[];
}

export const AddNodeModal: React.FC<AddNodeModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  parentNode,
  availableNodes,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'team' | 'role'>('team');
  const [description, setDescription] = useState('');
  const [selectedParentId, setSelectedParentId] = useState(parentNode?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onAdd({
        name: name.trim(),
        type,
        description: description.trim() || undefined,
        parentId: selectedParentId || undefined,
      });
      setName('');
      setDescription('');
      setType('team');
      setSelectedParentId('');
      onClose();
    } catch (error) {
      console.error('Failed to add node:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-hive-surface border border-hive-border rounded-lg p-6 w-[500px] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold mb-4">新しいノードを追加</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">名前 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-hive-bg border border-hive-border rounded text-hive-text focus:outline-none focus:ring-2 focus:ring-hive-accent"
              placeholder="開発チーム、バックエンドエンジニアなど..."
              autoFocus
              required
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium mb-1">タイプ *</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="team"
                  checked={type === 'team'}
                  onChange={() => setType('team')}
                  className="text-hive-accent"
                />
                <span>👥 チーム</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="role"
                  checked={type === 'role'}
                  onChange={() => setType('role')}
                  className="text-hive-accent"
                />
                <span>🎭 役割</span>
              </label>
            </div>
            <p className="text-xs text-hive-muted mt-1">
              チーム: 組織単位 (例: 開発部、デザインチーム)<br />
              役割: 担当・職務 (例: バックエンドエンジニア、プロジェクトマネージャー)
            </p>
          </div>

          {/* Parent */}
          <div>
            <label className="block text-sm font-medium mb-1">親ノード (オプション)</label>
            <select
              value={selectedParentId}
              onChange={(e) => setSelectedParentId(e.target.value)}
              className="w-full px-3 py-2 bg-hive-bg border border-hive-border rounded text-hive-text focus:outline-none focus:ring-2 focus:ring-hive-accent"
            >
              <option value="">なし (ルートノード)</option>
              {availableNodes.map(node => (
                <option key={node.id} value={node.id}>
                  {node.type === 'team' ? '👥' : '🎭'} {node.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-hive-muted mt-1">
              親ノードを選択すると、そのノードの配下に配置されます
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">説明 (オプション)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-hive-bg border border-hive-border rounded text-hive-text focus:outline-none focus:ring-2 focus:ring-hive-accent resize-none"
              placeholder="このチーム/役割の説明..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="flex-1 px-4 py-2 bg-hive-accent text-black font-medium rounded hover:bg-hive-accent/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '追加中...' : '追加'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-hive-bg border border-hive-border text-hive-text rounded hover:bg-hive-surface"
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
