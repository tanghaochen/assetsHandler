const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const os = require("os");

class BatchProcessor {
  constructor(config) {
    // 统一布尔值（兼容 'true'/'false' 字符串与数字 1/0）
    const toBoolean = (value) => {
      if (typeof value === "boolean") return value;
      if (typeof value === "string") return value.toLowerCase() === "true";
      if (typeof value === "number") return value === 1;
      return Boolean(value);
    };

    this.config = {
      password: config.password ?? "3y@Ef!YzJNmY",
      suffix: config.suffix ?? "_installguider.com",
      copyFilePath: config.copyFilePath ?? "",
      copyFileEnabled: toBoolean(config.copyFileEnabled ?? false),
      // 默认不删除，只有明确为 true 才删除
      deleteOriginal: toBoolean(config.deleteOriginal ?? false),
      extractNested: toBoolean(config.extractNested ?? true),
      inputPath: config.inputPath ?? "",
      outputPath: config.outputPath ?? config.inputPath ?? "",
    };

    this.logCallback = null;
  }

  setLogCallback(callback) {
    this.logCallback = callback;
  }

  log(message) {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    if (this.logCallback) {
      this.logCallback({ type: "output", message: logMessage });
    }
  }

  error(message) {
    const timestamp = new Date().toLocaleTimeString();
    const errorMessage = `[${timestamp}] 错误: ${message}`;
    console.error(errorMessage);
    if (this.logCallback) {
      this.logCallback({ type: "error", message: errorMessage });
    }
  }

  async check7z() {
    return new Promise((resolve) => {
      const child = spawn("7z", ["--help"], { stdio: "pipe" });

      child.on("close", (code) => {
        if (code === 0) {
          this.log("7-Zip 可用");
          resolve(true);
        } else {
          this.error("7-Zip 未找到或不可用");
          resolve(false);
        }
      });

      child.on("error", () => {
        this.error("7-Zip 未找到或不可用");
        resolve(false);
      });
    });
  }

  async findZipFiles(directory) {
    // 自动查找：当前目录与第一层子目录中的 .zip，不做更深层递归
    try {
      const entries = await fs.promises.readdir(directory);
      const result = [];

      for (const entry of entries) {
        const fullPath = path.join(directory, entry);
        const stat = await fs.promises.stat(fullPath);

        if (stat.isFile() && entry.toLowerCase().endsWith(".zip")) {
          // 顶层 ZIP：使用文件名（与现有下游逻辑兼容）
          result.push(entry);
        } else if (stat.isDirectory()) {
          // 第一层子目录内的 ZIP：以 相对子路径/文件名 的形式返回
          try {
            const subFiles = await fs.promises.readdir(fullPath);
            for (const sub of subFiles) {
              const subFull = path.join(fullPath, sub);
              const subStat = await fs.promises.stat(subFull);
              if (subStat.isFile() && sub.toLowerCase().endsWith(".zip")) {
                result.push(path.join(entry, sub));
              }
            }
          } catch (subErr) {
            this.error(`读取子目录失败(${entry}): ${subErr.message}`);
          }
        }
      }

      return result;
    } catch (err) {
      this.error(`读取目录失败: ${err.message}`);
      return [];
    }
  }

  async extractZip(zipPath, outputDir, password = null) {
    return new Promise((resolve) => {
      // 性能优化：开启多线程、降低日志
      const args = ["x", zipPath, `-o${outputDir}`, "-y", "-mmt=on", "-bb0"];
      if (password) {
        args.push(`-p${password}`);
      }

      this.log(`解压开始: ${path.basename(zipPath)}`);

      const child = spawn("7z", args, { stdio: ["ignore", "ignore", "pipe"] });

      let errorOutput = "";
      child.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      child.on("close", (code) => {
        if (code === 0) {
          this.log(`解压完成: ${path.basename(zipPath)}`);
          resolve(true);
        } else {
          this.error(`解压失败: ${path.basename(zipPath)}, 退出码: ${code}`);
          if (errorOutput) {
            this.error(`错误详情: ${errorOutput}`);
          }
          resolve(false);
        }
      });

      child.on("error", (err) => {
        this.error(`解压错误: ${err.message}`);
        resolve(false);
      });
    });
  }

  async copyFile(sourcePath, targetPath) {
    try {
      await fs.promises.copyFile(sourcePath, targetPath);
      this.log(`文件拷贝成功: ${path.basename(sourcePath)}`);
      return true;
    } catch (err) {
      this.error(`文件拷贝失败: ${err.message}`);
      return false;
    }
  }

  async deleteFile(filePath) {
    try {
      await fs.promises.unlink(filePath);
      this.log(`删除文件: ${path.basename(filePath)}`);
      return true;
    } catch (err) {
      this.error(`删除文件失败: ${err.message}`);
      return false;
    }
  }

