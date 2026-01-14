import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet, FileText, ArrowRightLeft, TrendingUp, TrendingDown, Loader2, Plus,
  Building2, PlusCircle, LayoutGrid, List, FileDown, BarChart2, Home, RotateCcw
} from 'lucide-react';
import {
  getChantiers, getDepenses, getDevis, getTransferts,
  getCategories, getConfig
} from '../services/api';
import type { Chantier, Depense, Devis, TransfertBudget, Categorie, AppConfig, DeviseType } from '../types';
import { formatMontant, convertToDNT, convertFromDNT } from '../utils/format';
import ExchangeRateSettings from '../components/ExchangeRateSettings';
import KPICard from '../components/charts/KPICard';
import ChartDepensesParChantier from '../components/charts/ChartDepensesParChantier';
import ChartDepensesParLot from '../components/charts/ChartDepensesParLot';
import ChartEvolutionTemps from '../components/charts/ChartEvolutionTemps';
import ChartBilanActeurs from '../components/charts/ChartBilanActeurs';
import FilterBar, { type FilterState } from '../components/FilterBar';
import DataTable, { renderMontant, renderTypeBadge, renderPhotoLinks } from '../components/DataTable';
import ChantierCard from '../components/ChantierCard';
import ChantierListItem from '../components/ChantierListItem';
import { exportAllChantiersPdf } from '../utils/exportPdf';

type ViewMode = 'overview' | 'analytics';
type ChantierViewMode = 'grid' | 'list';

