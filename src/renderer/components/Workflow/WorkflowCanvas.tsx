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
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TaskNode, TriggerNode, ConditionalNode, NotificationNode, MergeNode, DelayNode, LoopNode, SubworkflowNode, AgentNode } from './nodes';
import { NodePalette } from './NodePalette';
import { NodeSettingsPanel } from './settings/NodeSettingsPanel';
import { WorkflowSettingsModal } from './WorkflowSettingsModal';
import { ImportValidationDialog } from './ImportValidationDialog';
import { ExportTemplateDialog } from './ExportTemplateDialog';
import { useWorkflowStore } from '../../stores/workflowStore';
import { ipcBridge } from '../../bridge/ipcBridge';
import { useToast } from '../../hooks/useToast';
import type { NodeType, WorkflowNodeData, WorkflowImportResult } from '../../../shared/types/workflow';

const nodeTypes: NodeTypes = {
  task: TaskNode,
  trigger: TriggerNode,
  conditional: ConditionalNode,
  notification: NotificationNode,
  merge: MergeNode,
  delay: DelayNode,
  loop: LoopNode,
  subworkflow: SubworkflowNode,
  agent: AgentNode,
};

interface WorkflowCanvasProps {
  showNodePalette?: boolean;
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({ showNodePalette = false }) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<Node<WorkflowNodeData> | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importResult, setImportResult] = useState<WorkflowImportResult | null>(null);
  const [showExportTemplateDialog, setShowExportTemplateDialog] = useState(false);
  const toast = useToast();

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
      const loadingToast = toast.loading('Saving workflow...');
      try {
        await saveCurrentWorkflow();
        toast.dismiss(loadingToast);
        toast.success('Workflow saved successfully!');
      } catch (error) {
        toast.dismiss(loadingToast);
        toast.error('Failed to save workflow');
        console.error('Save error:', error);
      }
    } else {
      toast.warning('No workflow selected');
    }
  };

  const handleExecute = async () => {
    if (!currentWorkflow) {
      toast.warning('No workflow selected');
      return;
    }

    if (isExecuting) {
      toast.warning('Workflow is already executing');
      return;
    }

    const loadingToast = toast.loading('Executing workflow...');
    try {
      const result = await executeWorkflow(currentWorkflow.id);
      toast.dismiss(loadingToast);

      if (result) {
        if (result.status === 'success') {
          toast.success('Workflow executed successfully!');
        } else {
          toast.error(`Workflow execution failed: ${result.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Failed to execute workflow');
      console.error('Execution error:', error);
    }
  };

  const handleExport = async () => {
    if (!currentWorkflow) {
      toast.warning('No workflow selected');
      return;
    }

    try {
      const result = await ipcBridge.workflow.export(currentWorkflow.id);
      if (result.success && result.filePath) {
        toast.success(`Workflow exported to: ${result.filePath}`);
      } else if (result.canceled) {
        // User cancelled the dialog, do nothing
      } else {
        toast.error('Failed to export workflow');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleImport = async () => {
    if (!currentWorkflow) {
      toast.warning('No workflow selected. Please select or create a workflow first.');
      return;
    }

    const loadingToast = toast.loading('Importing workflow...');
    try {
      const sessionId = currentWorkflow.sessionId;
      const result = await ipcBridge.workflow.import(sessionId);
      toast.dismiss(loadingToast);

      if (result.canceled) {
        // User cancelled the dialog, do nothing
        return;
      }

      // Show ImportValidationDialog with result
      setImportResult(result);
      setShowImportDialog(true);
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Import error:', error);
      toast.error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleImportConfirm = () => {
    setShowImportDialog(false);
    if (importResult?.success && importResult.workflow) {
      toast.success(`Workflow "${importResult.workflow.name}" imported successfully!`);
      // Reload workflows
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const handleExportTemplate = () => {
    if (!currentWorkflow) {
      toast.warning('No workflow selected');
      return;
    }
    setShowExportTemplateDialog(true);
  };

  const handleExportTemplateSuccess = () => {
    toast.success('Workflow saved as template successfully!');
  };

  const captureScreenshot = async (): Promise<string | null> => {
    if (!reactFlowWrapper.current) {
      console.error('React Flow wrapper not found');
      return null;
    }

    try {
      // Dynamic import to avoid SSR issues
      const { toPng } = await import('html-to-image');

      // Find the React Flow viewport element
      const viewportElement = reactFlowWrapper.current.querySelector('.react-flow__viewport');
      if (!viewportElement) {
        console.error('React Flow viewport not found');
        return null;
      }

      // Capture the viewport as PNG
      const dataUrl = await toPng(viewportElement as HTMLElement, {
        cacheBust: true,
        pixelRatio: 2, // Higher quality
        backgroundColor: '#111827', // gray-900
      });

      // Resize to max width 400px
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }

          const maxWidth = 400;
          const ratio = Math.min(maxWidth / img.width, 1);
          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(null);
        img.src = dataUrl;
      });
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      return null;
    }
  };

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node<WorkflowNodeData>) => {
      setSelectedNode(node);
    },
    []
  );

  // Show empty state if no workflow selected
  if (!currentWorkflow) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-gray-500">
        <div className="text-center">
          <svg className="w-24 h-24 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-lg font-medium mb-2">No Workflow Selected</p>
          <p className="text-sm">Select a workflow from the list or create a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-900">
      {showNodePalette && <NodePalette onAddNode={handleAddNode} />}

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
          onNodeClick={handleNodeClick}
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
                case 'notification':
                  return '#8b5cf6';
                case 'merge':
                  return '#06b6d4';
                case 'delay':
                  return '#6b7280';
                case 'loop':
                  return '#f97316';
                case 'subworkflow':
                  return '#6366f1';
                case 'agent':
                  return '#ec4899';
                default:
                  return '#6b7280';
              }
            }}
          />

          <Panel position="top-right" className="flex gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="
                px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg
                font-medium shadow-lg transition-colors
              "
              title="Workflow settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              onClick={handleExport}
              className="
                px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg
                font-medium shadow-lg transition-colors
              "
              title="Export workflow to JSON"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            <button
              onClick={handleImport}
              className="
                px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg
                font-medium shadow-lg transition-colors
              "
              title="Import workflow from JSON"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </button>
            <button
              onClick={handleExportTemplate}
              className="
                px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg
                font-medium shadow-lg transition-colors
              "
              title="Save as template"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
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
          </Panel>

          <Panel position="top-left">
            <div className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
              <div className="text-xs text-gray-400 uppercase">Workflow</div>
              <div className="text-sm font-medium text-white">{currentWorkflow.name}</div>
              {currentWorkflow.description && (
                <div className="text-xs text-gray-500 mt-1">{currentWorkflow.description}</div>
              )}
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {selectedNode && (
        <NodeSettingsPanel
          selectedNode={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      )}

      {showSettings && (
        <WorkflowSettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          workflow={currentWorkflow}
        />
      )}

      <ImportValidationDialog
        isOpen={showImportDialog}
        result={importResult}
        onClose={() => setShowImportDialog(false)}
        onConfirm={handleImportConfirm}
      />

      <ExportTemplateDialog
        isOpen={showExportTemplateDialog}
        workflowId={currentWorkflow?.id || null}
        workflowName={currentWorkflow?.name || ''}
        onClose={() => setShowExportTemplateDialog(false)}
        onSuccess={handleExportTemplateSuccess}
        onCaptureScreenshot={captureScreenshot}
      />
    </div>
  );
};
