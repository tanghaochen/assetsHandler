import React, { useRef, useState } from "react";
import { ImageItem } from "./types";
import { color } from "html2canvas/dist/types/css/types/color";
import Button from "@mui/material/Button";

interface ImageListProps {
  images: ImageItem[];
  selectedIndex: number;
  onImageSelect: (index: number) => void;
  onImageUpload: (files: FileList) => void;
  onDeleteImage: (index: number) => void;
  onClearAll: () => void;
}

const ImageList: React.FC<ImageListProps> = ({
  images,
  selectedIndex,
  onImageSelect,
  onImageUpload,
  onDeleteImage,
  onClearAll,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onImageUpload(files);
      // 重置input值，允许重复选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);

    const files = event.dataTransfer.files;
    console.log("Drop event triggered, files:", files);
    console.log("DataTransfer types:", event.dataTransfer.types);
    console.log("DataTransfer items:", event.dataTransfer.items);

    // 尝试多种方式获取文件
    let imageFiles: File[] = [];

    // 方法1: 直接从 files 获取
    if (files && files.length > 0) {
      imageFiles = Array.from(files).filter((file) => {
        console.log("Processing file:", file.name, "type:", file.type);
        // 检查文件类型
        if (file.type.startsWith("image/")) {
          return true;
        }
        // 检查文件扩展名
        const fileName = file.name.toLowerCase();
        const imageExtensions = [
          ".jpg",
          ".jpeg",
          ".png",
          ".gif",
          ".bmp",
          ".webp",
        ];
        return imageExtensions.some((ext) => fileName.endsWith(ext));
      });
    }

    // 方法2: 尝试从 items 获取
    if (imageFiles.length === 0 && event.dataTransfer.items) {
      console.log("Trying to get files from items...");
      const items = Array.from(event.dataTransfer.items);

      for (const item of items) {
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) {
            console.log("Got file from item:", file.name, file.type);
            const fileName = file.name.toLowerCase();
            const imageExtensions = [
              ".jpg",
              ".jpeg",
              ".png",
              ".gif",
              ".bmp",
              ".webp",
            ];
            if (
              file.type.startsWith("image/") ||
              imageExtensions.some((ext) => fileName.endsWith(ext))
            ) {
              imageFiles.push(file);
            }
          }
        }
      }
    }

    // 方法3: 尝试从 URI 列表获取（某些浏览器可能支持）
    if (
      imageFiles.length === 0 &&
      event.dataTransfer.types.includes("text/uri-list")
    ) {
      console.log("Trying to get files from URI list...");
      try {
        const uriList = event.dataTransfer.getData("text/uri-list");
        console.log("URI list:", uriList);

        if (uriList) {
          const uris = uriList.split("\n").filter((uri) => uri.trim());
          console.log("Parsed URIs:", uris);

          // 这里可以尝试处理 file:// 协议的 URI
          // 但由于安全限制，可能无法直接访问
        }
      } catch (error) {
        console.log("Failed to get URI list:", error);
      }
    }

    console.log("Final image files:", imageFiles);

    if (imageFiles.length > 0) {
      // 创建新的 FileList 对象
      const dataTransfer = new DataTransfer();
      imageFiles.forEach((file) => dataTransfer.items.add(file));
      onImageUpload(dataTransfer.files);
    } else {
      console.log("No valid image files found");
      // 提供更详细的调试信息
      console.log("Available data types:", event.dataTransfer.types);
      console.log("Available items:", event.dataTransfer.items);

      // 尝试获取所有可能的数据
      event.dataTransfer.types.forEach((type) => {
        try {
          const data = event.dataTransfer.getData(type);
          console.log(`Data for type ${type}:`, data);
        } catch (error) {
          console.log(`Failed to get data for type ${type}:`, error);
        }
      });

      alert(
        '未检测到有效的图片文件。请确保拖拽的是图片文件，或使用"添加图片"按钮选择文件。',
      );
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);

    // 在 Electron 环境中，设置允许的文件类型
    if (window.electronAPI) {
      event.dataTransfer.dropEffect = "copy";
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    // 在 Electron 环境中，尝试启用文件拖拽
    if (window.electronAPI) {
      console.log("Electron environment detected, enabling file drop");
    }
  };

  return (
    <div className="image-list">
      <div className="image-list-header">
        <h3 className="text-lg font-semibold text-gray-700">图片列表</h3>
        <div className="header-buttons">
          {images.length > 0 && (
            <div className="text-xs text-gray-500 mr-2">使用 ↑↓ 键切换图片</div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="add-btn"
          >
            添加图片
          </button>
          {images.length > 0 && (
            <button
              onClick={onClearAll}
              className="clear-btn"
              title="清除所有图片"
            >
              清除全部
            </button>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div
        className={`image-list-content ${isDragOver ? "drag-over" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        style={{
          border: isDragOver ? "2px dashed #3b82f6" : "2px dashed transparent",
          borderRadius: "8px",
          transition: "all 0.2s ease",
          backgroundColor: isDragOver
            ? "rgba(59, 130, 246, 0.1)"
            : "transparent",
          minHeight: "200px",
        }}
      >
        {images.length === 0 ? (
          <div className="empty-state">
            <div
              className={`text-center py-8 ${
                isDragOver ? "text-blue-500" : "text-gray-400"
              }`}
            >
              <svg
                className={`w-16 h-16 mx-auto mb-4 ${
                  isDragOver ? "text-blue-500" : ""
                }`}
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
              <p
                className={`text-lg font-medium ${
                  isDragOver ? "text-blue-600" : ""
                }`}
              >
                {isDragOver ? "释放鼠标添加图片" : "拖拽图片到这里"}
              </p>
              <p className="text-sm">支持 JPG、PNG、GIF 等格式</p>
              <p className="text-sm text-gray-500">
                💡 提示：只能拖拽从其他网页或应用复制的图片文件
              </p>
              <p className="text-sm">或点击上方"添加图片"按钮选择文件</p>
            </div>
          </div>
        ) : (
          <div className="image-grid">
            {images.map((image, index) => (
              <div
                key={image.id}
                className={`image-item group ${
                  selectedIndex === index ? "selected" : ""
                }`}
                onClick={() => onImageSelect(index)}
              >
                <div className="image-thumbnail relative">
                  <img
                    src={image.url}
                    alt={image.file.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="image-overlay">
                    <Button
                      className="absolute top-2 right-2 w-6 h-6 min-w-6 min-h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-200 ease-in-out shadow-lg hover:shadow-xl transform hover:scale-110 opacity-30 hover:opacity-100 z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteImage(index);
                      }}
                      title="删除图片"
                    >
                      <svg
                        className="w-3 h-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </Button>
                    {/* <button
                      className="size-4 rounded-full absolute top-2 right-2 p-3 content-center flex items-center justify-center bg-white opacity-50"
                      title="删除图片"
                    >
                      <div className="text-black flex-1 text-center">x</div>
                    </button> */}
                  </div>
                </div>

                <div className="image-info">
                  <p className="image-name" title={image.file.name}>
                    {image.file.name.length > 20
                      ? image.file.name.substring(0, 20) + "..."
                      : image.file.name}
                  </p>
                  <p className="image-size">
                    {(image.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageList;
