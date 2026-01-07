import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getChantiers, getDepenses, getCategories } from '../services/api';
import type { Chantier, Depense, Categorie } from '../types';
import { formatMontant } from '../utils/format';
import ChantierCard from '../components/ChantierCard';
import ChantierListItem from '../components/ChantierListItem';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { PlusCircle, Building2, TrendingUp, TrendingDown, Wallet, LayoutGrid, List, FileDown } from 'lucide-react';
import { exportAllChantiersPdf } from '../utils/exportPdf';

export default function Dashboard() {
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [chantiersData, depensesData, categoriesData] = await Promise.all([
        getChantiers(),
        getDepenses(),
        getCategories()
      ]);
      setChantiers(chantiersData);
      setDepenses(depensesData);
      setCategories(categoriesData);
    } catch (err) {
      setError('Erreur de connexion au serveur. Lancez: npm run server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Pre-compute depenses by chantier for performance
  const depensesByChantier = useMemo(() => {
    const map: Record<string, Depense[]> = {};
    depenses.forEach(d => {
      if (!map[d.chantierId]) map[d.chantierId] = [];
      map[d.chantierId].push(d);
    });
    return map;
  }, [depenses]);

  // Memoized stats
  const { budgetTotal, depensesTotal, resteTotal, chantiersEnCours, chantiersTermines, chantiersSuspendus } = useMemo(() => {
    const budgetTotal = chantiers.reduce((sum, c) => sum + c.budgetPrevisionnel, 0);
    const depensesTotal = depenses.reduce((sum, d) => sum + d.montant, 0);
    return {
      budgetTotal,
      depensesTotal,
      resteTotal: budgetTotal - depensesTotal,
      chantiersEnCours: chantiers.filter(c => c.statut === 'en_cours').length,
      chantiersTermines: chantiers.filter(c => c.statut === 'termine').length,
      chantiersSuspendus: chantiers.filter(c => c.statut === 'suspendu').length
    };
  }, [chantiers, depenses]);

  if (loading) {
    return <Loading message="Chargement des chantiers..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadData} />;
  }

  // État vide - aucun chantier
  if (chantiers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Building2 className="w-20 h-20 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Bienvenue sur MonChantier</h2>
        <p className="text-gray-500 mb-6 text-center max-w-md">
          Gérez vos chantiers BTP en toute simplicité. Suivez vos budgets, vos dépenses et l'avancement de vos projets.
        </p>
        <Link
          to="/chantiers/nouveau"
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <PlusCircle className="w-5 h-5" />
          Créer mon premier chantier
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Budget Total</p>
              <p className="text-2xl font-bold text-blue-600">{formatMontant(budgetTotal)}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Wallet className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Dépenses Totales</p>
              <p className="text-2xl font-bold text-red-600">{formatMontant(depensesTotal)}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Reste</p>
              <p className={`text-2xl font-bold ${resteTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatMontant(resteTotal)}
              </p>
            </div>
            <div className={`${resteTotal >= 0 ? 'bg-green-100' : 'bg-red-100'} p-3 rounded-full`}>
              <TrendingUp className={`w-6 h-6 ${resteTotal >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques des chantiers */}
      <div className="bg-white rounded-lg shadow p-4 mb-8">
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span className="text-gray-600">{chantiersEnCours} en cours</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-gray-600">{chantiersTermines} terminé{chantiersTermines > 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span className="text-gray-600">{chantiersSuspendus} suspendu{chantiersSuspendus > 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Liste des chantiers */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Chantiers ({chantiers.length})</h2>
        <div className="flex items-center gap-2">
          {/* Toggle vue */}
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
          </div>
          <button
            onClick={() => exportAllChantiersPdf(chantiers, depenses, categories)}
            className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            title="Exporter tous les chantiers en PDF"
          >
            <FileDown className="w-4 h-4" />
            Export PDF
          </button>
          <Link
            to="/chantiers/nouveau"
            className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Nouveau
          </Link>
        </div>
      </div>

      {/* Affichage grille */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

      {/* Affichage liste */}
      {viewMode === 'list' && (
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
  );
}
