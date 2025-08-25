import React from 'react'

interface SettingsPanelProps {
  watermarkText: string
  watermarkColor: string
  watermarkOpacity: number
  watermarkFontSize: number
  onWatermarkTextChange: (text: string) => void
  onWatermarkColorChange: (color: string) => void
  onWatermarkOpacityChange: (opacity: number) => void
  onWatermarkFontSizeChange: (size: number) => void
  onApplyToAll: () => void
  onExportAll: () => void
  imageCount: number
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  watermarkText,
  watermarkColor,
  watermarkOpacity,
  watermarkFontSize,
  onWatermarkTextChange,
  onWatermarkColorChange,
  onWatermarkOpacityChange,
  onWatermarkFontSizeChange,
  onApplyToAll,
  onExportAll,
  imageCount
}) => {
  const presetColors = [
    '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff',
    '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080'
  ]

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <h3 className="text-lg font-semibold text-gray-700">水印设置</h3>
      </div>

      <div className="settings-content">
        {/* 水印文本设置 */}
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

        {/* 字体大小设置 */}
        <div className="setting-group">
          <label className="setting-label">字体大小</label>
          <div className="setting-range">
            <input
              type="range"
              min="12"
              max="72"
              value={watermarkFontSize}
              onChange={(e) => onWatermarkFontSizeChange(Number(e.target.value))}
              className="range-slider"
            />
            <span className="range-value">{watermarkFontSize}px</span>
          </div>
        </div>

        {/* 颜色设置 */}
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
                  className={`color-preset ${watermarkColor === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => onWatermarkColorChange(color)}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>

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
            <span className="range-value">{Math.round(watermarkOpacity * 100)}%</span>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="action-buttons">
          <button
            onClick={onApplyToAll}
            disabled={imageCount === 0}
            className="action-btn apply-btn"
            title="将当前水印设置应用到所有图片"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
            </svg>
            应用到全部 ({imageCount})
          </button>

          <button
            onClick={onExportAll}
            disabled={imageCount === 0}
            className="action-btn export-btn"
            title="导出所有带水印的图片"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            导出所有图片
          </button>
        </div>

        {/* 预览 */}
        <div className="setting-group">
          <label className="setting-label">预览效果</label>
          <div className="watermark-preview">
            <div
              className="preview-text"
              style={{
                color: watermarkColor,
                opacity: watermarkOpacity,
                fontSize: `${watermarkFontSize}px`,
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                fontWeight: 'bold'
              }}
            >
              {watermarkText || '预览文本'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPanel
