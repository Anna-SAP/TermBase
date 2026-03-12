import React, { useState, useMemo, useDeferredValue, useEffect } from 'react';
import { Term } from '../services/googleSheetsService';
import { Search, Globe2, Loader2, CheckSquare, Square } from 'lucide-react';

interface TermTableProps {
  terms: Term[];
}

export const TermTable: React.FC<TermTableProps> = ({ terms }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [matchWholeWord, setMatchWholeWord] = useState(false);
  const [matchCase, setMatchCase] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState<Set<string>>(new Set());
  
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const isSearching = searchTerm !== deferredSearchTerm;
  
  const [displayCount, setDisplayCount] = useState(20);

  // Reset display count when search changes
  useEffect(() => {
    setDisplayCount(20);
  }, [deferredSearchTerm, matchWholeWord, matchCase, selectedLanguages]);

  // Dynamically extract language columns (e.g., zh_CN, fr_FR, es_419)
  const languages = useMemo(() => {
    if (terms.length === 0) return [];
    const firstTerm = terms[0];
    const langRegex = /^[a-z]{2}_[A-Z0-9]{2,3}$/;
    return Object.keys(firstTerm).filter(key => langRegex.test(key) && key !== 'en_US').sort();
  }, [terms]);

  // Initialize selected languages when languages are loaded
  useEffect(() => {
    if (languages.length > 0 && selectedLanguages.size === 0) {
      setSelectedLanguages(new Set(languages));
    }
  }, [languages]);

  const toggleLanguage = (lang: string) => {
    const newSelected = new Set(selectedLanguages);
    if (newSelected.has(lang)) {
      newSelected.delete(lang);
    } else {
      newSelected.add(lang);
    }
    setSelectedLanguages(newSelected);
  };

  const toggleAllLanguages = () => {
    if (selectedLanguages.size === languages.length) {
      setSelectedLanguages(new Set());
    } else {
      setSelectedLanguages(new Set(languages));
    }
  };

  const filteredTerms = useMemo(() => {
    return terms.filter(term => {
      const query = deferredSearchTerm.trim();
      if (!query) return true; // Optimization: return all if search is empty
      
      const searchStr = matchCase ? query : query.toLowerCase();
      
      const checkMatch = (text: string | undefined) => {
        if (!text) return false;
        const targetText = matchCase ? text.trim() : text.trim().toLowerCase();
        
        if (matchWholeWord) {
          // Exact match: the entire field must match the search string exactly.
          // This prevents returning phrases that merely contain the word.
          return targetText === searchStr;
        } else {
          // Substring match
          return targetText.includes(searchStr);
        }
      };
      
      if (checkMatch(term.en_US)) return true;
      if (checkMatch(term.definition)) return true;
      
      // Search across all available languages
      for (const lang of languages) {
        if (checkMatch(term[lang])) {
          return true;
        }
      }
      return false;
    });
  }, [terms, deferredSearchTerm, languages, matchWholeWord, matchCase]);

  const displayedTerms = useMemo(() => {
    return filteredTerms.slice(0, displayCount);
  }, [filteredTerms, displayCount]);

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + 20);
  };

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      <div className="mb-6">
        <div className="relative w-full max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-12 py-3 border border-slate-200 rounded-xl leading-5 bg-white shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-base transition-all"
            placeholder="Search terms, definitions, or translations in any language..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {isSearching && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
            </div>
          )}
        </div>
        
        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-indigo-600 transition-colors">
              <input 
                type="checkbox" 
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                checked={matchWholeWord}
                onChange={(e) => setMatchWholeWord(e.target.checked)}
              />
              Match whole word
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-indigo-600 transition-colors">
              <input 
                type="checkbox" 
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                checked={matchCase}
                onChange={(e) => setMatchCase(e.target.checked)}
              />
              Match case
            </label>
          </div>
          
          <div className="text-slate-500 flex items-center gap-2 ml-auto sm:ml-0">
            {isSearching ? (
              <span>Searching...</span>
            ) : (
              <span>Showing {displayedTerms.length} of {filteredTerms.length} terms</span>
            )}
          </div>
        </div>

        {/* Language Filter Section */}
        {languages.length > 0 && (
          <div className="mt-6 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700">Translation Languages:</h3>
              <button 
                onClick={toggleAllLanguages}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
              >
                {selectedLanguages.size === languages.length ? (
                  <><Square className="w-3.5 h-3.5" /> Deselect All</>
                ) : (
                  <><CheckSquare className="w-3.5 h-3.5" /> Select All</>
                )}
              </button>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {languages.map(lang => (
                <label key={lang} className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                    checked={selectedLanguages.has(lang)}
                    onChange={() => toggleLanguage(lang)}
                  />
                  <span className="text-sm text-slate-600 group-hover:text-indigo-600 transition-colors uppercase font-medium tracking-wide">
                    {lang.replace('_', '-')}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto pb-8 pr-2 custom-scrollbar">
        {displayedTerms.length > 0 ? (
          <div className="flex flex-col gap-6">
            {displayedTerms.map((term, idx) => (
              <div key={`${term.id}-${idx}`} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                
                {/* Card Header: English Term & Definition */}
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-slate-900">{term.en_US}</h3>
                        {term['Part of speech'] && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {term['Part of speech']}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed max-w-4xl">
                        {term.definition || term.Context || <span className="italic text-slate-400">No definition provided</span>}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Body: Translations Grid */}
                {selectedLanguages.size > 0 && (
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4 text-sm font-medium text-slate-500 uppercase tracking-wider">
                      <Globe2 className="w-4 h-4" />
                      Translations
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-5">
                      {languages.filter(lang => selectedLanguages.has(lang)).map(lang => (
                        <div key={lang} className="flex flex-col gap-1">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            {lang}
                          </span>
                          <span className="text-sm text-slate-800 font-medium break-words">
                            {term[lang] || <span className="text-slate-300 italic font-normal">-</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {filteredTerms.length > displayCount && (
              <div className="pt-4 pb-8 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  className="px-6 py-2.5 bg-white border border-slate-300 rounded-full text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-all"
                >
                  Load More Terms
                </button>
              </div>
            )}
          </div>
        ) : (
          !isSearching && (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
              <Search className="h-10 w-10 text-slate-300 mb-4" />
              <p className="text-slate-500 text-lg">No terms found matching your criteria.</p>
              <p className="text-slate-400 text-sm mt-1">Try adjusting your search keywords.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};
