
export interface ProjectConfig {
  projectId: string;
  sceneId: string;
  rows: number;
  cols: number;
  aspectRatioWidth: number;
  aspectRatioHeight: number;
}

export interface Asset {
  id: string;
  originalFileName: string;
  processedName: string;
  url: string;
  blob: Blob;
  gridIndex: number;
  width: number;
  height: number;
  selected: boolean;
  error?: string;
  metadata?: any;
}

export interface ProcessingTask {
  id: string;
  shortId: string;
  file: File;
  customName: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  results: Asset[];
  error?: string;
  selected: boolean;
  // Per-task slicing parameters
  rows: number;
  cols: number;
  aspectRatioWidth: number;
  aspectRatioHeight: number;
}
