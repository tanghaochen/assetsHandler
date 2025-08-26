const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const os = require("os");

class BatchProcessor {
  constructor(config) {
    const toBoolean = (value) => {
      if (typeof value === "boolean") return value;
      if (typeof value === "string") return value.toLowerCase() === "true";
      if (typeof value === "number") return value === 1;
      return Boolean(value);
    };

    this.config = {
      password: config.password || "3y@Ef!YzJNmY",
      suffix: config.suffix || "_installguider.com",
      copyFilePath: config.copyFilePath || "",
      copyFileEnabled: toBoolean(config.copyFileEnabled ?? false),
      // 默认不删除
      deleteOriginal: toBoolean(config.deleteOriginal ?? false),
      extractNested: toBoolean(config.extractNested ?? true),
      inputPath: config.inputPath || "",
      outputPath: config.outputPath || config.inputPath || "",
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
    // 自动查找当前目录与第一层子目录下的 .zip，不进行更深层递归
    try {
      const entries = await fs.promises.readdir(directory);
      const result = [];

      for (const entry of entries) {
        const fullPath = path.join(directory, entry);
        const stat = await fs.promises.stat(fullPath);

        if (stat.isFile() && entry.toLowerCase().endsWith(".zip")) {
          result.push(entry);
        } else if (stat.isDirectory()) {
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
      // 性能优化：开启多线程，降低日志输出
      const args = ["x", zipPath, `-o${outputDir}`, "-y", "-mmt=on", "-bb0"];
      if (password) {
        args.push(`-p${password}`);
      }

      this.log(`解压开始: ${path.basename(zipPath)}`);

      const child = spawn("7z", args, { stdio: ["ignore", "ignore", "pipe"] });

      let errorOutput = "";

      child.stderr.on("data", (data) => {
        // 仅在出错时保留信息，避免大量 I/O 拖慢速度
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

  async createZip(sourceDir, zipPath) {
    return new Promise((resolve) => {
      // 性能优化：最快压缩等级、开启多线程、降低日志
      this.log(`创建压缩包: ${path.basename(zipPath)}`);

      const args = ["a", zipPath, "*", "-r", "-mx=1", "-mmt=on", "-bb0"];

      const child = spawn("7z", args, {
        cwd: sourceDir,
        stdio: ["ignore", "ignore", "pipe"],
      });

      let errorOutput = "";
      child.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      child.on("close", (code) => {
        if (code === 0) {
          this.log(`压缩包创建完成: ${path.basename(zipPath)}`);
          resolve(true);
        } else {
          this.error(
            `压缩包创建失败: ${path.basename(zipPath)}, 退出码: ${code}`,
          );
          if (errorOutput) {
            this.error(`错误详情: ${errorOutput}`);
          }
          resolve(false);
        }
      });

      child.on("error", (err) => {
        this.error(`压缩包创建错误: ${err.message}`);
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

  async deleteDirectory(dirPath) {
    try {
      await fs.promises.rm(dirPath, { recursive: true, force: true });
      this.log(`删除目录: ${path.basename(dirPath)}`);
      return true;
    } catch (err) {
      this.error(`删除目录失败: ${err.message}`);
      return false;
    }
  }

  async findTargetDirectory(extractedDir, sourceName) {
    try {
      this.log(`分析目录结构: ${extractedDir}`);
      this.log(`查找源文件名: ${sourceName}`);

      const items = await fs.promises.readdir(extractedDir);
      const directories = [];

      for (const item of items) {
        const itemPath = path.join(extractedDir, item);
        const stat = await fs.promises.stat(itemPath);
        if (stat.isDirectory()) {
          directories.push(item);
        }
      }

      this.log(`找到子目录: ${directories.join(", ")}`);

      // 查找匹配源文件名的目录
      for (const dir of directories) {
        if (dir === sourceName) {
          this.log(`目录名匹配源文件名，继续深入查找: ${dir}`);
          const subDirPath = path.join(extractedDir, dir);
          const subTarget = await this.findTargetDirectory(
            subDirPath,
            sourceName,
          );
          if (subTarget) {
            return subTarget;
          }
        } else {
          this.log(`目录名不匹配源文件名，这是目标目录: ${dir}`);
          return path.join(extractedDir, dir);
        }
      }

      // 如果没有找到匹配的子目录，检查当前目录是否有文件
      const files = [];
      for (const item of items) {
        const itemPath = path.join(extractedDir, item);
        const stat = await fs.promises.stat(itemPath);
        if (stat.isFile()) {
          files.push(item);
        }
      }

      if (files.length > 0) {
        this.log(`没有找到匹配的子目录，使用当前路径作为目标`);
        return extractedDir;
      }

      return null;
    } catch (err) {
      this.error(`查找目标目录失败: ${err.message}`);
      return null;
    }
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

        // 解压嵌套ZIP文件
        const extractSuccess = await this.extractZip(
          zipPath,
          directory,
          this.config.password,
        );
        if (extractSuccess) {
          // 删除嵌套ZIP文件
          await this.deleteFile(zipPath);
        }
      }

      // 递归处理子目录
      for (const item of files) {
        const itemPath = path.join(directory, item);
        const stat = await fs.promises.stat(itemPath);
        if (stat.isDirectory()) {
          await this.processNestedZips(itemPath);
        }
      }
    } catch (err) {
      this.error(`处理嵌套ZIP文件失败: ${err.message}`);
    }
  }

  async processZipFile(zipPath) {
    try {
      const zipName = path.basename(zipPath, ".zip");
      const zipDir = path.dirname(zipPath);

      // 确定输出目录
      const outputDir =
        this.config.outputPath &&
        this.config.outputPath !== this.config.inputPath
          ? this.config.outputPath
          : zipDir;

      // 创建临时解压目录（带后缀）
      const tempExtractDir = path.join(outputDir, zipName + this.config.suffix);

      this.log(`处理文件: ${path.basename(zipPath)}`);
      this.log(`源文件名: ${zipName}`);
      this.log(`输出目录: ${outputDir}`);
      this.log(`临时解压目录: ${tempExtractDir}`);

      // 创建临时解压目录
      try {
        await fs.promises.mkdir(tempExtractDir, { recursive: true });
        this.log(`创建目录: ${path.basename(tempExtractDir)}`);
      } catch (err) {
        this.error(`创建解压目录失败: ${err.message}`);
        return false;
      }

      // 解压文件
      this.log(`开始解压文件到: ${tempExtractDir}`);
      const extractSuccess = await this.extractZip(
        zipPath,
        tempExtractDir,
        this.config.password,
      );
      if (!extractSuccess) {
        this.error(`解压失败，停止处理`);
        return false;
      }

      // 如果需要解压嵌套ZIP文件
      if (this.config.extractNested) {
        this.log(`查找嵌套ZIP文件: ${tempExtractDir}`);
        await this.processNestedZips(tempExtractDir);
      }

      // 查找目标目录
      this.log(`开始分析目录结构...`);
      const targetDir = await this.findTargetDirectory(tempExtractDir, zipName);
      if (!targetDir) {
        this.error(`未找到目标目录: ${tempExtractDir}`);
        return false;
      }

      this.log(`找到目标目录: ${targetDir}`);

      // 如果需要拷贝文件
      if (this.config.copyFileEnabled && this.config.copyFilePath) {
        if (fs.existsSync(this.config.copyFilePath)) {
          const copyFileName = path.basename(this.config.copyFilePath);
          const copyTargetPath = path.join(targetDir, copyFileName);
          this.log(`拷贝文件到: ${copyTargetPath}`);
          await this.copyFile(this.config.copyFilePath, copyTargetPath);
        } else {
          this.error(`指定文件不存在: ${this.config.copyFilePath}`);
        }
      }

      // 创建最终压缩包
      const finalZipName = zipName + this.config.suffix + ".zip";
      const finalZipPath = path.join(outputDir, finalZipName);

      this.log(`准备创建最终压缩包: ${finalZipName}`);
      this.log(`压缩包路径: ${finalZipPath}`);
      this.log(`源目录: ${targetDir}`);

      const zipSuccess = await this.createZip(targetDir, finalZipPath);
      if (zipSuccess) {
        this.log(`压缩包创建成功，开始清理...`);

        // 删除临时解压目录
        this.log(`删除临时目录: ${tempExtractDir}`);
        await this.deleteDirectory(tempExtractDir);

        // 如果需要删除原始文件
        if (this.config.deleteOriginal) {
          this.log(`删除原始文件: ${zipPath}`);
          await this.deleteFile(zipPath);
        } else {
          this.log(`保留原始文件: ${zipPath}`);
        }

        this.log(`文件处理完成: ${finalZipName}`);
        return true;
      } else {
        this.error(`压缩包创建失败`);
        return false;
      }
    } catch (error) {
      this.error(`处理文件时发生错误: ${error.message}`);
      return false;
    }
  }

  async process() {
    this.log("开始批处理...");
    this.log(`输入路径: ${this.config.inputPath}`);
    this.log(`输出路径: ${this.config.outputPath}`);
    this.log(`密码: ${this.config.password}`);
    this.log(`后缀: ${this.config.suffix}`);
    this.log(`删除原始文件: ${this.config.deleteOriginal}`);
    this.log(`解压嵌套ZIP: ${this.config.extractNested}`);
    this.log(`启用文件拷贝: ${this.config.copyFileEnabled}`);
    this.log(`拷贝文件路径: ${this.config.copyFilePath}`);

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
