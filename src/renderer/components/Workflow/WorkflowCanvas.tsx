import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  NodeTypes,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TaskNode, TriggerNode, ConditionalNode } from './nodes';
import { NodePalette } from './NodePalette';
import { useWorkflowStore } from '../../stores/workflowStore';
import type { NodeType, WorkflowNodeData } from '../../../shared/types/workflow';

const nodeTypes: NodeTypes = {
  task: TaskNode,
  trigger: TriggerNode,
  conditional: ConditionalNode,
};

export const WorkflowCanvas: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  const {
    currentWorkflow,
    nodes: storeNodes,
    edges: storeEdges,
    setNodes: setStoreNodes,
    setEdges: setStoreEdges,
    addNode: addStoreNode,
    saveCurrentWorkflow,
    executeWorkflow,
    isExecuting,
  } = useWorkflowStore();

  const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges);

  // Sync with store
  useEffect(() => {
    setNodes(storeNodes);
  }, [storeNodes, setNodes]);

  useEffect(() => {
    setEdges(storeEdges);
  }, [storeEdges, setEdges]);

  // Update store when local state changes
  useEffect(() => {
    setStoreNodes(nodes);
  }, [nodes]);

  useEffect(() => {
    setStoreEdges(edges);
  }, [edges]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow') as NodeType;
      if (!type || !reactFlowInstance) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: {
          label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
          config: {},
        } as WorkflowNodeData,
      };

      addStoreNode(newNode);
    },
    [reactFlowInstance, addStoreNode]
  );

  const handleAddNode = (type: NodeType) => {
    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
        config: {},
      } as WorkflowNodeData,
    };

    addStoreNode(newNode);
  };

  const handleSave = async () => {
    if (currentWorkflow) {
      await saveCurrentWorkflow();
      alert('Workflow saved!');
    } else {
      alert('No workflow selected');
    }
  };

  const handleExecute = async () => {
    if (!currentWorkflow) {
      alert('No workflow selected');
      return;
    }

    if (isExecuting) {
      alert('Workflow is already executing');
      return;
    }

    const result = await executeWorkflow(currentWorkflow.id);
    if (result) {
      if (result.status === 'success') {
        alert('Workflow executed successfully!');
      } else {
        alert(`Workflow execution failed: ${result.error}`);
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-900">
      <NodePalette onAddNode={handleAddNode} />

      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gray-900"
        >
          <Background color="#374151" gap={16} />
          <Controls className="bg-gray-800 border border-gray-700" />
          <MiniMap
            className="bg-gray-800 border border-gray-700"
            nodeColor={(node) => {
              switch (node.type) {
                case 'trigger':
                  return '#10b981';
                case 'task':
                  return '#8b5cf6';
                case 'conditional':
                  return '#f59e0b';
                default:
                  return '#6b7280';
              }
            }}
          />

          <Panel position="top-right" className="flex gap-2">
            {currentWorkflow && (
              <>
                <button
                  onClick={handleSave}
                  className="
                    px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                    font-medium shadow-lg transition-colors
                  "
                >
                  Save
                </button>
                <button
                  onClick={handleExecute}
                  disabled={isExecuting}
                  className={`
                    px-4 py-2 rounded-lg font-medium shadow-lg transition-colors
                    ${
                      isExecuting
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }
                  `}
                >
                  {isExecuting ? 'Executing...' : 'Execute'}
                </button>
              </>
            )}
            {!currentWorkflow && (
              <div className="px-4 py-2 bg-gray-700 text-gray-400 rounded-lg">
                No workflow selected
              </div>
            )}
          </Panel>

          <Panel position="top-left">
            {currentWorkflow && (
              <div className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
                <div className="text-xs text-gray-400 uppercase">Workflow</div>
                <div className="text-sm font-medium text-white">{currentWorkflow.name}</div>
                {currentWorkflow.description && (
                  <div className="text-xs text-gray-500 mt-1">{currentWorkflow.description}</div>
                )}
              </div>
            )}
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
};
