import React from 'react';
import { format } from 'date-fns';
import { RefreshCw, Database, CheckCircle, AlertCircle, Clock, ExternalLink } from 'lucide-react';
import { DiffSummary } from '../services/diffService';

interface SyncStatusProps {
  lastSyncDate: Date | null;
  isFetching: boolean;
  isIntegrating: boolean;
  diffSummary: DiffSummary | null;
  onFetch: () => void;
  onIntegrate: () => void;
  onCancel: () => void;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({
  lastSyncDate,
  isFetching,
  isIntegrating,
  diffSummary,
  onFetch,
  onIntegrate,
  onCancel
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        
        {/* Status Info */}
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Terminology Database</h2>
            <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
              <Clock className="w-4 h-4" />
              <span>
                Last Synced: {lastSyncDate ? format(lastSyncDate, 'MMM d, yyyy HH:mm') : 'Never'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions & Diff Summary */}
        <div className="flex flex-col items-end gap-3 w-full md:w-auto">
          {diffSummary ? (
            <div className="flex flex-col items-end gap-3 w-full">
              {diffSummary.isDifferent ? (
                <div className="relative group flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-1.5 rounded-md border border-amber-200 cursor-help">
                  <AlertCircle className="w-4 h-4" />
                  <span>Update available: {diffSummary.added} added, {diffSummary.updated} updated, {diffSummary.removed} removed</span>
                  
                  {/* Infotip / Tooltip */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 p-3 bg-slate-800 text-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 delay-200 z-50 transform translate-y-1 group-hover:translate-y-0">
                    {/* Caret */}
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-800 rotate-45"></div>
                    
                    <div className="relative z-10">
                      <h4 className="text-xs font-bold mb-2 text-slate-100 border-b border-slate-700 pb-1.5">更新内容预览</h4>
                      <ul className="space-y-2 text-xs leading-tight">
                        <li className="flex items-start gap-1.5">
                          <span className="text-slate-400 font-medium shrink-0">[修正]</span>
                          <span className="text-slate-200">修复部分术语拼写错误</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-slate-400 font-medium shrink-0">[优化]</span>
                          <span className="text-slate-200">提升多语言翻译准确度</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-slate-400 font-medium shrink-0">[补充]</span>
                          <span className="text-slate-200">完善核心词汇上下文描述</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-slate-400 font-medium shrink-0">[规范]</span>
                          <span className="text-slate-200">统一全局标点符号格式</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-200">
                  <CheckCircle className="w-4 h-4" />
                  <span>Database is up to date</span>
                </div>
              )}
              
              <div className="flex gap-2 w-full md:w-auto">
                {diffSummary.isDifferent && (
                  <button
                    onClick={onIntegrate}
                    disabled={isIntegrating}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isIntegrating ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Integrate Updates
                  </button>
                )}
                <button
                  onClick={onCancel}
                  className="flex-1 md:flex-none inline-flex items-center justify-center px-4 py-2 bg-white text-slate-700 text-sm font-medium rounded-lg border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  {diffSummary.isDifferent ? 'Cancel' : 'Dismiss'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onFetch}
              disabled={isFetching}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              {isFetching ? 'Fetching Updates...' : 'Fetch Updates'}
            </button>
          )}
          
          <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
            Source: 
            <a 
              href="https://docs.google.com/spreadsheets/d/1l7UklehnPi0XK1J4ieuHLrJFzhdpijSe/edit" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 transition-colors"
            >
              Google Sheets <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
