import React, { forwardRef, useEffect, useState, useRef } from "react";
import Moveable from "react-moveable";
import Selecto from "react-selecto";
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
  slideDirection?: "left" | "right" | null;
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
      slideDirection,
    },
    ref,
  ) => {
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const [originalImageSize, setOriginalImageSize] = useState({
      width: 0,
      height: 0,
    });
    const [scale, setScale] = useState(1);
    const [showMoveable, setShowMoveable] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [animationKey, setAnimationKey] = useState(0);
    const [previousImageId, setPreviousImageId] = useState<string | null>(null);
    const [isWatermarkFocused, setIsWatermarkFocused] = useState(true);

    // 添加框选相关状态
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectionBox, setSelectionBox] = useState<{
      x: number;
      y: number;
      width: number;
      height: number;
    } | null>(null);

    // 框选容器引用
    const selectoContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (image) {
        // 触发动画
        setIsAnimating(true);
        setAnimationKey((prev) => prev + 1);

        const img = new window.Image();
        img.onload = () => {
          // 保存原始尺寸
          setOriginalImageSize({ width: img.width, height: img.height });

          // 默认缩放为100%
          const initialScale = 1;

          // 计算适合预览区域的图片显示尺寸
          const containerWidth = 600; // 预览容器的最大宽度
          const containerHeight = 400; // 预览容器的最大高度

          const imgAspectRatio = img.width / img.height;
          const containerAspectRatio = containerWidth / containerHeight;

          let displayWidth, displayHeight;

          if (imgAspectRatio > containerAspectRatio) {
            // 图片更宽，以宽度为准
            displayWidth = Math.min(img.width, containerWidth);
            displayHeight = displayWidth / imgAspectRatio;
          } else {
            // 图片更高，以高度为准
            displayHeight = Math.min(img.height, containerHeight);
            displayWidth = displayHeight * imgAspectRatio;
          }

          // 确保尺寸是整数，避免像素对齐问题
          displayWidth = Math.round(displayWidth);
          displayHeight = Math.round(displayHeight);

          setScale(initialScale);
          setImageSize({ width: displayWidth, height: displayHeight });
          setShowMoveable(true);

          console.log("Image loaded, original size:", {
            width: img.width,
            height: img.height,
          });
          console.log("Display size:", {
            width: displayWidth,
            height: displayHeight,
          });
          console.log("Initial scale:", initialScale);

          // 动画结束后重置状态
          setTimeout(() => {
            setIsAnimating(false);
          }, 500);
        };

        // 添加错误处理
        img.onerror = () => {
          console.error("Failed to load image:", image.url);
          setIsAnimating(false);
        };

        img.src = image.url;

        // 更新前一个图片ID
        setPreviousImageId(image.id.toString());
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
      if (
        watermarkRef.current &&
        originalImageSize.width &&
        originalImageSize.height
      ) {
        const style = getWatermarkStyle();
        Object.assign(watermarkRef.current.style, style);
      }
    }, [
      watermarkPosition,
      originalImageSize.width,
      originalImageSize.height,
      scale,
    ]);

    // 确保容器尺寸和图片尺寸完全同步
    useEffect(() => {
      if (originalImageSize.width && originalImageSize.height && scale) {
        // 强制重新计算容器尺寸
        const containerWidth = Math.round(originalImageSize.width * scale);
        const containerHeight = Math.round(originalImageSize.height * scale);

        // 检查当前尺寸是否匹配，如果不匹配则强制更新
        if (
          imageSize.width !== containerWidth ||
          imageSize.height !== containerHeight
        ) {
          setImageSize({ width: containerWidth, height: containerHeight });

          console.log("Container size corrected:", {
            oldSize: imageSize,
            newSize: { width: containerWidth, height: containerHeight },
            scale,
            originalSize: originalImageSize,
          });
        }
      }
    }, [
      originalImageSize.width,
      originalImageSize.height,
      scale,
      imageSize.width,
      imageSize.height,
    ]);

    // 添加键盘事件监听器
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (
          !isWatermarkFocused ||
          !originalImageSize.width ||
          !originalImageSize.height
        ) {
          return;
        }

        const moveStep = 1; // 移动1像素
        const scaledStep = moveStep / scale; // 根据缩放调整步长

        let newX = watermarkPosition.x;
        let newY = watermarkPosition.y;

        switch (e.key.toLowerCase()) {
          case "a":
            e.preventDefault();
            newX = Math.max(
              0,
              watermarkPosition.x - scaledStep / originalImageSize.width,
            );
            break;
          case "d":
            e.preventDefault();
            newX = Math.min(
              1 - watermarkPosition.width,
              watermarkPosition.x + scaledStep / originalImageSize.width,
            );
            break;
          case "w":
            e.preventDefault();
            newY = Math.max(
              0,
              watermarkPosition.y - scaledStep / originalImageSize.height,
            );
            break;
          case "s":
            e.preventDefault();
            newY = Math.min(
              1 - watermarkPosition.height,
              watermarkPosition.y + scaledStep / originalImageSize.height,
            );
            break;
          case "q":
            e.preventDefault();
            // 增加水印宽度，同时调整X位置保持中心对齐
            const newWidth = Math.min(
              1 - watermarkPosition.x,
              watermarkPosition.width + scaledStep / originalImageSize.width,
            );
            const widthDiff = newWidth - watermarkPosition.width;
            const newXCenter = Math.max(0, watermarkPosition.x - widthDiff / 2);

            onWatermarkUpdate({
              ...watermarkPosition,
              width: newWidth,
              x: newXCenter,
            });
            return; // 直接返回，避免执行下面的通用更新
          case "e":
            e.preventDefault();
            // 增加水印高度，同时调整Y位置保持中心对齐
            const newHeight = Math.min(
              1 - watermarkPosition.height,
              watermarkPosition.height + scaledStep / originalImageSize.height,
            );
            const heightDiff = newHeight - watermarkPosition.height;
            const newYCenter = Math.max(
              0,
              watermarkPosition.y - heightDiff / 2,
            );

            onWatermarkUpdate({
              ...watermarkPosition,
              height: newHeight,
              y: newYCenter,
            });
            return; // 直接返回，避免执行下面的通用更新
          default:
            return;
        }

        onWatermarkUpdate({
          ...watermarkPosition,
          x: newX,
          y: newY,
        });
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }, [
      isWatermarkFocused,
      originalImageSize.width,
      originalImageSize.height,
      scale,
      watermarkPosition,
      onWatermarkUpdate,
    ]);

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

      // 计算百分比位置 - 使用缩放后的尺寸
      const scaledWidth = originalImageSize.width * scale;
      const scaledHeight = originalImageSize.height * scale;
      const x = newLeft / scaledWidth;
      const y = newTop / scaledHeight;

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

      // 计算百分比位置和尺寸 - 使用缩放后的尺寸
      const scaledWidth = originalImageSize.width * scale;
      const scaledHeight = originalImageSize.height * scale;
      const x = newLeft / scaledWidth;
      const y = newTop / scaledHeight;
      const widthPercent = newWidth / scaledWidth;
      const heightPercent = newHeight / scaledHeight;

      // 确保位置在有效范围内，但允许任意尺寸
      const clampedX = Math.max(0, Math.min(1 - widthPercent, x));
      const clampedY = Math.max(0, Math.min(1 - heightPercent, y));
      const clampedWidth = Math.max(0.01, Math.min(1, widthPercent)); // 最小1%而不是10%
      const clampedHeight = Math.max(0.01, Math.min(1, heightPercent)); // 最小1%而不是5%

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

    const handleWatermarkClick = () => {
      setIsWatermarkFocused(true);
    };

    const handleContainerClick = (e: React.MouseEvent) => {
      // 如果点击的是水印元素，不处理
      if (
        e.target === watermarkRef.current ||
        watermarkRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      // 水印始终保持选中状态，不需要取消焦点
      // setIsWatermarkFocused(false);
    };

    const handleZoomIn = () => {
      setScale((prev) => Math.min(prev * 1.2, 5)); // 最大放大5倍
    };

    const handleZoomOut = () => {
      setScale((prev) => Math.max(prev / 1.2, 0.1)); // 最小缩小到0.1倍
    };

    const handleResetZoom = () => {
      setScale(1); // 重置到100%
    };

    // 框选事件处理
    const handleSelect = (e: any) => {
      if (!isSelectionMode) return;
      
      console.log("框选事件:", e);
      
      // 获取框选的矩形区域
      const rect = e.rect;
      if (!rect) return;
      
      // 计算相对于容器的位置
      const containerRect =
        selectoContainerRef.current?.getBoundingClientRect();
      if (!containerRect) return;
      
      // 转换为百分比位置和尺寸
      const scaledWidth = originalImageSize.width * scale;
      const scaledHeight = originalImageSize.height * scale;
      
      const x = rect.left / scaledWidth;
      const y = rect.top / scaledHeight;
      const width = rect.width / scaledWidth;
      const height = rect.height / scaledHeight;
      
      // 确保位置和尺寸在有效范围内
      const clampedX = Math.max(0, Math.min(1 - width, x));
      const clampedY = Math.max(0, Math.min(1 - height, y));
      const clampedWidth = Math.max(0.01, Math.min(1, width));
      const clampedHeight = Math.max(0.01, Math.min(1, height));
      
      // 更新水印位置和尺寸
      onWatermarkUpdate({
        ...watermarkPosition,
        x: clampedX,
        y: clampedY,
        width: clampedWidth,
        height: clampedHeight,
      });
      
      // 退出框选模式
      setIsSelectionMode(false);
      setSelectionBox(null);
      
      // 显示成功提示
      console.log("框选完成，水印已更新到:", {
        x: clampedX,
        y: clampedY,
        width: clampedWidth,
        height: clampedHeight,
      });
    };

    // 框选开始事件
    const handleSelectStart = (e: any) => {
      if (!isSelectionMode) return;
      console.log("开始框选...", e);
    };

    // 框选结束事件
    const handleSelectEnd = (e: any) => {
      if (!isSelectionMode) return;
      console.log("框选结束", e);
    };

    // 切换框选模式
    const toggleSelectionMode = () => {
      setIsSelectionMode(!isSelectionMode);
      if (isSelectionMode) {
        setSelectionBox(null);
      }
    };

    // 手动框选相关状态和函数
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [dragEnd, setDragEnd] = useState({ x: 0, y: 0 });

    // 鼠标按下事件
    const handleMouseDown = (e: React.MouseEvent) => {
      if (!isSelectionMode) return;
      
      const rect = selectoContainerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setIsDragging(true);
      setDragStart({ x, y });
      setDragEnd({ x, y });
    };

    // 鼠标移动事件
    const handleMouseMove = (e: React.MouseEvent) => {
      if (!isSelectionMode || !isDragging) return;
      
      const rect = selectoContainerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setDragEnd({ x, y });
    };

    // 鼠标松开事件
    const handleMouseUp = () => {
      if (!isSelectionMode || !isDragging) return;
      
      setIsDragging(false);
      
      // 计算框选区域
      const startX = Math.min(dragStart.x, dragEnd.x);
      const startY = Math.min(dragStart.y, dragEnd.y);
      const endX = Math.max(dragStart.x, dragEnd.x);
      const endY = Math.max(dragStart.y, dragEnd.y);
      
      const width = endX - startX;
      const height = endY - startY;
      
      // 如果框选区域太小，忽略
      if (width < 10 || height < 10) return;
      
      // 转换为百分比位置和尺寸
      const scaledWidth = originalImageSize.width * scale;
      const scaledHeight = originalImageSize.height * scale;
      
      const x = startX / scaledWidth;
      const y = startY / scaledHeight;
      const widthPercent = width / scaledWidth;
      const heightPercent = height / scaledHeight;
      
      // 确保位置和尺寸在有效范围内
      const clampedX = Math.max(0, Math.min(1 - widthPercent, x));
      const clampedY = Math.max(0, Math.min(1 - heightPercent, y));
      const clampedWidth = Math.max(0.01, Math.min(1, widthPercent));
      const clampedHeight = Math.max(0.01, Math.min(1, heightPercent));
      
      // 更新水印位置和尺寸
      onWatermarkUpdate({
        ...watermarkPosition,
        x: clampedX,
        y: clampedY,
        width: clampedWidth,
        height: clampedHeight,
      });
      
      // 退出框选模式
      setIsSelectionMode(false);
      setSelectionBox(null);
      
      // 显示成功提示
      console.log("框选完成，水印已更新到:", {
        x: clampedX,
        y: clampedY,
        width: clampedWidth,
        height: clampedHeight,
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        !isWatermarkFocused ||
        !originalImageSize.width ||
        !originalImageSize.height
      ) {
        return;
      }

      const moveStep = 1; // 移动1像素
      const scaledStep = moveStep / scale; // 根据缩放调整步长

      let newX = watermarkPosition.x;
      let newY = watermarkPosition.y;

      switch (e.key.toLowerCase()) {
        case "a":
          e.preventDefault();
          newX = Math.max(
            0,
            watermarkPosition.x - scaledStep / originalImageSize.width,
          );
          break;
        case "d":
          e.preventDefault();
          newX = Math.min(
            1 - watermarkPosition.width,
            watermarkPosition.x + scaledStep / originalImageSize.width,
          );
          break;
        case "w":
          e.preventDefault();
          newY = Math.max(
            0,
            watermarkPosition.y - scaledStep / originalImageSize.height,
          );
          break;
        case "s":
          e.preventDefault();
          newY = Math.min(
            1 - watermarkPosition.height,
            watermarkPosition.y + scaledStep / originalImageSize.height,
          );
          break;
        case "q":
          e.preventDefault();
          // 增加水印宽度，同时调整X位置保持中心对齐
          const newWidth = Math.min(
            1 - watermarkPosition.x,
            watermarkPosition.width + scaledStep / originalImageSize.width,
          );
          const widthDiff = newWidth - watermarkPosition.width;
          const newXCenter = Math.max(0, watermarkPosition.x - widthDiff / 2);

          onWatermarkUpdate({
            ...watermarkPosition,
            width: newWidth,
            x: newXCenter,
          });
          return;
        case "e":
          e.preventDefault();
          // 增加水印高度，同时调整Y位置保持中心对齐
          const newHeight = Math.min(
            1 - watermarkPosition.height,
            watermarkPosition.height + scaledStep / originalImageSize.height,
          );
          const heightDiff = newHeight - watermarkPosition.height;
          const newYCenter = Math.max(0, watermarkPosition.y - heightDiff / 2);

          onWatermarkUpdate({
            ...watermarkPosition,
            height: newHeight,
            y: newYCenter,
          });
          return;
        default:
          return;
      }

      onWatermarkUpdate({
        ...watermarkPosition,
        x: newX,
        y: newY,
      });
    };

    const getWatermarkStyle = () => {
      if (!originalImageSize.width || !originalImageSize.height) return {};

      // 计算像素尺寸 - 直接使用缩放后的尺寸
      const scaledWidth = originalImageSize.width * scale;
      const scaledHeight = originalImageSize.height * scale;
      const pixelWidth = watermarkPosition.width * scaledWidth;
      const pixelHeight = watermarkPosition.height * scaledHeight;
      const pixelX = watermarkPosition.x * scaledWidth;
      const pixelY = watermarkPosition.y * scaledHeight;

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
        border: "2px solid #3b82f6",
        boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.2)",
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
              {originalImageSize.width} × {originalImageSize.height} px
            </span>
            <span className="text-sm text-gray-500 ml-2">
              (缩放: {Math.round(scale * 100)}%)
            </span>
            <span className="text-sm text-gray-500 ml-2">
              (容器: {imageSize.width} × {imageSize.height} px)
            </span>
          </div>
          <div className="zoom-controls">
            <button onClick={handleZoomOut} className="zoom-btn" title="缩小">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 12H4"
                />
              </svg>
            </button>
            <button
              onClick={handleResetZoom}
              className="zoom-btn"
              title="重置缩放"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            </button>
            <button onClick={handleZoomIn} className="zoom-btn" title="放大">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>

            {/* 添加框选模式切换按钮 */}
            <button
              onClick={toggleSelectionMode}
              className={`selection-mode-btn ${
                isSelectionMode ? "active" : ""
              }`}
              title={isSelectionMode ? "退出框选模式" : "进入框选模式"}
            >
              {isSelectionMode ? "🚫 退出框选" : "📐 框选模式"}
            </button>

            {isWatermarkFocused && (
              <span
                className="text-xs text-blue-600 ml-2"
                title="使用WSAD键移动水印，QE键调整水印尺寸，或使用框选模式"
              >
                ⌨️ WSAD移动 QE调整尺寸 | 📐 框选模式
              </span>
            )}
          </div>
        </div>

        <div className="preview-container">
          <div
            ref={selectoContainerRef}
            className={`image-container ${
              isAnimating ? `slide-${slideDirection}` : ""
            }`}
            key={animationKey}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleContainerClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{
              position: "relative",
              width: `${imageSize.width}px`,
              height: `${imageSize.height}px`,
              maxWidth: "100%",
              maxHeight: "100%",
              border: "1px solid #ccc",
              overflow: "hidden",
            }}
          >
            <img
              src={image.url}
              alt={image.file.name}
              draggable={false}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "fill",
                objectPosition: "center",
                display: "block",
                userSelect: "none",
                position: "absolute",
                top: 0,
                left: 0,
              }}
            />
            <div
              ref={watermarkRef}
              className="watermark-element"
              style={getWatermarkStyle()}
              onClick={handleWatermarkClick}
              tabIndex={0}
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

            {/* 框选提示覆盖层 */}
            {isSelectionMode && (
              <div className="selection-overlay">
                <div className="selection-instruction">
                  <div className="instruction-icon">📐</div>
                  <div className="instruction-text">
                    <p>框选模式已激活</p>
                    <p>在图片上拖拽鼠标选择区域</p>
                    <p>选择完成后水印将自动定位到该区域</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* 框选区域显示 */}
            {isSelectionMode && isDragging && (
              <div
                className="selection-box"
                style={{
                  position: "absolute",
                  left: Math.min(dragStart.x, dragEnd.x),
                  top: Math.min(dragStart.y, dragEnd.y),
                  width: Math.abs(dragEnd.x - dragStart.x),
                  height: Math.abs(dragEnd.y - dragStart.y),
                  border: "2px dashed #3b82f6",
                  backgroundColor: "rgba(59, 130, 246, 0.1)",
                  pointerEvents: "none",
                  zIndex: 1001,
                }}
              />
            )}
          </div>
        </div>

        {/* 移除React Selecto组件，使用手动框选 */}
      </div>
    );
  },
);

PreviewArea.displayName = "PreviewArea";

export default PreviewArea;