  async renameFile(oldPath, newPath) {
    try {
      await fs.promises.rename(oldPath, newPath);
      this.log(
        `重命名文件: ${path.basename(oldPath)} -> ${path.basename(newPath)}`,
      );
      return true;
    } catch (err) {
      this.error(`重命名文件失败: ${err.message}`);
      return false;
    }
  }

  async processZipFile(zipPath) {
    const zipName = path.basename(zipPath, ".zip");
    // 优先输出到配置的 outputPath；否则与源同级
    const parentDir =
      this.config.outputPath && this.config.outputPath !== this.config.inputPath
        ? this.config.outputPath
        : path.dirname(zipPath);
    const outputDir = path.join(parentDir, zipName);

    // 创建输出目录
    try {
      await fs.promises.mkdir(outputDir, { recursive: true });
    } catch (err) {
      this.error(`创建输出目录失败: ${err.message}`);
      return false;
    }

    // 解压文件
    const extractSuccess = await this.extractZip(
      zipPath,
      outputDir,
      this.config.password,
    );
    if (!extractSuccess) {
      return false;
    }

    // 如果需要拷贝文件
    if (this.config.copyFileEnabled && this.config.copyFilePath) {
      const copyFileName = path.basename(this.config.copyFilePath);
      const copyTargetPath = path.join(outputDir, copyFileName);
      await this.copyFile(this.config.copyFilePath, copyTargetPath);
    }

    // 仅当明确勾选删除原始文件时才删除；未勾选则保持原文件不变
    if (this.config.deleteOriginal === true) {
      await this.deleteFile(zipPath);
    }

    // 如果需要解压嵌套ZIP文件
    if (this.config.extractNested) {
      await this.processNestedZips(outputDir);
    }

    return true;
  }

  async processNestedZips(directory) {
    try {
      const files = await fs.promises.readdir(directory);
      const zipFiles = files.filter(
        (file) =>
          file.toLowerCase().endsWith(".zip") &&
          fs.statSync(path.join(directory, file)).isFile(),
      );

      for (const zipFile of zipFiles) {
        const zipPath = path.join(directory, zipFile);
        this.log(`处理嵌套ZIP文件: ${zipFile}`);
        await this.processZipFile(zipPath);
      }
    } catch (err) {
      this.error(`处理嵌套ZIP文件失败: ${err.message}`);
    }
  }

  async process() {
    this.log("开始批处理...");
    this.log(`输入路径: ${this.config.inputPath}`);
    this.log(`输出路径: ${this.config.outputPath}`);
    this.log(`密码: ${this.config.password}`);
    this.log(`后缀: ${this.config.suffix}`);

    // 检查7z是否可用
    const has7z = await this.check7z();
    if (!has7z) {
      return { success: false, message: "7-Zip 未找到或不可用" };
    }

    // 检查输入路径
    if (!fs.existsSync(this.config.inputPath)) {
      return { success: false, message: "输入路径不存在" };
    }

    // 查找ZIP文件
    const zipFiles = await this.findZipFiles(this.config.inputPath);
    if (zipFiles.length === 0) {
      this.log("当前目录中没有找到ZIP文件");
      return { success: true, message: "没有找到ZIP文件需要处理" };
    }

    this.log(`找到 ${zipFiles.length} 个ZIP文件`);

    // 处理每个ZIP文件
    let successCount = 0;
    let failCount = 0;

    for (const zipFile of zipFiles) {
      const zipPath = path.join(this.config.inputPath, zipFile);
      this.log(`处理文件: ${zipFile}`);

      const success = await this.processZipFile(zipPath);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    this.log(`批处理完成: 成功 ${successCount} 个，失败 ${failCount} 个`);

    if (failCount === 0) {
      return {
        success: true,
        message: `批处理完成，成功处理 ${successCount} 个文件`,
      };
    } else {
      return {
        success: false,
        message: `批处理完成，成功 ${successCount} 个，失败 ${failCount} 个`,
      };
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const config = {
    password: process.env.PASSWORD || "3y@Ef!YzJNmY",
    suffix: process.env.SUFFIX || "_installguider.com",
    copyFilePath: process.env.COPY_FILE_PATH || "",
    copyFileEnabled: process.env.COPY_FILE_ENABLED === "true",
    deleteOriginal: process.env.DELETE_ORIGINAL === "true",
    extractNested: process.env.EXTRACT_NESTED === "true",
    inputPath: process.env.INPUT_PATH || process.cwd(),
    outputPath: process.env.OUTPUT_PATH || process.cwd(),
  };

  const processor = new BatchProcessor(config);
  processor.setLogCallback((data) => {
    console.log(data.message);
  });

  processor
    .process()
    .then((result) => {
      if (result.success) {
        console.log("批处理成功完成");
        process.exit(0);
      } else {
        console.error("批处理失败:", result.message);
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error("批处理执行错误:", err);
      process.exit(1);
    });
}

module.exports = BatchProcessor;
