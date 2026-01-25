import React, { useMemo } from 'react';
import type { Agent, Organization } from '../../../shared/types';
import { AgentNode } from './AgentNode';

interface OrgChartProps {
  organization?: Organization;
  onAgentClick?: (agent: Agent) => void;
}

// Demo data: CEO → CTO → Engineers
const createDemoAgents = (): Agent[] => {
  const now = new Date();
  return [
    {
      id: 'ceo-1',
      name: 'CEO Agent',
      role: 'orchestrator',
      status: 'idle',
      childAgentIds: ['cto-1'],
      capabilities: ['planning', 'delegation'],
      createdAt: now,
    },
    {
      id: 'cto-1',
      name: 'CTO Agent',
      role: 'orchestrator',
      status: 'thinking',
      parentAgentId: 'ceo-1',
      childAgentIds: ['dev-1', 'dev-2', 'dev-3'],
      capabilities: ['architecture', 'review'],
      createdAt: now,
    },
    {
      id: 'dev-1',
      name: 'Frontend Dev',
      role: 'developer',
      status: 'executing',
      parentAgentId: 'cto-1',
      capabilities: ['react', 'typescript'],
      createdAt: now,
    },
    {
      id: 'dev-2',
      name: 'Backend Dev',
      role: 'developer',
      status: 'waiting_input',
      parentAgentId: 'cto-1',
      capabilities: ['node', 'database'],
      createdAt: now,
    },
    {
      id: 'dev-3',
      name: 'QA Engineer',
      role: 'tester',
      status: 'idle',
      parentAgentId: 'cto-1',
      capabilities: ['testing', 'automation'],
      createdAt: now,
    },
  ];
};

// Build tree structure from flat agent list
interface TreeNode {
  agent: Agent;
  children: TreeNode[];
}

const buildTree = (agents: Agent[]): TreeNode | null => {
  const agentMap = new Map<string, Agent>();
  agents.forEach((a) => agentMap.set(a.id, a));

  // Find root (no parent)
  const root = agents.find((a) => !a.parentAgentId);
  if (!root) return null;

  const buildNode = (agent: Agent): TreeNode => {
    const children = agents
      .filter((a) => a.parentAgentId === agent.id)
      .map((child) => buildNode(child));
    return { agent, children };
  };

  return buildNode(root);
};

// Recursive tree renderer
interface TreeLevelProps {
  node: TreeNode;
  onAgentClick?: (agent: Agent) => void;
}

const TreeLevel: React.FC<TreeLevelProps> = ({ node, onAgentClick }) => {
  const hasChildren = node.children.length > 0;

  return (
    <div className="flex flex-col items-center">
      {/* Current node */}
      <AgentNode agent={node.agent} onClick={onAgentClick} />

      {/* Connection line to children */}
      {hasChildren && (
        <div className="w-0.5 h-6 bg-hive-border" />
      )}

      {/* Children container */}
      {hasChildren && (
        <div className="relative">
          {/* Horizontal connector line */}
          {node.children.length > 1 && (
            <div
              className="absolute top-0 h-0.5 bg-hive-border"
              style={{
                left: '50%',
                transform: 'translateX(-50%)',
                width: `calc(100% - 80px)`,
              }}
            />
          )}

          {/* Children */}
          <div className="flex gap-4 pt-0">
            {node.children.map((child) => (
              <div key={child.agent.id} className="flex flex-col items-center">
                {/* Vertical line from horizontal connector */}
                <div className="w-0.5 h-6 bg-hive-border" />
                <TreeLevel node={child} onAgentClick={onAgentClick} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const OrgChart: React.FC<OrgChartProps> = ({
  organization,
  onAgentClick,
}) => {
  // Use demo data if no organization provided
  const agents = useMemo(() => {
    return organization?.agents?.length ? organization.agents : createDemoAgents();
  }, [organization]);

  const tree = useMemo(() => buildTree(agents), [agents]);

  if (!tree) {
    return (
      <div className="flex items-center justify-center h-full text-hive-muted">
        <div className="text-center">
          <p className="text-lg">No agents in organization</p>
          <p className="text-sm mt-1">Add agents to see the org chart</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white">
          {organization?.name || 'Organization Structure'}
        </h2>
        <p className="text-hive-muted text-sm mt-1">
          {agents.length} agents in hierarchy
        </p>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-8 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-gray-500" />
          <span className="text-hive-muted">Idle</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-hive-muted">Thinking</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
          <span className="text-hive-muted">Running</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-hive-muted">Executing</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-hive-muted">Waiting Input</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-hive-muted">Error</span>
        </div>
      </div>

      {/* Tree visualization */}
      <div className="flex justify-center">
        <TreeLevel node={tree} onAgentClick={onAgentClick} />
      </div>
    </div>
  );
};
