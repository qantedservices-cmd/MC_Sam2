import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, ChevronLeft, ChevronRight, Package,
  Plus, Trash2, BarChart2, ChevronDown, ChevronUp
} from 'lucide-react';
import {
  getChantiers, getMaterielsActifs, getUtilisationsMateriel,
  getEmployesByChantier, createUtilisationMateriel, updateUtilisationMateriel,
  deleteUtilisationMateriel
} from '../services/api';
import type { Chantier, Materiel, UtilisationMateriel, Employe, TypeDeplacement } from '../types';
import { TYPES_MATERIEL, TYPES_DEPLACEMENT } from '../types';
import { useToast } from '../contexts/ToastContext';
import { formatMontant } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';

interface UtilisationForm {
  id?: string;
  materielId: string;
  employeId: string;
  typeDeplacement: TypeDeplacement;
  kilometrage: number;
  fraisKm: number;
  coutLocation: number;
  dureeHeures: number;
  notes: string;
}

const TAUX_KM_DEFAULT = 0.25; // DNT par km

export default function UtilisationMaterielPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [materiels, setMateriels] = useState<Materiel[]>([]);
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [utilisations, setUtilisations] = useState<UtilisationMateriel[]>([]);
  const [selectedChantier, setSelectedChantier] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showStats, setShowStats] = useState(false);

  // Liste des utilisations du jour en cours d'edition
  const [dailyUtilisations, setDailyUtilisations] = useState<UtilisationForm[]>([]);

  const loadChantiers = useCallback(async () => {
    try {
      const [chantiersData, materielsData] = await Promise.all([
        getChantiers(),
        getMaterielsActifs()
      ]);
      setChantiers(chantiersData);
      setMateriels(materielsData);
      if (chantiersData.length > 0 && !selectedChantier) {
        setSelectedChantier(chantiersData[0].id);
      }
    } catch {
      showError('Erreur lors du chargement');
    }
  }, [showError, selectedChantier]);

  const loadData = useCallback(async () => {
    if (!selectedChantier) return;

    try {
      setLoading(true);
      const [employesData, utilisationsData] = await Promise.all([
        getEmployesByChantier(selectedChantier),
        getUtilisationsMateriel(selectedChantier)
      ]);

      setEmployes(employesData.filter(e => e.statut === 'actif'));
      setUtilisations(utilisationsData);

      // Charger les utilisations du jour
      const dayUtilisations = utilisationsData
        .filter(u => u.date === selectedDate)
        .map(u => ({
          id: u.id,
          materielId: u.materielId,
          employeId: u.employeId || '',
          typeDeplacement: u.typeDeplacement || 'vehicule_entreprise' as TypeDeplacement,
          kilometrage: u.kilometrage || 0,
          fraisKm: u.fraisKm || 0,
          coutLocation: u.coutLocation || 0,
          dureeHeures: u.dureeHeures || 0,
          notes: u.notes || ''
        }));

      setDailyUtilisations(dayUtilisations);
    } catch {
      showError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [selectedChantier, selectedDate, showError]);

  useEffect(() => {
    loadChantiers();
  }, [loadChantiers]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Stats mensuelles
  const monthlyStats = useMemo(() => {
    const currentMonth = selectedDate.substring(0, 7);
    const monthUtilisations = utilisations.filter(u => u.date.startsWith(currentMonth));

    const statsByMateriel = materiels.map(mat => {
      const matUtilisations = monthUtilisations.filter(u => u.materielId === mat.id);
      const joursUtilisation = new Set(matUtilisations.map(u => u.date)).size;
      const totalKm = matUtilisations.reduce((s, u) => s + (u.kilometrage || 0), 0);
      const totalFraisKm = matUtilisations.reduce((s, u) => s + (u.fraisKm || 0), 0);
      const totalCoutLocation = matUtilisations.reduce((s, u) => s + (u.coutLocation || 0), 0);
      const totalHeures = matUtilisations.reduce((s, u) => s + (u.dureeHeures || 0), 0);

      return {
        materielId: mat.id,
        nom: mat.nom,
        type: mat.type,
        joursUtilisation,
        totalKm,
        totalFraisKm,
        totalCoutLocation,
        totalHeures,
        coutTotal: totalFraisKm + totalCoutLocation
      };
    }).filter(s => s.joursUtilisation > 0);

    return statsByMateriel;
  }, [utilisations, materiels, selectedDate]);

  const handleAddUtilisation = () => {
    if (materiels.length === 0) {
      showError('Aucun materiel disponible');
      return;
    }

    setDailyUtilisations(prev => [...prev, {
      materielId: materiels[0].id,
      employeId: '',
      typeDeplacement: 'vehicule_entreprise',
      kilometrage: 0,
      fraisKm: 0,
      coutLocation: 0,
      dureeHeures: 0,
      notes: ''
    }]);
  };

  const handleRemoveUtilisation = async (index: number) => {
    const utilisation = dailyUtilisations[index];

    if (utilisation.id) {
      try {
        await deleteUtilisationMateriel(utilisation.id);
        showSuccess('Utilisation supprimee');
      } catch {
        showError('Erreur lors de la suppression');
        return;
      }
    }

    setDailyUtilisations(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateUtilisation = (index: number, field: keyof UtilisationForm, value: string | number) => {
    setDailyUtilisations(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // Auto-calcul frais km si vehicule perso
      if (field === 'kilometrage' && updated[index].typeDeplacement === 'vehicule_perso') {
        updated[index].fraisKm = Number(value) * TAUX_KM_DEFAULT;
      }

      return updated;
    });
  };

  const handleSaveAll = async () => {
    setSaving(true);

    try {
      for (const utilisation of dailyUtilisations) {
        const data = {
          materielId: utilisation.materielId,
          chantierId: selectedChantier,
          date: selectedDate,
          employeId: utilisation.employeId || undefined,
          typeDeplacement: utilisation.typeDeplacement || undefined,
          kilometrage: utilisation.kilometrage || undefined,
          fraisKm: utilisation.fraisKm || undefined,
          coutLocation: utilisation.coutLocation || undefined,
          dureeHeures: utilisation.dureeHeures || undefined,
          notes: utilisation.notes || undefined,
          createdAt: new Date().toISOString().split('T')[0],
          createdBy: user?.id
        };

        if (utilisation.id) {
          await updateUtilisationMateriel(utilisation.id, data);
        } else {
          await createUtilisationMateriel(data);
        }
      }

      showSuccess('Utilisations enregistrees');
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

  const formatMonth = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric'
    });
  };

  // Totaux du jour
  const dailyTotals = useMemo(() => {
    return {
      fraisKm: dailyUtilisations.reduce((s, u) => s + (u.fraisKm || 0), 0),
      coutLocation: dailyUtilisations.reduce((s, u) => s + (u.coutLocation || 0), 0),
      total: dailyUtilisations.reduce((s, u) => s + (u.fraisKm || 0) + (u.coutLocation || 0), 0)
    };
  }, [dailyUtilisations]);

  if (loading && chantiers.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/materiel"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Utilisation Materiel</h1>
            <p className="text-gray-500 capitalize">{formatDate(selectedDate)}</p>
          </div>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={saving || dailyUtilisations.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          <span className="hidden sm:inline">Enregistrer</span>
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Chantier</label>
            <select
              value={selectedChantier}
              onChange={e => setSelectedChantier(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {chantiers.map(c => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={() => navigateDate(-1)}
              className="p-2 border rounded-lg hover:bg-gray-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
      </div>

      {/* Totaux du jour */}
      {dailyUtilisations.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white rounded-lg shadow p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Frais km</p>
            <p className="text-lg font-bold text-blue-600">{formatMontant(dailyTotals.fraisKm)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Cout location</p>
            <p className="text-lg font-bold text-orange-600">{formatMontant(dailyTotals.coutLocation)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Total jour</p>
            <p className="text-lg font-bold text-gray-800">{formatMontant(dailyTotals.total)}</p>
          </div>
        </div>
      )}

      {/* Stats mensuelles */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <button
          onClick={() => setShowStats(!showStats)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-800">
              Statistiques du mois ({formatMonth(selectedDate)})
            </span>
          </div>
          {showStats ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        {showStats && monthlyStats.length > 0 && (
          <div className="border-t overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Materiel</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-700">Jours</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-700">Km</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-700">Heures</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">Frais km</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">Location</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {monthlyStats.map(stat => (
                  <tr key={stat.materielId} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <p className="font-medium">{stat.nom}</p>
                      <p className="text-xs text-gray-500">{TYPES_MATERIEL[stat.type]}</p>
                    </td>
                    <td className="px-4 py-2 text-center">{stat.joursUtilisation}</td>
                    <td className="px-4 py-2 text-center">{stat.totalKm}</td>
                    <td className="px-4 py-2 text-center">{stat.totalHeures}h</td>
                    <td className="px-4 py-2 text-right">{formatMontant(stat.totalFraisKm)}</td>
                    <td className="px-4 py-2 text-right">{formatMontant(stat.totalCoutLocation)}</td>
                    <td className="px-4 py-2 text-right font-semibold">{formatMontant(stat.coutTotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 font-semibold">
                <tr>
                  <td className="px-4 py-2">Total</td>
                  <td className="px-4 py-2 text-center">-</td>
                  <td className="px-4 py-2 text-center">{monthlyStats.reduce((s, m) => s + m.totalKm, 0)}</td>
                  <td className="px-4 py-2 text-center">{monthlyStats.reduce((s, m) => s + m.totalHeures, 0)}h</td>
                  <td className="px-4 py-2 text-right">{formatMontant(monthlyStats.reduce((s, m) => s + m.totalFraisKm, 0))}</td>
                  <td className="px-4 py-2 text-right">{formatMontant(monthlyStats.reduce((s, m) => s + m.totalCoutLocation, 0))}</td>
                  <td className="px-4 py-2 text-right">{formatMontant(monthlyStats.reduce((s, m) => s + m.coutTotal, 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {showStats && monthlyStats.length === 0 && (
          <div className="border-t p-4 text-center text-gray-500">
            Aucune utilisation ce mois
          </div>
        )}
      </div>

      {/* Liste utilisations du jour */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Utilisations du jour</h3>
          <button
            onClick={handleAddUtilisation}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : dailyUtilisations.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Aucune utilisation pour ce jour</p>
            <button
              onClick={handleAddUtilisation}
              className="text-blue-600 hover:underline text-sm"
            >
              Ajouter une utilisation
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {dailyUtilisations.map((utilisation, index) => (
              <div key={index} className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Materiel */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Materiel</label>
                    <select
                      value={utilisation.materielId}
                      onChange={e => handleUpdateUtilisation(index, 'materielId', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      {materiels.map(m => (
                        <option key={m.id} value={m.id}>{m.nom}</option>
                      ))}
                    </select>
                  </div>

                  {/* Employe */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Utilise par</label>
                    <select
                      value={utilisation.employeId}
                      onChange={e => handleUpdateUtilisation(index, 'employeId', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Non specifie</option>
                      {employes.map(e => (
                        <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>
                      ))}
                    </select>
                  </div>

                  {/* Type deplacement */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                    <select
                      value={utilisation.typeDeplacement}
                      onChange={e => handleUpdateUtilisation(index, 'typeDeplacement', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.entries(TYPES_DEPLACEMENT).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Duree */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Duree (h)</label>
                    <input
                      type="number"
                      value={utilisation.dureeHeures}
                      onChange={e => handleUpdateUtilisation(index, 'dureeHeures', Number(e.target.value))}
                      min="0"
                      step="0.5"
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Kilometrage */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Km</label>
                    <input
                      type="number"
                      value={utilisation.kilometrage}
                      onChange={e => handleUpdateUtilisation(index, 'kilometrage', Number(e.target.value))}
                      min="0"
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Frais km */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Frais km (DNT)</label>
                    <input
                      type="number"
                      value={utilisation.fraisKm}
                      onChange={e => handleUpdateUtilisation(index, 'fraisKm', Number(e.target.value))}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Cout location */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Cout location (DNT)</label>
                    <input
                      type="number"
                      value={utilisation.coutLocation}
                      onChange={e => handleUpdateUtilisation(index, 'coutLocation', Number(e.target.value))}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Supprimer */}
                  <div className="flex items-end">
                    <button
                      onClick={() => handleRemoveUtilisation(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Notes */}
                <div className="mt-2">
                  <input
                    type="text"
                    value={utilisation.notes}
                    onChange={e => handleUpdateUtilisation(index, 'notes', e.target.value)}
                    placeholder="Notes..."
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
