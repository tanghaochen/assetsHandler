import React from "react";

interface SettingsPanelProps {
  watermarkText: string;
  watermarkColor: string;
  watermarkOpacity: number;
  watermarkFontSize: number;
  watermarkType: "text" | "image";
  watermarkImageUrl?: string;
  onWatermarkTextChange: (text: string) => void;
  onWatermarkColorChange: (color: string) => void;
  onWatermarkOpacityChange: (opacity: number) => void;
  onWatermarkFontSizeChange: (size: number) => void;
  onWatermarkTypeChange: (type: "text" | "image") => void;
  onWatermarkImageChange: (file: File) => void;
  exportSettings: { outputPath: string };
  onExportSettingsChange: (settings: { outputPath?: string }) => void;
  onApplyToAll: () => void;
  onExportAll: () => void;
  onClearSettings: () => void;
  imageCount: number;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  watermarkText,
  watermarkColor,
  watermarkOpacity,
  watermarkFontSize,
  watermarkType,
  watermarkImageUrl,
  onWatermarkTextChange,
  onWatermarkColorChange,
  onWatermarkOpacityChange,
  onWatermarkFontSizeChange,
  onWatermarkTypeChange,
  onWatermarkImageChange,
  exportSettings,
  onExportSettingsChange,
  onApplyToAll,
  onExportAll,
  onClearSettings,
  imageCount,
}) => {
  const presetColors = [
    "#ffffff",
    "#000000",
    "#ff0000",
    "#00ff00",
    "#0000ff",
    "#ffff00",
    "#ff00ff",
    "#00ffff",
    "#ffa500",
    "#800080",
  ];

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <h3 className="text-lg font-semibold text-gray-700">水印设置</h3>
      </div>

      <div className="settings-content">
        {/* 水印类型选择 */}
        <div className="setting-group">
          <label className="setting-label">水印类型</label>
          <div className="watermark-type-selector">
            <button
              className={`type-btn ${watermarkType === "text" ? "active" : ""}`}
              onClick={() => onWatermarkTypeChange("text")}
            >
              文字水印
            </button>
            <button
              className={`type-btn ${
                watermarkType === "image" ? "active" : ""
              }`}
              onClick={() => onWatermarkTypeChange("image")}
            >
              图片水印
            </button>
          </div>
        </div>

        {/* 水印文本设置 */}
        {watermarkType === "text" && (
          <div className="setting-group">
            <label className="setting-label">水印文本</label>
            <input
              type="text"
              value={watermarkText}
              onChange={(e) => onWatermarkTextChange(e.target.value)}
              className="setting-input"
              placeholder="输入水印文本"
            />
          </div>
        )}

        {/* 图片水印设置 */}
        {watermarkType === "image" && (
          <div className="setting-group">
            <label className="setting-label">水印图片</label>
            <div className="image-upload-area">
              {watermarkImageUrl ? (
                <div className="image-preview">
                  <img
                    src={watermarkImageUrl}
                    alt="水印图片"
                    className="watermark-image-preview"
                  />
                  <button
                    className="change-image-btn"
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*";
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          onWatermarkImageChange(file);
                        }
                      };
                      input.click();
                    }}
                  >
                    更换图片
                  </button>
                </div>
              ) : (
                <div
                  className="upload-placeholder"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        onWatermarkImageChange(file);
                      }
                    };
                    input.click();
                  }}
                >
                  <svg
                    className="upload-icon"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  <span>点击上传水印图片</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 字体大小设置 - 仅文字水印时显示 */}
        {watermarkType === "text" && (
          <div className="setting-group">
            <label className="setting-label">字体大小</label>
            <div className="setting-range">
              <input
                type="range"
                min="12"
                max="72"
                value={watermarkFontSize}
                onChange={(e) =>
                  onWatermarkFontSizeChange(Number(e.target.value))
                }
                className="range-slider"
              />
              <span className="range-value">{watermarkFontSize}px</span>
            </div>
          </div>
        )}

        {/* 颜色设置 - 仅文字水印时显示 */}
        {watermarkType === "text" && (
          <div className="setting-group">
            <label className="setting-label">文字颜色</label>
            <div className="color-picker">
              <input
                type="color"
                value={watermarkColor}
                onChange={(e) => onWatermarkColorChange(e.target.value)}
                className="color-input"
              />
              <div className="preset-colors">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    className={`color-preset ${
                      watermarkColor === color ? "active" : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => onWatermarkColorChange(color)}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 透明度设置 */}
        <div className="setting-group">
          <label className="setting-label">透明度</label>
          <div className="setting-range">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={watermarkOpacity}
              onChange={(e) => onWatermarkOpacityChange(Number(e.target.value))}
              className="range-slider"
            />
            <span className="range-value">
              {Math.round(watermarkOpacity * 100)}%
            </span>
          </div>
        </div>

        {/* 导出设置 */}
        <div className="setting-group">
          <label className="setting-label">导出设置</label>
          <div className="export-settings">
            <div className="setting-item">
              <label className="setting-sub-label">保存位置</label>
              <div className="path-input-container">
                <input
                  type="text"
                  value={exportSettings.outputPath}
                  onChange={(e) =>
                    onExportSettingsChange({ outputPath: e.target.value })
                  }
                  className="setting-input"
                  placeholder="输入保存路径或点击选择按钮"
                />
                <button
                  className="path-select-btn"
                  onClick={() => {
                    // 在Electron环境中使用原生文件选择器
                    if (window.electronAPI) {
                      window.electronAPI
                        .selectDirectory()
                        .then((path: string | null) => {
                          if (path) {
                            onExportSettingsChange({ outputPath: path });
                          }
                        });
                    } else {
                      // 浏览器环境下的备用方案
                      const input = document.createElement("input");
                      input.type = "file";
                      input.webkitdirectory = true;
                      input.onchange = (e) => {
                        const files = (e.target as HTMLInputElement).files;
                        if (files && files.length > 0) {
                          const path =
                            files[0].webkitRelativePath.split("/")[0];
                          onExportSettingsChange({ outputPath: path });
                        }
                      };
                      input.click();
                    }
                  }}
                >
                  选择
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 清除设置按钮 */}
        <div className="setting-group">
          <div className="setting-item">
            <button
              onClick={onClearSettings}
              className="clear-settings-btn"
              title="清除所有水印设置，恢复默认值"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              清除水印设置
            </button>
          </div>
        </div>
      </div>

      {/* 固定在底部的操作按钮 */}
      <div className="fixed-action-buttons">
        <button
          onClick={() => {
            if (imageCount > 0) {
              const confirmed = window.confirm(
                `确定要将当前水印设置应用到所有 ${imageCount} 张图片吗？\n\n注意：此操作会覆盖所有图片的独立水印位置设置。`,
              );
              if (confirmed) {
                onApplyToAll();
              }
            }
          }}
          disabled={imageCount === 0}
          className="action-btn apply-btn"
          title="将当前水印位置以百分比形式应用到所有图片，适应不同尺寸"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
            />
          </svg>
          应用到全部 ({imageCount})
        </button>

        <button
          onClick={onExportAll}
          disabled={imageCount === 0}
          className="action-btn export-btn"
          title="导出所有带水印的图片"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          导出所有图片
        </button>
      </div>
    </div>
  );
};

export default SettingsPanel;
