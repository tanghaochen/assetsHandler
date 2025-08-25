import React, { useRef, useState } from "react";
import { ImageItem } from "./types";

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

    if (files && files.length > 0) {
      // 过滤只接受图片文件
      const imageFiles = Array.from(files).filter((file) =>
        file.type.startsWith("image/"),
      );

      if (imageFiles.length > 0) {
        onImageUpload(imageFiles as unknown as FileList);
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div className="image-list">
      <div className="image-list-header">
        <h3 className="text-lg font-semibold text-gray-700">图片列表</h3>
        <div className="header-buttons">
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
          border: "2px dashed transparent",
          borderRadius: "8px",
          transition: "all 0.2s ease",
        }}
      >
        {images.length === 0 ? (
          <div className="empty-state">
            <div className="text-gray-400 text-center py-8">
              <svg
                className="w-16 h-16 mx-auto mb-4"
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
              <p className="text-lg font-medium">拖拽图片到这里</p>
              <p className="text-sm">支持 JPG、PNG、GIF 等格式</p>
              <p className="text-sm">或点击上方按钮选择图片</p>
            </div>
          </div>
        ) : (
          <div className="image-grid">
            {images.map((image, index) => (
              <div
                key={image.id}
                className={`image-item ${
                  selectedIndex === index ? "selected" : ""
                }`}
                onClick={() => onImageSelect(index)}
              >
                <div className="image-thumbnail">
                  <img
                    src={image.url}
                    alt={image.file.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="image-overlay">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteImage(index);
                      }}
                      className="delete-btn"
                      title="删除图片"
                    >
                      <svg
                        className="delete-icon"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
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
