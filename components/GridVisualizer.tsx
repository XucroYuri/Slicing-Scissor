
import React, { useMemo, useState, useEffect } from 'react';
import { ProjectConfig } from '../types';
import { t } from '../i18n';

interface Props {
  imageUrl: string;
  config: ProjectConfig;
}

export const GridVisualizer: React.FC<Props> = ({ imageUrl, config }) => {
  const { rows, cols, aspectRatioWidth, aspectRatioHeight } = config;
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const cropMetrics = useMemo(() => {
    if (!naturalSize) return null;

    // 单个格子的原始物理像素尺寸
    const cellPixelW = naturalSize.w / cols;
    const cellPixelH = naturalSize.h / rows;
    
    // 目标写入的画幅比例
    const targetRatio = aspectRatioWidth / aspectRatioHeight;
    const cellRatio = cellPixelW / cellPixelH;

    let cropW, cropH;
    
    // 计算预览框相对于格子的百分比尺寸
    // 逻辑：如果格子比目标宽，则高度填满，宽度按比例缩放
    if (cellRatio > targetRatio) {
      cropH = 100;
      cropW = (targetRatio / cellRatio) * 100;
    } else {
      cropW = 100;
      cropH = (cellRatio / targetRatio) * 100;
    }

    return {
      width: `${cropW}%`,
      height: `${cropH}%`,
      left: `${(100 - cropW) / 2}%`,
      top: `${(100 - cropH) / 2}%`,
      shroudW: (100 - cropW) / 2,
      shroudH: (100 - cropH) / 2
    };
  }, [rows, cols, aspectRatioWidth, aspectRatioHeight, naturalSize]);

  const gridCells = useMemo(() => {
    const cells = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        cells.push({ r, c });
      }
    }
    return cells;
  }, [rows, cols]);

  if (!naturalSize || !cropMetrics) {
    return (
      <div className="w-full aspect-video bg-slate-900 animate-pulse rounded-xl flex items-center justify-center">
        <div className="text-slate-500 text-xs font-mono uppercase tracking-widest">Initialising Viewfinder...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto rounded-xl overflow-hidden bg-slate-950 border border-slate-700 shadow-2xl ring-1 ring-white/10">
      <img 
        src={imageUrl} 
        alt="Slicing Preview" 
        className="w-full h-auto block"
      />
      
      <div className="absolute inset-0 flex flex-wrap pointer-events-none">
        {gridCells.map((cell, i) => (
          <div 
            key={i}
            className="relative border-[0.5px] border-white/10 box-border"
            style={{ 
              width: `${100 / cols}%`, 
              height: `${100 / rows}%` 
            }}
          >
            {/* 裁剪遮罩区域 */}
            <div className="absolute top-0 left-0 right-0 bg-slate-950/70 backdrop-blur-[1px]" style={{ height: `${cropMetrics.shroudH}%` }} />
            <div className="absolute bottom-0 left-0 right-0 bg-slate-950/70 backdrop-blur-[1px]" style={{ height: `${cropMetrics.shroudH}%` }} />
            <div className="absolute top-0 bottom-0 left-0 bg-slate-950/70 backdrop-blur-[1px]" style={{ width: `${cropMetrics.shroudW}%`, top: `${cropMetrics.shroudH}%`, bottom: `${cropMetrics.shroudH}%` }} />
            <div className="absolute top-0 bottom-0 right-0 bg-slate-950/70 backdrop-blur-[1px]" style={{ width: `${cropMetrics.shroudW}%`, top: `${cropMetrics.shroudH}%`, bottom: `${cropMetrics.shroudH}%` }} />

            {/* 最终导出预览框 */}
            <div 
              className="absolute border-2 border-dashed border-blue-400/80 shadow-[0_0_20px_rgba(59,130,246,0.2)] z-10"
              style={{
                width: cropMetrics.width,
                height: cropMetrics.height,
                left: cropMetrics.left,
                top: cropMetrics.top
              }}
            >
              <div className="absolute -top-6 left-0 flex items-center gap-1">
                <span className="bg-blue-600/90 text-[8px] font-bold text-white px-1.5 py-0.5 rounded shadow-lg uppercase tracking-tighter">
                  {t('shot')} {i + 1}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* HUD Info */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-600/90 backdrop-blur-md rounded-full border border-blue-400/50 shadow-lg">
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span className="text-[10px] font-bold text-white uppercase tracking-widest">{t('liveViewfinder')}</span>
        </div>
      </div>

      <div className="absolute bottom-4 left-0 right-0 flex justify-center px-4 pointer-events-none">
        <div className="flex flex-wrap justify-center gap-4 px-4 py-2 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border border-dashed border-blue-400 bg-blue-500/10" />
            <span className="text-[10px] font-semibold text-slate-300">{t('exportArea')} ({aspectRatioWidth}:{aspectRatioHeight})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-slate-950/70 border border-white/10" />
            <span className="text-[10px] font-semibold text-slate-400">{t('discardedMargin')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
