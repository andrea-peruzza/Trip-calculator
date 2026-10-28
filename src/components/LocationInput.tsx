import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, X } from 'lucide-react';
import { searchLocations } from '../services/geocodingService';
import { Coordinates, LocationSuggestion } from '../types';

interface LocationInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (name: string, coords: Coordinates | null) => void;
  accentColor?: string;
}

export const LocationInput: React.FC<LocationInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  accentColor = 'text-blue-600',
}) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const isSelectingRef = useRef(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      return;
    }

    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      const results = await searchLocations(trimmed);
      setSuggestions(results);
      setIsLoading(false);
      setSelectedIndex(-1);
      setIsOpen(results.length > 0);
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  // Chiudi dropdown se clicco fuori
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: LocationSuggestion) => {
    isSelectingRef.current = true;
    setQuery(item.displayName);
    setSuggestions([]);
    setIsOpen(false);
    onChange(item.displayName, { lat: item.lat, lng: item.lng });
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    onChange('', null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const targetItem = selectedIndex >= 0 ? suggestions[selectedIndex] : suggestions[0];
      if (targetItem) {
        handleSelect(targetItem);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
        {label}
      </label>
      <div className="relative flex items-center">
        <MapPin className={`absolute left-3 w-4 h-4 ${accentColor}`} />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!e.target.value) onChange('', null);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 w-4 h-4 text-slate-400 animate-spin" />
        )}
        {!isLoading && query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg max-h-64 overflow-auto py-1 divide-y divide-slate-100">
          {suggestions.map((item, idx) => {
            const commaIdx = item.displayName.indexOf(',');
            const mainText = commaIdx !== -1 ? item.displayName.slice(0, commaIdx) : item.displayName;
            const subText = commaIdx !== -1 ? item.displayName.slice(commaIdx + 1).trim() : '';
            const isHighlighted = selectedIndex === idx;

            return (
              <li
                key={idx}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`px-3.5 py-2 cursor-pointer transition flex items-center gap-2.5 ${
                  isHighlighted ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <MapPin className={`w-4 h-4 shrink-0 ${isHighlighted ? 'text-blue-600' : 'text-slate-400'}`} />
                <div className="flex flex-col min-w-0">
                  <span className={`text-xs font-semibold truncate ${isHighlighted ? 'text-blue-900' : 'text-slate-800'}`}>
                    {mainText}
                  </span>
                  {subText && (
                    <span className="text-[11px] text-slate-500 truncate">
                      {subText}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
