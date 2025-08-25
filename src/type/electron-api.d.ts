declare global {
  interface Window {
    electronAPI?: {
      selectDirectory: () => Promise<string | null>;
      selectFolder: () => Promise<string | null>;
      selectFile: () => Promise<string | null>;
      saveFile: (data: {
        data: ArrayBuffer;
        fileName: string;
        filePath: string;
      }) => Promise<void>;
      handleFileDrop: (filePaths: string[]) => Promise<string[]>;
      executeBatchScript: (
        config: any,
      ) => Promise<{
        success: boolean;
        message: string;
        output?: string;
        error?: string;
      }>;
      testBatchScript: (
        config: any,
      ) => Promise<{
        success: boolean;
        message: string;
        output?: string;
        error?: string;
      }>;
      getSystemInfo: () => Promise<any>;
      onBatchProgress: (
        callback: (data: { type: "output" | "error"; message: string }) => void,
      ) => void;
      isElectron?: boolean;
    };
  }
}

export {};
