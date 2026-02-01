export {};

// ElectronAPI type is defined in preload.ts and re-exported here
// The actual interface with proper types is in the preload file's ElectronAPI export

declare global {
  interface Window {
    electronAPI: import('../main/preload').ElectronAPI;
  }
}
