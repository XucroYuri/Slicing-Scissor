
import { ProjectConfig, Asset } from '../types';

/**
 * 主流画幅比例库 (Nano Banana Pro 常用)
 */
const MAINSTREAM_RATIOS = [
  { w: 16, h: 9, val: 16 / 9 },
  { w: 9, h: 16, val: 9 / 16 },
  { w: 1,  h: 1,  val: 1 / 1 },
  { w: 4,  h: 3,  val: 4 / 3 },
  { w: 3,  h: 4,  val: 3 / 4 },
  { w: 3,  h: 2,  val: 3 / 2 },
  { w: 2,  h: 3,  val: 2 / 3 },
  { w: 21, h: 9,  val: 21 / 9 },
];

/**
 * 智能比例转换：尝试吸附到主流比例，否则返回最简整数比
 */
export const getSmartAspectRatio = (width: number, height: number): { w: number, h: number } => {
  const rawRatio = width / height;
  const threshold = 0.05; // 5% 的置信度偏差允许

  // 1. 尝试匹配主流比例
  for (const standard of MAINSTREAM_RATIOS) {
    if (Math.abs(rawRatio - standard.val) < threshold) {
      return { w: standard.w, h: standard.h };
    }
  }

  // 2. 无法匹配时，计算最简整数比
  const simplify = (val: number) => {
    const precision = 1.0e-3;
    let x = val;
    let n = 1;
    let d = 1;
    for (let i = 1; i < 20; i++) {
        n = Math.round(x * i);
        d = i;
        if (Math.abs(n / d - x) < precision) break;
    }
    return { n, d };
  };

  const { n, d } = simplify(rawRatio);
  return { w: n, h: d };
};

/**
 * 提取图片原始尺寸和元素
 */
export const getImageDimensions = (file: File): Promise<{ width: number; height: number; element: HTMLImageElement }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight, element: img });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

/**
 * 自动识别网格结构 (Rows/Cols)
 */
export const detectGridStructure = (img: HTMLImageElement): { rows: number; cols: number } => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { rows: 3, cols: 3 };

  const scanWidth = 300;
  const scanHeight = Math.round((img.naturalHeight / img.naturalWidth) * scanWidth);
  canvas.width = scanWidth;
  canvas.height = scanHeight;
  ctx.drawImage(img, 0, 0, scanWidth, scanHeight);

  const imageData = ctx.getImageData(0, 0, scanWidth, scanHeight);
  const data = imageData.data;

  const getLineVariance = (isRow: boolean, pos: number) => {
    let variance = 0;
    if (isRow) {
      const y = Math.floor(pos * (scanHeight - 1));
      for (let x = 0; x < scanWidth - 1; x++) {
        const idx = (y * scanWidth + x) * 4;
        const nextIdx = (y * scanWidth + (x + 1)) * 4;
        variance += Math.abs(data[idx] - data[nextIdx]) + Math.abs(data[idx+1] - data[nextIdx+1]) + Math.abs(data[idx+2] - data[nextIdx+2]);
      }
    } else {
      const x = Math.floor(pos * (scanWidth - 1));
      for (let y = 0; y < scanHeight - 1; y++) {
        const idx = (y * scanWidth + x) * 4;
        const nextIdx = ((y + 1) * scanWidth + x) * 4;
        variance += Math.abs(data[idx] - data[nextIdx]) + Math.abs(data[idx+1] - data[nextIdx+1]) + Math.abs(data[idx+2] - data[nextIdx+2]);
      }
    }
    return variance / (isRow ? scanWidth : scanHeight);
  };

  const checkSplit = (isRow: boolean, count: number) => {
    if (count === 1) return true;
    const splitPoints = [];
    for (let i = 1; i < count; i++) splitPoints.push(getLineVariance(isRow, i / count));
    const baselines = [];
    for (let i = 0; i < count; i++) baselines.push(getLineVariance(isRow, (i + 0.5) / count));
    const avgSplit = splitPoints.reduce((a, b) => a + b, 0) / splitPoints.length;
    const avgBase = baselines.reduce((a, b) => a + b, 0) / baselines.length;
    return avgSplit < avgBase * 0.45;
  };

  let rows = 1, cols = 1;
  if (checkSplit(true, 3)) rows = 3; else if (checkSplit(true, 2)) rows = 2;
  if (checkSplit(false, 3)) cols = 3; else if (checkSplit(false, 2)) cols = 2;

  if (rows === 1 && cols === 1) {
    const ratio = img.naturalWidth / img.naturalHeight;
    if (ratio > 0.8 && ratio < 1.2) return { rows: 3, cols: 3 };
  }
  return { rows, cols };
};

/**
 * 核心切片逻辑
 */
export const sliceImage = async (
  file: File, 
  config: ProjectConfig,
  onProgress: (progress: number) => void,
  imageName: string,
  taskId: string
): Promise<Asset[]> => {
  return new Promise((resolve, reject) => {
    const { rows, cols, aspectRatioWidth, aspectRatioHeight, projectId, sceneId } = config;
    const img = new Image();
    img.onload = async () => {
      try {
        const totalShots = rows * cols;
        const assets: Asset[] = [];
        const cellWidth = img.naturalWidth / cols;
        const cellHeight = img.naturalHeight / rows;
        const targetRatio = aspectRatioWidth / aspectRatioHeight;
        const currentCellRatio = cellWidth / cellHeight;
        
        let extractWidth, extractHeight;
        if (currentCellRatio > targetRatio) {
          extractHeight = cellHeight;
          extractWidth = cellHeight * targetRatio;
        } else {
          extractWidth = cellWidth;
          extractHeight = cellWidth / targetRatio;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context failure.'));
        
        canvas.width = Math.round(extractWidth);
        canvas.height = Math.round(extractHeight);
        
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const index = r * cols + c;
            const shotNum = (index + 1).toString().padStart(3, '0');
            const cellStartX = c * cellWidth;
            const cellStartY = r * cellHeight;
            const offsetX = (cellWidth - extractWidth) / 2;
            const offsetY = (cellHeight - extractHeight) / 2;

            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.drawImage(
              img,
              cellStartX + offsetX, cellStartY + offsetY, extractWidth, extractHeight,
              0, 0, canvas.width, canvas.height
            );
            
            // 优化后的命名逻辑：ShotID前置，并使用双下划线分隔符
            const processedName = `Shot${shotNum}_${imageName}_${sceneId}__${projectId}_${shotNum}_${taskId}.png`;
            
            const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
            if (blob) {
              assets.push({
                id: `${file.name}_${index}_${Date.now()}`,
                originalFileName: file.name,
                processedName,
                url: URL.createObjectURL(blob),
                blob,
                gridIndex: index,
                width: canvas.width,
                height: canvas.height,
                selected: true,
              });
            }
            onProgress(((index + 1) / totalShots) * 100);
          }
        }
        resolve(assets);
      } catch (err) {
        reject(err);
      }
    };
    img.src = URL.createObjectURL(file);
  });
};