interface UnifiedEntry {
  id: string;
  type: 'depense' | 'devis' | 'transfert';
  date: string;
  montant: number;
  description: string;
  chantierNom: string;
  categorieNom: string;
  photosUrls?: string[];
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [devis, setDevis] = useState<Devis[]>([]);
  const [transferts, setTransferts] = useState<TransfertBudget[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [displayCurrency, setDisplayCurrency] = useState<DeviseType>('DNT');
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [chantierViewMode, setChantierViewMode] = useState<ChantierViewMode>('grid');

  const [filters, setFilters] = useState<FilterState>({
    chantierIds: [],
    categorieIds: [],
    dateDebut: '',
    dateFin: '',
    type: 'all'
  });

  // Etat pour le filtrage croise dans Analytics (selection via clic sur graphiques)
  const [crossFilter, setCrossFilter] = useState<{
    chantierIds: string[];
    categorieIds: string[];
  }>({
    chantierIds: [],
    categorieIds: []
  });

  const hasCrossFilter = crossFilter.chantierIds.length > 0 || crossFilter.categorieIds.length > 0;

  // Gestionnaire de selection croisee pour chantiers
  const handleChantierSelect = useCallback((chantierId: string, ctrlKey: boolean) => {
    setCrossFilter(prev => {
      if (ctrlKey) {
        // Multi-selection avec CTRL
        const isSelected = prev.chantierIds.includes(chantierId);
        return {
          ...prev,
          chantierIds: isSelected
            ? prev.chantierIds.filter(id => id !== chantierId)
            : [...prev.chantierIds, chantierId]
        };
      } else {
        // Selection simple (toggle)
        const isOnlySelected = prev.chantierIds.length === 1 && prev.chantierIds[0] === chantierId;
        return {
          ...prev,
          chantierIds: isOnlySelected ? [] : [chantierId]
        };
      }
    });
  }, []);

  // Gestionnaire de selection croisee pour categories
  const handleCategorieSelect = useCallback((categorieId: string, ctrlKey: boolean) => {
    setCrossFilter(prev => {
      if (ctrlKey) {
        // Multi-selection avec CTRL
        const isSelected = prev.categorieIds.includes(categorieId);
        return {
          ...prev,
          categorieIds: isSelected
            ? prev.categorieIds.filter(id => id !== categorieId)
            : [...prev.categorieIds, categorieId]
        };
      } else {
        // Selection simple (toggle)
        const isOnlySelected = prev.categorieIds.length === 1 && prev.categorieIds[0] === categorieId;
        return {
          ...prev,
          categorieIds: isOnlySelected ? [] : [categorieId]
        };
      }
    });
  }, []);

  // Reinitialiser le filtrage croise
  const resetCrossFilter = useCallback(() => {
    setCrossFilter({ chantierIds: [], categorieIds: [] });
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [chantiersData, depensesData, devisData, transfertsData, categoriesData, configData] = await Promise.all([
        getChantiers(),
        getDepenses(),
        getDevis(),
        getTransferts(),
        getCategories(),
        getConfig()
      ]);
      setConfig(configData);
      setDisplayCurrency(configData.deviseAffichage);
      setChantiers(chantiersData);
      setDepenses(depensesData);
      setDevis(devisData);
      setTransferts(transfertsData);
      setCategories(categoriesData);
    } catch (err) {
      setError('Erreur de connexion au serveur. Lancez: npm run server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Pre-compute depenses by chantier for performance
  const depensesByChantier = useMemo(() => {
    const map: Record<string, Depense[]> = {};
    depenses.forEach(d => {
      if (!map[d.chantierId]) map[d.chantierId] = [];
      map[d.chantierId].push(d);
    });
    return map;
  }, [depenses]);

  // Apply filters to data (barre de filtres + filtrage croise)
  const filteredDepenses = useMemo(() => {
    return depenses.filter(d => {
      // Filtres de la barre
      if (filters.chantierIds.length > 0 && !filters.chantierIds.includes(d.chantierId)) return false;
      if (filters.categorieIds.length > 0 && !filters.categorieIds.includes(d.categorieId)) return false;
      if (filters.dateDebut && d.date < filters.dateDebut) return false;
      if (filters.dateFin && d.date > filters.dateFin) return false;
      // Filtrage croise (selection graphiques)
      if (crossFilter.chantierIds.length > 0 && !crossFilter.chantierIds.includes(d.chantierId)) return false;
      if (crossFilter.categorieIds.length > 0 && !crossFilter.categorieIds.includes(d.categorieId)) return false;
      return true;
    });
  }, [depenses, filters, crossFilter]);

  const filteredDevis = useMemo(() => {
    return devis.filter(d => {
      if (filters.chantierIds.length > 0 && !filters.chantierIds.includes(d.chantierId)) return false;
      if (filters.categorieIds.length > 0 && !filters.categorieIds.includes(d.categorieId)) return false;
      if (filters.dateDebut && d.date < filters.dateDebut) return false;
      if (filters.dateFin && d.date > filters.dateFin) return false;
      // Filtrage croise
      if (crossFilter.chantierIds.length > 0 && !crossFilter.chantierIds.includes(d.chantierId)) return false;
      if (crossFilter.categorieIds.length > 0 && !crossFilter.categorieIds.includes(d.categorieId)) return false;
      return true;
    });
  }, [devis, filters, crossFilter]);

  const filteredTransferts = useMemo(() => {
    return transferts.filter(t => {
      if (filters.dateDebut && t.date < filters.dateDebut) return false;
      if (filters.dateFin && t.date > filters.dateFin) return false;
      return true;
    });
  }, [transferts, filters]);

  // Get exchange rates from config
  const rates = useMemo(() =>
    config?.tauxChange || { EUR: 3.35, USD: 3.10, DNT: 1 },
    [config]
  );

  // Helper to get amount in DNT (memoized)
  const getAmountInDNT = useCallback((montant: number, chantierId: string): number => {
    const chantier = chantiers.find(c => c.id === chantierId);
    const devise = chantier?.devise || 'DNT';
    return convertToDNT(montant, devise, rates);
  }, [chantiers, rates]);

  // Format amount in display currency (memoized)
  const formatInDisplayCurrency = useCallback((amountDNT: number): string => {
    const converted = convertFromDNT(amountDNT, displayCurrency, rates);
    return formatMontant(converted, displayCurrency);
  }, [displayCurrency, rates]);

  // Overview stats (simple view) - converted to DNT for multi-currency support
  const overviewStats = useMemo(() => {
    const budgetTotal = chantiers.reduce((sum, c) => {
      return sum + convertToDNT(c.budgetPrevisionnel, c.devise || 'DNT', rates);
    }, 0);
    const depensesTotal = depenses.reduce((sum, d) => {
      return sum + getAmountInDNT(d.montant, d.chantierId);
    }, 0);
    return {
      budgetTotal,
      depensesTotal,
      resteTotal: budgetTotal - depensesTotal,
      chantiersEnCours: chantiers.filter(c => c.statut === 'en_cours').length,
      chantiersTermines: chantiers.filter(c => c.statut === 'termine').length,
      chantiersSuspendus: chantiers.filter(c => c.statut === 'suspendu').length
    };
  }, [chantiers, depenses, rates, getAmountInDNT]);

  // Compute filtered stats (all converted to DNT)
  const filteredStats = useMemo(() => {
    const totalDepenses = filteredDepenses.reduce((sum, d) => {
      return sum + getAmountInDNT(d.montant, d.chantierId);
    }, 0);
    const totalDevis = filteredDevis.reduce((sum, d) => {
      return sum + getAmountInDNT(d.montant, d.chantierId);
    }, 0);
    const totalTransferts = filteredTransferts.reduce((sum, t) => {
      return sum + (t.montantConverti || convertToDNT(t.montant, t.devise, rates));
    }, 0);

    // Depenses par chantier (en DNT)
    const parChantierMap: Record<string, number> = {};
    filteredDepenses.forEach(d => {
      const amountDNT = getAmountInDNT(d.montant, d.chantierId);
      parChantierMap[d.chantierId] = (parChantierMap[d.chantierId] || 0) + amountDNT;
    });
    const depensesParChantier = Object.entries(parChantierMap).map(([id, value]) => ({
      chantierId: id,
      name: chantiers.find(c => c.id === id)?.nom || id,
      value
    }));

    // Depenses par categorie (en DNT)
    const parCategorieMap: Record<string, number> = {};
    filteredDepenses.forEach(d => {
      const amountDNT = getAmountInDNT(d.montant, d.chantierId);
      parCategorieMap[d.categorieId] = (parCategorieMap[d.categorieId] || 0) + amountDNT;
    });
    const depensesParCategorie = Object.entries(parCategorieMap).map(([id, value]) => ({
      categorieId: id,
      name: categories.find(c => c.id === id)?.nom || id,
      value
    }));

    // Evolution par mois (en DNT)
    const parMoisMap: Record<string, { depenses: number; cumul: number }> = {};
    let cumul = 0;
    const sortedDepenses = [...filteredDepenses].sort((a, b) => a.date.localeCompare(b.date));
    sortedDepenses.forEach(d => {
      const mois = d.date.substring(0, 7);
      if (!parMoisMap[mois]) {
        parMoisMap[mois] = { depenses: 0, cumul: 0 };
      }
      parMoisMap[mois].depenses += getAmountInDNT(d.montant, d.chantierId);
    });
    // Compute cumul
    Object.keys(parMoisMap).sort().forEach(mois => {
      cumul += parMoisMap[mois].depenses;
      parMoisMap[mois].cumul = cumul;
    });
    const evolutionMois = Object.entries(parMoisMap)
      .map(([date, data]) => ({ date: `${date}-01`, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalDepenses,
      totalDevis,
      totalTransferts,
      nbDepenses: filteredDepenses.length,
      nbDevis: filteredDevis.length,
      nbTransferts: filteredTransferts.length,
      depensesParChantier,
      depensesParCategorie,
      evolutionMois
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredDepenses, filteredDevis, filteredTransferts, chantiers, categories, rates]);

  // Unified data for table
  const tableData = useMemo(() => {
    const entries: UnifiedEntry[] = [];

    if (filters.type === 'all' || filters.type === 'depense') {
      filteredDepenses.forEach(d => {
        entries.push({
          id: d.id,
          type: 'depense',
          date: d.date,
          montant: d.montant,
          description: d.description,
          chantierNom: chantiers.find(c => c.id === d.chantierId)?.nom || d.chantierId,
          categorieNom: categories.find(c => c.id === d.categorieId)?.nom || d.categorieId,
          photosUrls: d.photosUrls
        });
      });
    }

    if (filters.type === 'all' || filters.type === 'devis') {
      filteredDevis.forEach(d => {
        entries.push({
          id: d.id,
          type: 'devis',
          date: d.date,
          montant: d.montant,
          description: d.fournisseur,
          chantierNom: chantiers.find(c => c.id === d.chantierId)?.nom || d.chantierId,
          categorieNom: categories.find(c => c.id === d.categorieId)?.nom || d.categorieId,
          photosUrls: d.photosUrls
        });
      });
    }

    if (filters.type === 'all' || filters.type === 'transfert') {
      filteredTransferts.forEach(t => {
        entries.push({
          id: t.id,
          type: 'transfert',
          date: t.date,
          montant: t.montantConverti || t.montant,
          description: `${t.source} -> ${t.destination}`,
          chantierNom: '-',
          categorieNom: t.devise,
          photosUrls: t.photoUrl ? [t.photoUrl] : undefined
        });
      });
    }

    return entries.sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredDepenses, filteredDevis, filteredTransferts, filters.type, chantiers, categories]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={loadData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Recharger
          </button>
        </div>
      </div>
    );
  }

  // Empty state - no chantiers
  if (chantiers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Building2 className="w-20 h-20 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Bienvenue sur MonChantier</h2>
        <p className="text-gray-500 mb-6 text-center max-w-md">
          Gerez vos chantiers BTP en toute simplicite. Suivez vos budgets, vos depenses et l'avancement de vos projets.
        </p>
        <Link
          to="/chantiers/nouveau"
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <PlusCircle className="w-5 h-5" />
          Creer mon premier chantier
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with view toggle */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Dashboard</h1>

          {/* View mode toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('overview')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors text-sm ${
                viewMode === 'overview' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Apercu</span>
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors text-sm ${
                viewMode === 'analytics' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {viewMode === 'analytics' && (
            <>
              {/* Currency selector */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1">
                <span className="text-sm text-gray-600 hidden sm:inline">Afficher en:</span>
                <select
                  value={displayCurrency}
                  onChange={(e) => setDisplayCurrency(e.target.value as DeviseType)}
                  className="bg-transparent border-none text-sm font-medium focus:outline-none cursor-pointer"
                >
                  <option value="DNT">DNT</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </div>

              {/* Exchange rate settings */}
              <ExchangeRateSettings onUpdate={setConfig} />

              {/* Action buttons */}
              <Link
                to="/devis/nouveau"
                className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Devis</span>
              </Link>
              <Link
                to="/transferts/nouveau"
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Transfert</span>
              </Link>
            </>
          )}

          {viewMode === 'overview' && (
            <>
              {/* Currency selector */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1">
                <span className="text-sm text-gray-600 hidden sm:inline">Devise:</span>
                <select
                  value={displayCurrency}
                  onChange={(e) => setDisplayCurrency(e.target.value as DeviseType)}
                  className="bg-transparent border-none text-sm font-medium focus:outline-none cursor-pointer"
                >
                  <option value="DNT">DNT</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <button
                onClick={() => exportAllChantiersPdf(chantiers, depenses, categories)}
                className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                title="Exporter tous les chantiers en PDF"
              >
                <FileDown className="w-4 h-4" />
                <span className="hidden sm:inline">Export PDF</span>
              </button>
              <Link
                to="/chantiers/nouveau"
                className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Nouveau chantier</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* OVERVIEW MODE */}
      {viewMode === 'overview' && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Budget Total</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">{formatInDisplayCurrency(overviewStats.budgetTotal)}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Wallet className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Depenses Totales</p>
                  <p className="text-xl sm:text-2xl font-bold text-red-600">{formatInDisplayCurrency(overviewStats.depensesTotal)}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Reste</p>
                  <p className={`text-xl sm:text-2xl font-bold ${overviewStats.resteTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatInDisplayCurrency(overviewStats.resteTotal)}
                  </p>
                </div>
                <div className={`${overviewStats.resteTotal >= 0 ? 'bg-green-100' : 'bg-red-100'} p-3 rounded-full`}>
                  <TrendingUp className={`w-6 h-6 ${overviewStats.resteTotal >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
              </div>
            </div>
          </div>

          {/* Chantier statistics */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span className="text-gray-600">{overviewStats.chantiersEnCours} en cours</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span className="text-gray-600">{overviewStats.chantiersTermines} termine{overviewStats.chantiersTermines > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                <span className="text-gray-600">{overviewStats.chantiersSuspendus} suspendu{overviewStats.chantiersSuspendus > 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          {/* Chantiers list */}
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-gray-800">Chantiers ({chantiers.length})</h2>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setChantierViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  chantierViewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
                title="Vue grille"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setChantierViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  chantierViewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
                title="Vue liste"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Grid view */}
          {chantierViewMode === 'grid' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {chantiers.map(chantier => (
                <ChantierCard
                  key={chantier.id}
                  chantier={chantier}
                  depenses={depensesByChantier[chantier.id] || []}
                  categories={categories}
                />
              ))}
            </div>
          )}

          {/* List view */}
          {chantierViewMode === 'list' && (
            <div className="space-y-3">
              {chantiers.map(chantier => (
                <ChantierListItem
                  key={chantier.id}
                  chantier={chantier}
                  depenses={depensesByChantier[chantier.id] || []}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ANALYTICS MODE */}
      {viewMode === 'analytics' && (
        <>
          {/* Filter Bar */}
          <FilterBar
            chantiers={chantiers}
            categories={categories}
            filters={filters}
            onFilterChange={setFilters}
          />

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <KPICard
              title="Total Depenses"
              value={formatInDisplayCurrency(filteredStats.totalDepenses)}
              subtitle={`${filteredStats.nbDepenses} depenses`}
              icon={<Wallet className="w-5 h-5" />}
              color="blue"
            />
            <KPICard
              title="Total Devis"
              value={formatInDisplayCurrency(filteredStats.totalDevis)}
              subtitle={`${filteredStats.nbDevis} devis`}
              icon={<FileText className="w-5 h-5" />}
              color="purple"
            />
            <KPICard
              title="Transferts"
              value={formatInDisplayCurrency(filteredStats.totalTransferts)}
              subtitle={`${filteredStats.nbTransferts} transferts`}
              icon={<ArrowRightLeft className="w-5 h-5" />}
              color="green"
            />
            <KPICard
              title="Moyenne/Depense"
              value={formatInDisplayCurrency(
                filteredStats.nbDepenses > 0
                  ? filteredStats.totalDepenses / filteredStats.nbDepenses
                  : 0
              )}
              subtitle="par operation"
              icon={<TrendingUp className="w-5 h-5" />}
              color="orange"
            />
          </div>

          {/* Bouton reinitialisation filtrage croise */}
          {hasCrossFilter && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
              <span className="text-sm text-blue-700">
                Filtrage actif : {crossFilter.chantierIds.length > 0 && `${crossFilter.chantierIds.length} chantier(s)`}
                {crossFilter.chantierIds.length > 0 && crossFilter.categorieIds.length > 0 && ', '}
                {crossFilter.categorieIds.length > 0 && `${crossFilter.categorieIds.length} categorie(s)`}
              </span>
              <button
                onClick={resetCrossFilter}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reinitialiser
              </button>
            </div>
          )}

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <ChartDepensesParChantier
              data={filteredStats.depensesParChantier}
              height={280}
              selectedIds={crossFilter.chantierIds}
              onSelect={handleChantierSelect}
            />
            <ChartDepensesParLot
              data={filteredStats.depensesParCategorie}
              height={280}
              selectedIds={crossFilter.categorieIds}
              onSelect={handleCategorieSelect}
            />
          </div>

          {/* Evolution Chart */}
          {filteredStats.evolutionMois.length > 0 && (
            <ChartEvolutionTemps
              data={filteredStats.evolutionMois}
              height={250}
            />
          )}

          {/* Bilan Acteurs (Transferts & Depenses) */}
          <ChartBilanActeurs
            transferts={filteredTransferts}
            depenses={filteredDepenses}
            formatMontant={formatInDisplayCurrency}
            getAmountInDNT={getAmountInDNT}
            height={280}
          />

          {/* Data Table */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Details des Operations</h2>
            <DataTable<UnifiedEntry>
              data={tableData}
              columns={[
                {
                  key: 'date',
                  header: 'Date',
                  render: (row: UnifiedEntry) => new Date(row.date).toLocaleDateString('fr-FR')
                },
                {
                  key: 'type',
                  header: 'Type',
                  render: (row: UnifiedEntry) => renderTypeBadge(row.type)
                },
                {
                  key: 'description',
                  header: 'Description',
                  className: 'max-w-xs truncate'
                },
                {
                  key: 'chantierNom',
                  header: 'Chantier'
                },
                {
                  key: 'categorieNom',
                  header: 'Categorie'
                },
                {
                  key: 'montant',
                  header: 'Montant',
                  className: 'text-right',
                  render: (row: UnifiedEntry) => renderMontant(row.montant)
                },
                {
                  key: 'photosUrls',
                  header: 'Photos',
                  sortable: false,
                  render: (row: UnifiedEntry) => renderPhotoLinks(row.photosUrls)
                }
              ]}
              pageSize={15}
            />
          </div>
        </>
      )}
    </div>
  );
}
