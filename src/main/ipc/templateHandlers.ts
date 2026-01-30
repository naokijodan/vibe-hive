import { ipcMain } from 'electron';
import { TemplateRepository } from '../services/db/TemplateRepository';
import { IPC_CHANNELS } from './channels';
import type {
  TaskTemplateCreateInput,
  TaskTemplateUpdateInput,
} from '../../shared/types/taskTemplate';

const templateRepository = new TemplateRepository();

export function registerTemplateHandlers(): void {
  // Create template
  ipcMain.handle(IPC_CHANNELS.TEMPLATE_CREATE, (_event, input: TaskTemplateCreateInput) => {
    return templateRepository.create(input);
  });

  // Get template by ID
  ipcMain.handle(IPC_CHANNELS.TEMPLATE_GET, (_event, id: string) => {
    return templateRepository.getById(id);
  });

  // Get all templates
  ipcMain.handle(IPC_CHANNELS.TEMPLATE_GET_ALL, () => {
    return templateRepository.getAll();
  });

  // Get templates by category
  ipcMain.handle(IPC_CHANNELS.TEMPLATE_GET_BY_CATEGORY, (_event, category: string) => {
    return templateRepository.getByCategory(category);
  });

  // Get popular templates
  ipcMain.handle(IPC_CHANNELS.TEMPLATE_GET_POPULAR, (_event, limit?: number) => {
    return templateRepository.getPopular(limit);
  });

  // Update template
  ipcMain.handle(IPC_CHANNELS.TEMPLATE_UPDATE, (_event, id: string, updates: TaskTemplateUpdateInput) => {
    return templateRepository.update(id, updates);
  });

  // Increment usage count
  ipcMain.handle(IPC_CHANNELS.TEMPLATE_INCREMENT_USAGE, (_event, id: string) => {
    templateRepository.incrementUsageCount(id);
  });

  // Delete template
  ipcMain.handle(IPC_CHANNELS.TEMPLATE_DELETE, (_event, id: string) => {
    templateRepository.delete(id);
  });

  // Search templates
  ipcMain.handle(IPC_CHANNELS.TEMPLATE_SEARCH, (_event, query: string) => {
    return templateRepository.search(query);
  });
}
