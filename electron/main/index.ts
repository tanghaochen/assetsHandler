import { app, BrowserWindow, shell, ipcMain, dialog } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import { spawn } from "node:child_process";
import { update } from "./update";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 确保 APP_ROOT 先被设置并提供后备路径
const defaultAppRoot = path.join(__dirname, "../..");
process.env.APP_ROOT = process.env.APP_ROOT || defaultAppRoot;

// 使用 CommonJS 方式引入，避免类型声明要求
const require = createRequire(import.meta.url);
const isDev = !!process.env.VITE_DEV_SERVER_URL;
const appRoot = process.env.APP_ROOT as string;
const batchProcessorPath = isDev
  ? path.join(appRoot, "electron/batch-processor.cjs")
  : path.join(__dirname, "batch-processor.cjs");
const BatchProcessor = require(batchProcessorPath);

// 批处理处理器已作为 TypeScript 模块引入，随主进程一起打包

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
// 此处 APP_ROOT 已在上方初始化

export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith("6.1")) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());

// 生产环境安全设置
if (!VITE_DEV_SERVER_URL) {
  // 禁用远程内容
  app.on("web-contents-created", (event, contents) => {
    contents.on("will-navigate", (event, navigationUrl) => {
      const parsedUrl = new URL(navigationUrl);
      if (parsedUrl.origin !== "file://") {
        event.preventDefault();
      }
    });
  });
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let win: BrowserWindow | null = null;
const preload = path.join(__dirname, "../preload/index.mjs");
const indexHtml = path.join(RENDERER_DIST, "index.html");

async function createWindow() {
  win = new BrowserWindow({
    title: "Main window",
    icon: path.join(process.env.VITE_PUBLIC, "favicon.ico"),
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload,
      // 启用文件拖拽支持
      webSecurity: false,
      allowRunningInsecureContent: true,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // nodeIntegration: true,

      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      // contextIsolation: false,
    },
  });

  // 窗口最大化（但不是全屏）
  win.maximize();

  // 隐藏菜单栏
  win.setMenu(null);

  // 禁用开发者工具（生产环境）
  if (!VITE_DEV_SERVER_URL) {
    win.webContents.on("devtools-opened", () => {
      win?.webContents.closeDevTools();
    });

    // 禁用右键菜单
    win.webContents.on("context-menu", (e) => {
      e.preventDefault();
    });

    // 禁用键盘快捷键
    win.webContents.on("before-input-event", (event, input) => {
      // 禁用 F12 键
      if (input.key === "F12") {
        event.preventDefault();
      }
      // 禁用 Ctrl+Shift+I
      if (input.control && input.shift && input.key === "I") {
        event.preventDefault();
      }
      // 禁用 Ctrl+Shift+C
      if (input.control && input.shift && input.key === "C") {
        event.preventDefault();
      }
    });
  }

  // 启用文件拖拽
  win.webContents.on("will-navigate", (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);

    // 如果是文件协议，阻止导航
    if (parsedUrl.protocol === "file:") {
      event.preventDefault();
    }
  });

  // 处理文件拖拽
  win.webContents.on("dom-ready", () => {
    win?.webContents.executeJavaScript(`
      // 移除可能存在的旧事件监听器
      document.removeEventListener('dragover', window._dragOverHandler);
      document.removeEventListener('drop', window._dropHandler);
      
      // 创建事件处理函数
      window._dragOverHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
      };
      
      window._dropHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const files = Array.from(e.dataTransfer.files);
        console.log('Electron drop event, files:', files);
        
        if (files.length > 0) {
          // 在 Electron 环境中，文件对象应该有 path 属性
          const filePaths = files.map(f => f.path || f.name);
          console.log('拖拽文件路径:', filePaths);
          
          // 触发自定义事件，传递文件对象和路径
          const event = new CustomEvent('electron-file-drop', {
            detail: { 
              files: files,
              filePaths: filePaths
            }
          });
          document.dispatchEvent(event);
        }
      };
      
      // 添加事件监听器
      document.addEventListener('dragover', window._dragOverHandler);
      document.addEventListener('drop', window._dropHandler);
      
      console.log('Electron file drop handlers installed');
    `);
  });

  if (VITE_DEV_SERVER_URL) {
    // #298
    win.loadURL(VITE_DEV_SERVER_URL);
    // Open devTool if the app is not packaged
    win.webContents.openDevTools();
  } else {
    win.loadFile(indexHtml);
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) shell.openExternal(url);
    return { action: "deny" };
  });

  // Auto update
  update(win);
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  win = null;
  if (process.platform !== "darwin") app.quit();
});

