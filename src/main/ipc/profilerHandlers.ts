// Profiler IPC Handlers
import { ipcMain } from 'electron';
import { getProfilerService } from '../services/ProfilerService';
import type { ProfilerFilter } from '../../shared/types/profiler';

export function registerProfilerHandlers(): void {
  const profiler = getProfilerService();

  ipcMain.handle('profiler:getSummary', (_event, filter?: ProfilerFilter) => {
    return profiler.getSummary(filter);
  });

  ipcMain.handle('profiler:getExecutions', (_event, filter?: ProfilerFilter) => {
    return profiler.getExecutions(filter);
  });

  ipcMain.handle('profiler:getTaskStats', (_event, filter?: ProfilerFilter) => {
    return profiler.getTaskStats(filter);
  });

  ipcMain.handle('profiler:getSessionStats', () => {
    return profiler.getSessionStats();
  });

  ipcMain.handle('profiler:getTimeline', (_event, filter?: ProfilerFilter) => {
    return profiler.getTimeline(filter);
  });
}
