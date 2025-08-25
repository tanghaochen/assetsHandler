import React, { useState, useRef, useCallback } from "react";
import ImageList from "./ImageList";
import PreviewArea from "./PreviewArea";
import SettingsPanel from "./SettingsPanel";
import { ImageItem, WatermarkPosition } from "./types";
import "./WatermarkEditor.css";

const WatermarkEditor: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1);
  const [watermarkText, setWatermarkText] = useState<string>("Watermark");
  const [watermarkColor, setWatermarkColor] = useState<string>("#ffffff");
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(1.0);
  const [watermarkFontSize, setWatermarkFontSize] = useState<number>(24);
  const [watermarkType, setWatermarkType] = useState<"text" | "image">("text");
  const [watermarkImageUrl, setWatermarkImageUrl] = useState<string>("");
  const [exportSettings, setExportSettings] = useState({
    outputPath: "",
  });
  const [watermarkPosition, setWatermarkPosition] = useState<WatermarkPosition>(
    {
      x: 0.5,
      y: 0.5,
      width: 0.3,
      height: 0.1,
      rotation: 0,
    },
  );

  const previewRef = useRef<HTMLDivElement>(null);
  const watermarkRef = useRef<HTMLDivElement>(null);

  // 处理图片上传
  const handleImageUpload = useCallback(
    (files: FileList) => {
      const newImages: ImageItem[] = Array.from(files).map((file, index) => ({
        id: Date.now() + index,
        file,
        url: URL.createObjectURL(file),
        watermarkPosition: { ...watermarkPosition },
      }));

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
      setSelectedImageIndex(index);
      if (images[index]) {
        // 加载该图片的独立水印位置设置
        setWatermarkPosition({ ...images[index].watermarkPosition });
      }
    },
    [images],
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
    },
    [selectedImageIndex],
  );

  // 处理水印图片上传
  const handleWatermarkImageChange = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setWatermarkImageUrl(url);
    console.log("水印图片已上传:", file.name);
  }, []);

  // 处理导出设置更新
  const handleExportSettingsChange = useCallback(
    (settings: { outputPath?: string }) => {
      setExportSettings((prev) => ({ ...prev, ...settings }));
    },
    [],
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

    const { saveAs } = await import("file-saver");
    const html2canvas = (await import("html2canvas")).default;
    const JSZip = (await import("jszip")).default;

    const zip = new JSZip();

    // 根据原文件名推断导出 mime 与后缀
    const resolveMimeAndExt = (
      fileName: string,
    ): { mime: string; ext: string; bg: string | null } => {
      const match = /\.([a-zA-Z0-9]+)$/.exec(fileName);
      const ext = (match?.[1] || "png").toLowerCase();
      // 默认透明背景；对于 jpeg 等不支持透明的格式使用白底
      switch (ext) {
        case "jpg":
        case "jpeg":
          return { mime: "image/jpeg", ext: ext, bg: "#ffffff" };
        case "png":
          return { mime: "image/png", ext: "png", bg: null };
        case "webp":
          return { mime: "image/webp", ext: "webp", bg: null };
        default:
          // 其他格式统一转为 png 并修改后缀
          return { mime: "image/png", ext: "png", bg: null };
      }
    };

    // 临时保存当前选中的图片索引和水印位置
    const originalSelectedIndex = selectedImageIndex;
    const originalWatermarkPosition = { ...watermarkPosition };

    for (let i = 0; i < images.length; i++) {
      console.log(`导出第 ${i + 1} 张图片:`, images[i].file.name);
      console.log(`水印位置设置:`, images[i].watermarkPosition);

      // 切换到当前图片并应用其水印位置设置
      setSelectedImageIndex(i);
      setWatermarkPosition({ ...images[i].watermarkPosition });

      // 等待DOM更新，确保水印位置正确应用
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (previewRef.current) {
        // 临时隐藏所有 moveable 控件和预览区域的交互元素
        const moveableElements = previewRef.current.querySelectorAll(
          '[class*="moveable"], [class*="Moveable"]',
        );
        const originalDisplay: string[] = [];
        moveableElements.forEach((el) => {
          originalDisplay.push((el as HTMLElement).style.display);
          (el as HTMLElement).style.display = "none";
        });

        // 隐藏预览区域的交互提示
        const previewFooter =
          previewRef.current.querySelector(".preview-footer");
        if (previewFooter) {
          (previewFooter as HTMLElement).style.display = "none";
        }

        const { mime, ext, bg } = resolveMimeAndExt(images[i].file.name);

        try {
          const canvas = await html2canvas(previewRef.current, {
            useCORS: true,
            allowTaint: true,
            backgroundColor: bg, // jpeg 使用白底，其余保持透明
            scale: 1, // 确保1:1比例
            logging: false, // 关闭日志
            removeContainer: false, // 不移除容器
          });

          // 恢复 moveable 控件的显示
          moveableElements.forEach((el, index) => {
            (el as HTMLElement).style.display = originalDisplay[index];
          });

          // 恢复预览区域提示
          if (previewFooter) {
            (previewFooter as HTMLElement).style.display = "";
          }

          // 将 canvas 转为指定格式的 Blob 并添加到 zip
          const blob: Blob | null = await new Promise((resolve) =>
            canvas.toBlob((b) => resolve(b), mime),
          );

          if (blob) {
            // 保留原文件名（加前缀），并确保后缀与导出格式一致
            const originalName = images[i].file.name.replace(/\.[^.]+$/, "");
            const outName = `watermarked_${originalName}.${ext}`;
            zip.file(outName, blob);
            console.log(`成功添加文件到ZIP: ${outName}`);
          }
        } catch (error) {
          console.error(`导出图片 ${images[i].file.name} 时出错:`, error);
        }
      }
    }

    // 恢复原始选中的图片索引和水印位置
    setSelectedImageIndex(originalSelectedIndex);
    setWatermarkPosition(originalWatermarkPosition);

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

    // 如果有设置保存路径，使用Electron API保存到指定位置
    if (exportSettings.outputPath && window.electronAPI) {
      try {
        await window.electronAPI.saveFile({
          data: await zipBlob.arrayBuffer(),
          fileName: fileName,
          filePath: exportSettings.outputPath,
        });
        console.log("导出完成，ZIP文件已保存到:", exportSettings.outputPath);
      } catch (error) {
        console.error("保存文件失败:", error);
        // 如果保存失败，回退到浏览器下载
        saveAs(zipBlob, fileName);
        console.log("回退到浏览器下载，ZIP文件已下载:", fileName);
      }
    } else {
      // 浏览器环境或未设置路径，使用默认下载
      saveAs(zipBlob, fileName);
      console.log("导出完成，ZIP文件已下载:", fileName);
    }
  }, [images, selectedImageIndex, watermarkPosition]);

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

  const selectedImage =
    selectedImageIndex >= 0 ? images[selectedImageIndex] : null;

  return (
    <div className="watermark-editor">
      <div className="editor-header">
        <h1 className="text-2xl font-bold text-gray-800">图片水印编辑器</h1>
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
            onWatermarkTextChange={setWatermarkText}
            onWatermarkColorChange={setWatermarkColor}
            onWatermarkOpacityChange={setWatermarkOpacity}
            onWatermarkFontSizeChange={setWatermarkFontSize}
            onWatermarkTypeChange={setWatermarkType}
            onWatermarkImageChange={handleWatermarkImageChange}
            exportSettings={exportSettings}
            onExportSettingsChange={handleExportSettingsChange}
            onApplyToAll={applyToAllImages}
            onExportAll={exportAllImages}
            imageCount={images.length}
          />
        </div>
      </div>
    </div>
  );
};

export default WatermarkEditor;
