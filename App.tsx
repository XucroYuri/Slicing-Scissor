
import React, { useState, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { SettingsPanel } from './components/SettingsPanel';
import { Dropzone } from './components/Dropzone';
import { AssetGallery } from './components/AssetGallery';
import { sliceImage, getImageDimensions, detectGridStructure, getSmartAspectRatio } from './services/imageProcessor';
import { ProjectConfig, ProcessingTask, Asset } from './types';
import { Layers, Download, Trash2, CheckCircle2, Loader2, Sparkles, CheckSquare, PackageCheck, ListChecks, Square, LayoutGrid, ListTodo, AlertTriangle, X } from 'lucide-react';
import JSZip from 'jszip';
import { t } from './i18n';

const generateShortId = () => {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
};

const App: React.FC = () => {
  const [config, setConfig] = useState<ProjectConfig>({
    projectId: 'PRJ',
    sceneId: 'SC01',
    rows: 3,
    cols: 3,
    aspectRatioWidth: 16,
    aspectRatioHeight: 9,
  });

  const [tasks, setTasks] = useState<ProcessingTask[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastDetectedInfo, setLastDetectedInfo] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'queue' | 'grid'>('queue');
  const [showMismatchModal, setShowMismatchModal] = useState(false);

  const handleFilesAdded = useCallback(async (files: File[]) => {
    const newTasksPromises = files.map(async file => {
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      const { width, height, element } = await getImageDimensions(file);
      const { rows, cols } = detectGridStructure(element);
      const cellW = width / cols;
      const cellH = height / rows;
      const { w, h } = getSmartAspectRatio(cellW, cellH);

      return {
        id: Math.random().toString(36).substr(2, 9),
        shortId: generateShortId(),
        file,
        customName: fileNameWithoutExt,
        status: 'pending' as const,
        progress: 0,
        results: [],
        selected: true,
        rows,
        cols,
        aspectRatioWidth: w,
        aspectRatioHeight: h,
      };
    });
    
    const resolvedTasks = await Promise.all(newTasksPromises);
    setTasks(prev => [...prev, ...resolvedTasks]);

    // Update global config based on the first added file if it's the first batch
    if (tasks.length === 0 && resolvedTasks.length > 0) {
      const first = resolvedTasks[0];
      setConfig(prev => ({
        ...prev,
        rows: first.rows,
        cols: first.cols,
        aspectRatioWidth: first.aspectRatioWidth,
        aspectRatioHeight: first.aspectRatioHeight
      }));
      setLastDetectedInfo(`${first.cols}x${first.rows} | ${first.aspectRatioWidth}:${first.aspectRatioHeight}`);
    }
  }, [tasks.length]);

  const updateTaskName = (taskId: string, newName: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, customName: newName } : t));
  };

  const updateTaskParams = (taskId: string, updates: Partial<ProcessingTask>) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
  };

  const moveTaskUp = useCallback((index: number) => {
    if (index <= 0) return;
    setTasks(prev => {
      const newTasks = [...prev];
      const temp = newTasks[index];
      newTasks[index] = newTasks[index - 1];
      newTasks[index - 1] = temp;
      return newTasks;
    });
  }, []);

  const moveTaskDown = useCallback((index: number) => {
    setTasks(prev => {
      if (index >= prev.length - 1) return prev;
      const newTasks = [...prev];
      const temp = newTasks[index];
      newTasks[index] = newTasks[index + 1];
      newTasks[index + 1] = temp;
      return newTasks;
    });
  }, []);

  const mismatchedTasks = useMemo(() => {
    const threshold = 0.05;
    return tasks.filter(task => {
      if (task.status === 'completed') return false;
      const gridMismatch = task.rows !== config.rows || task.cols !== config.cols;
      const taskRatio = task.aspectRatioWidth / task.aspectRatioHeight;
      const globalRatio = config.aspectRatioWidth / config.aspectRatioHeight;
      const ratioMismatch = Math.abs(taskRatio - globalRatio) > threshold;
      return gridMismatch || ratioMismatch;
    });
  }, [tasks, config]);

  const startProcessing = async (applyGlobal = false) => {
    setShowMismatchModal(false);
    setIsProcessing(true);

    const tasksToProcess = [...tasks];
    
    for (const task of tasksToProcess) {
      if (task.status === 'completed') continue;

      try {
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'processing', progress: 10 } : t));
        
        // Use either task's individual params or global config based on selection
        const slicingParams = applyGlobal ? {
          ...config,
          rows: config.rows,
          cols: config.cols,
          aspectRatioWidth: config.aspectRatioWidth,
          aspectRatioHeight: config.aspectRatioHeight
        } : {
          ...config, // Still use projectId/sceneId from global
          rows: task.rows,
          cols: task.cols,
          aspectRatioWidth: task.aspectRatioWidth,
          aspectRatioHeight: task.aspectRatioHeight
        };

        const assets = await sliceImage(
          task.file, 
          slicingParams, 
          (p) => {
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, progress: 10 + (p * 0.9) } : t));
          },
          task.customName,
          task.shortId
        );

        const assetsWithSelection = assets.map(a => ({ ...a, selected: true }));

        setTasks(prev => prev.map(t => t.id === task.id ? { 
          ...t, 
          status: 'completed', 
          progress: 100, 
          results: assetsWithSelection 
        } : t));
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setTasks(prev => prev.map(t => t.id === task.id ? { 
          ...t, 
          status: 'error', 
          error: errorMsg 
        } : t));
      }
    }
    
    setIsProcessing(false);
  };

  const handleStartSlicingClick = () => {
    if (mismatchedTasks.length > 0) {
      setShowMismatchModal(true);
    } else {
      startProcessing();
    }
  };

  const handleToggleTaskSelect = (taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const newSelected = !t.selected;
        return {
          ...t,
          selected: newSelected,
          results: t.results.map(a => ({ ...a, selected: newSelected }))
        };
      }
      return t;
    }));
  };

  const handleToggleAssetSelect = (taskId: string, assetId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const updatedResults = t.results.map(a => a.id === assetId ? { ...a, selected: !a.selected } : a);
        const someSelected = updatedResults.some(a => a.selected);
        return {
          ...t,
          results: updatedResults,
          selected: someSelected
        };
      }
      return t;
    }));
  };

  const handleSelectAll = useCallback(() => {
    const allSelected = tasks.every(t => t.selected && t.results.every(a => a.selected));
    const targetState = !allSelected;

    setTasks(prev => prev.map(t => ({
      ...t,
      selected: targetState,
      results: t.results.map(a => ({ ...a, selected: targetState }))
    })));
  }, [tasks]);

  const clearTasks = useCallback(() => {
    setTasks([]);
    setLastDetectedInfo(null);
  }, []);

  const selectedAssetCount = useMemo(() => {
    return tasks.reduce((sum, t) => sum + t.results.filter(a => a.selected).length, 0);
  }, [tasks]);

  const isAllSelected = useMemo(() => {
    if (tasks.length === 0) return false;
    return tasks.every(t => t.selected && (t.results.length === 0 || t.results.every(a => a.selected)));
  }, [tasks]);

  const downloadSelectedAsZip = async () => {
    if (selectedAssetCount === 0) return;
    const zip = new JSZip();
    let fileAdded = false;

    tasks.forEach((task) => {
      const selectedShots = task.results.filter(a => a.selected);
      if (selectedShots.length > 0) {
        const folderName = `${config.projectId}_${config.sceneId}_${task.customName}_${task.shortId}`;
        const folder = zip.folder(folderName);
        if (folder) {
          selectedShots.forEach(asset => {
            folder.file(asset.processedName, asset.blob);
            fileAdded = true;
          });
        }
      }
    });

    if (!fileAdded) return;
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${config.projectId}_${config.sceneId}_Export_Package.zip`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      <Header />
      
      <main className="flex-1 flex flex-col md:flex-row p-4 md:p-6 gap-6 overflow-hidden">
        <aside className="w-full md:w-80 space-y-6 flex-shrink-0 overflow-y-auto max-h-full pb-10 scrollbar-hide">
          <SettingsPanel config={config} onConfigChange={setConfig} />
          
          <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-4 h-4" />
                {t('batchControl')}
              </h3>
              {selectedAssetCount > 0 && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/20 text-[9px] font-black uppercase">
                  <CheckSquare className="w-3 h-3" />
                  {selectedAssetCount}
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              {lastDetectedInfo && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[10px] text-blue-400 font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  {t('autoDetect')}: {lastDetectedInfo}
                </div>
              )}
              
              <button
                onClick={handleStartSlicingClick}
                disabled={tasks.length === 0 || isProcessing}
                className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed rounded-2xl font-bold transition-all shadow-xl shadow-blue-900/20 transform active:scale-95"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                {isProcessing ? t('processingTasks') : t('startSlicing')}
              </button>
              
              <button
                onClick={downloadSelectedAsZip}
                disabled={selectedAssetCount === 0 || isProcessing}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:border-transparent disabled:cursor-not-allowed rounded-2xl font-bold transition-all shadow-xl shadow-emerald-900/10 border border-emerald-500/20"
              >
                <PackageCheck className="w-5 h-5" />
                {t('downloadZip')}
              </button>

              <button
                onClick={clearTasks}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700/30 hover:bg-red-900/40 hover:text-red-400 hover:border-red-500/30 rounded-2xl font-bold transition-all text-slate-400 border border-slate-700/50"
              >
                <Trash2 className="w-4.5 h-4.5" />
                {t('clearWorkspace')}
              </button>
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          {tasks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center border-4 border-dashed border-slate-700/30 rounded-[4rem] bg-slate-900/20 p-12 text-center">
              <Dropzone onFilesAdded={handleFilesAdded} />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6 sticky top-0 z-30 bg-[#0f172a]/80 backdrop-blur-md py-4 gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                      {t('assetMgmt')} 
                      <span className="text-xs font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">{tasks.length}</span>
                    </h2>
                    
                    <div className="bg-slate-900/80 border border-slate-700 p-1 rounded-xl flex items-center shadow-inner">
                      <button
                        onClick={() => setViewMode('queue')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          viewMode === 'queue' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-500 hover:text-slate-300'
                        }`}
                        title={t('queueView')}
                      >
                        <ListTodo className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{t('queueView')}</span>
                      </button>
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          viewMode === 'grid' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-500 hover:text-slate-300'
                        }`}
                        title={t('gridView')}
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{t('gridView')}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <button 
                      onClick={handleSelectAll}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border transform active:scale-95 ${
                        isAllSelected 
                        ? 'bg-blue-600/20 text-blue-400 border-blue-500/50' 
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white hover:border-slate-500 shadow-lg'
                      }`}
                    >
                      {isAllSelected ? <CheckSquare className="w-4 h-4" /> : <ListChecks className="w-4 h-4" />}
                      {isAllSelected ? t('deselectAll') : t('selectAll')}
                    </button>
                    <div className="text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20 shadow-inner shadow-blue-900/10">
                      {selectedAssetCount} {t('selectedCount')}
                    </div>
                  </div>
                </div>
                <AssetGallery 
                  tasks={tasks} 
                  config={config} 
                  onToggleTaskSelect={handleToggleTaskSelect}
                  onToggleAssetSelect={handleToggleAssetSelect}
                  onUpdateTaskName={updateTaskName}
                  onUpdateTaskParams={updateTaskParams}
                  onMoveTaskUp={moveTaskUp}
                  onMoveTaskDown={moveTaskDown}
                  viewMode={viewMode}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Configuration Mismatch Modal */}
      {showMismatchModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowMismatchModal(false)}></div>
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-300">
            <button 
              className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors"
              onClick={() => setShowMismatchModal(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center text-center">
              <div className="p-4 bg-amber-500/20 rounded-2xl mb-6">
                <AlertTriangle className="w-10 h-10 text-amber-500" />
              </div>
              <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">{t('configMismatch')}</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">{t('mismatchDesc')}</p>
              
              <div className="space-y-3 w-full">
                <button
                  onClick={() => startProcessing(false)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/20"
                >
                  {t('proceedIndividual')}
                </button>
                <button
                  onClick={() => startProcessing(true)}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 transition-all"
                >
                  {t('applyGlobal')}
                </button>
                <button
                  onClick={() => setShowMismatchModal(false)}
                  className="w-full py-3 text-slate-500 font-bold hover:text-slate-300 transition-all"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: #1e293b; 
          border-radius: 20px; 
          border: 3px solid #0f172a;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default App;
