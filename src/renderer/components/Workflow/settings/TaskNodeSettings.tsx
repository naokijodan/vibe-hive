import React, { useEffect } from 'react';
import { useTaskStore } from '../../../stores/taskStore';
import type { WorkflowNodeData } from '../../../../shared/types/workflow';

interface TaskNodeSettingsProps {
  data: WorkflowNodeData;
  onChange: (data: Partial<WorkflowNodeData>) => void;
}

export const TaskNodeSettings: React.FC<TaskNodeSettingsProps> = ({ data, onChange }) => {
  const { tasks, loadTasks } = useTaskStore();

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleTaskChange = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    onChange({
      taskId: parseInt(taskId, 10),
      label: task ? task.title : data.label,
    });
  };

  const handleCommandChange = (command: string) => {
    onChange({
      config: {
        ...data.config,
        command,
      },
    });
  };

  const handleWorkingDirChange = (workingDirectory: string) => {
    onChange({
      config: {
        ...data.config,
        workingDirectory,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Select Task
        </label>
        <select
          value={data.taskId?.toString() || ''}
          onChange={(e) => handleTaskChange(e.target.value)}
          className="
            w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
            text-white focus:outline-none focus:ring-2 focus:ring-blue-500
          "
        >
          <option value="">-- Select a task --</option>
          {tasks.map(task => (
            <option key={task.id} value={task.id}>
              {task.title} ({task.status})
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          {tasks.length} task{tasks.length !== 1 ? 's' : ''} available
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Command (Optional)
        </label>
        <input
          type="text"
          value={data.config?.command || ''}
          onChange={(e) => handleCommandChange(e.target.value)}
          placeholder="echo 'Hello World'"
          className="
            w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
            text-white placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-blue-500
          "
        />
        <p className="text-xs text-gray-500 mt-1">
          Override task command
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Working Directory (Optional)
        </label>
        <input
          type="text"
          value={data.config?.workingDirectory || ''}
          onChange={(e) => handleWorkingDirChange(e.target.value)}
          placeholder="/path/to/directory"
          className="
            w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
            text-white placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-blue-500
          "
        />
        <p className="text-xs text-gray-500 mt-1">
          Override working directory
        </p>
      </div>
    </div>
  );
};
