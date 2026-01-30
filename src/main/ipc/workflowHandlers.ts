import { ipcMain, dialog } from 'electron';
import { promises as fs } from 'fs';
import { getWorkflowEngine } from '../services/WorkflowEngine';
import { WorkflowRepository } from '../services/db/WorkflowRepository';
import { WorkflowTemplateRepository } from '../services/db/WorkflowTemplateRepository';
import { getDatabase } from '../services/db/Database';
import { WorkflowValidator } from '../services/WorkflowValidator';
import { IPC_CHANNELS } from './channels';
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
      // Detect advanced features
      const advancedFeatures: string[] = [];
      workflow.nodes.forEach(node => {
        if (node.type === 'loop' && !advancedFeatures.includes('loop')) {
          advancedFeatures.push('loop');
        }
        if (node.type === 'subworkflow' && !advancedFeatures.includes('subworkflow')) {
          advancedFeatures.push('subworkflow');
        }
        if (node.type === 'conditional' && node.data.conditionGroup?.groups) {
          if (!advancedFeatures.includes('expert-condition')) {
            advancedFeatures.push('expert-condition');
          }
        }
      });

      // Determine complexity
      let complexity: 'simple' | 'medium' | 'complex' = 'simple';
      if (workflow.nodes.length > 20 || advancedFeatures.length > 2) {
        complexity = 'complex';
      } else if (workflow.nodes.length > 10 || advancedFeatures.length > 0) {
        complexity = 'medium';
      }

      const exportData = {
        formatVersion: '2.0',
        exportedAt: new Date().toISOString(),
        name: workflow.name,
        description: workflow.description,
        nodes: workflow.nodes,
        edges: workflow.edges,
        autoCreateTask: workflow.autoCreateTask,
        nodeCount: workflow.nodes.length,
        edgeCount: workflow.edges.length,
        usesAdvancedFeatures: advancedFeatures.length > 0 ? advancedFeatures : undefined,
        complexity,
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

      let importData;
      try {
        importData = JSON.parse(fileContent);
      } catch (error) {
        return {
          success: false,
          errors: ['Invalid JSON file'],
        };
      }

      // Validate imported data
      const validator = new WorkflowValidator();
      const validationResult = validator.validate(importData);

      if (!validationResult.valid) {
        return {
          success: false,
          errors: validationResult.errors,
          warnings: validationResult.warnings,
          validationReport: {
            nodeCount: validationResult.nodeCount,
            edgeCount: validationResult.edgeCount,
            hasAdvancedFeatures: validationResult.hasAdvancedFeatures,
            advancedFeatures: validationResult.advancedFeatures,
            compatibility: validationResult.compatibility,
          },
        };
      }

      // Migrate old format if needed
      const migratedData = validator.migrateFormat(importData);

      // Create new workflow from imported data
      const newWorkflow = await workflowRepository.create({
        sessionId,
        name: migratedData.name || 'Imported Workflow',
        description: migratedData.description,
        nodes: migratedData.nodes || [],
        edges: migratedData.edges || [],
        autoCreateTask: migratedData.autoCreateTask || false,
      });

      return {
        success: true,
        workflow: newWorkflow,
        warnings: validationResult.warnings.length > 0 ? validationResult.warnings : undefined,
        validationReport: {
          nodeCount: validationResult.nodeCount,
          edgeCount: validationResult.edgeCount,
          hasAdvancedFeatures: validationResult.hasAdvancedFeatures,
          advancedFeatures: validationResult.advancedFeatures,
          compatibility: validationResult.compatibility,
        },
      };
    }

    return { success: false, canceled: true };
  });

  // Workflow Template handlers
  ipcMain.handle(IPC_CHANNELS.WORKFLOW_TEMPLATE_GET_ALL, () => {
    const templateRepo = getTemplateRepository();
    return templateRepo.findAll();
  });

  ipcMain.handle(IPC_CHANNELS.WORKFLOW_TEMPLATE_GET, (_event, id: number) => {
    const templateRepo = getTemplateRepository();
    return templateRepo.findById(id);
  });

  ipcMain.handle(IPC_CHANNELS.WORKFLOW_TEMPLATE_GET_BY_CATEGORY, (_event, category: string) => {
    const templateRepo = getTemplateRepository();
    return templateRepo.findByCategory(category);
  });

  ipcMain.handle(IPC_CHANNELS.WORKFLOW_TEMPLATE_CREATE, (_event, input: TemplateCreateInput) => {
    const templateRepo = getTemplateRepository();
    return templateRepo.create(input);
  });

  ipcMain.handle(IPC_CHANNELS.WORKFLOW_TEMPLATE_UPDATE, (_event, id: number, input: TemplateUpdateInput) => {
    const templateRepo = getTemplateRepository();
    return templateRepo.update(id, input);
  });

  ipcMain.handle(IPC_CHANNELS.WORKFLOW_TEMPLATE_DELETE, (_event, id: number) => {
    const templateRepo = getTemplateRepository();
    templateRepo.delete(id);
  });

  ipcMain.handle(IPC_CHANNELS.WORKFLOW_TEMPLATE_APPLY, (_event, templateId: number, sessionId: number) => {
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

  // Export workflow as template (saves directly to template repository)
  ipcMain.handle('workflow:exportAsTemplate', async (_event, workflowId: number, templateData: { category?: 'automation' | 'notification' | 'data-processing' | 'custom'; thumbnail?: string }) => {
    const workflow = workflowEngine.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const templateRepo = getTemplateRepository();

    const templateInput: TemplateCreateInput = {
      name: workflow.name,
      description: workflow.description || '',
      category: templateData.category || 'custom',
      nodes: workflow.nodes,
      edges: workflow.edges,
      thumbnail: templateData.thumbnail,
    };

    const newTemplate = templateRepo.create(templateInput);
    return { success: true, template: newTemplate };
  });
}

// Export workflow engine for initialization in main
export { workflowEngine };
