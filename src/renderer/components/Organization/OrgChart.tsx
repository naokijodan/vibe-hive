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
import { useOrganizationStore } from '../../stores/organizationStore';
import { useAgentStore } from '../../stores/agentStore';
import { OrgNodeCard } from './OrgNodeCard';
import { AddNodeModal } from './AddNodeModal';
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
    loadOrganization,
    addNode,
    updateNode,
    deleteNode,
    setSelectedNode,
    assignAgentToNode,
    unassignAgentFromNode,
  } = useOrganizationStore();

  const { agents } = useAgentStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showAgentPanel, setShowAgentPanel] = useState(false);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Load organization on mount
  useEffect(() => {
    loadOrganization();
  }, [loadOrganization]);

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

          <div className="mb-4 p-3 bg-hive-bg rounded">
            <div className="text-sm font-medium text-white mb-1">{selectedNode.name}</div>
            <div className="text-xs text-hive-muted">
              {selectedNode.type === 'team' ? '👥 チーム' : '🎭 役割'}
            </div>
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
    </div>
  );
};
