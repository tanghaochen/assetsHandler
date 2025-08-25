import React, { forwardRef, useEffect, useState } from "react";
import Moveable from "react-moveable";
import { ImageItem, WatermarkPosition } from "./types";

interface PreviewAreaProps {
  image: ImageItem | null;
  watermarkText: string;
  watermarkColor: string;
  watermarkOpacity: number;
  watermarkFontSize: number;
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
      watermarkPosition,
      onWatermarkUpdate,
      watermarkRef,
    },
    ref,
  ) => {
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const [showMoveable, setShowMoveable] = useState(false);

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

    const handleDrag = (e: any) => {
      console.log("Drag event:", e);

      // 获取图片容器的边界
      const imageContainer = e.target.parentElement;
      const watermarkRect = e.target.getBoundingClientRect();

      // 计算新的位置
      let newLeft = watermarkRect.left - imageContainer.offsetLeft;
      let newTop = watermarkRect.top - imageContainer.offsetTop;

      // 限制在图片范围内
      const maxLeft = imageSize.width - watermarkRect.width;
      const maxTop = imageSize.height - watermarkRect.height;

      newLeft = Math.max(0, Math.min(maxLeft, newLeft));
      newTop = Math.max(0, Math.min(maxTop, newTop));

      // 应用限制后的位置
      e.target.style.left = `${newLeft}px`;
      e.target.style.top = `${newTop}px`;
      e.target.style.transform = e.transform.replace(/translate\([^)]+\)/, "");

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

      // 限制最大尺寸不超过图片
      const maxWidth = imageSize.width;
      const maxHeight = imageSize.height;

      const newWidth = Math.min(e.width, maxWidth);
      const newHeight = Math.min(e.height, maxHeight);

      // 应用尺寸
      e.target.style.width = `${newWidth}px`;
      e.target.style.height = `${newHeight}px`;
      e.target.style.transform = e.drag.transform;

      // 确保位置不超出边界
      const currentLeft = parseFloat(e.target.style.left) || 0;
      const currentTop = parseFloat(e.target.style.top) || 0;

      if (currentLeft + newWidth > maxWidth) {
        e.target.style.left = `${maxWidth - newWidth}px`;
      }
      if (currentTop + newHeight > maxHeight) {
        e.target.style.top = `${maxHeight - newHeight}px`;
      }

      // 计算百分比尺寸
      const widthPercent = newWidth / imageSize.width;
      const heightPercent = newHeight / imageSize.height;

      onWatermarkUpdate({
        ...watermarkPosition,
        width: Math.max(0.1, Math.min(1, widthPercent)),
        height: Math.max(0.05, Math.min(1, heightPercent)),
      });
    };

    const handleRotate = (e: any) => {
      console.log("Rotate event:", e);
      e.target.style.transform = e.transform;

      // 从transform中提取旋转角度
      const rotation = parseFloat(
        e.transform.match(/rotate\(([^)]+)deg\)/)?.[1] || "0",
      );

      onWatermarkUpdate({
        ...watermarkPosition,
        rotation,
      });
    };

    const getWatermarkStyle = () => {
      if (!imageSize.width || !imageSize.height) return {};

      // 计算像素尺寸 - 直接使用图片尺寸
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
        backgroundColor: "rgba(255,255,255,0.1)",
        border: "1px solid rgba(0,0,0,0.1)",
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
            style={{
              position: "relative",
              width: `${imageSize.width}px`,
              height: `${imageSize.height}px`,
              maxWidth: "100%",
              maxHeight: "100%",
              backgroundImage: `url(${image.url})`,
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              border: "1px solid #ccc",
            }}
          >
            <div
              ref={watermarkRef}
              className="watermark-element"
              style={getWatermarkStyle()}
            >
              {watermarkText}
            </div>
            {showMoveable && watermarkRef.current && (
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
                onDrag={(e) => {
                  e.target.style.transform = e.transform;
                }}
                onScale={(e) => {
                  e.target.style.transform = e.drag.transform;
                }}
                onBound={(e) => {
                  console.log(e);
                }}
              />
            )}
          </div>
        </div>

        <div className="preview-footer">
          <p className="text-sm text-gray-500">
            拖拽水印调整位置，拖拽边缘调整大小，拖拽旋转手柄调整角度
          </p>
        </div>
      </div>
    );
  },
);

PreviewArea.displayName = "PreviewArea";

export default PreviewArea;
