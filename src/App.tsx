/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { TermTable } from './components/TermTable';
import { SyncStatus } from './components/SyncStatus';
import { fetchTermsFromSheet, Term } from './services/googleSheetsService';
import { computeDiff, DiffSummary } from './services/diffService';
import { BookOpen, Loader2 } from 'lucide-react';

export default function App() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [lastSyncDate, setLastSyncDate] = useState<Date | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isIntegrating, setIsIntegrating] = useState(false);
  const [isInitialSyncing, setIsInitialSyncing] = useState(true);
  const [diffSummary, setDiffSummary] = useState<DiffSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const hasAttemptedInitialSync = useRef(false);

  // Load from local storage on mount or trigger initial sync
  useEffect(() => {
    if (hasAttemptedInitialSync.current) return;
    hasAttemptedInitialSync.current = true;

    const storedTerms = localStorage.getItem('terminology_terms');
    const storedDate = localStorage.getItem('terminology_last_sync');
    let hasLocalData = false;
    let parsedTerms: Term[] = [];
    
    if (storedTerms) {
      try {
        parsedTerms = JSON.parse(storedTerms);
        if (parsedTerms && parsedTerms.length > 0) {
          setTerms(parsedTerms);
          hasLocalData = true;
        }
      } catch (e) {
        console.error('Failed to parse stored terms', e);
      }
    }
    
    if (storedDate) {
      setLastSyncDate(new Date(storedDate));
    }

    if (!hasLocalData) {
      performInitialSync();
    } else {
      setIsInitialSyncing(false);
      // Automatically check for updates in the background if we loaded from cache
      performBackgroundCheck(parsedTerms);
    }
  }, []);

  const performInitialSync = async () => {
    setIsInitialSyncing(true);
    setError(null);
    try {
      const fetchedTerms = await fetchTermsFromSheet();
      const now = new Date();
      
      setTerms(fetchedTerms);
      setLastSyncDate(now);
      
      localStorage.setItem('terminology_terms', JSON.stringify(fetchedTerms));
      localStorage.setItem('terminology_last_sync', now.toISOString());
    } catch (err) {
      console.error('Initial sync failed:', err);
      setError('Failed to load initial data automatically. Please try fetching manually.');
    } finally {
      setIsInitialSyncing(false);
    }
  };

  const performBackgroundCheck = async (currentTerms: Term[]) => {
    setIsFetching(true);
    try {
      const fetchedTerms = await fetchTermsFromSheet();
      const diff = computeDiff(currentTerms, fetchedTerms);
      
      // If there are updates, automatically show the banner
      if (diff.isDifferent) {
        setDiffSummary(diff);
      }
    } catch (err) {
      console.error('Background sync failed:', err);
      // Fail silently for background checks to avoid disrupting the user
    } finally {
      setIsFetching(false);
    }
  };

  const handleFetch = async () => {
    setIsFetching(true);
    setError(null);
    try {
      const fetchedTerms = await fetchTermsFromSheet();
      const diff = computeDiff(terms, fetchedTerms);
      setDiffSummary(diff);
    } catch (err) {
      console.error('Error fetching terms:', err);
      setError('Failed to fetch terminology updates. Please try again.');
    } finally {
      setIsFetching(false);
    }
  };

  const handleIntegrate = async () => {
    if (!diffSummary) return;
    
    setIsIntegrating(true);
    try {
      // Simulate a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const newTerms = diffSummary.newTerms;
      const now = new Date();
      
      setTerms(newTerms);
      setLastSyncDate(now);
      
      localStorage.setItem('terminology_terms', JSON.stringify(newTerms));
      localStorage.setItem('terminology_last_sync', now.toISOString());
      
      setDiffSummary(null);
    } catch (err) {
      console.error('Error integrating terms:', err);
      setError('Failed to integrate updates. Please try again.');
    } finally {
      setIsIntegrating(false);
    }
  };

  const handleCancel = () => {
    setDiffSummary(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">TermBase</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-4rem)] flex flex-col">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative shadow-sm" role="alert">
            <span className="block sm:inline">{error}</span>
            <button 
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={() => setError(null)}
            >
              <span className="sr-only">Dismiss</span>
              <svg className="fill-current h-6 w-6 text-red-500 hover:text-red-700 transition-colors" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
            </button>
          </div>
        )}

        {isInitialSyncing ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-xl shadow-sm border border-slate-200 p-12">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-75"></div>
              <div className="relative bg-white p-4 rounded-full shadow-sm border border-slate-100">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
              </div>
            </div>
            <h2 className="mt-6 text-xl font-semibold text-slate-900">Initializing Database</h2>
            <p className="mt-2 text-slate-500 text-center max-w-md">
              Please wait while we fetch the latest terminology data from Google Sheets for your first visit...
            </p>
          </div>
        ) : (
          <>
            <SyncStatus
              lastSyncDate={lastSyncDate}
              isFetching={isFetching}
              isIntegrating={isIntegrating}
              diffSummary={diffSummary}
              onFetch={handleFetch}
              onIntegrate={handleIntegrate}
              onCancel={handleCancel}
            />

            <div className="flex-1 min-h-0">
              <TermTable terms={terms} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

