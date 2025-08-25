import React, { forwardRef, useEffect, useState } from "react";
import Moveable from "react-moveable";
import { ImageItem, WatermarkPosition } from "./types";

interface PreviewAreaProps {
  image: ImageItem | null;
  watermarkText: string;
  watermarkColor: string;
  watermarkOpacity: number;
  watermarkFontSize: number;
  watermarkType: "text" | "image";
  watermarkImageUrl?: string;
  watermarkPosition: WatermarkPosition;
  onWatermarkUpdate: (position: WatermarkPosition) => void;
  watermarkRef: React.RefObject<HTMLDivElement>;
}

const PreviewArea = forwardRef<HTMLDivElement, PreviewAreaProps>(
  (
    {
      image,
      watermarkText,
      watermarkColor,
      watermarkOpacity,
      watermarkFontSize,
      watermarkType,
      watermarkImageUrl,
      watermarkPosition,
      onWatermarkUpdate,
      watermarkRef,
    },
    ref,
  ) => {
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const [showMoveable, setShowMoveable] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
      if (image) {
        const img = new window.Image();
        img.onload = () => {
          setImageSize({ width: img.width, height: img.height });
          setShowMoveable(true);
          console.log("Image loaded, size:", {
            width: img.width,
            height: img.height,
          });
        };
        img.src = image.url;
      } else {
        setShowMoveable(false);
      }
    }, [image?.id]); // 只在图片ID变化时重新加载

    useEffect(() => {
      console.log("ShowMoveable state:", showMoveable);
      console.log("WatermarkRef current:", watermarkRef.current);
    }, [showMoveable]);

    // 当水印位置变化时，更新水印元素的样式
    useEffect(() => {
      if (watermarkRef.current && imageSize.width && imageSize.height) {
        const style = getWatermarkStyle();
        Object.assign(watermarkRef.current.style, style);
      }
    }, [watermarkPosition, imageSize.width, imageSize.height]);

    const handleDrag = (e: any) => {
      console.log("Drag event:", e);
      // 让 Moveable 正常处理拖拽
      e.target.style.transform = e.transform;
    };

    const handleDragEnd = (e: any) => {
      console.log("Drag end event:", e);

      // 拖拽结束后计算百分比位置
      const rect = e.target.getBoundingClientRect();
      const containerRect = e.target.parentElement.getBoundingClientRect();

      const newLeft = rect.left - containerRect.left;
      const newTop = rect.top - containerRect.top;

      // 计算百分比位置
      const x = newLeft / imageSize.width;
      const y = newTop / imageSize.height;

      onWatermarkUpdate({
        ...watermarkPosition,
        x: Math.max(0, Math.min(1 - watermarkPosition.width, x)),
        y: Math.max(0, Math.min(1 - watermarkPosition.height, y)),
      });
    };

    const handleResize = (e: any) => {
      console.log("Resize event:", e);
      // 让 Moveable 正常处理缩放
      e.target.style.transform = e.transform;
    };

    const handleResizeEnd = (e: any) => {
      console.log("Resize end event:", e);

      // 获取缩放后的实际位置和尺寸
      const rect = e.target.getBoundingClientRect();
      const containerRect = e.target.parentElement.getBoundingClientRect();

      // 计算相对于容器的位置
      const newLeft = rect.left - containerRect.left;
      const newTop = rect.top - containerRect.top;
      const newWidth = rect.width;
      const newHeight = rect.height;

      // 计算百分比位置和尺寸
      const x = newLeft / imageSize.width;
      const y = newTop / imageSize.height;
      const widthPercent = newWidth / imageSize.width;
      const heightPercent = newHeight / imageSize.height;

      // 确保位置和尺寸在有效范围内
      const clampedX = Math.max(0, Math.min(1 - widthPercent, x));
      const clampedY = Math.max(0, Math.min(1 - heightPercent, y));
      const clampedWidth = Math.max(0.1, Math.min(1, widthPercent));
      const clampedHeight = Math.max(0.05, Math.min(1, heightPercent));

      console.log("Resize calculations:", {
        original: { x: newLeft, y: newTop, width: newWidth, height: newHeight },
        percent: { x, y, width: widthPercent, height: heightPercent },
        clamped: {
          x: clampedX,
          y: clampedY,
          width: clampedWidth,
          height: clampedHeight,
        },
      });

      onWatermarkUpdate({
        ...watermarkPosition,
        x: clampedX,
        y: clampedY,
        width: clampedWidth,
        height: clampedHeight,
      });
    };

    const handleRotate = (e: any) => {
      console.log("Rotate event:", e);
      // 让 Moveable 正常处理旋转
      e.target.style.transform = e.transform;
    };

    const handleRotateEnd = (e: any) => {
      console.log("Rotate end event:", e);

      // 旋转结束后提取旋转角度
      const rotation = parseFloat(
        e.transform.match(/rotate\(([^)]+)deg\)/)?.[1] || "0",
      );

      onWatermarkUpdate({
        ...watermarkPosition,
        rotation,
      });
    };

    const handleMouseEnter = () => {
      setIsHovered(true);
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
    };

    const getWatermarkStyle = () => {
      if (!imageSize.width || !imageSize.height) return {};

      // 计算像素尺寸 - 将百分比位置转换为像素位置，适应不同尺寸的图片
      const pixelWidth = watermarkPosition.width * imageSize.width;
      const pixelHeight = watermarkPosition.height * imageSize.height;
      const pixelX = watermarkPosition.x * imageSize.width;
      const pixelY = watermarkPosition.y * imageSize.height;

      return {
        position: "absolute" as const,
        left: `${pixelX}px`,
        top: `${pixelY}px`,
        width: `${pixelWidth}px`,
        height: `${pixelHeight}px`,
        transform: `rotate(${watermarkPosition.rotation}deg)`,
        color: watermarkColor,
        opacity: watermarkOpacity,
        fontSize: `${watermarkFontSize}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none" as const,
        cursor: "move",
        textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
        fontWeight: "bold" as const,
        whiteSpace: "nowrap" as const,
        overflow: "hidden" as const,
        textOverflow: "ellipsis" as const,
        pointerEvents: "auto" as const,
        zIndex: 1000,
      };
    };

    if (!image) {
      return (
        <div ref={ref} className="preview-area empty">
          <div className="empty-preview">
            <svg
              className="w-24 h-24 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-gray-500 text-lg mt-4">请选择一张图片进行预览</p>
          </div>
        </div>
      );
    }

    return (
      <div ref={ref} className="preview-area">
        <div className="preview-header">
          <h3 className="text-lg font-semibold text-gray-700">预览区域</h3>
          <div className="image-info">
            <span className="text-sm text-gray-500">
              {imageSize.width} × {imageSize.height} px
            </span>
          </div>
        </div>

        <div className="preview-container">
          <div
            className="image-container"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
              position: "relative",
              width: `${imageSize.width}px`,
              height: `${imageSize.height}px`,
              maxWidth: "100%",
              maxHeight: "100%",
              border: "1px solid #ccc",
            }}
          >
            <img
              src={image.url}
              alt={image.file.name}
              draggable={false}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                objectPosition: "center",
                display: "block",
                userSelect: "none",
              }}
            />
            <div
              ref={watermarkRef}
              className="watermark-element"
              style={getWatermarkStyle()}
            >
              {watermarkType === "text" && watermarkText}
              {watermarkType === "image" && watermarkImageUrl && (
                <img
                  src={watermarkImageUrl}
                  alt="水印图片"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "fill",
                    opacity: watermarkOpacity,
                  }}
                />
              )}
            </div>
            {showMoveable && watermarkRef.current && isHovered && (
              <Moveable
                target={watermarkRef.current}
                draggable={true}
                throttleDrag={1}
                edgeDraggable={false}
                startDragRotate={0}
                throttleDragRotate={0}
                scalable={true}
                keepRatio={false}
                throttleScale={0}
                snappable={true}
                bounds={{
                  left: 0,
                  top: 0,
                  right: 0,
                  bottom: 0,
                  position: "css",
                }}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                onScale={handleResize}
                onScaleEnd={handleResizeEnd}
                onRotate={handleRotate}
                onRotateEnd={handleRotateEnd}
              />
            )}
          </div>
        </div>
      </div>
    );
  },
);

PreviewArea.displayName = "PreviewArea";

export default PreviewArea;
