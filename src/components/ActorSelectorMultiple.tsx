import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { Entreprise } from '../types';
import { SPECIALITES_ENTREPRISE } from '../types';
import { ChevronDown, Search, X, PlusCircle, HardHat, Check } from 'lucide-react';

interface ActorSelectorMultipleProps {
  entreprises: Entreprise[];
  value: string[];
  onChange: (entrepriseIds: string[]) => void;
  placeholder?: string;
}

export default function ActorSelectorMultiple({
  entreprises,
  value,
  onChange,
  placeholder
}: ActorSelectorMultipleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedEntreprises = entreprises.filter(e => value.includes(e.id));

  const filteredEntreprises = entreprises.filter(entreprise =>
    entreprise.nom.toLowerCase().includes(search.toLowerCase()) ||
    entreprise.specialites?.some(s =>
      (SPECIALITES_ENTREPRISE[s as keyof typeof SPECIALITES_ENTREPRISE] || s)
        .toLowerCase().includes(search.toLowerCase())
    )
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

  const toggleEntreprise = (entrepriseId: string) => {
    if (value.includes(entrepriseId)) {
      onChange(value.filter(id => id !== entrepriseId));
    } else {
      onChange([...value, entrepriseId]);
    }
  };

  const removeEntreprise = (e: React.MouseEvent, entrepriseId: string) => {
    e.stopPropagation();
    onChange(value.filter(id => id !== entrepriseId));
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-h-[42px] flex items-center justify-between px-3 py-2 border rounded-lg transition-colors ${
          isOpen ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <div className="flex flex-wrap gap-1 min-w-0 flex-1">
          {selectedEntreprises.length > 0 ? (
            selectedEntreprises.map(ent => (
              <span
                key={ent.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-sm"
              >
                {ent.nom}
                <button
                  type="button"
                  onClick={(e) => removeEntreprise(e, ent.id)}
                  className="hover:text-orange-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          ) : (
            <span className="text-gray-400">{placeholder || 'Selectionner des entreprises'}</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
                placeholder="Rechercher par nom ou specialite..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                autoFocus
              />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-60 overflow-y-auto">
            {filteredEntreprises.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                {search ? 'Aucun resultat' : 'Aucune entreprise'}
              </div>
            ) : (
              filteredEntreprises.map(entreprise => {
                const isSelected = value.includes(entreprise.id);
                return (
                  <button
                    key={entreprise.id}
                    type="button"
                    onClick={() => toggleEntreprise(entreprise.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-orange-50' : ''
                    }`}
                  >
                    <div className={`p-1.5 rounded ${isSelected ? 'bg-orange-100' : 'bg-gray-100'}`}>
                      <HardHat className={`w-4 h-4 ${isSelected ? 'text-orange-600' : 'text-gray-500'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm truncate ${isSelected ? 'text-orange-700 font-medium' : 'text-gray-800'}`}>
                        {entreprise.nom}
                      </p>
                      {entreprise.specialites && entreprise.specialites.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {entreprise.specialites.slice(0, 3).map(spec => (
                            <span key={spec} className="text-xs text-gray-500">
                              {SPECIALITES_ENTREPRISE[spec as keyof typeof SPECIALITES_ENTREPRISE] || spec}
                            </span>
                          ))}
                          {entreprise.specialites.length > 3 && (
                            <span className="text-xs text-gray-400">+{entreprise.specialites.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-orange-600 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Create new link */}
          <div className="border-t p-2">
            <Link
              to="/acteurs/entreprise/nouveau"
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Creer une nouvelle entreprise
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
