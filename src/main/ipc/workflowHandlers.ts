import { ipcMain, dialog } from 'electron';
import { promises as fs } from 'fs';
import { getWorkflowEngine } from '../services/WorkflowEngine';
import { WorkflowRepository } from '../services/db/WorkflowRepository';
import { WorkflowTemplateRepository } from '../services/db/WorkflowTemplateRepository';
import { getDatabase } from '../services/db/Database';
import type {
  CreateWorkflowParams,
  UpdateWorkflowParams,
  ExecuteWorkflowParams,
  Workflow,
} from '../../shared/types/workflow';
import type {
  TemplateCreateInput,
  TemplateUpdateInput,
} from '../../shared/types/template';

const workflowEngine = getWorkflowEngine();
const workflowRepository = new WorkflowRepository();

function getTemplateRepository(): WorkflowTemplateRepository {
  return new WorkflowTemplateRepository(getDatabase());
}

export function registerWorkflowHandlers(): void {
  // Create workflow
  ipcMain.handle('workflow:create', (_event, params: CreateWorkflowParams) => {
    return workflowRepository.create(params);
  });

  // Update workflow
  ipcMain.handle('workflow:update', (_event, params: UpdateWorkflowParams) => {
    return workflowRepository.update(params);
  });

  // Delete workflow
  ipcMain.handle('workflow:delete', (_event, id: number) => {
    workflowRepository.delete(id);
  });

  // Get workflow by ID
  ipcMain.handle('workflow:getById', (_event, id: number) => {
    return workflowEngine.getWorkflow(id);
  });

  // Get all workflows
  ipcMain.handle('workflow:getAll', () => {
    return workflowEngine.getAllWorkflows();
  });

  // Get workflows by session
  ipcMain.handle('workflow:getBySession', (_event, sessionId: number) => {
    return workflowEngine.getWorkflowsBySession(sessionId);
  });

  // Execute workflow
  ipcMain.handle('workflow:execute', async (_event, params: ExecuteWorkflowParams) => {
    return await workflowEngine.execute(params);
  });

  // Cancel workflow execution
  ipcMain.handle('workflow:cancel', (_event, executionId: number) => {
    workflowEngine.cancel(executionId);
  });

  // Get execution by ID
  ipcMain.handle('workflow:getExecution', (_event, executionId: number) => {
    return workflowEngine.getExecution(executionId);
  });

  // Get executions by workflow ID
  ipcMain.handle('workflow:getExecutions', (_event, workflowId: number) => {
    return workflowEngine.getExecutionsByWorkflow(workflowId);
  });

  // Export workflow to JSON file
  ipcMain.handle('workflow:export', async (_event, workflowId: number) => {
    const workflow = workflowEngine.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const result = await dialog.showSaveDialog({
      title: 'Export Workflow',
      defaultPath: `${workflow.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`,
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (!result.canceled && result.filePath) {
      const exportData = {
        name: workflow.name,
        description: workflow.description,
        nodes: workflow.nodes,
        edges: workflow.edges,
        autoCreateTask: workflow.autoCreateTask,
        exportedAt: new Date().toISOString(),
        version: '1.0',
      };

      await fs.writeFile(result.filePath, JSON.stringify(exportData, null, 2), 'utf-8');
      return { success: true, filePath: result.filePath };
    }

    return { success: false, canceled: true };
  });

  // Import workflow from JSON file
  ipcMain.handle('workflow:import', async (_event, sessionId: number) => {
    const result = await dialog.showOpenDialog({
      title: 'Import Workflow',
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      properties: ['openFile'],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const importData = JSON.parse(fileContent);

      // Create new workflow from imported data
      const newWorkflow = await workflowRepository.create({
        sessionId,
        name: importData.name || 'Imported Workflow',
        description: importData.description,
        nodes: importData.nodes || [],
        edges: importData.edges || [],
        autoCreateTask: importData.autoCreateTask || false,
      });

      return { success: true, workflow: newWorkflow };
    }

    return { success: false, canceled: true };
  });

  // Workflow Template handlers
  ipcMain.handle('template:getAll', () => {
    const templateRepo = getTemplateRepository();
    return templateRepo.findAll();
  });

  ipcMain.handle('template:get', (_event, id: number) => {
    const templateRepo = getTemplateRepository();
    return templateRepo.findById(id);
  });

  ipcMain.handle('template:getByCategory', (_event, category: string) => {
    const templateRepo = getTemplateRepository();
    return templateRepo.findByCategory(category);
  });

  ipcMain.handle('template:create', (_event, input: TemplateCreateInput) => {
    const templateRepo = getTemplateRepository();
    return templateRepo.create(input);
  });

  ipcMain.handle('template:update', (_event, id: number, input: TemplateUpdateInput) => {
    const templateRepo = getTemplateRepository();
    return templateRepo.update(id, input);
  });

  ipcMain.handle('template:delete', (_event, id: number) => {
    const templateRepo = getTemplateRepository();
    templateRepo.delete(id);
  });

  ipcMain.handle('template:apply', (_event, templateId: number, sessionId: number) => {
    const templateRepo = getTemplateRepository();
    const template = templateRepo.findById(templateId);

    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const workflowParams: CreateWorkflowParams = {
      sessionId,
      name: `${template.name} (from template)`,
      description: template.description,
      nodes: template.nodes,
      edges: template.edges,
    };

    return workflowRepository.create(workflowParams);
  });
}

// Export workflow engine for initialization in main
export { workflowEngine };
