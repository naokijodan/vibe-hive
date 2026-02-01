import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { Agent } from '../../../shared/types';
import type { AgentType } from '../../../shared/types/workflow';
import type { ExecutionStrategy } from '../../../shared/types/organization';
import { useOrganizationStore } from '../../stores/organizationStore';
import { useAgentStore } from '../../stores/agentStore';
import { OrgNodeCard } from './OrgNodeCard';
import { AddNodeModal } from './AddNodeModal';
import { ResultsReviewPanel } from './ResultsReviewPanel';
import type { OrgNode } from '../../../shared/types/organization';

interface OrgChartProps {
  onAgentClick?: (agent: Agent) => void;
}

// Custom node types for React Flow
const nodeTypes: NodeTypes = {
  orgNode: OrgNodeCard,
};

// Helper function to build hierarchical layout
const buildHierarchyLayout = (nodes: OrgNode[]) => {
  const nodeMap = new Map<string, OrgNode>();
  nodes.forEach(n => nodeMap.set(n.id, n));

  // Find root nodes (no parent)
  const roots = nodes.filter(n => !n.parentId);

  // Calculate positions using a tree layout
  const HORIZONTAL_SPACING = 300;
  const VERTICAL_SPACING = 150;

  const positionedNodes: Node[] = [];
  const edges: Edge[] = [];

  const positionNode = (
    node: OrgNode,
    x: number,
    y: number,
    usedX: Set<number>
  ): number => {
    // Avoid overlapping by checking if X position is already used
    let adjustedX = x;
    while (usedX.has(adjustedX)) {
      adjustedX += HORIZONTAL_SPACING;
    }
    usedX.add(adjustedX);

    positionedNodes.push({
      id: node.id,
      type: 'orgNode',
      position: node.position || { x: adjustedX, y },
      data: node,
    });

    // Find children
    const children = nodes.filter(n => n.parentId === node.id);
    if (children.length === 0) return adjustedX;

    // Position children
    const childY = y + VERTICAL_SPACING;
    let childX = adjustedX - ((children.length - 1) * HORIZONTAL_SPACING) / 2;

    children.forEach(child => {
      edges.push({
        id: `${node.id}-${child.id}`,
        source: node.id,
        target: child.id,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#6366f1', strokeWidth: 2 },
      });

      childX = positionNode(child, childX, childY, usedX);
      childX += HORIZONTAL_SPACING;
    });

    return adjustedX;
  };

  const usedX = new Set<number>();
  let rootX = 0;

  roots.forEach(root => {
    rootX = positionNode(root, rootX, 0, usedX);
    rootX += HORIZONTAL_SPACING * 2;
  });

  return { nodes: positionedNodes, edges };
};

