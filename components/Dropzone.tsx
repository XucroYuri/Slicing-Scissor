
import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, Plus, Sparkles } from 'lucide-react';
import { t } from '../i18n';

interface Props {
  onFilesAdded: (files: File[]) => void;
}

export const Dropzone: React.FC<Props> = ({ onFilesAdded }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = (Array.from(e.dataTransfer.files) as File[]).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) onFilesAdded(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = (Array.from(e.target.files || []) as File[]).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) onFilesAdded(files);
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`group relative flex flex-col items-center gap-6 cursor-pointer p-16 transition-all duration-700 w-full max-w-2xl border-4 border-dashed rounded-[4rem] ${
        isDragging 
        ? 'border-blue-500 bg-blue-500/10 scale-105 shadow-[0_0_100px_rgba(59,130,246,0.2)]' 
        : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-800/40'
      }`}
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        multiple 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileSelect}
      />
      
      <div className={`relative w-28 h-28 rounded-3xl flex items-center justify-center transition-all duration-700 ${
        isDragging 
        ? 'bg-gradient-to-br from-blue-500 to-indigo-700 shadow-[0_0_50px_rgba(59,130,246,0.4)] rotate-12 scale-110' 
        : 'bg-slate-800 border-2 border-slate-700 group-hover:border-blue-500 group-hover:bg-slate-700 group-hover:rotate-3'
      }`}>
        {isDragging ? (
          <Plus className="w-12 h-12 text-white animate-bounce" />
        ) : (
          <Upload className="w-12 h-12 text-slate-500 group-hover:text-blue-400 transition-colors" />
        )}
        
        {/* Animated rings when dragging */}
        {isDragging && (
          <div className="absolute inset-0 rounded-3xl border-2 border-blue-400 animate-ping opacity-20"></div>
        )}
      </div>

      <div className="text-center space-y-3">
        <h4 className={`text-3xl font-black transition-all duration-500 ${isDragging ? 'text-blue-400 tracking-wider' : 'text-slate-200 tracking-tight'}`}>
          {isDragging ? t('dropzoneActive') : t('uploadAssets')}
        </h4>
        <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed font-medium">
          {t('dropzoneDesc')}
        </p>
      </div>

      <div className="flex items-center gap-2.5 px-6 py-2.5 bg-slate-800/80 backdrop-blur rounded-full text-xs font-black text-slate-400 border border-slate-700 shadow-2xl group-hover:text-blue-400 group-hover:border-blue-500/30 transition-all">
        <Sparkles className="w-4 h-4 text-blue-500" />
        {t('supports')}
      </div>
    </div>
  );
};
