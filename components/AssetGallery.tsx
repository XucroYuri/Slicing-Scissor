
import React, { useState } from 'react';
import { ProcessingTask, ProjectConfig } from '../types';
import { AssetCard } from './AssetCard';
import { GridVisualizer } from './GridVisualizer';
import { CheckCircle, Clock, AlertCircle, Loader2, Eye, EyeOff, LayoutPanelTop, CheckSquare, Square, XCircle, Edit3, Terminal, Bug, ChevronDown, ChevronUp, MoveUp, MoveDown, Maximize, Layout, AlertTriangle } from 'lucide-react';
import { t } from '../i18n';

interface Props {
  tasks: ProcessingTask[];
  config: ProjectConfig;
  onToggleTaskSelect: (id: string) => void;
  onToggleAssetSelect: (taskId: string, assetId: string) => void;
  onUpdateTaskName: (taskId: string, newName: string) => void;
  onUpdateTaskParams: (taskId: string, updates: Partial<ProcessingTask>) => void;
  onMoveTaskUp: (index: number) => void;
  onMoveTaskDown: (index: number) => void;
  viewMode?: 'queue' | 'grid';
}

export const AssetGallery: React.FC<Props> = ({ 
  tasks, 
  config, 
  onToggleTaskSelect, 
  onToggleAssetSelect, 
  onUpdateTaskName,
  onUpdateTaskParams,
  onMoveTaskUp,
  onMoveTaskDown,
  viewMode = 'queue'
}) => {
  const [showPreviews, setShowPreviews] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandErrorLog, setExpandErrorLog] = useState(true);

  const togglePreview = (id: string) => {
    setShowPreviews(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleNameBlur = () => {
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setEditingId(null);
    }
  };

  const checkMismatch = (task: ProcessingTask) => {
    const threshold = 0.05;
    const gridMismatch = task.rows !== config.rows || task.cols !== config.cols;
    const taskRatio = task.aspectRatioWidth / task.aspectRatioHeight;
    const globalRatio = config.aspectRatioWidth / config.aspectRatioHeight;
    const ratioMismatch = Math.abs(taskRatio - globalRatio) > threshold;
    return { gridMismatch, ratioMismatch, any: gridMismatch || ratioMismatch };
  };

  const failedTasks = tasks.filter(t => t.status === 'error');

  return (
    <div className="space-y-8 pb-24">
      {failedTasks.length > 0 && (
        <div className="bg-slate-900/80 border border-red-500/30 rounded-[2rem] overflow-hidden shadow-2xl shadow-red-950/20 backdrop-blur-md">
          <div 
            className="flex items-center justify-between px-6 py-4 bg-red-500/10 border-b border-red-500/20 cursor-pointer hover:bg-red-500/20 transition-colors"
            onClick={() => setExpandErrorLog(!expandErrorLog)}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <Bug className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h4 className="text-sm font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
                  {t('errorLog')}
                  <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full">{failedTasks.length}</span>
                </h4>
                <p className="text-[10px] text-red-400/60 font-medium">Critical interruptions detected in current pipeline</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
               <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-red-400/50">
                  <Terminal className="w-3.5 h-3.5" />
                  STDOUT/STDERR CAPTURED
               </div>
               {expandErrorLog ? <ChevronUp className="w-5 h-5 text-red-400" /> : <ChevronDown className="w-5 h-5 text-red-400" />}
            </div>
          </div>
          
          {expandErrorLog && (
            <div className="p-6 max-h-[400px] overflow-y-auto custom-scrollbar-red bg-slate-950/50">
              <div className="grid gap-4">
                {failedTasks.map(task => (
                  <div key={task.id} className="group bg-red-500/5 border border-red-500/10 rounded-2xl p-4 flex items-start gap-4 transition-all hover:bg-red-500/10 hover:border-red-500/30">
                    <div className="w-12 h-12 rounded-xl bg-red-950/50 border border-red-500/20 flex items-center justify-center flex-shrink-0 shadow-lg shadow-black/40 group-hover:scale-105 transition-transform">
                      <XCircle className="w-6 h-6 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="text-sm font-black text-red-200 truncate pr-4">
                          {task.customName} <span className="text-red-500/40 text-[10px] font-mono ml-2">#{task.shortId}</span>
                        </div>
                        <div className="text-[9px] font-mono text-red-500/50 uppercase">{task.file.name}</div>
                      </div>
                      <div className="relative">
                        <div className="text-[11px] text-red-400/80 font-mono leading-relaxed bg-black/40 p-3 rounded-xl border border-red-500/10 italic">
                          <span className="text-red-600 font-bold mr-2">&gt;</span>
                          {task.error || 'Unknown slicing engine failure. Please check input image grid compatibility.'}
                        </div>
                        <div className="absolute -right-1 -bottom-1 w-24 h-24 bg-red-500/5 blur-2xl pointer-events-none rounded-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tasks.map((task, index) => {
        const isPreviewing = viewMode === 'grid' || showPreviews[task.id];
        const imageUrl = React.useMemo(() => URL.createObjectURL(task.file), [task.file]);
        const mismatch = checkMismatch(task);

        return (
          <div key={task.id} className={`bg-slate-800/20 rounded-3xl border overflow-hidden shadow-2xl transition-all duration-500 ${task.selected ? 'border-blue-500/50 bg-blue-500/5' : 'border-slate-700/50 hover:bg-slate-800/30'}`}>
            <div className="px-6 py-4 bg-slate-800/60 border-b border-slate-700/50 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="flex flex-col gap-1">
                  <button 
                    onClick={() => onMoveTaskUp(index)}
                    disabled={index === 0}
                    className={`p-1 rounded bg-slate-900 border border-slate-700 text-slate-500 hover:text-white hover:border-blue-500/50 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-90`}
                    title={t('moveUp')}
                  >
                    <MoveUp className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => onMoveTaskDown(index)}
                    disabled={index === tasks.length - 1}
                    className={`p-1 rounded bg-slate-900 border border-slate-700 text-slate-500 hover:text-white hover:border-blue-500/50 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-90`}
                    title={t('moveDown')}
                  >
                    <MoveDown className="w-3 h-3" />
                  </button>
                </div>

                <button 
                  onClick={() => onToggleTaskSelect(task.id)}
                  disabled={task.status === 'error'}
                  className={`p-2.5 rounded-xl border transition-all flex-shrink-0 active:scale-90 ${task.status === 'error' ? 'bg-slate-800 border-slate-700 text-slate-700 cursor-not-allowed' : task.selected ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/40' : 'bg-slate-900 border-slate-700 text-slate-500 hover:text-white hover:border-slate-500'}`}
                  title={t('selectTask')}
                >
                  {task.selected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                </button>

                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2.5 bg-slate-700/50 rounded-xl ring-1 ring-white/5 shadow-inner flex-shrink-0">
                    <LayoutPanelTop className="w-4.5 h-4.5 text-slate-300" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2 group/name relative">
                      {editingId === task.id ? (
                        <input
                          autoFocus
                          value={task.customName}
                          onChange={(e) => onUpdateTaskName(task.id, e.target.value)}
                          onBlur={handleNameBlur}
                          onKeyDown={handleKeyDown}
                          className="bg-slate-950 border border-blue-500 rounded-lg px-2 py-1 text-sm font-bold text-white w-full focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                        />
                      ) : (
                        <div 
                          onClick={() => task.status !== 'error' && setEditingId(task.id)}
                          className={`flex items-center gap-2 select-none max-w-full ${task.status === 'error' ? 'cursor-default' : 'cursor-text'}`}
                        >
                          <div className={`text-sm font-black truncate transition-colors ${task.status === 'error' ? 'text-red-400/70' : 'text-slate-200 group-hover/name:text-blue-400'}`}>
                            {task.customName}
                          </div>
                          {task.status !== 'error' && <Edit3 className="w-3 h-3 text-slate-600 group-hover/name:text-blue-500 transition-colors" />}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                        task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        task.status === 'processing' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        task.status === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }`}>
                        {task.status === 'completed' ? t('ready') : 
                         task.status === 'processing' ? t('slicing') : 
                         task.status === 'error' ? t('failed') : t('queue')}
                      </span>
                      <span className="text-[9px] text-slate-600 font-mono bg-slate-900/50 px-1.5 py-0.5 rounded border border-white/5 flex items-center gap-1">
                        TaskID: <span className="text-slate-400 font-bold">{task.shortId}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Per-Task Params Controls */}
                <div className="hidden lg:flex items-center gap-4 bg-slate-900/40 p-1.5 rounded-2xl border border-slate-700/50">
                   <div className={`flex items-center gap-2 px-2 py-1 rounded-lg border transition-colors ${mismatch.gridMismatch ? 'bg-amber-500/10 border-amber-500/30' : 'border-transparent'}`}>
                      <Layout className={`w-3 h-3 ${mismatch.gridMismatch ? 'text-amber-500' : 'text-slate-500'}`} />
                      <div className="flex items-center gap-1">
                        <input 
                          type="number" min="1" max="9" value={task.rows} 
                          onChange={(e) => onUpdateTaskParams(task.id, { rows: parseInt(e.target.value) || 1 })}
                          className="w-4 bg-transparent text-[10px] font-bold text-center text-slate-300 focus:text-white outline-none"
                        />
                        <span className="text-[10px] text-slate-600">x</span>
                        <input 
                          type="number" min="1" max="9" value={task.cols} 
                          onChange={(e) => onUpdateTaskParams(task.id, { cols: parseInt(e.target.value) || 1 })}
                          className="w-4 bg-transparent text-[10px] font-bold text-center text-slate-300 focus:text-white outline-none"
                        />
                      </div>
                   </div>
                   <div className={`flex items-center gap-2 px-2 py-1 rounded-lg border transition-colors ${mismatch.ratioMismatch ? 'bg-amber-500/10 border-amber-500/30' : 'border-transparent'}`}>
                      <Maximize className={`w-3 h-3 ${mismatch.ratioMismatch ? 'text-amber-500' : 'text-slate-500'}`} />
                      <div className="flex items-center gap-1">
                        <input 
                          type="number" min="1" value={task.aspectRatioWidth} 
                          onChange={(e) => onUpdateTaskParams(task.id, { aspectRatioWidth: parseFloat(e.target.value) || 1 })}
                          className="w-6 bg-transparent text-[10px] font-bold text-center text-slate-300 focus:text-white outline-none"
                        />
                        <span className="text-[10px] text-slate-600">:</span>
                        <input 
                          type="number" min="1" value={task.aspectRatioHeight} 
                          onChange={(e) => onUpdateTaskParams(task.id, { aspectRatioHeight: parseFloat(e.target.value) || 1 })}
                          className="w-6 bg-transparent text-[10px] font-bold text-center text-slate-300 focus:text-white outline-none"
                        />
                      </div>
                   </div>
                   {mismatch.any && (
                     <div className="px-2 py-1 bg-amber-500 text-slate-950 text-[9px] font-black rounded-lg animate-pulse flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {t('mismatchDetected')}
                     </div>
                   )}
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {viewMode === 'queue' && (
                  <button
                    onClick={() => togglePreview(task.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border transform active:scale-95 ${
                      isPreviewing 
                      ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-900/40' 
                      : 'bg-slate-700/50 text-slate-300 border-slate-600 hover:bg-slate-700 hover:text-white hover:border-slate-500'
                    }`}
                  >
                    {isPreviewing ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {isPreviewing ? t('hideSlicing') : t('showGrid')}
                  </button>
                )}

                <div className="h-6 w-px bg-slate-700/50 mx-1"></div>

                 {task.status === 'processing' && (
                    <div className="w-24 sm:w-32 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-600 via-indigo-400 to-blue-600 bg-[length:200%_100%] animate-shimmer transition-all duration-300" 
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                 )}
                 {task.status === 'completed' && <CheckCircle className="w-5 h-5 text-emerald-500 filter drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" />}
                 {task.status === 'pending' && <Clock className="w-5 h-5 text-slate-500 animate-pulse" />}
                 {task.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
              </div>
            </div>

            {isPreviewing && (
              <div className={`bg-slate-950/40 border-slate-700/30 ${viewMode === 'grid' ? 'p-0' : 'p-6 border-b'}`}>
                {/* 
                  Pass task parameters specifically here to ensure Visualizer respects 
                  per-task overrides 
                */}
                <GridVisualizer 
                  imageUrl={imageUrl} 
                  config={{
                    ...config,
                    rows: task.rows,
                    cols: task.cols,
                    aspectRatioWidth: task.aspectRatioWidth,
                    aspectRatioHeight: task.aspectRatioHeight
                  }} 
                />
              </div>
            )}

            {viewMode === 'queue' && (
              <div className="p-6">
                {task.results.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('generatedAssets')}</h5>
                      <span className="text-[10px] font-mono text-slate-600 bg-slate-900/50 px-2 py-0.5 rounded border border-white/5">
                        {task.results.length} {t('total')}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                      {task.results.map((asset) => (
                        <AssetCard 
                          key={asset.id} 
                          asset={asset} 
                          status={task.status} 
                          onToggleSelect={(id) => onToggleAssetSelect(task.id, id)}
                        />
                      ))}
                    </div>
                  </div>
                ) : task.status === 'processing' ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <div className="relative">
                      <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                      <div className="absolute inset-0 bg-blue-500/20 blur-xl animate-pulse rounded-full" />
                    </div>
                    <p className="text-slate-400 text-sm font-black tracking-tight">{t('extracting')}</p>
                  </div>
                ) : task.status === 'error' ? (
                  <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-red-500/20 rounded-2xl bg-red-950/10 text-red-500/60 italic text-sm group">
                    <AlertCircle className="w-8 h-8 mb-3 opacity-40 group-hover:opacity-100 transition-all duration-500 transform group-hover:scale-110" />
                    <p className="font-bold tracking-tight mb-1">Processing Aborted</p>
                    <p className="text-[10px] font-medium opacity-60">See global error log for details</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-700/30 rounded-2xl bg-slate-900/30 text-slate-500 italic text-sm group">
                    <Clock className="w-8 h-8 mb-3 opacity-20 group-hover:opacity-40 transition-all duration-500 transform group-hover:scale-110" />
                    <p className="font-bold tracking-tight">{t('waiting')}</p>
                  </div>
                )}
              </div>
            )}
            
            <style>{`
              @keyframes shimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
              }
              .animate-shimmer {
                animation: shimmer 2s linear infinite;
              }
              .custom-scrollbar-red::-webkit-scrollbar { width: 6px; }
              .custom-scrollbar-red::-webkit-scrollbar-track { background: rgba(239, 68, 68, 0.05); }
              .custom-scrollbar-red::-webkit-scrollbar-thumb { 
                background: rgba(239, 68, 68, 0.2); 
                border-radius: 10px; 
              }
              .custom-scrollbar-red::-webkit-scrollbar-thumb:hover { background: rgba(239, 68, 68, 0.4); }
            `}</style>
          </div>
        );
      })}
    </div>
  );
};
