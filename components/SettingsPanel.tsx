
import React from 'react';
import { ProjectConfig } from '../types';
import { Settings, Layout, Maximize, FileText, HelpCircle } from 'lucide-react';
import { t } from '../i18n';

interface Props {
  config: ProjectConfig;
  onConfigChange: (config: ProjectConfig) => void;
}

const Tooltip: React.FC<{ text: string }> = ({ text }) => (
  <div className="group relative inline-block ml-1.5 align-middle">
    <HelpCircle className="w-3 h-3 text-slate-600 hover:text-blue-400 cursor-help transition-colors" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 border border-slate-700 text-[10px] text-slate-300 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-[60] leading-relaxed">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-700" />
    </div>
  </div>
);

export const SettingsPanel: React.FC<Props> = ({ config, onConfigChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onConfigChange({
      ...config,
      [name]: (['rows', 'cols', 'aspectRatioWidth', 'aspectRatioHeight'].includes(name)) 
        ? parseFloat(value) || 1 
        : value,
    });
  };

  const setRatio = (w: number, h: number) => {
    onConfigChange({ ...config, aspectRatioWidth: w, aspectRatioHeight: h });
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 shadow-xl shadow-black/20">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Settings className="w-4 h-4" />
        {t('slicingLogic')}
      </h3>
      
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase flex items-center">
              {t('projectId')}
              <Tooltip text={t('projectIdTooltip')} />
            </label>
            <input
              type="text"
              name="projectId"
              value={config.projectId}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all hover:border-slate-600"
              placeholder="PRJ"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase flex items-center">
              {t('sceneId')}
              <Tooltip text={t('sceneIdTooltip')} />
            </label>
            <input
              type="text"
              name="sceneId"
              value={config.sceneId}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all hover:border-slate-600"
              placeholder="SC01"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-700/50">
          <label className="block text-[10px] font-bold text-slate-500 mb-3 uppercase flex items-center gap-1">
            <Layout className="w-3 h-3" /> {t('gridStructure')}
            <Tooltip text={t('gridStructureTooltip')} />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black text-slate-600 uppercase flex items-center gap-1 px-1">
                {t('rows')}
                <Tooltip text={t('rowsTooltip')} />
              </span>
              <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-slate-700 hover:border-slate-600 transition-all">
                <input
                  type="number"
                  name="rows"
                  min="1"
                  value={config.rows}
                  onChange={handleChange}
                  className="w-full bg-transparent text-sm focus:outline-none text-center font-mono"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black text-slate-600 uppercase flex items-center gap-1 px-1">
                {t('cols')}
                <Tooltip text={t('colsTooltip')} />
              </span>
              <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-slate-700 hover:border-slate-600 transition-all">
                <input
                  type="number"
                  name="cols"
                  min="1"
                  value={config.cols}
                  onChange={handleChange}
                  className="w-full bg-transparent text-sm focus:outline-none text-center font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-700/50">
          <label className="block text-[10px] font-bold text-slate-500 mb-3 uppercase flex items-center gap-1">
            <Maximize className="w-3 h-3" /> {t('targetRatio')}
            <Tooltip text={t('targetRatioTooltip')} />
          </label>
          <div className="grid grid-cols-2 gap-4 mb-3">
             <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-slate-700 hover:border-slate-600 transition-all">
              <input
                type="number"
                name="aspectRatioWidth"
                value={config.aspectRatioWidth}
                onChange={handleChange}
                className="w-full bg-transparent text-sm focus:outline-none text-center font-mono"
              />
            </div>
            <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-slate-700 hover:border-slate-600 transition-all">
              <input
                type="number"
                name="aspectRatioHeight"
                value={config.aspectRatioHeight}
                onChange={handleChange}
                className="w-full bg-transparent text-sm focus:outline-none text-center font-mono"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {[
              { label: '16:9', w: 16, h: 9 },
              { label: '9:16', w: 9, h: 16 },
              { label: '1:1', w: 1, h: 1 },
              { label: '3:4', w: 3, h: 4 },
              { label: '4:3', w: 4, h: 3 }
            ].map(ratio => (
              <button
                key={ratio.label}
                onClick={() => setRatio(ratio.w, ratio.h)}
                className={`px-2 py-1 text-[10px] rounded border transition-all font-bold ${
                  config.aspectRatioWidth === ratio.w && config.aspectRatioHeight === ratio.h
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/40'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
                }`}
              >
                {ratio.label}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 mt-2 border-t border-blue-500/20 bg-blue-500/5 p-3 rounded-xl border relative group/naming">
          <label className="block text-[9px] font-bold text-blue-400 mb-1.5 uppercase flex items-center gap-1.5">
            <FileText className="w-3 h-3" /> {t('namingConvention')}
            <Tooltip text={t('namingConventionTooltip')} />
          </label>
          <div className="font-mono text-[9px] text-blue-300/80 break-all leading-relaxed">
            <span className="text-emerald-400 font-bold">Shot001</span>_
            <span className="text-white font-bold italic">ImageName</span>_
            <span className="text-blue-500 font-bold">{config.sceneId || 'SC01'}</span>__
            <span className="text-blue-500 font-bold">{config.projectId || 'PRJ'}</span>_
            <span className="text-emerald-400 font-bold">001</span>_
            <span className="text-blue-400 font-bold">A7X2</span>.png
          </div>
        </div>
      </div>
    </div>
  );
};
