import { app, BrowserWindow, shell, ipcMain, dialog } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import { update } from "./update";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
process.env.APP_ROOT = path.join(__dirname, "../..");

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
