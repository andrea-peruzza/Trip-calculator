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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      const results = await searchLocations(query);
      setSuggestions(results);
      setIsLoading(false);
      setIsOpen(true);
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
    setQuery(item.displayName);
    setIsOpen(false);
    onChange(item.displayName, { lat: item.lat, lng: item.lng });
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    onChange('', null);
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
        <ul className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-auto py-1">
          {suggestions.map((item, idx) => (
            <li
              key={idx}
              onClick={() => handleSelect(item)}
              className="px-3.5 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition flex items-center gap-2"
            >
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{item.displayName}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
