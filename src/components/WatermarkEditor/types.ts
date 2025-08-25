export interface ImageItem {
  id: number;
  file: File;
  url: string;
  watermarkPosition: WatermarkPosition;
}

export interface WatermarkPosition {
  x: number; // 百分比位置 (0-1)
  y: number; // 百分比位置 (0-1)
  width: number; // 百分比宽度 (0-1)
  height: number; // 百分比高度 (0-1)
  rotation: number; // 旋转角度
}

export interface WatermarkSettings {
  text: string;
  color: string;
  opacity: number;
  fontSize: number;
  imageUrl?: string;
  imageFile?: File;
}

export interface WatermarkConfig {
  type: "text" | "image" | "both";
  text: string;
  color: string;
  opacity: number;
  fontSize: number;
  imageUrl?: string;
  imageFile?: File;
}
