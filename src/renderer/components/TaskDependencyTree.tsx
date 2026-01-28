import React, { useState, useEffect } from 'react';
import ipcBridge from '../bridge/ipcBridge';
import type { Task } from '../../shared/types/task';

interface DependencyTreeNode {
  task: Task;
  dependencies: DependencyTreeNode[];
}

interface TaskDependencyTreeProps {
  taskId: string;
}

export const TaskDependencyTree: React.FC<TaskDependencyTreeProps> = ({ taskId }) => {
  const [task, setTask] = useState<Task | null>(null);
  const [dependencyTree, setDependencyTree] = useState<DependencyTreeNode | null>(null);
  const [dependentTasks, setDependentTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [selectedDependency, setSelectedDependency] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTaskData();
  }, [taskId]);

  const loadTaskData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [taskData, treeData, dependents, tasks] = await Promise.all([
        ipcBridge.task.get(taskId),
        ipcBridge.task.getDependencyTree(taskId),
        ipcBridge.task.getDependentTasks(taskId),
        ipcBridge.task.getAll(),
      ]);

      setTask(taskData);
      setDependencyTree(treeData as DependencyTreeNode);
      setDependentTasks(dependents);
      setAllTasks(tasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load task data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDependency = async () => {
    if (!selectedDependency || !task) return;

    setIsLoading(true);
    setError(null);
    try {
      // Check for circular dependency
      const wouldCreateCycle = await ipcBridge.task.wouldCreateCircularDependency(
        taskId,
        selectedDependency
      );

      if (wouldCreateCycle) {
        setError('Cannot add dependency: this would create a circular dependency');
        setIsLoading(false);
        return;
      }

      // Add dependency
      const currentDeps = task.dependsOn || [];
      if (currentDeps.includes(selectedDependency)) {
        setError('This dependency already exists');
        setIsLoading(false);
        return;
      }

      await ipcBridge.task.update(taskId, {
        dependsOn: [...currentDeps, selectedDependency],
      });

      setSelectedDependency('');
      await loadTaskData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add dependency');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveDependency = async (depId: string) => {
    if (!task) return;

    setIsLoading(true);
    setError(null);
    try {
      const currentDeps = task.dependsOn || [];
      await ipcBridge.task.update(taskId, {
        dependsOn: currentDeps.filter(id => id !== depId),
      });

      await loadTaskData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove dependency');
    } finally {
      setIsLoading(false);
    }
  };

  const renderDependencyTree = (node: DependencyTreeNode, depth = 0): React.ReactNode => {
    const indent = depth * 20;
    const statusColors: Record<string, string> = {
      backlog: 'text-gray-500',
      todo: 'text-blue-500',
      in_progress: 'text-yellow-500',
      review: 'text-purple-500',
      done: 'text-green-500',
    };

    return (
      <div key={node.task.id} style={{ marginLeft: `${indent}px` }} className="my-1">
        <div className="flex items-center gap-2">
          <span className={`font-mono text-sm ${statusColors[node.task.status]}`}>
            [{node.task.status}]
          </span>
          <span className="text-sm">{node.task.title}</span>
        </div>
        {node.dependencies.map(dep => renderDependencyTree(dep, depth + 1))}
      </div>
    );
  };

  const availableTasksForDependency = allTasks.filter(t => {
    if (t.id === taskId) return false; // Can't depend on itself
    if (task?.dependsOn?.includes(t.id)) return false; // Already a dependency
    return true;
  });

  if (isLoading && !task) {
    return <div className="p-4 text-gray-400">Loading task dependencies...</div>;
  }

  if (!task) {
    return <div className="p-4 text-red-400">Task not found</div>;
  }

  return (
    <div className="p-4 bg-gray-900 rounded-lg">
      <h2 className="text-xl font-bold mb-4 text-white">Task Dependencies</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-white">Current Task</h3>
        <div className="p-3 bg-gray-800 rounded">
          <div className="text-white font-medium">{task.title}</div>
          <div className="text-gray-400 text-sm">Status: {task.status}</div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-white">Dependencies (What this task depends on)</h3>
        {dependencyTree && dependencyTree.dependencies.length > 0 ? (
          <div className="p-3 bg-gray-800 rounded">
            {dependencyTree.dependencies.map(dep => renderDependencyTree(dep))}
          </div>
        ) : (
          <div className="p-3 bg-gray-800 rounded text-gray-500 text-sm">
            No dependencies
          </div>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-white">Add Dependency</h3>
        <div className="flex gap-2">
          <select
            value={selectedDependency}
            onChange={(e) => setSelectedDependency(e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
            disabled={isLoading}
          >
            <option value="">Select a task...</option>
            {availableTasksForDependency.map(t => (
              <option key={t.id} value={t.id}>
                [{t.status}] {t.title}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddDependency}
            disabled={!selectedDependency || isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 rounded text-white font-medium"
          >
            Add
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-white">Direct Dependencies</h3>
        <div className="space-y-2">
          {task.dependsOn && task.dependsOn.length > 0 ? (
            task.dependsOn.map(depId => {
              const depTask = allTasks.find(t => t.id === depId);
              if (!depTask) return null;
              return (
                <div key={depId} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                  <div>
                    <span className="text-white">{depTask.title}</span>
                    <span className="ml-2 text-gray-400 text-sm">[{depTask.status}]</span>
                  </div>
                  <button
                    onClick={() => handleRemoveDependency(depId)}
                    disabled={isLoading}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 rounded text-white text-sm"
                  >
                    Remove
                  </button>
                </div>
              );
            })
          ) : (
            <div className="p-3 bg-gray-800 rounded text-gray-500 text-sm">
              No direct dependencies
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2 text-white">Dependent Tasks (Tasks that depend on this)</h3>
        {dependentTasks.length > 0 ? (
          <div className="space-y-2">
            {dependentTasks.map(dep => (
              <div key={dep.id} className="p-2 bg-gray-800 rounded">
                <span className="text-white">{dep.title}</span>
                <span className="ml-2 text-gray-400 text-sm">[{dep.status}]</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 bg-gray-800 rounded text-gray-500 text-sm">
            No tasks depend on this task
          </div>
        )}
      </div>
    </div>
  );
};
