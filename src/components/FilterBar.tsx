import { useState } from 'react';
import { Filter, X, Calendar, Building2, Tag } from 'lucide-react';
import type { Chantier, Categorie } from '../types';

export interface FilterState {
  chantierIds: string[];
  categorieIds: string[];
  dateDebut: string;
  dateFin: string;
  type: 'all' | 'depense' | 'devis' | 'transfert';
}

interface FilterBarProps {
  chantiers: Chantier[];
  categories: Categorie[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

const PERIOD_PRESETS = [
  { label: 'Tout', value: 'all' },
  { label: '7 jours', value: '7d' },
  { label: '30 jours', value: '30d' },
  { label: '90 jours', value: '90d' },
  { label: 'Cette annee', value: 'year' },
];

export default function FilterBar({
  chantiers,
  categories,
  filters,
  onFilterChange
}: FilterBarProps) {
  const [showChantierDropdown, setShowChantierDropdown] = useState(false);
  const [showCategorieDropdown, setShowCategorieDropdown] = useState(false);

  const handlePeriodPreset = (preset: string) => {
    const today = new Date();
    let dateDebut = '';
    const dateFin = today.toISOString().split('T')[0];

    switch (preset) {
      case '7d':
        dateDebut = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          .toISOString().split('T')[0];
        break;
      case '30d':
        dateDebut = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
          .toISOString().split('T')[0];
        break;
      case '90d':
        dateDebut = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
          .toISOString().split('T')[0];
        break;
      case 'year':
        dateDebut = `${today.getFullYear()}-01-01`;
        break;
      default:
        dateDebut = '';
    }

    onFilterChange({ ...filters, dateDebut, dateFin: preset === 'all' ? '' : dateFin });
  };

  const toggleChantier = (chantierId: string) => {
    const newIds = filters.chantierIds.includes(chantierId)
      ? filters.chantierIds.filter(id => id !== chantierId)
      : [...filters.chantierIds, chantierId];
    onFilterChange({ ...filters, chantierIds: newIds });
    // Fermer le dropdown apres selection
    setShowChantierDropdown(false);
  };

  const toggleCategorie = (categorieId: string) => {
    const newIds = filters.categorieIds.includes(categorieId)
      ? filters.categorieIds.filter(id => id !== categorieId)
      : [...filters.categorieIds, categorieId];
    onFilterChange({ ...filters, categorieIds: newIds });
    // Fermer le dropdown apres selection
    setShowCategorieDropdown(false);
  };

  const clearFilters = () => {
    onFilterChange({
      chantierIds: [],
      categorieIds: [],
      dateDebut: '',
      dateFin: '',
      type: 'all'
    });
  };

  const hasActiveFilters = filters.chantierIds.length > 0 ||
    filters.categorieIds.length > 0 ||
    filters.dateDebut ||
    filters.dateFin ||
    filters.type !== 'all';

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-gray-500" />
        <h3 className="font-medium text-gray-700">Filtres</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="ml-auto flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
            Effacer
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        {/* Type filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Type:</span>
          <div className="flex gap-1">
            {(['all', 'depense', 'devis', 'transfert'] as const).map(type => (
              <button
                key={type}
                onClick={() => onFilterChange({ ...filters, type })}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  filters.type === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type === 'all' ? 'Tout' :
                 type === 'depense' ? 'Depenses' :
                 type === 'devis' ? 'Devis' : 'Transferts'}
              </button>
            ))}
          </div>
        </div>

        {/* Period presets */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">Periode:</span>
          <div className="flex gap-1">
            {PERIOD_PRESETS.map(preset => (
              <button
                key={preset.value}
                onClick={() => handlePeriodPreset(preset.value)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  (preset.value === 'all' && !filters.dateDebut) ||
                  (preset.value !== 'all' && filters.dateDebut)
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chantier dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowChantierDropdown(!showChantierDropdown);
              setShowCategorieDropdown(false);
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm"
          >
            <Building2 className="w-4 h-4 text-gray-500" />
            <span>Chantiers</span>
            {filters.chantierIds.length > 0 && (
              <span className="bg-blue-600 text-white text-xs px-1.5 rounded-full">
                {filters.chantierIds.length}
              </span>
            )}
          </button>
          {showChantierDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg z-10 min-w-[200px] py-2">
              {chantiers.map(chantier => (
                <label
                  key={chantier.id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filters.chantierIds.includes(chantier.id)}
                    onChange={() => toggleChantier(chantier.id)}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">{chantier.nom}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Categorie dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowCategorieDropdown(!showCategorieDropdown);
              setShowChantierDropdown(false);
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm"
          >
            <Tag className="w-4 h-4 text-gray-500" />
            <span>Categories</span>
            {filters.categorieIds.length > 0 && (
              <span className="bg-blue-600 text-white text-xs px-1.5 rounded-full">
                {filters.categorieIds.length}
              </span>
            )}
          </button>
          {showCategorieDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg z-10 min-w-[200px] py-2 max-h-64 overflow-y-auto">
              {categories.filter(c => c.parentId === null).map(cat => (
                <label
                  key={cat.id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filters.categorieIds.includes(cat.id)}
                    onChange={() => toggleCategorie(cat.id)}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">{cat.nom}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Custom date inputs */}
        <div className="flex items-center gap-2 ml-auto">
          <input
            type="date"
            value={filters.dateDebut}
            onChange={(e) => onFilterChange({ ...filters, dateDebut: e.target.value })}
            className="px-2 py-1 border rounded text-sm"
          />
          <span className="text-gray-400">-</span>
          <input
            type="date"
            value={filters.dateFin}
            onChange={(e) => onFilterChange({ ...filters, dateFin: e.target.value })}
            className="px-2 py-1 border rounded text-sm"
          />
        </div>
      </div>
    </div>
  );
}
