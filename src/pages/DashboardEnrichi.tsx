import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, FileText, ArrowRightLeft, TrendingUp, Loader2, Plus } from 'lucide-react';
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

export default function DashboardEnrichi() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [devis, setDevis] = useState<Devis[]>([]);
  const [transferts, setTransferts] = useState<TransfertBudget[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [displayCurrency, setDisplayCurrency] = useState<DeviseType>('DNT');

  const [filters, setFilters] = useState<FilterState>({
    chantierIds: [],
    categorieIds: [],
    dateDebut: '',
    dateFin: '',
    type: 'all'
  });

  useEffect(() => {
    async function loadData() {
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
        setError('Erreur lors du chargement des donnees');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Apply filters to data
  const filteredDepenses = useMemo(() => {
    return depenses.filter(d => {
      if (filters.chantierIds.length > 0 && !filters.chantierIds.includes(d.chantierId)) return false;
      if (filters.categorieIds.length > 0 && !filters.categorieIds.includes(d.categorieId)) return false;
      if (filters.dateDebut && d.date < filters.dateDebut) return false;
      if (filters.dateFin && d.date > filters.dateFin) return false;
      return true;
    });
  }, [depenses, filters]);

  const filteredDevis = useMemo(() => {
    return devis.filter(d => {
      if (filters.chantierIds.length > 0 && !filters.chantierIds.includes(d.chantierId)) return false;
      if (filters.categorieIds.length > 0 && !filters.categorieIds.includes(d.categorieId)) return false;
      if (filters.dateDebut && d.date < filters.dateDebut) return false;
      if (filters.dateFin && d.date > filters.dateFin) return false;
      return true;
    });
  }, [devis, filters]);

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
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Recharger
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex items-center gap-3">
          {/* Currency selector */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1">
            <span className="text-sm text-gray-600">Afficher en:</span>
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
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Devis
          </Link>
          <Link
            to="/transferts/nouveau"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Transfert
          </Link>
        </div>
      </div>

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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <ChartDepensesParChantier
          data={filteredStats.depensesParChantier}
          height={280}
        />
        <ChartDepensesParLot
          data={filteredStats.depensesParCategorie}
          height={280}
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
    </div>
  );
}
