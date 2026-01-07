import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { BaseActor, ActorType } from '../types';
import { ACTOR_TYPE_LABELS } from '../types';
import { ChevronDown, Search, X, PlusCircle, User } from 'lucide-react';

interface ActorSelectorProps {
  type: ActorType;
  actors: BaseActor[];
  value: string | null;
  onChange: (actorId: string | null) => void;
  placeholder?: string;
}

export default function ActorSelector({
  type,
  actors,
  value,
  onChange,
  placeholder
}: ActorSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedActor = actors.find(a => a.id === value);
  const label = ACTOR_TYPE_LABELS[type];

  const filteredActors = actors.filter(actor =>
    actor.nom.toLowerCase().includes(search.toLowerCase()) ||
    actor.email?.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (actorId: string) => {
    onChange(actorId);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 border rounded-lg transition-colors ${
          isOpen ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <User className="w-4 h-4 text-gray-400 shrink-0" />
          {selectedActor ? (
            <span className="truncate text-gray-800">{selectedActor.nom}</span>
          ) : (
            <span className="text-gray-400">{placeholder || `Selectionner un ${label.toLowerCase()}`}</span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {selectedActor && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          {/* Search */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                autoFocus
              />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-60 overflow-y-auto">
            {filteredActors.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                {search ? 'Aucun resultat' : `Aucun ${label.toLowerCase()}`}
              </div>
            ) : (
              filteredActors.map(actor => (
                <button
                  key={actor.id}
                  type="button"
                  onClick={() => handleSelect(actor.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                    actor.id === value ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="p-1.5 bg-gray-100 rounded">
                    <User className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm truncate ${actor.id === value ? 'text-blue-700 font-medium' : 'text-gray-800'}`}>
                      {actor.nom}
                    </p>
                    {actor.email && (
                      <p className="text-xs text-gray-500 truncate">{actor.email}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Create new link */}
          <div className="border-t p-2">
            <Link
              to={`/acteurs/${type}/nouveau`}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Creer un nouveau {label.toLowerCase()}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
