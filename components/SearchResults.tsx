
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { SearchResultItem } from '../types';
import { ExternalLink, Scale } from 'lucide-react';

interface SearchResultsProps {
  results: SearchResultItem[];
}

const SearchResults: React.FC<SearchResultsProps> = ({ results }) => {
  if (!results || results.length === 0) return null;

  return (
    <div className="w-full mt-6 animate-in fade-in pt-6 border-t border-slate-100">
      <div className="flex items-center gap-2 mb-4">
        <Scale className="w-4 h-4 text-indigo-500" />
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Legal References</h3>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {results.map((result, index) => (
          <a 
            key={index} 
            href={result.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group block p-3 bg-white border border-slate-200 rounded hover:border-indigo-400 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between gap-2 mb-1">
               <h4 className="font-serif text-sm font-bold text-slate-800 group-hover:text-indigo-700 transition-colors line-clamp-1">
                 {result.title}
               </h4>
               <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-indigo-500 flex-shrink-0" />
            </div>
            <div className="text-[10px] text-slate-500 font-mono truncate">
                {result.url}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default SearchResults;