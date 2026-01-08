import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, ChevronLeft, ChevronRight,
  Plus, Trash2, CheckCircle, BarChart2, ChevronDown, ChevronUp
} from 'lucide-react';
import {
  getTaches, getChantier, getProductions, createProduction,
  updateProduction, deleteProduction
} from '../services/api';
import type { Tache, Chantier, Production } from '../types';
import { useToast } from '../contexts/ToastContext';
import { formatMontant } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';

interface ProductionForm {
  id?: string;
  tacheId: string;
  quantiteRealisee: number;
  notes: string;
  valide: boolean;
}

export default function ProductionPage() {
  const { id: chantierId } = useParams<{ id: string }>();
  const { user, hasPermission } = useAuth();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [chantier, setChantier] = useState<Chantier | null>(null);
  const [taches, setTaches] = useState<Tache[]>([]);
  const [productions, setProductions] = useState<Production[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showStats, setShowStats] = useState(false);

  // Productions du jour en cours d'edition
  const [dailyProductions, setDailyProductions] = useState<ProductionForm[]>([]);

  const canEdit = hasPermission('canSaisieProduction');
  const canValidate = hasPermission('canValiderPV');

  const loadData = useCallback(async () => {
    if (!chantierId) return;

    try {
      setLoading(true);
      const [chantierData, tachesData, productionsData] = await Promise.all([
        getChantier(chantierId),
        getTaches(chantierId),
        getProductions(chantierId)
      ]);

      setChantier(chantierData);
      setTaches(tachesData.filter(t => t.statut !== 'termine'));
      setProductions(productionsData);

      // Charger les productions du jour
      const dayProductions = productionsData
        .filter(p => p.date === selectedDate)
        .map(p => ({
          id: p.id,
          tacheId: p.tacheId,
          quantiteRealisee: p.quantiteRealisee,
          notes: p.notes || '',
          valide: p.valide
        }));

      setDailyProductions(dayProductions);
    } catch {
      showError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [chantierId, selectedDate, showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Stats par tache
  const tacheStats = useMemo(() => {
    return taches.map(tache => {
      const tacheProductions = productions.filter(p => p.tacheId === tache.id);
      const totalRealise = tacheProductions.reduce((sum, p) => sum + p.quantiteRealisee, 0);
      const pourcentage = tache.quantitePrevue
        ? Math.min(100, (totalRealise / tache.quantitePrevue) * 100)
        : 0;

      return {
        tacheId: tache.id,
        titre: tache.titre,
        quantitePrevue: tache.quantitePrevue || 0,
        unite: tache.unite || '',
        totalRealise,
        pourcentage,
        prixUnitaire: tache.prixUnitaire || 0
      };
    });
  }, [taches, productions]);

  const handleAddProduction = () => {
    if (taches.length === 0) {
      showError('Aucune tache disponible');
      return;
    }

    setDailyProductions(prev => [...prev, {
      tacheId: taches[0].id,
      quantiteRealisee: 0,
      notes: '',
      valide: false
    }]);
  };

  const handleRemoveProduction = async (index: number) => {
    const production = dailyProductions[index];

    if (production.id) {
      try {
        await deleteProduction(production.id);
        showSuccess('Production supprimee');
      } catch {
        showError('Erreur lors de la suppression');
        return;
      }
    }

    setDailyProductions(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateProduction = (index: number, field: keyof ProductionForm, value: string | number | boolean) => {
    setDailyProductions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSaveAll = async () => {
    if (!chantierId) return;

    setSaving(true);

    try {
      for (const production of dailyProductions) {
        if (production.quantiteRealisee <= 0) continue;

        const data = {
          tacheId: production.tacheId,
          chantierId,
          date: selectedDate,
          quantiteRealisee: production.quantiteRealisee,
          notes: production.notes || undefined,
          valide: production.valide,
          saisieParId: user?.id,
          createdAt: new Date().toISOString().split('T')[0]
        };

        if (production.id) {
          await updateProduction(production.id, data);
        } else {
          await createProduction(data);
        }
      }

      showSuccess('Productions enregistrees');
      loadData();
    } catch {
      showError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const navigateDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getTacheInfo = (tacheId: string) => {
    return taches.find(t => t.id === tacheId);
  };

  // Totaux du jour
  const dailyTotals = useMemo(() => {
    let montant = 0;
    dailyProductions.forEach(p => {
      const tache = getTacheInfo(p.tacheId);
      if (tache?.prixUnitaire) {
        montant += p.quantiteRealisee * tache.prixUnitaire;
      }
    });
    return { montant };
  }, [dailyProductions, taches]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!chantier) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Chantier non trouve</p>
        <Link to="/" className="text-blue-600 hover:underline">Retour</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to={`/chantiers/${chantierId}/taches`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Production</h1>
            <p className="text-gray-500 capitalize">{formatDate(selectedDate)}</p>
          </div>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={saving || dailyProductions.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          <span className="hidden sm:inline">Enregistrer</span>
        </button>
      </div>

      {/* Navigation date */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => navigateDate(-1)}
            className="p-2 border rounded-lg hover:bg-gray-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => navigateDate(1)}
            className="p-2 border rounded-lg hover:bg-gray-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="px-3 py-2 border rounded-lg hover:bg-gray-50 text-sm"
          >
            Aujourd'hui
          </button>
        </div>
      </div>

      {/* Total du jour */}
      {dailyProductions.length > 0 && dailyTotals.montant > 0 && (
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-sm text-gray-500 mb-1">Valeur production du jour</p>
          <p className="text-2xl font-bold text-blue-600">{formatMontant(dailyTotals.montant)}</p>
        </div>
      )}

      {/* Stats avancement */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <button
          onClick={() => setShowStats(!showStats)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-800">Avancement des taches</span>
          </div>
          {showStats ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        {showStats && tacheStats.length > 0 && (
          <div className="border-t p-4 space-y-4">
            {tacheStats.map(stat => (
              <div key={stat.tacheId}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{stat.titre}</span>
                  <span className="text-sm text-gray-500">
                    {stat.totalRealise} / {stat.quantitePrevue} {stat.unite}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      stat.pourcentage >= 100 ? 'bg-green-500' :
                      stat.pourcentage >= 50 ? 'bg-blue-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${Math.min(100, stat.pourcentage)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500">{stat.pourcentage.toFixed(1)}%</span>
                  {stat.prixUnitaire > 0 && (
                    <span className="text-xs text-gray-500">
                      {formatMontant(stat.totalRealise * stat.prixUnitaire)} / {formatMontant(stat.quantitePrevue * stat.prixUnitaire)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {showStats && tacheStats.length === 0 && (
          <div className="border-t p-4 text-center text-gray-500">
            Aucune tache en cours
          </div>
        )}
      </div>

      {/* Saisie production */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Saisie du jour</h3>
          {canEdit && (
            <button
              onClick={handleAddProduction}
              disabled={taches.length === 0}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          )}
        </div>

        {taches.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 mb-2">Aucune tache en cours</p>
            <Link
              to={`/chantiers/${chantierId}/taches`}
              className="text-blue-600 hover:underline text-sm"
            >
              Creer des taches
            </Link>
          </div>
        ) : dailyProductions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 mb-2">Aucune production saisie pour ce jour</p>
            {canEdit && (
              <button
                onClick={handleAddProduction}
                className="text-blue-600 hover:underline text-sm"
              >
                Ajouter une production
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {dailyProductions.map((production, index) => {
              const tacheInfo = getTacheInfo(production.tacheId);
              return (
                <div key={index} className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {/* Tache */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Tache</label>
                      <select
                        value={production.tacheId}
                        onChange={e => handleUpdateProduction(index, 'tacheId', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        {taches.map(t => (
                          <option key={t.id} value={t.id}>{t.titre}</option>
                        ))}
                      </select>
                    </div>

                    {/* Quantite */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Quantite {tacheInfo?.unite && `(${tacheInfo.unite})`}
                      </label>
                      <input
                        type="number"
                        value={production.quantiteRealisee}
                        onChange={e => handleUpdateProduction(index, 'quantiteRealisee', Number(e.target.value))}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-end gap-2">
                      {canValidate && (
                        <button
                          onClick={() => handleUpdateProduction(index, 'valide', !production.valide)}
                          className={`p-2 rounded-lg transition-colors ${
                            production.valide
                              ? 'bg-green-100 text-green-600'
                              : 'bg-gray-100 text-gray-400 hover:bg-green-50 hover:text-green-600'
                          }`}
                          title={production.valide ? 'Valide' : 'Valider'}
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => handleRemoveProduction(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Notes + montant */}
                  <div className="mt-2 flex items-center gap-4">
                    <input
                      type="text"
                      value={production.notes}
                      onChange={e => handleUpdateProduction(index, 'notes', e.target.value)}
                      placeholder="Notes..."
                      className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                    {tacheInfo?.prixUnitaire && production.quantiteRealisee > 0 && (
                      <span className="text-sm font-medium text-gray-700">
                        = {formatMontant(production.quantiteRealisee * tacheInfo.prixUnitaire)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