app.on("second-instance", () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on("activate", () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

// New window example arg: new windows url
ipcMain.handle("open-win", (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`);
  } else {
    childWindow.loadFile(indexHtml, { hash: arg });
  }
});

// 处理文件拖拽
ipcMain.handle("handle-file-drop", (_, filePaths: string[]) => {
  console.log("收到拖拽文件:", filePaths);
  // 这里可以添加文件处理逻辑
  return filePaths;
});

// 选择目录
ipcMain.handle("select-directory", async () => {
  const result = await dialog.showOpenDialog(win!, {
    properties: ["openDirectory"],
  });
  return result.canceled ? null : result.filePaths[0];
});

// 保存文件
ipcMain.handle(
  "save-file",
  async (
    _,
    data: { data: ArrayBuffer; fileName: string; filePath: string },
  ) => {
    const { data: fileData, fileName, filePath } = data;
    const fullPath = path.join(filePath, fileName);

    try {
      await fs.promises.writeFile(fullPath, Buffer.from(fileData));
      return { success: true, path: fullPath };
    } catch (error) {
      console.error("保存文件失败:", error);
      throw error;
    }
  },
);

// 批处理相关IPC处理器
ipcMain.handle("select-folder", async () => {
  const result = await dialog.showOpenDialog(win!, {
    properties: ["openDirectory"],
    title: "选择文件夹",
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle("select-file", async () => {
  const result = await dialog.showOpenDialog(win!, {
    properties: ["openFile"],
    title: "选择文件",
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle("execute-batch-script", async (event, config) => {
  try {
    console.log("执行批处理:", config);

    // 检查输入路径是否存在
    if (!config.inputPath || !fs.existsSync(config.inputPath)) {
      return { success: false, message: "输入路径不存在或无效" };
    }

    // 创建批处理处理器实例
    const processor = new BatchProcessor({
      password: config.password,
      suffix: config.suffix,
      copyFilePath: config.copyFilePath,
      copyFileEnabled: config.copyFileEnabled,
      deleteOriginal: config.deleteOriginal,
      extractNested: config.extractNested,
      inputPath: config.inputPath,
      outputPath: config.outputPath || config.inputPath,
    });

    // 设置日志回调
    processor.setLogCallback((data: any) => {
      event.sender.send("batch-progress", data);
    });

    // 执行批处理
    const result = await processor.process();
    return result;
  } catch (error) {
    console.error("批处理执行失败:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "未知错误",
    };
  }
});

ipcMain.handle("get-system-info", async () => {
  return {
    platform: process.platform,
    arch: process.arch,
    version: process.version,
    nodeVersion: process.versions.node,
    electronVersion: process.versions.electron,
  };
});

// 测试批处理脚本执行
ipcMain.handle("test-batch-script", async (event, config) => {
  try {
    console.log("测试批处理:", config);

    // 检查输入路径是否存在
    if (!config.inputPath || !fs.existsSync(config.inputPath)) {
      return { success: false, message: "输入路径不存在或无效" };
    }

    // 创建批处理处理器实例进行测试
    const processor = new BatchProcessor({
      password: config.password,
      suffix: config.suffix,
      copyFilePath: config.copyFilePath,
      copyFileEnabled: config.copyFileEnabled,
      deleteOriginal: config.deleteOriginal,
      extractNested: config.extractNested,
      inputPath: config.inputPath,
      outputPath: config.outputPath || config.inputPath,
    });

    // 设置日志回调
    processor.setLogCallback((data: any) => {
      event.sender.send("batch-progress", data);
    });

    // 执行测试
    processor.log("开始测试批处理...");
    processor.log(`输入路径: ${config.inputPath}`);
    processor.log(`输出路径: ${config.outputPath || "默认路径"}`);
    processor.log(`密码: ${config.password}`);
    processor.log(`后缀: ${config.suffix}`);

    // 检查7z是否可用
    const has7z = await processor.check7z();
    if (!has7z) {
      return { success: false, message: "7-Zip 未找到或不可用" };
    }

    // 查找ZIP文件
    const zipFiles = await processor.findZipFiles(config.inputPath);
    if (zipFiles.length === 0) {
      processor.log("当前目录中没有找到ZIP文件");
      return { success: true, message: "测试完成，没有找到ZIP文件" };
    }

    processor.log(`找到 ${zipFiles.length} 个ZIP文件`);
    processor.log("测试完成");

    return { success: true, message: "测试完成", output: "所有检查通过" };
  } catch (error) {
    console.error("测试执行失败:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "未知错误",
    };
  }
});
