import { ipcMain } from 'electron';
import { TemplateRepository } from '../services/db/TemplateRepository';
import type {
  TaskTemplateCreateInput,
  TaskTemplateUpdateInput,
} from '../../shared/types/taskTemplate';

const templateRepository = new TemplateRepository();

export function registerTemplateHandlers(): void {
  // Create template
  ipcMain.handle('template:create', (_event, input: TaskTemplateCreateInput) => {
    return templateRepository.create(input);
  });

  // Get template by ID
  ipcMain.handle('template:get', (_event, id: string) => {
    return templateRepository.getById(id);
  });

  // Get all templates
  ipcMain.handle('template:getAll', () => {
    return templateRepository.getAll();
  });

  // Get templates by category
  ipcMain.handle('template:getByCategory', (_event, category: string) => {
    return templateRepository.getByCategory(category);
  });

  // Get popular templates
  ipcMain.handle('template:getPopular', (_event, limit?: number) => {
    return templateRepository.getPopular(limit);
  });

  // Update template
  ipcMain.handle('template:update', (_event, id: string, updates: TaskTemplateUpdateInput) => {
    return templateRepository.update(id, updates);
  });

  // Increment usage count
  ipcMain.handle('template:incrementUsage', (_event, id: string) => {
    templateRepository.incrementUsageCount(id);
  });

  // Delete template
  ipcMain.handle('template:delete', (_event, id: string) => {
    templateRepository.delete(id);
  });

  // Search templates
  ipcMain.handle('template:search', (_event, query: string) => {
    return templateRepository.search(query);
  });
}
