
import React from 'react';
import { Scissors, ShieldCheck } from 'lucide-react';
import { t } from '../i18n';

export const Header: React.FC = () => {
  return (
    <header className="h-16 px-6 border-b border-slate-800 bg-slate-900/90 backdrop-blur-xl flex items-center justify-between sticky top-0 z-50 shadow-lg shadow-black/40">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-700 rounded-xl shadow-lg shadow-blue-900/40">
          <Scissors className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-slate-500 tracking-tight">
            {t('appTitle')}
          </h1>
          <p className="text-[9px] text-slate-500 font-bold tracking-[0.2em] uppercase leading-none mt-0.5">
            {t('assetMgmt')}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">{t('localProcessing')}</span>
        </div>
      </div>
    </header>
  );
};