export const OrgChart: React.FC<OrgChartProps> = ({ onAgentClick }) => {
  const {
    nodes: orgNodes,
    selectedNodeId,
    nodeExecutions,
    orchestrationStates,
    loadOrganization,
    addNode,
    updateNode,
    deleteNode,
    setSelectedNode,
    assignAgentToNode,
    unassignAgentFromNode,
    executeNode,
    stopNode,
    initOrchestrationListener,
    orchestrateNode,
    approveOrchestration,
    rejectOrchestration,
  } = useOrganizationStore();

  const { agents } = useAgentStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showAgentPanel, setShowAgentPanel] = useState(false);
  const [executePrompt, setExecutePrompt] = useState('');
  const [orchestrateGoal, setOrchestrateGoal] = useState('');
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [reviewNodeId, setReviewNodeId] = useState<string | null>(null);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Load organization on mount + orchestration listener
  useEffect(() => {
    loadOrganization();
    const cleanup = initOrchestrationListener();
    return cleanup;
  }, [loadOrganization, initOrchestrationListener]);

  // Update React Flow nodes when org nodes change
  useEffect(() => {
    if (orgNodes.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const { nodes: layoutNodes, edges: layoutEdges } = buildHierarchyLayout(orgNodes);

    // Add custom data with callbacks
    const enrichedNodes = layoutNodes.map(node => ({
      ...node,
      data: {
        node: node.data,
        onSelect: handleNodeSelect,
        onDelete: handleNodeDelete,
        isSelected: node.id === selectedNodeId,
      },
    }));

    setNodes(enrichedNodes);
    setEdges(layoutEdges);
  }, [orgNodes, selectedNodeId]);

  const handleNodeSelect = useCallback((id: string) => {
    setSelectedNode(id);
    setShowAgentPanel(true);
  }, [setSelectedNode]);

  const handleNodeDelete = useCallback(async (id: string) => {
    if (confirm('このノードとその配下のノードを削除しますか?')) {
      await deleteNode(id);
    }
  }, [deleteNode]);

  const handleAddNode = useCallback(async (nodeData: Omit<OrgNode, 'id'>) => {
    await addNode(nodeData);
  }, [addNode]);

  const onConnect = useCallback(
    (connection: Connection) => {
      // Update parent-child relationship
      if (connection.source && connection.target) {
        updateNode(connection.target, { parentId: connection.source });
      }
    },
    [updateNode]
  );

  const selectedNode = useMemo(
    () => orgNodes.find(n => n.id === selectedNodeId),
    [orgNodes, selectedNodeId]
  );

  const assignedAgents = useMemo(
    () => selectedNode
      ? agents.filter(a => selectedNode.assignedAgentIds?.includes(a.id))
      : [],
    [selectedNode, agents]
  );

  const unassignedAgents = useMemo(
    () => selectedNode
      ? agents.filter(a => !selectedNode.assignedAgentIds?.includes(a.id))
      : [],
    [selectedNode, agents]
  );

  return (
    <div className="h-full w-full flex">
      {/* Main Flow Canvas */}
      <div className="flex-1 relative">
        {orgNodes.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-hive-muted text-lg mb-4">組織構造が空です</p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-hive-accent text-black font-medium rounded hover:bg-hive-accent/80"
              >
                + 最初のノードを追加
              </button>
            </div>
          </div>
        ) : (
          <>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              className="bg-hive-bg"
              defaultEdgeOptions={{
                type: 'smoothstep',
                animated: false,
                style: { stroke: '#6366f1', strokeWidth: 2 },
              }}
            >
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#374151" />
              <Controls className="bg-hive-surface border border-hive-border" />
            </ReactFlow>

            {/* Add Node Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="absolute top-4 right-4 px-4 py-2 bg-hive-accent text-black font-medium rounded hover:bg-hive-accent/80 shadow-lg z-10"
            >
              + ノード追加
            </button>
          </>
        )}
      </div>

      {/* Agent Assignment Panel */}
      {showAgentPanel && selectedNode && (
        <div className="w-80 bg-hive-surface border-l border-hive-border p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">エージェント割り当て</h3>
            <button
              onClick={() => setShowAgentPanel(false)}
              className="text-hive-muted hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="mb-4 p-3 bg-hive-bg rounded space-y-2">
            <div className="text-sm font-medium text-white">{selectedNode.name}</div>
            <div className="text-xs text-hive-muted">
              {selectedNode.type === 'team' ? '👥 チーム' : '🎭 役割'}
            </div>

            {/* Preferred Agent Type */}
            <div>
              <label className="text-[10px] text-hive-muted block mb-1">推奨モデル</label>
              <select
                value={selectedNode.preferredAgentType || ''}
                onChange={(e) => updateNode(selectedNode.id, {
                  preferredAgentType: (e.target.value as AgentType) || undefined,
                })}
                className="w-full text-xs px-2 py-1 bg-hive-surface border border-hive-border rounded text-white"
              >
                <option value="">指定なし</option>
                <option value="claude-code">🤖 Claude Code</option>
                <option value="codex">⚡ Codex CLI</option>
                <option value="gemini">💎 Gemini CLI</option>
                <option value="ollama">🦙 Ollama</option>
                <option value="custom">🔧 カスタム</option>
              </select>
            </div>

            {/* Execution Strategy (team only) */}
            {selectedNode.type === 'team' && (
              <div>
                <label className="text-[10px] text-hive-muted block mb-1">動作モード</label>
                <select
                  value={selectedNode.executionStrategy || 'parallel'}
                  onChange={(e) => updateNode(selectedNode.id, {
                    executionStrategy: e.target.value as ExecutionStrategy,
                  })}
                  className="w-full text-xs px-2 py-1 bg-hive-surface border border-hive-border rounded text-white"
                >
                  <option value="parallel">⚡ 並列 (Parallel)</option>
                  <option value="sequential">⏩ 直列 (Sequential)</option>
                </select>
              </div>
            )}

            {/* System Prompt */}
            <div>
              <label className="text-[10px] text-hive-muted block mb-1">システムプロンプト</label>
              <textarea
                value={selectedNode.systemPrompt || ''}
                onChange={(e) => updateNode(selectedNode.id, {
                  systemPrompt: e.target.value || undefined,
                })}
                placeholder="このノードの役割・指示を記述..."
                className="w-full text-xs px-2 py-1 bg-hive-surface border border-hive-border rounded text-white resize-none h-16"
              />
            </div>
          </div>

          {/* Orchestrate Controls (team nodes with children) */}
          {selectedNode.type === 'team' && orgNodes.some(n => n.parentId === selectedNode.id) && (
            <div className="mb-4 p-3 bg-indigo-900/20 border border-indigo-700/30 rounded space-y-2">
              <label className="text-[10px] text-indigo-300 block font-medium">オーケストレーション</label>
              <textarea
                value={orchestrateGoal}
                onChange={(e) => setOrchestrateGoal(e.target.value)}
                placeholder="チーム全体の目標を入力..."
                className="w-full text-xs px-2 py-1.5 bg-hive-surface border border-hive-border rounded text-white resize-none h-16"
              />
              {(() => {
                const orchState = orchestrationStates.get(selectedNode.id);
                const isActive = orchState && !['approved', 'rejected'].includes(orchState.phase);
                return (
                  <>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (orchestrateGoal.trim()) {
                            orchestrateNode(selectedNode.id, orchestrateGoal.trim());
                          }
                        }}
                        disabled={!orchestrateGoal.trim() || !!isActive}
                        className="flex-1 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        オーケストレート
                      </button>
                      {orchState && (
                        <button
                          onClick={() => {
                            setReviewNodeId(selectedNode.id);
                            setShowReviewPanel(true);
                          }}
                          className="px-3 py-1.5 bg-hive-bg border border-hive-border text-xs text-white rounded hover:bg-hive-surface"
                        >
                          結果
                        </button>
                      )}
                    </div>
                    {orchState && (
                      <div className={`text-[10px] ${
                        orchState.phase === 'pending_approval' ? 'text-amber-300' :
                        orchState.phase === 'approved' ? 'text-green-300' :
                        orchState.phase === 'rejected' ? 'text-red-300' :
                        'text-blue-300'
                      }`}>
                        {orchState.phase === 'planning' ? '計画中...' :
                         orchState.phase === 'executing' ? '実行中...' :
                         orchState.phase === 'reviewing' ? 'レビュー中...' :
                         orchState.phase === 'pending_approval' ? '承認待ち' :
                         orchState.phase === 'approved' ? '承認済み' :
                         orchState.phase === 'rejected' ? '却下' : orchState.phase}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* Execution Controls */}
          <div className="mb-4 p-3 bg-hive-bg rounded space-y-2">
            <label className="text-[10px] text-hive-muted block">実行プロンプト</label>
            <textarea
              value={executePrompt}
              onChange={(e) => setExecutePrompt(e.target.value)}
              placeholder="このノードに実行させるタスクを入力..."
              className="w-full text-xs px-2 py-1.5 bg-hive-surface border border-hive-border rounded text-white resize-none h-20"
            />
            {(() => {
              const exec = nodeExecutions.get(selectedNode.id);
              const status = exec?.status ?? 'idle';
              const isRunning = status === 'running';
              return (
                <div className="flex items-center gap-2">
                  {isRunning ? (
                    <button
                      onClick={() => stopNode(selectedNode.id)}
                      className="flex-1 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-500"
                    >
                      停止
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (executePrompt.trim()) {
                          executeNode(selectedNode.id, executePrompt.trim());
                        }
                      }}
                      disabled={!executePrompt.trim()}
                      className="flex-1 px-3 py-1.5 bg-hive-accent text-black text-xs font-medium rounded hover:bg-hive-accent/80 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      実行
                    </button>
                  )}
                  {status !== 'idle' && (
                    <span className={`text-[10px] px-2 py-0.5 rounded ${
                      status === 'running' ? 'bg-blue-900/50 text-blue-300' :
                      status === 'completed' ? 'bg-green-900/50 text-green-300' :
                      'bg-red-900/50 text-red-300'
                    }`}>
                      {status === 'running' ? '実行中...' : status === 'completed' ? '完了' : '失敗'}
                    </span>
                  )}
                </div>
              );
            })()}
            {(() => {
              const exec = nodeExecutions.get(selectedNode.id);
              if (exec?.error) {
                return (
                  <div className="text-[10px] text-red-400 mt-1 break-words">
                    {exec.error}
                  </div>
                );
              }
              return null;
            })()}
          </div>

          {/* Assigned Agents */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-hive-muted mb-2">
              割り当て済み ({assignedAgents.length})
            </h4>
            <div className="space-y-2">
              {assignedAgents.map(agent => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between p-2 bg-hive-bg rounded"
                >
                  <div className="flex items-center gap-2">
                    <span>🤖</span>
                    <span className="text-sm text-white">{agent.name}</span>
                  </div>
                  <button
                    onClick={() => unassignAgentFromNode(selectedNode.id, agent.id)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    解除
                  </button>
                </div>
              ))}
              {assignedAgents.length === 0 && (
                <p className="text-xs text-hive-muted">割り当てなし</p>
              )}
            </div>
          </div>

          {/* Available Agents */}
          <div>
            <h4 className="text-sm font-medium text-hive-muted mb-2">
              利用可能 ({unassignedAgents.length})
            </h4>
            <div className="space-y-2">
              {unassignedAgents.map(agent => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between p-2 bg-hive-bg rounded hover:bg-hive-accent/10"
                >
                  <div className="flex items-center gap-2">
                    <span>🤖</span>
                    <span className="text-sm text-white">{agent.name}</span>
                  </div>
                  <button
                    onClick={() => assignAgentToNode(selectedNode.id, agent.id)}
                    className="text-xs text-hive-accent hover:text-hive-accent/80"
                  >
                    割り当て
                  </button>
                </div>
              ))}
              {unassignedAgents.length === 0 && (
                <p className="text-xs text-hive-muted">すべて割り当て済み</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Node Modal */}
      <AddNodeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddNode}
        availableNodes={orgNodes}
      />

      {/* Results Review Panel */}
      {showReviewPanel && reviewNodeId && (() => {
        const orchState = orchestrationStates.get(reviewNodeId);
        if (!orchState) return null;
        return (
          <ResultsReviewPanel
            state={orchState}
            onApprove={() => {
              approveOrchestration(reviewNodeId);
              setShowReviewPanel(false);
            }}
            onReject={(feedback) => {
              rejectOrchestration(reviewNodeId, feedback);
              setShowReviewPanel(false);
            }}
            onClose={() => setShowReviewPanel(false)}
          />
        );
      })()}
    </div>
  );
};
