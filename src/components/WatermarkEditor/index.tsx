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
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(0.7);
  const [watermarkFontSize, setWatermarkFontSize] = useState<number>(24);
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

  // 导出所有图片
  const exportAllImages = useCallback(async () => {
    if (images.length === 0) return;

    const { saveAs } = await import("file-saver");
    const html2canvas = (await import("html2canvas")).default;

    for (let i = 0; i < images.length; i++) {
      setSelectedImageIndex(i);

      // 等待DOM更新
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (previewRef.current) {
        const canvas = await html2canvas(previewRef.current, {
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
        });

        canvas.toBlob((blob) => {
          if (blob) {
            const fileName = `watermarked_${images[i].file.name}`;
            saveAs(blob, fileName);
          }
        });
      }
    }
  }, [images]);

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
            onWatermarkTextChange={setWatermarkText}
            onWatermarkColorChange={setWatermarkColor}
            onWatermarkOpacityChange={setWatermarkOpacity}
            onWatermarkFontSizeChange={setWatermarkFontSize}
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
