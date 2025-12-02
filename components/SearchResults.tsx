
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { SearchResultItem } from '../types';
import { ExternalLink, Scale, Link as LinkIcon } from 'lucide-react';

interface SearchResultsProps {
  results: SearchResultItem[];
}

const SearchResults: React.FC<SearchResultsProps> = ({ results }) => {
  if (!results || results.length === 0) return null;

  return (
    <div className="w-full max-w-6xl mx-auto mt-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 border-t border-slate-800 pt-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-slate-900 rounded border border-slate-800 text-cyan-500">
            <Scale className="w-4 h-4" />
        </div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Legal References & Precedents</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.map((result, index) => (
          <a 
            key={index} 
            href={result.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group relative flex flex-col p-4 bg-slate-900/60 border border-slate-800 rounded hover:border-cyan-500/30 hover:bg-slate-900 transition-all"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
               <h4 className="font-mono text-xs font-bold text-slate-300 group-hover:text-cyan-400 transition-colors line-clamp-1">
                 {result.title}
               </h4>
               <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-cyan-400" />
            </div>
            <div className="text-[10px] text-slate-600 font-mono truncate">
                {result.url}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default SearchResults;
