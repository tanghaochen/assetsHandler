interface VersionInfo {
  update: boolean;
  version: string;
  newVersion?: string;
}

interface ErrorType {
  message: string;
  error: Error;
}

// Expose limited ipcRenderer API from preload
declare global {
  interface Window {
    ipcRenderer: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      send: (channel: string, ...args: any[]) => void;
      on: (channel: string, listener: (...args: any[]) => void) => void;
      off: (channel: string, listener: (...args: any[]) => void) => void;
    };
  }
}
