import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, PlusCircle, LayoutGrid, List, Table2, Search, Filter, X,
  Loader2, ChevronDown, ChevronUp, ArrowUpDown
} from 'lucide-react';
import { getChantiers, getDepenses, getClients, getCategories } from '../services/api';
import type { Chantier, Depense, Client, Categorie, DeviseType } from '../types';
import { STATUTS_CHANTIER, DEVISES } from '../types';
import { formatMontant, formatDate } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';
import { canAccessChantier, ROLE_PERMISSIONS } from '../utils/permissions';
import ChantierCard from '../components/ChantierCard';
import ChantierListItem from '../components/ChantierListItem';

type ViewMode = 'grid' | 'list' | 'table';
type SortField = 'nom' | 'dateCreation' | 'budgetPrevisionnel' | 'statut' | 'depenses';
type SortOrder = 'asc' | 'desc';

interface ChantierFilters {
  search: string;
  clientIds: string[];
  statuts: string[];
  devises: DeviseType[];
  dateDebut: string;
  dateFin: string;
}

const defaultFilters: ChantierFilters = {
  search: '',
  clientIds: [],
  statuts: [],
  devises: [],
  dateDebut: '',
  dateFin: ''
};

export default function ChantiersIndex() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ChantierFilters>(defaultFilters);
  const [sortField, setSortField] = useState<SortField>('dateCreation');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const permissions = user ? ROLE_PERMISSIONS[user.role] : null;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [chantiersData, depensesData, clientsData, categoriesData] = await Promise.all([
        getChantiers(),
        getDepenses(),
        getClients(),
        getCategories()
      ]);
      setChantiers(chantiersData);
      setDepenses(depensesData);
      setClients(clientsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Erreur chargement donnees:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtrer les chantiers selon les permissions de l'utilisateur
  const accessibleChantiers = useMemo(() => {
    if (!user) return [];
    if (permissions?.canViewAllChantiers) return chantiers;
    return chantiers.filter(c => canAccessChantier(user.role, user.chantierIds, c.id));
  }, [chantiers, user, permissions]);

  // Calculer les depenses par chantier
  const depensesByChantier = useMemo(() => {
    const map: Record<string, number> = {};
    depenses.forEach(d => {
      map[d.chantierId] = (map[d.chantierId] || 0) + d.montant;
    });
    return map;
  }, [depenses]);

  // Depenses array par chantier pour les cartes
  const depensesArrayByChantier = useMemo(() => {
    const map: Record<string, Depense[]> = {};
    depenses.forEach(d => {
      if (!map[d.chantierId]) map[d.chantierId] = [];
      map[d.chantierId].push(d);
    });
    return map;
  }, [depenses]);

  // Appliquer les filtres
  const filteredChantiers = useMemo(() => {
    return accessibleChantiers.filter(c => {
      // Recherche texte
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!c.nom.toLowerCase().includes(searchLower) &&
            !c.adresse.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      // Filtre par client
      if (filters.clientIds.length > 0 && c.clientId && !filters.clientIds.includes(c.clientId)) {
        return false;
      }
      // Filtre par statut
      if (filters.statuts.length > 0 && !filters.statuts.includes(c.statut)) {
        return false;
      }
      // Filtre par devise
      if (filters.devises.length > 0 && !filters.devises.includes(c.devise)) {
        return false;
      }
      // Filtre par date
      if (filters.dateDebut && c.dateCreation < filters.dateDebut) {
        return false;
      }
      if (filters.dateFin && c.dateCreation > filters.dateFin) {
        return false;
      }
      return true;
    });
  }, [accessibleChantiers, filters]);

  // Trier les chantiers
  const sortedChantiers = useMemo(() => {
    return [...filteredChantiers].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'nom':
          comparison = a.nom.localeCompare(b.nom);
          break;
        case 'dateCreation':
          comparison = a.dateCreation.localeCompare(b.dateCreation);
          break;
        case 'budgetPrevisionnel':
          comparison = a.budgetPrevisionnel - b.budgetPrevisionnel;
          break;
        case 'statut':
          comparison = a.statut.localeCompare(b.statut);
          break;
        case 'depenses':
          comparison = (depensesByChantier[a.id] || 0) - (depensesByChantier[b.id] || 0);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredChantiers, sortField, sortOrder, depensesByChantier]);

  // Toggle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Reset filtres
  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const hasActiveFilters = filters.search || filters.clientIds.length > 0 ||
    filters.statuts.length > 0 || filters.devises.length > 0 ||
    filters.dateDebut || filters.dateFin;

  // Toggle multi-select filter
  const toggleFilter = <K extends keyof ChantierFilters>(
    key: K,
    value: ChantierFilters[K] extends (infer U)[] ? U : never
  ) => {
    setFilters(prev => {
      const arr = prev[key] as unknown[];
      const newArr = arr.includes(value)
        ? arr.filter(v => v !== value)
        : [...arr, value];
      return { ...prev, [key]: newArr };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Mes Chantiers</h1>
          <p className="text-sm text-gray-500">
            {sortedChantiers.length} chantier{sortedChantiers.length > 1 ? 's' : ''}
            {hasActiveFilters && ` (filtre actif)`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle filters */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtres
            {hasActiveFilters && (
              <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">!</span>
            )}
          </button>

          {/* View mode toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Vue grille"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Vue liste"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'table' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Vue tableau"
            >
              <Table2 className="w-4 h-4" />
            </button>
          </div>

          {/* New chantier button */}
          {permissions?.canCreateChantier && (
            <Link
              to="/chantiers/nouveau"
              className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Nouveau</span>
            </Link>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Filtres</h3>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Reinitialiser
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou adresse..."
              value={filters.search}
              onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {filters.search && (
              <button
                onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Client filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {clients.map(client => (
                  <label key={client.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.clientIds.includes(client.id)}
                      onChange={() => toggleFilter('clientIds', client.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">{client.nom}</span>
                  </label>
                ))}
                {clients.length === 0 && (
                  <span className="text-sm text-gray-400">Aucun client</span>
                )}
              </div>
            </div>

            {/* Status filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
              <div className="space-y-1">
                {Object.entries(STATUTS_CHANTIER).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.statuts.includes(key)}
                      onChange={() => toggleFilter('statuts', key)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Devise filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Devise</label>
              <div className="space-y-1">
                {Object.entries(DEVISES).map(([key, deviseLabel]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.devises.includes(key as DeviseType)}
                      onChange={() => toggleFilter('devises', key as DeviseType)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">{key} - {deviseLabel}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Periode</label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={filters.dateDebut}
                  onChange={e => setFilters(prev => ({ ...prev, dateDebut: e.target.value }))}
                  className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Du"
                />
                <input
                  type="date"
                  value={filters.dateFin}
                  onChange={e => setFilters(prev => ({ ...prev, dateFin: e.target.value }))}
                  className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Au"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {sortedChantiers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg shadow">
          <Building2 className="w-16 h-16 text-gray-300 mb-4" />
          {hasActiveFilters ? (
            <>
              <h2 className="text-xl font-bold text-gray-700 mb-2">Aucun chantier trouve</h2>
              <p className="text-gray-500 mb-4">Modifiez vos filtres pour voir plus de resultats</p>
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Reinitialiser les filtres
              </button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-700 mb-2">Aucun chantier</h2>
              <p className="text-gray-500 mb-4">Commencez par creer votre premier chantier</p>
              {permissions?.canCreateChantier && (
                <Link
                  to="/chantiers/nouveau"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <PlusCircle className="w-5 h-5" />
                  Creer un chantier
                </Link>
              )}
            </>
          )}
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && sortedChantiers.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sortedChantiers.map(chantier => (
            <ChantierCard
              key={chantier.id}
              chantier={chantier}
              depenses={depensesArrayByChantier[chantier.id] || []}
              categories={categories}
            />
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && sortedChantiers.length > 0 && (
        <div className="space-y-3">
          {sortedChantiers.map(chantier => (
            <ChantierListItem
              key={chantier.id}
              chantier={chantier}
              depenses={depensesArrayByChantier[chantier.id] || []}
            />
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && sortedChantiers.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('nom')}
                      className="flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-gray-800"
                    >
                      Nom
                      {sortField === 'nom' ? (
                        sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 opacity-30" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('statut')}
                      className="flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-gray-800"
                    >
                      Statut
                      {sortField === 'statut' ? (
                        sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 opacity-30" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleSort('budgetPrevisionnel')}
                      className="flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-gray-800 ml-auto"
                    >
                      Budget
                      {sortField === 'budgetPrevisionnel' ? (
                        sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 opacity-30" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleSort('depenses')}
                      className="flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-gray-800 ml-auto"
                    >
                      Depenses
                      {sortField === 'depenses' ? (
                        sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 opacity-30" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-center">Progression</th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('dateCreation')}
                      className="flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-gray-800"
                    >
                      Date
                      {sortField === 'dateCreation' ? (
                        sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 opacity-30" />
                      )}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sortedChantiers.map(chantier => {
                  const totalDepenses = depensesByChantier[chantier.id] || 0;
                  const pourcentage = chantier.budgetPrevisionnel > 0
                    ? Math.round((totalDepenses / chantier.budgetPrevisionnel) * 100)
                    : 0;
                  const isOverBudget = pourcentage > 100;

                  return (
                    <tr key={chantier.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link
                          to={`/chantiers/${chantier.id}`}
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          {chantier.nom}
                        </Link>
                        <p className="text-sm text-gray-500 truncate max-w-xs">{chantier.adresse}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          chantier.statut === 'en_cours' ? 'bg-blue-100 text-blue-700' :
                          chantier.statut === 'termine' ? 'bg-green-100 text-green-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {STATUTS_CHANTIER[chantier.statut]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatMontant(chantier.budgetPrevisionnel, chantier.devise)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={isOverBudget ? 'text-red-600 font-medium' : ''}>
                          {formatMontant(totalDepenses, chantier.devise)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isOverBudget ? 'bg-red-500' :
                                pourcentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(pourcentage, 100)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${isOverBudget ? 'text-red-600' : 'text-gray-600'}`}>
                            {pourcentage}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(chantier.dateCreation)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
