import React, { useState, useRef, useCallback, useEffect } from "react";
import { Snackbar, Alert } from "@mui/material";
import ImageList from "./ImageList";
import PreviewArea from "./PreviewArea";
import SettingsPanel from "./SettingsPanel";
import { ImageItem, WatermarkPosition } from "./types";
import "./WatermarkEditor.css";

const WatermarkEditor: React.FC = () => {
  // 从localStorage加载保存的设置
  const loadSettingsFromStorage = () => {
    try {
      const savedSettings = localStorage.getItem("watermarkEditorSettings");
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        console.log("从localStorage加载的设置:", settings);
        return {
          watermarkText: settings.watermarkText || "Watermark",
          watermarkColor: settings.watermarkColor || "#ffffff",
          watermarkOpacity: settings.watermarkOpacity || 1.0,
          watermarkFontSize: settings.watermarkFontSize || 24,
          watermarkType: settings.watermarkType || "text",
          watermarkImageUrl: settings.watermarkImageUrl || "",
          exportSettings: {
            outputPath: settings.exportSettings?.outputPath || "",
          },
          watermarkPosition: settings.watermarkPosition || {
            x: 0.5,
            y: 0.5,
            width: 0.3,
            height: 0.1,
            rotation: 0,
          },
        };
      }
    } catch (error) {
      console.error("加载设置失败:", error);
    }

    // 返回默认设置
    return {
      watermarkText: "Watermark",
      watermarkColor: "#ffffff",
      watermarkOpacity: 1.0,
      watermarkFontSize: 24,
      watermarkType: "text" as "text" | "image",
      watermarkImageUrl: "",
      exportSettings: {
        outputPath: "",
      },
      watermarkPosition: {
        x: 0.5,
        y: 0.5,
        width: 0.3,
        height: 0.1,
        rotation: 0,
      },
    };
  };

  // 保存设置到localStorage
  const saveSettingsToStorage = (settings: any) => {
    try {
      localStorage.setItem("watermarkEditorSettings", JSON.stringify(settings));
      console.log("保存设置到localStorage:", settings);
    } catch (error) {
      console.error("保存设置失败:", error);
    }
  };

  const initialSettings = loadSettingsFromStorage();

  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1);
  const [watermarkText, setWatermarkText] = useState<string>(
    initialSettings.watermarkText,
  );
  const [watermarkColor, setWatermarkColor] = useState<string>(
    initialSettings.watermarkColor,
  );
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(
    initialSettings.watermarkOpacity,
  );
  const [watermarkFontSize, setWatermarkFontSize] = useState<number>(
    initialSettings.watermarkFontSize,
  );
  const [watermarkType, setWatermarkType] = useState<"text" | "image">(
    initialSettings.watermarkType,
  );
  const [watermarkImageUrl, setWatermarkImageUrl] = useState<string>(
    initialSettings.watermarkImageUrl,
  );
  const [exportSettings, setExportSettings] = useState(
    initialSettings.exportSettings,
  );
  const [watermarkPosition, setWatermarkPosition] = useState<WatermarkPosition>(
    initialSettings.watermarkPosition,
  );

  // Snackbar 状态
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "info" | "warning"
  >("success");
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(
    null,
  );

  const previewRef = useRef<HTMLDivElement>(null);
  const watermarkRef = useRef<HTMLDivElement>(null);

  // Snackbar 处理函数
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "info" | "warning" = "success",
  ) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // 键盘事件处理
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowUp":
          if (images.length === 0) return;
          event.preventDefault();
          const prevIndex =
            selectedImageIndex <= 0
              ? images.length - 1
              : selectedImageIndex - 1;
          setSlideDirection("left");
          setSelectedImageIndex(prevIndex);
          // 加载对应图片的水印位置
          if (images[prevIndex]) {
            setWatermarkPosition({ ...images[prevIndex].watermarkPosition });
          }
          break;
        case "ArrowDown":
          if (images.length === 0) return;
          event.preventDefault();
          const nextIndex =
            selectedImageIndex >= images.length - 1
              ? 0
              : selectedImageIndex + 1;
          setSlideDirection("right");
          setSelectedImageIndex(nextIndex);
          // 加载对应图片的水印位置
          if (images[nextIndex]) {
            setWatermarkPosition({ ...images[nextIndex].watermarkPosition });
          }
          break;
        case "s":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            // 保存当前设置
            const currentSettings = {
              watermarkText,
              watermarkColor,
              watermarkOpacity,
              watermarkFontSize,
              watermarkType,
              watermarkImageUrl,
              exportSettings,
              watermarkPosition,
            };
            saveSettingsToStorage(currentSettings);
            showSnackbar("设置已保存", "success");
          }
          break;
      }
    },
    [
      images.length,
      selectedImageIndex,
      images,
      watermarkText,
      watermarkColor,
      watermarkOpacity,
      watermarkFontSize,
      watermarkType,
      watermarkImageUrl,
      exportSettings,
      watermarkPosition,
      saveSettingsToStorage,
      showSnackbar,
    ],
  );

  // 监听键盘事件
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // 重置滑动方向
  useEffect(() => {
    if (slideDirection) {
      const timer = setTimeout(() => {
        setSlideDirection(null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [slideDirection]);

  // 处理文件拖拽
  const handleFileDrop = useCallback(
    (filePaths: string[]) => {
      console.log("收到拖拽文件:", filePaths);

      // 过滤图片文件
      const imageExtensions = [
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".bmp",
        ".webp",
      ];
      const imageFiles = filePaths.filter((path) => {
        const ext = path.toLowerCase().substring(path.lastIndexOf("."));
        return imageExtensions.includes(ext);
      });

      if (imageFiles.length === 0) {
        alert("请拖拽图片文件！");
        return;
      }

      // 将文件路径转换为 File 对象
      const newImages: ImageItem[] = imageFiles.map((filePath, index) => {
        // 在 Electron 环境中，我们需要从文件路径创建 File 对象
        const fileName = filePath.substring(filePath.lastIndexOf("\\") + 1);
        const file = new File([], fileName, { type: "image/*" });

        return {
          id: Date.now() + index,
          file,
          url: `file://${filePath}`, // 使用 file:// 协议
          watermarkPosition: { ...watermarkPosition },
        };
      });

      setImages((prev) => [...prev, ...newImages]);
      if (selectedImageIndex === -1 && newImages.length > 0) {
        setSelectedImageIndex(0);
      }
    },
    [selectedImageIndex, watermarkPosition],
  );

  // 监听文件拖拽事件
  useEffect(() => {
    const handleFileDropEvent = (event: CustomEvent) => {
      const { files } = event.detail;
      handleFileDrop(files);
    };

    const handleElectronFileDropEvent = (event: CustomEvent) => {
      const { files, filePaths } = event.detail;
      console.log("Electron file drop event:", files, filePaths);

      // 在 Electron 环境中，直接使用文件对象
      if (files && files.length > 0) {
        // 过滤图片文件
        const imageFiles = Array.from(files).filter((file: any) => {
          const fileName = file.name.toLowerCase();
          const imageExtensions = [
            ".jpg",
            ".jpeg",
            ".png",
            ".gif",
            ".bmp",
            ".webp",
          ];
          return (
            file.type.startsWith("image/") ||
            imageExtensions.some((ext) => fileName.endsWith(ext))
          );
        });

        if (imageFiles.length > 0) {
          // 创建 FileList 对象
          const dataTransfer = new DataTransfer();
          imageFiles.forEach((file: any) => dataTransfer.items.add(file));

          // 直接处理文件上传
          const newImages: ImageItem[] = Array.from(dataTransfer.files).map(
            (file, index) => ({
              id: Date.now() + index,
              file,
              url: URL.createObjectURL(file),
              watermarkPosition: { ...watermarkPosition },
            }),
          );

          setImages((prev) => [...prev, ...newImages]);
          if (selectedImageIndex === -1 && newImages.length > 0) {
            setSelectedImageIndex(0);
          }
        } else {
          alert("请拖拽图片文件！");
        }
      }
    };

    document.addEventListener(
      "file-drop",
      handleFileDropEvent as EventListener,
    );

    document.addEventListener(
      "electron-file-drop",
      handleElectronFileDropEvent as EventListener,
    );

    return () => {
      document.removeEventListener(
        "file-drop",
        handleFileDropEvent as EventListener,
      );
      document.removeEventListener(
        "electron-file-drop",
        handleElectronFileDropEvent as EventListener,
      );
    };
  }, [handleFileDrop]);

  // 通用的设置保存函数
  const saveAllSettings = useCallback(() => {
    saveSettingsToStorage({
      watermarkText,
      watermarkColor,
      watermarkOpacity,
      watermarkFontSize,
      watermarkType,
      watermarkImageUrl,
      exportSettings,
      watermarkPosition,
    });
  }, [
    watermarkText,
    watermarkColor,
    watermarkOpacity,
    watermarkFontSize,
    watermarkType,
    watermarkImageUrl,
    exportSettings,
    watermarkPosition,
  ]);

  // 处理图片上传
  const handleImageUpload = useCallback(
    (files: FileList) => {
      console.log("handleImageUpload called with files:", files);

      const newImages: ImageItem[] = Array.from(files).map((file, index) => ({
        id: Date.now() + index,
        file,
        url: URL.createObjectURL(file),
        watermarkPosition: { ...watermarkPosition },
      }));

      console.log("Created new images:", newImages);

      setImages((prev) => [...prev, ...newImages]);
      if (selectedImageIndex === -1 && newImages.length > 0) {
        setSelectedImageIndex(0);
      }
    },
    [selectedImageIndex, watermarkPosition],
  );

  // 处理图片选择
  const handleImageSelect = useCallback(
    (index: number) => {
      console.log(
        `选择图片 ${index}，当前水印位置:`,
        images[index]?.watermarkPosition,
      );

      // 确定滑动方向
      if (selectedImageIndex !== -1) {
        const direction = index > selectedImageIndex ? "right" : "left";
        setSlideDirection(direction);
      }

      setSelectedImageIndex(index);
      if (images[index]) {
        // 加载该图片的独立水印位置设置
        setWatermarkPosition({ ...images[index].watermarkPosition });
      }
    },
    [images, selectedImageIndex],
  );

  // 处理水印位置更新
  const handleWatermarkUpdate = useCallback(
    (newPosition: WatermarkPosition) => {
      console.log(`更新图片 ${selectedImageIndex} 的水印位置:`, newPosition);
      setWatermarkPosition(newPosition);

      // 更新当前选中图片的水印位置
      if (selectedImageIndex >= 0) {
        setImages((prev) =>
          prev.map((img, index) =>
            index === selectedImageIndex
              ? { ...img, watermarkPosition: newPosition }
              : img,
          ),
        );
      }

      // 保存设置到localStorage
      setTimeout(() => saveAllSettings(), 0);
    },
    [selectedImageIndex, saveAllSettings],
  );

  // 处理水印图片上传
  const handleWatermarkImageChange = useCallback(
    (file: File) => {
      const url = URL.createObjectURL(file);
      setWatermarkImageUrl(url);
      console.log("水印图片已上传:", file.name);

      // 将文件转换为base64以便保存到localStorage
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setWatermarkImageUrl(base64);

        // 保存设置到localStorage
        setTimeout(() => saveAllSettings(), 0);
      };
      reader.readAsDataURL(file);
    },
    [saveAllSettings],
  );

  // 处理导出设置更新
  const handleExportSettingsChange = useCallback(
    (settings: { outputPath?: string }) => {
      setExportSettings((prev) => {
        const newSettings = { ...prev, ...settings };

        // 立刻保存整套设置到 localStorage，避免读取到旧的 state
        const mergedAllSettings = {
          watermarkText,
          watermarkColor,
          watermarkOpacity,
          watermarkFontSize,
          watermarkType,
          watermarkImageUrl,
          exportSettings: newSettings,
          watermarkPosition,
        };
        saveSettingsToStorage(mergedAllSettings);

        return newSettings;
      });
    },
    [
      watermarkText,
      watermarkColor,
      watermarkOpacity,
      watermarkFontSize,
      watermarkType,
      watermarkImageUrl,
      watermarkPosition,
    ],
  );

  // 验证导出路径
  const validateExportPath = useCallback((path: string): boolean => {
    if (!path) return true; // 空路径是允许的（使用默认下载）

    // 在Electron环境中验证路径
    if (window.electronAPI) {
      // 这里可以添加更复杂的路径验证逻辑
      // 目前简单检查是否包含路径分隔符
      return path.includes("/") || path.includes("\\");
    }

    // 浏览器环境中，路径验证相对简单
    return true;
  }, []);

  // 包装函数：处理水印文本更新
  const handleWatermarkTextChange = useCallback(
    (text: string) => {
      setWatermarkText(text);
      setTimeout(() => saveAllSettings(), 0);
    },
    [saveAllSettings],
  );

  // 包装函数：处理水印颜色更新
  const handleWatermarkColorChange = useCallback(
    (color: string) => {
      setWatermarkColor(color);
      setTimeout(() => saveAllSettings(), 0);
    },
    [saveAllSettings],
  );

  // 包装函数：处理水印透明度更新
  const handleWatermarkOpacityChange = useCallback(
    (opacity: number) => {
      setWatermarkOpacity(opacity);
      setTimeout(() => saveAllSettings(), 0);
    },
    [saveAllSettings],
  );

  // 包装函数：处理水印字体大小更新
  const handleWatermarkFontSizeChange = useCallback(
    (size: number) => {
      setWatermarkFontSize(size);
      setTimeout(() => saveAllSettings(), 0);
    },
    [saveAllSettings],
  );

  // 包装函数：处理水印类型更新
  const handleWatermarkTypeChange = useCallback(
    (type: "text" | "image") => {
      setWatermarkType(type);
      setTimeout(() => saveAllSettings(), 0);
    },
    [saveAllSettings],
  );

  // 应用到所有图片 - 将当前水印位置以百分比形式应用到所有图片
  const applyToAllImages = useCallback(() => {
    console.log("应用到所有图片，当前水印位置:", watermarkPosition);
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        watermarkPosition: { ...watermarkPosition }, // 使用百分比位置，适应每张图片
      })),
    );
  }, [watermarkPosition]);

  // 导出所有图片：打包为 zip，并保留原文件名与后缀格式
  const exportAllImages = useCallback(async () => {
    if (images.length === 0) return;

    // 显示开始导出的提示
    showSnackbar("正在处理图片，请稍候...", "info");

    const { saveAs } = await import("file-saver");
    const JSZip = (await import("jszip")).default;

    const zip = new JSZip();

    // 根据原文件名推断导出 mime 与后缀，保持原格式
    const resolveMimeAndExt = (
      fileName: string,
    ): { mime: string; ext: string; bg: string | null } => {
      const match = /\.([a-zA-Z0-9]+)$/.exec(fileName);
      const ext = (match?.[1] || "png").toLowerCase();

      // 根据原文件扩展名确定格式，保持原格式不变
      switch (ext) {
        case "jpg":
        case "jpeg":
          return { mime: "image/jpeg", ext: ext, bg: "#ffffff" };
        case "png":
          return { mime: "image/png", ext: ext, bg: null };
        case "webp":
          return { mime: "image/webp", ext: ext, bg: null };
        case "gif":
          return { mime: "image/gif", ext: ext, bg: null };
        case "bmp":
          return { mime: "image/bmp", ext: ext, bg: "#ffffff" };
        case "tiff":
        case "tif":
          return { mime: "image/tiff", ext: ext, bg: null };
        default:
          // 对于不支持的格式，保持原扩展名但使用PNG格式
          return { mime: "image/png", ext: ext, bg: null };
      }
    };

    // 预加载水印图片（如果使用图片水印）
    let watermarkImg: HTMLImageElement | null = null;
    if (watermarkType === "image" && watermarkImageUrl) {
      watermarkImg = new Image();
      await new Promise((resolve, reject) => {
        watermarkImg!.onload = resolve;
        watermarkImg!.onerror = reject;
        watermarkImg!.src = watermarkImageUrl;
      });
    }

    // 批量处理所有图片
    const processPromises = images.map(async (image, index) => {
      console.log(`处理第 ${index + 1} 张图片:`, image.file.name);

      const { mime, ext, bg } = resolveMimeAndExt(image.file.name);
      const watermarkPosition = image.watermarkPosition;

      try {
        // 获取图片实际尺寸
        const imageSize = await new Promise<{ width: number; height: number }>(
          (resolve) => {
            const img = new Image();
            img.onload = () => {
              resolve({ width: img.width, height: img.height });
            };
            img.src = image.url;
          },
        );

        // 创建一个临时的canvas来合成图片和水印
        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");
        tempCanvas.width = imageSize.width;
        tempCanvas.height = imageSize.height;

        if (tempCtx) {
          // 设置背景色
          if (bg) {
            tempCtx.fillStyle = bg;
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
          }

          // 绘制原图
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = image.url;
          });

          tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);

          // 绘制水印
          if (watermarkType === "text" && watermarkText) {
            tempCtx.save();
            tempCtx.globalAlpha = watermarkOpacity;
            tempCtx.fillStyle = watermarkColor;
            tempCtx.font = `bold ${watermarkFontSize}px Arial`;
            tempCtx.textAlign = "center";
            tempCtx.textBaseline = "middle";

            // 计算水印位置（基于百分比）
            const watermarkX = watermarkPosition.x * tempCanvas.width;
            const watermarkY = watermarkPosition.y * tempCanvas.height;
            const watermarkWidth = watermarkPosition.width * tempCanvas.width;
            const watermarkHeight =
              watermarkPosition.height * tempCanvas.height;

            // 应用旋转
            if (watermarkPosition.rotation !== 0) {
              tempCtx.translate(
                watermarkX + watermarkWidth / 2,
                watermarkY + watermarkHeight / 2,
              );
              tempCtx.rotate((watermarkPosition.rotation * Math.PI) / 180);
              tempCtx.fillText(watermarkText, 0, 0);
              tempCtx.setTransform(1, 0, 0, 1, 0, 0);
            } else {
              tempCtx.fillText(
                watermarkText,
                watermarkX + watermarkWidth / 2,
                watermarkY + watermarkHeight / 2,
              );
            }
            tempCtx.restore();
          } else if (watermarkType === "image" && watermarkImg) {
            tempCtx.save();
            tempCtx.globalAlpha = watermarkOpacity;

            // 计算水印位置和尺寸
            const watermarkWidth = watermarkPosition.width * tempCanvas.width;
            const watermarkHeight =
              watermarkPosition.height * tempCanvas.height;
            const watermarkX = watermarkPosition.x * tempCanvas.width;
            const watermarkY = watermarkPosition.y * tempCanvas.height;

            // 应用旋转
            if (watermarkPosition.rotation !== 0) {
              tempCtx.translate(
                watermarkX + watermarkWidth / 2,
                watermarkY + watermarkHeight / 2,
              );
              tempCtx.rotate((watermarkPosition.rotation * Math.PI) / 180);
              tempCtx.drawImage(
                watermarkImg,
                -watermarkWidth / 2,
                -watermarkHeight / 2,
                watermarkWidth,
                watermarkHeight,
              );
              tempCtx.setTransform(1, 0, 0, 1, 0, 0);
            } else {
              tempCtx.drawImage(
                watermarkImg,
                watermarkX,
                watermarkY,
                watermarkWidth,
                watermarkHeight,
              );
            }
            tempCtx.restore();
          }

          // 将临时canvas转换为blob，设置合适的质量
          const quality = mime === "image/jpeg" ? 0.9 : 1.0;
          const blob: Blob | null = await new Promise((resolve) =>
            tempCanvas.toBlob((b) => resolve(b), mime, quality),
          );

          if (blob) {
            const originalName = image.file.name.replace(/\.[^.]+$/, "");
            const outName = `watermarked_${originalName}.${ext}`;
            zip.file(outName, blob);
            console.log(
              `成功添加文件到ZIP: ${outName}, 大小: ${(
                blob.size /
                1024 /
                1024
              ).toFixed(2)}MB`,
            );
          }
        }
      } catch (error) {
        console.error(`处理图片 ${image.file.name} 时出错:`, error);
      }
    });

    // 并行处理所有图片
    await Promise.all(processPromises);

    const zipBlob = await zip.generateAsync({ type: "blob" });

    // 使用当前时间生成文件名
    const now = new Date();
    const timestamp =
      now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, "0") +
      now.getDate().toString().padStart(2, "0") +
      "_" +
      now.getHours().toString().padStart(2, "0") +
      now.getMinutes().toString().padStart(2, "0") +
      now.getSeconds().toString().padStart(2, "0");
    const fileName = `watermarked_images_${timestamp}.zip`;

    // 验证导出路径
    if (
      exportSettings.outputPath &&
      !validateExportPath(exportSettings.outputPath)
    ) {
      alert("导出路径格式不正确，请重新输入或使用选择按钮选择路径");
      return;
    }

    // 如果有设置保存路径，使用Electron API保存到指定位置
    if (exportSettings.outputPath && window.electronAPI) {
      try {
        await window.electronAPI.saveFile({
          data: await zipBlob.arrayBuffer(),
          fileName: fileName,
          filePath: exportSettings.outputPath,
        });
        console.log("导出完成，ZIP文件已保存到:", exportSettings.outputPath);
        showSnackbar(
          `导出完成！文件已保存到: ${exportSettings.outputPath}`,
          "success",
        );
      } catch (error) {
        console.error("保存文件失败:", error);
        showSnackbar(`保存失败: ${error}`, "error");
        // 清除无效路径
        handleExportSettingsChange({ outputPath: "" });
        // 如果保存失败，回退到浏览器下载
        saveAs(zipBlob, fileName);
        console.log("回退到浏览器下载，ZIP文件已下载:", fileName);
        showSnackbar("已回退到浏览器下载", "info");
      }
    } else {
      // 浏览器环境或未设置路径，使用默认下载
      saveAs(zipBlob, fileName);
      console.log("导出完成，ZIP文件已下载:", fileName);
      showSnackbar(`导出完成！文件已下载: ${fileName}`, "success");
    }
  }, [
    images,
    watermarkText,
    watermarkColor,
    watermarkOpacity,
    watermarkFontSize,
    watermarkType,
    watermarkImageUrl,
    exportSettings.outputPath,
    validateExportPath,
    handleExportSettingsChange,
  ]);

  // 删除图片
  const handleDeleteImage = useCallback(
    (index: number) => {
      setImages((prev) => {
        const newImages = prev.filter((_, i) => i !== index);
        if (selectedImageIndex === index) {
          setSelectedImageIndex(newImages.length > 0 ? 0 : -1);
        } else if (selectedImageIndex > index) {
          setSelectedImageIndex(selectedImageIndex - 1);
        }
        return newImages;
      });
    },
    [selectedImageIndex],
  );

  // 清除所有图片
  const handleClearAll = useCallback(() => {
    setImages([]);
    setSelectedImageIndex(-1);
  }, []);

  // 清除水印设置
  const handleClearSettings = useCallback(() => {
    // 重置为默认设置
    const defaultSettings = {
      watermarkText: "Watermark",
      watermarkColor: "#ffffff",
      watermarkOpacity: 1.0,
      watermarkFontSize: 24,
      watermarkType: "text" as "text" | "image",
      watermarkImageUrl: "",
      exportSettings: {
        outputPath: "",
      },
      watermarkPosition: {
        x: 0.5,
        y: 0.5,
        width: 0.3,
        height: 0.1,
        rotation: 0,
      },
    };

    // 更新状态
    setWatermarkText(defaultSettings.watermarkText);
    setWatermarkColor(defaultSettings.watermarkColor);
    setWatermarkOpacity(defaultSettings.watermarkOpacity);
    setWatermarkFontSize(defaultSettings.watermarkFontSize);
    setWatermarkType(defaultSettings.watermarkType);
    setWatermarkImageUrl(defaultSettings.watermarkImageUrl);
    setExportSettings(defaultSettings.exportSettings);
    setWatermarkPosition(defaultSettings.watermarkPosition);

    // 清除localStorage中的设置
    localStorage.removeItem("watermarkEditorSettings");

    console.log("水印设置已清除");
  }, []);

  const selectedImage =
    selectedImageIndex >= 0 ? images[selectedImageIndex] : null;

  return (
    <div className="watermark-editor">
      <div className="editor-header">
        <h1 className="text-2xl font-bold text-gray-800">图片水印编辑器</h1>
        {images.length > 0 && (
          <div className="text-sm text-gray-600 mt-1">
            键盘快捷键：↑↓ 切换图片 | Ctrl+S 保存设置
          </div>
        )}
      </div>

      <div className="editor-content">
        {/* 左侧图片列表 */}
        <div className="image-list-panel">
          <ImageList
            images={images}
            selectedIndex={selectedImageIndex}
            onImageSelect={handleImageSelect}
            onImageUpload={handleImageUpload}
            onDeleteImage={handleDeleteImage}
            onClearAll={handleClearAll}
          />
        </div>

        {/* 中间预览区域 */}
        <div className="preview-panel">
          <PreviewArea
            ref={previewRef}
            image={selectedImage}
            watermarkText={watermarkText}
            watermarkColor={watermarkColor}
            watermarkOpacity={watermarkOpacity}
            watermarkFontSize={watermarkFontSize}
            watermarkType={watermarkType}
            watermarkImageUrl={watermarkImageUrl}
            watermarkPosition={watermarkPosition}
            onWatermarkUpdate={handleWatermarkUpdate}
            watermarkRef={watermarkRef}
            slideDirection={slideDirection}
          />
        </div>

        {/* 右侧设置面板 */}
        <div className="settings-panel">
          <SettingsPanel
            watermarkText={watermarkText}
            watermarkColor={watermarkColor}
            watermarkOpacity={watermarkOpacity}
            watermarkFontSize={watermarkFontSize}
            watermarkType={watermarkType}
            watermarkImageUrl={watermarkImageUrl}
            onWatermarkTextChange={handleWatermarkTextChange}
            onWatermarkColorChange={handleWatermarkColorChange}
            onWatermarkOpacityChange={handleWatermarkOpacityChange}
            onWatermarkFontSizeChange={handleWatermarkFontSizeChange}
            onWatermarkTypeChange={handleWatermarkTypeChange}
            onWatermarkImageChange={handleWatermarkImageChange}
            exportSettings={exportSettings}
            onExportSettingsChange={handleExportSettingsChange}
            onApplyToAll={applyToAllImages}
            onExportAll={exportAllImages}
            onClearSettings={handleClearSettings}
            imageCount={images.length}
          />
        </div>
      </div>

      {/* Snackbar 提示 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default WatermarkEditor;
