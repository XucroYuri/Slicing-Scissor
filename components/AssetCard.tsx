
import React, { useState } from 'react';
import { Asset } from '../types';
import { ExternalLink, Copy, Check, Expand, Download, Info, Loader2, CheckSquare, Square, AlertTriangle, MessageCircleWarning } from 'lucide-react';
import { t } from '../i18n';

interface Props {
  asset: Asset;
  status: 'pending' | 'processing' | 'completed' | 'error';
  onToggleSelect?: (id: string) => void;
}

export const AssetCard: React.FC<Props> = ({ asset, status, onToggleSelect }) => {
  const [copied, setCopied] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showErrorDetail, setShowErrorDetail] = useState(false);

  const copyName = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(asset.processedName);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadAsset = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (asset.error) return;
    const link = document.createElement('a');
    link.href = asset.url;
    link.download = asset.processedName;
    link.click();
  };

  const toggleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (asset.error) return;
    onToggleSelect?.(asset.id);
  };

  const isFailed = asset.error || status === 'error';

  const getStatusBadge = () => {
    if (asset.error) {
      return (
        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-[8px] font-bold uppercase tracking-wider">
          <AlertTriangle className="w-2 h-2" />
          {t('failed')}
        </div>
      );
    }
    switch (status) {
      case 'completed':
        return (
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[8px] font-bold uppercase tracking-wider">
            {t('ready')}
          </div>
        );
      case 'processing':
        return (
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-[8px] font-bold uppercase tracking-wider">
            <Loader2 className="w-2 h-2 animate-spin" />
            {t('slicing')}
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-[8px] font-bold uppercase tracking-wider">
            {t('failed')}
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-500/20 text-slate-400 border border-slate-500/30 rounded text-[8px] font-bold uppercase tracking-wider">
            {t('queue')}
          </div>
        );
    }
  };

  return (
    <div 
      onClick={toggleSelect}
      onMouseEnter={() => asset.error && setShowErrorDetail(true)}
      onMouseLeave={() => setShowErrorDetail(false)}
      className={`group relative bg-slate-900 border rounded-2xl overflow-hidden transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.03] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] ring-1 ring-white/5 cursor-pointer ${
        isFailed
        ? 'border-red-500 shadow-red-900/20 bg-red-900/10'
        : asset.selected 
        ? 'border-blue-500 shadow-blue-900/40 bg-blue-500/5' 
        : 'border-slate-700/60 hover:border-blue-500/40 bg-slate-900 shadow-black/60'
      }`}
    >
      <div className="aspect-square relative overflow-hidden bg-slate-950 group/img">
        {!imageLoaded && !asset.error && (
          <div className="absolute inset-0 bg-slate-800 animate-pulse flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-slate-700 animate-spin" />
          </div>
        )}
        
        {asset.error ? (
          <div className="absolute inset-0 bg-red-950/20 flex flex-col items-center justify-center p-4 text-center">
             <MessageCircleWarning className="w-8 h-8 text-red-500/50 mb-2" />
             <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{t('errorDetail')}</span>
          </div>
        ) : (
          <img 
            src={asset.url} 
            alt={asset.processedName}
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-contain transition-all duration-700 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            title={`${t('name')}: ${asset.processedName}\n${t('resolution')}: ${asset.width}x${asset.height}px`}
          />
        )}

        {/* Action Overlay (Only if not failed) */}
        {!isFailed && (
          <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-md z-20">
            <button 
              onClick={(e) => { e.stopPropagation(); window.open(asset.url, '_blank'); }}
              className="p-2.5 bg-white/10 hover:bg-blue-600 rounded-xl text-white transition-all transform hover:scale-110 active:scale-90"
              title={t('viewOriginal')}
            >
              <ExternalLink className="w-4.5 h-4.5" />
            </button>
            <button 
              onClick={downloadAsset}
              className="p-2.5 bg-white/10 hover:bg-emerald-600 rounded-xl text-white transition-all transform hover:scale-110 active:scale-90"
              title={t('downloadIndividual')}
            >
              <Download className="w-4.5 h-4.5" />
            </button>
            <button 
              onClick={copyName}
              className="p-2.5 bg-white/10 hover:bg-indigo-600 rounded-xl text-white transition-all transform hover:scale-110 active:scale-90"
              title={t('copyFilename')}
            >
              {copied ? <Check className="w-4.5 h-4.5 text-emerald-400" /> : <Copy className="w-4.5 h-4.5" />}
            </button>
          </div>
        )}

        {/* Error Tooltip */}
        {showErrorDetail && asset.error && (
          <div className="absolute inset-0 z-40 bg-red-950/95 backdrop-blur-sm p-4 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-200">
            <AlertTriangle className="w-6 h-6 text-red-500 mb-2" />
            <p className="text-[11px] text-red-200 font-medium leading-relaxed">{asset.error}</p>
          </div>
        )}

        {/* Selection Checkbox (Hidden on failed) */}
        {!isFailed && (
          <div className="absolute top-2 right-2 z-30 transition-transform duration-300 transform scale-0 group-hover:scale-100 origin-top-right">
            {asset.selected ? (
              <div className="p-1 bg-blue-500 rounded-lg shadow-lg">
                <CheckSquare className="w-4 h-4 text-white" />
              </div>
            ) : (
              <div className="p-1 bg-slate-900/80 backdrop-blur rounded-lg border border-slate-600 text-slate-400 hover:text-white hover:bg-blue-600 hover:border-blue-400 transition-colors">
                <Square className="w-4 h-4" />
              </div>
            )}
          </div>
        )}

        {/* Info badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          <div className="px-2 py-0.5 bg-blue-600 rounded-lg text-[9px] font-black text-white uppercase shadow-lg shadow-black/40">
            {t('shot')} {asset.gridIndex + 1}
          </div>
          {getStatusBadge()}
        </div>
        
        {!isFailed && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 backdrop-blur-md rounded-lg text-[8px] font-mono text-slate-300 border border-white/10 flex items-center gap-1 shadow-lg z-10">
            <Expand className="w-2.5 h-2.5" />
            {asset.width}x{asset.height}
          </div>
        )}
      </div>
      
      {/* Footer Details */}
      <div className={`p-3 border-t transition-colors duration-500 ${isFailed ? 'border-red-500/30 bg-red-950/30' : asset.selected ? 'border-blue-500/30 bg-blue-500/10' : 'border-slate-800 bg-slate-900/50'}`}>
        <div 
          className={`text-[10px] font-mono truncate leading-tight mb-2 opacity-80 cursor-help flex items-center gap-1 ${isFailed ? 'text-red-400' : 'text-slate-400'}`} 
          title={asset.processedName}
        >
          {isFailed ? <AlertTriangle className="w-3 h-3 flex-shrink-0" /> : <Info className="w-3 h-3 flex-shrink-0 text-slate-600" />}
          <span className="truncate">{asset.processedName}</span>
        </div>
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-1.5">
             <div className={`w-1.5 h-1.5 rounded-full shadow-sm ${status === 'completed' && !asset.error ? 'bg-emerald-500 shadow-emerald-500/50 animate-pulse' : isFailed ? 'bg-red-500 shadow-red-500/50' : 'bg-slate-600'}`}></div>
             <span className={`text-[9px] font-black uppercase tracking-tighter ${status === 'completed' && !asset.error ? 'text-emerald-400' : isFailed ? 'text-red-400' : 'text-slate-500'}`}>
               {status === 'completed' && !asset.error ? t('readyToDeploy') : isFailed ? t('failed') : t('inPipeline')}
             </span>
           </div>
        </div>
      </div>
    </div>
  );
};
