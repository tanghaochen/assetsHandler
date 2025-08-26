declare module "./batch-processor.js" {
  export interface BatchProcessorConfig {
    password?: string;
    suffix?: string;
    copyFilePath?: string;
    copyFileEnabled?: boolean;
    deleteOriginal?: boolean;
    extractNested?: boolean;
    inputPath: string;
    outputPath?: string;
  }

  export interface BatchLogMessage {
    type: "output" | "error";
    message: string;
  }

  export default class BatchProcessor {
    constructor(config: BatchProcessorConfig);
    setLogCallback(cb: (data: BatchLogMessage) => void): void;
    process(): Promise<{ success: boolean; message: string }>;
    check7z(): Promise<boolean>;
    findZipFiles(directory: string): Promise<string[]>;
  }
}

declare module "electron/main/batch-processor.js" {
  export * from "./batch-processor.js";
  export { default } from "./batch-processor.js";
}
