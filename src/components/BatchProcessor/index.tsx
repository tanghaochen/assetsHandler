import React, { useState, useRef } from "react";
import {
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Card,
  CardContent,
  Typography,
  Box,
  Alert,
  LinearProgress,
  IconButton,
  Tooltip,
  Divider,
} from "@mui/material";
import {
  ArrowBackIcon,
  FolderOpenIcon,
  PlayArrowIcon,
  StopIcon,
  SettingsIcon,
  SaveIcon,
  RefreshIcon,
  InfoIcon,
} from "../Icons";
import "./BatchProcessor.css";

interface BatchProcessorProps {
  onBack: () => void;
}

interface BatchConfig {
  password: string;
  suffix: string;
  copyFilePath: string;
  copyFileEnabled: boolean;
  inputPath: string;
  outputPath: string;
  deleteOriginal: boolean;
  extractNested: boolean;
}

const BatchProcessor: React.FC<BatchProcessorProps> = ({ onBack }) => {
  const [config, setConfig] = useState<BatchConfig>({
    password: "3y@Ef!YzJNmY",
    suffix: "_installguider.com",
    copyFilePath: "E:\\TB\\看更多软件资源.url",
    copyFileEnabled: true,
    inputPath: "",
    outputPath: "",
    deleteOriginal: true,
    extractNested: true,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const inputPathRef = useRef<HTMLInputElement>(null);
  const outputPathRef = useRef<HTMLInputElement>(null);
  const copyFilePathRef = useRef<HTMLInputElement>(null);

  const handleConfigChange = (field: keyof BatchConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const selectFolder = async (type: "input" | "output" | "copy") => {
    try {
      // 这里需要调用Electron的对话框API
      const result = await window.electronAPI?.selectDirectory();
      if (result) {
        switch (type) {
          case "input":
            handleConfigChange("inputPath", result);
            break;
          case "output":
            handleConfigChange("outputPath", result);
            break;
          case "copy":
            handleConfigChange("copyFilePath", result);
            break;
        }
      }
    } catch (err) {
      console.error("选择文件夹失败:", err);
      setError("选择文件夹失败");
    }
  };

  const selectFile = async () => {
    try {
      // 暂时使用文件夹选择器，实际项目中需要实现文件选择器
      const result = await window.electronAPI?.selectDirectory();
      if (result) {
        handleConfigChange("copyFilePath", result);
      }
    } catch (err) {
      console.error("选择文件失败:", err);
      setError("选择文件失败");
    }
  };

  const addLog = (message: string) => {
    setLog((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ${message}`,
    ]);
  };

  const testProcessing = async () => {
    if (!config.inputPath) {
      setError("请选择输入文件夹");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setLog([]);
    setError(null);
    setSuccess(null);

    addLog("开始测试批处理...");
    addLog(`输入路径: ${config.inputPath}`);
    addLog(`输出路径: ${config.outputPath || "默认路径"}`);
    addLog(`密码: ${config.password}`);
    addLog(`后缀: ${config.suffix}`);

    try {
      // 设置批处理进度监听
      window.electronAPI?.onBatchProgress((data) => {
        if (data.type === "output") {
          addLog(data.message.trim());
        } else if (data.type === "error") {
          addLog(`错误: ${data.message.trim()}`);
        }
      });

      // 调用测试脚本
      const result = await window.electronAPI?.testBatchScript({
        password: config.password,
        suffix: config.suffix,
        copyFilePath: config.copyFilePath,
        copyFileEnabled: config.copyFileEnabled,
        inputPath: config.inputPath,
        outputPath: config.outputPath,
        deleteOriginal: config.deleteOriginal,
        extractNested: config.extractNested,
      });

      if (result.success) {
        setSuccess("测试完成！");
        addLog("测试脚本执行成功");
        setProgress(100);
      } else {
        setError(result.message || "测试失败");
        addLog(`测试失败: ${result.message}`);
        if (result.error) {
          addLog(`错误详情: ${result.error}`);
        }
      }
    } catch (err) {
      setError("测试过程中出现错误");
      addLog(`错误: ${err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const startProcessing = async () => {
    if (!config.inputPath) {
      setError("请选择输入文件夹");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setLog([]);
    setError(null);
    setSuccess(null);

    addLog("开始批处理...");
    addLog(`输入路径: ${config.inputPath}`);
    addLog(`输出路径: ${config.outputPath || "默认路径"}`);
    addLog(`密码: ${config.password}`);
    addLog(`后缀: ${config.suffix}`);

    try {
      // 设置批处理进度监听
      window.electronAPI?.onBatchProgress((data) => {
        if (data.type === "output") {
          addLog(data.message.trim());
        } else if (data.type === "error") {
          addLog(`错误: ${data.message.trim()}`);
        }
      });

      // 调用实际的批处理脚本
      const result = await window.electronAPI?.executeBatchScript({
        password: config.password,
        suffix: config.suffix,
        copyFilePath: config.copyFilePath,
        copyFileEnabled: config.copyFileEnabled,
        inputPath: config.inputPath,
        outputPath: config.outputPath,
        deleteOriginal: config.deleteOriginal,
        extractNested: config.extractNested,
      });

      if (result.success) {
        setSuccess("批处理完成！");
        addLog("所有文件处理完成");
        setProgress(100);
      } else {
        setError(result.message || "批处理失败");
        addLog(`批处理失败: ${result.message}`);
        if (result.error) {
          addLog(`错误详情: ${result.error}`);
        }
      }
    } catch (err) {
      setError("处理过程中出现错误");
      addLog(`错误: ${err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const stopProcessing = () => {
    setIsProcessing(false);
    addLog("用户停止处理");
  };

  const saveConfig = () => {
    try {
      localStorage.setItem("batchProcessorConfig", JSON.stringify(config));
      setSuccess("配置已保存");
    } catch (err) {
      setError("保存配置失败");
    }
  };

  const loadConfig = () => {
    try {
      const saved = localStorage.getItem("batchProcessorConfig");
      if (saved) {
        setConfig(JSON.parse(saved));
        setSuccess("配置已加载");
      }
    } catch (err) {
      setError("加载配置失败");
    }
  };

  return (
    <div className="batch-processor">
      <div className="batch-header">
        <IconButton onClick={onBack} className="back-button">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          批处理工具
        </Typography>
      </div>

      <div className="batch-content">
        <Box display="flex" gap={3} flexWrap="wrap">
          {/* 配置面板 */}
          <Box flex={1} minWidth={400}>
            <Card className="config-card">
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <SettingsIcon className="card-icon" />
                  <Typography variant="h6">处理配置</Typography>
                </Box>

                <Box display="flex" flexDirection="column" gap={2}>
                  <Box>
                    <TextField
                      fullWidth
                      label="解压密码"
                      value={config.password}
                      onChange={(e) =>
                        handleConfigChange("password", e.target.value)
                      }
                      variant="outlined"
                      size="small"
                    />
                  </Box>

                  <Box>
                    <TextField
                      fullWidth
                      label="文件后缀"
                      value={config.suffix}
                      onChange={(e) =>
                        handleConfigChange("suffix", e.target.value)
                      }
                      variant="outlined"
                      size="small"
                      helperText="处理后的文件将添加此后缀"
                    />
                  </Box>

                  <Box>
                    <Box display="flex" gap={1}>
                      <TextField
                        fullWidth
                        label="输入文件夹"
                        value={config.inputPath}
                        onChange={(e) =>
                          handleConfigChange("inputPath", e.target.value)
                        }
                        variant="outlined"
                        size="small"
                        placeholder="选择包含ZIP文件的文件夹"
                      />
                      <Tooltip title="选择输入文件夹">
                        <IconButton onClick={() => selectFolder("input")}>
                          <FolderOpenIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  <Box>
                    <Box display="flex" gap={1}>
                      <TextField
                        fullWidth
                        label="输出文件夹"
                        value={config.outputPath}
                        onChange={(e) =>
                          handleConfigChange("outputPath", e.target.value)
                        }
                        variant="outlined"
                        size="small"
                        placeholder="选择输出文件夹（可选）"
                      />
                      <Tooltip title="选择输出文件夹">
                        <IconButton onClick={() => selectFolder("output")}>
                          <FolderOpenIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  <Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.copyFileEnabled}
                          onChange={(e) =>
                            handleConfigChange(
                              "copyFileEnabled",
                              e.target.checked,
                            )
                          }
                        />
                      }
                      label="启用文件拷贝"
                    />
                  </Box>

                  {config.copyFileEnabled && (
                    <Box>
                      <Box display="flex" gap={1}>
                        <TextField
                          fullWidth
                          label="拷贝文件路径"
                          value={config.copyFilePath}
                          onChange={(e) =>
                            handleConfigChange("copyFilePath", e.target.value)
                          }
                          variant="outlined"
                          size="small"
                          placeholder="选择要拷贝的文件"
                        />
                        <Tooltip title="选择文件">
                          <IconButton onClick={selectFile}>
                            <FolderOpenIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  )}

                  <Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.deleteOriginal}
                          onChange={(e) =>
                            handleConfigChange(
                              "deleteOriginal",
                              e.target.checked,
                            )
                          }
                        />
                      }
                      label="删除原始文件"
                    />
                  </Box>

                  <Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.extractNested}
                          onChange={(e) =>
                            handleConfigChange(
                              "extractNested",
                              e.target.checked,
                            )
                          }
                        />
                      }
                      label="解压嵌套ZIP文件"
                    />
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box display="flex" gap={1}>
                  <Button
                    variant="outlined"
                    startIcon={<SaveIcon />}
                    onClick={saveConfig}
                    disabled={isProcessing}
                  >
                    保存配置
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={loadConfig}
                    disabled={isProcessing}
                  >
                    加载配置
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* 控制面板 */}
          <Box flex={1} minWidth={400}>
            <Card className="control-card">
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <PlayArrowIcon className="card-icon" />
                  <Typography variant="h6">处理控制</Typography>
                </Box>

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

                {success && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    {success}
                  </Alert>
                )}

                <Box mb={2} display="flex" gap={1}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={<PlayArrowIcon />}
                    onClick={startProcessing}
                    disabled={isProcessing || !config.inputPath}
                    sx={{ flex: 1 }}
                  >
                    {isProcessing ? "处理中..." : "开始处理"}
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    size="large"
                    onClick={testProcessing}
                    disabled={isProcessing || !config.inputPath}
                  >
                    测试
                  </Button>
                </Box>

                {isProcessing && (
                  <Box mb={2}>
                    <Button
                      variant="outlined"
                      color="secondary"
                      startIcon={<StopIcon />}
                      onClick={stopProcessing}
                      fullWidth
                    >
                      停止处理
                    </Button>
                  </Box>
                )}

                {isProcessing && (
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      处理进度: {progress}%
                    </Typography>
                    <LinearProgress variant="determinate" value={progress} />
                  </Box>
                )}

                <Typography variant="h6" mb={1}>
                  处理日志
                </Typography>
                <Box
                  className="log-container"
                  sx={{
                    height: 200,
                    overflowY: "auto",
                    backgroundColor: "#f5f5f5",
                    p: 1,
                    borderRadius: 1,
                    fontFamily: "monospace",
                    fontSize: "0.875rem",
                  }}
                >
                  {log.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      暂无日志
                    </Typography>
                  ) : (
                    log.map((entry, index) => (
                      <div key={index} className="log-entry">
                        {entry}
                      </div>
                    ))
                  )}
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </div>
    </div>
  );
};

export default BatchProcessor;
