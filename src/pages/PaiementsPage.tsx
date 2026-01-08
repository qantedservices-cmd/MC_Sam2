import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, DollarSign, Users, Loader2,
  CheckCircle, Clock, AlertCircle, RefreshCw, Download
} from 'lucide-react';
import {
  getChantiers, getEmployesByChantier, getPaiementsEmploye,
  calculerPaiementEmploye, createPaiementEmploye, updatePaiementEmploye
} from '../services/api';
import type { Chantier, Employe, PaiementEmploye, StatutPaiement } from '../types';
import { STATUTS_PAIEMENT } from '../types';
import { useToast } from '../contexts/ToastContext';
import { formatMontant } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';

export default function PaiementsPage() {
  const { hasPermission } = useAuth();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [selectedChantier, setSelectedChantier] = useState<string>('');
  const [selectedPeriode, setSelectedPeriode] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [paiements, setPaiements] = useState<PaiementEmploye[]>([]);
  const [paiementsGeneres, setPaiementsGeneres] = useState<Map<string, Omit<PaiementEmploye, 'id'>>>(new Map());

  const canManagePaiements = hasPermission('canViewCoutsInternes');

  const loadChantiers = useCallback(async () => {
    try {
      const data = await getChantiers();
      setChantiers(data);
      if (data.length > 0 && !selectedChantier) {
        setSelectedChantier(data[0].id);
      }
    } catch {
      showError('Erreur lors du chargement des chantiers');
    }
  }, [showError, selectedChantier]);

  const loadData = useCallback(async () => {
    if (!selectedChantier) return;

    try {
      setLoading(true);
      const [employesData, paiementsData] = await Promise.all([
        getEmployesByChantier(selectedChantier),
        getPaiementsEmploye(selectedChantier)
      ]);

      const activeEmployes = employesData.filter(e => e.statut === 'actif');
      setEmployes(activeEmployes);

      // Filtrer les paiements de la periode
      const periodePaiements = paiementsData.filter(p => p.periode === selectedPeriode);
      setPaiements(periodePaiements);
    } catch {
      showError('Erreur lors du chargement des donnees');
    } finally {
      setLoading(false);
    }
  }, [selectedChantier, selectedPeriode, showError]);

  useEffect(() => {
    loadChantiers();
  }, [loadChantiers]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGeneratePaiements = async () => {
    if (!selectedChantier || employes.length === 0) return;

    setGenerating(true);
    try {
      const generated = new Map<string, Omit<PaiementEmploye, 'id'>>();

      for (const employe of employes) {
        const calcul = await calculerPaiementEmploye(employe.id, selectedChantier, selectedPeriode);
        generated.set(employe.id, calcul);
      }

      setPaiementsGeneres(generated);
      showSuccess('Calculs generes');
    } catch {
      showError('Erreur lors du calcul');
    } finally {
      setGenerating(false);
    }
  };

  const handleSavePaiement = async (employeId: string) => {
    const calcul = paiementsGeneres.get(employeId);
    if (!calcul) return;

    try {
      const existing = paiements.find(p => p.employeId === employeId);

      if (existing) {
        await updatePaiementEmploye(existing.id, { ...calcul, id: existing.id });
      } else {
        await createPaiementEmploye(calcul);
      }

      showSuccess('Paiement enregistre');
      loadData();
    } catch {
      showError('Erreur lors de l\'enregistrement');
    }
  };

  const handleSaveAll = async () => {
    setGenerating(true);
    try {
      for (const [employeId] of paiementsGeneres) {
        await handleSavePaiement(employeId);
      }
      setPaiementsGeneres(new Map());
      showSuccess('Tous les paiements ont ete enregistres');
    } catch {
      showError('Erreur lors de l\'enregistrement');
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateStatut = async (paiement: PaiementEmploye, statut: StatutPaiement) => {
    try {
      const updates: Partial<PaiementEmploye> = { statut };
      if (statut === 'paye') {
        updates.datePaiement = new Date().toISOString().split('T')[0];
      }
      await updatePaiementEmploye(paiement.id, updates);
      showSuccess('Statut mis a jour');
      loadData();
    } catch {
      showError('Erreur lors de la mise a jour');
    }
  };

  const getEmployeNom = (employeId: string) => {
    const emp = employes.find(e => e.id === employeId);
    return emp ? `${emp.prenom} ${emp.nom}` : 'Inconnu';
  };

  const getStatutIcon = (statut: StatutPaiement) => {
    switch (statut) {
      case 'paye': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'partiel': return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatutColor = (statut: StatutPaiement) => {
    switch (statut) {
      case 'paye': return 'bg-green-100 text-green-700';
      case 'partiel': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Calculer les totaux
  const totalMontant = paiements.reduce((sum, p) => sum + p.montantTotal, 0);
  const totalPaye = paiements.filter(p => p.statut === 'paye').reduce((sum, p) => sum + p.montantTotal, 0);
  const totalEnAttente = totalMontant - totalPaye;

  // Mois disponibles (12 derniers mois)
  const getAvailableMonths = () => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      months.push({ value, label });
    }
    return months;
  };

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
            to="/personnel"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Paiements</h1>
            <p className="text-gray-500">Gestion des salaires</p>
          </div>
        </div>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Periode</label>
            <select
              value={selectedPeriode}
              onChange={e => setSelectedPeriode(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {getAvailableMonths().map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          {canManagePaiements && (
            <div className="flex items-end">
              <button
                onClick={handleGeneratePaiements}
                disabled={generating || employes.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
              >
                {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                Calculer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Resume */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total periode</p>
              <p className="text-xl font-bold text-gray-800">{formatMontant(totalMontant)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Paye</p>
              <p className="text-xl font-bold text-green-600">{formatMontant(totalPaye)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">En attente</p>
              <p className="text-xl font-bold text-orange-600">{formatMontant(totalEnAttente)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Paiements generes (non enregistres) */}
      {paiementsGeneres.size > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-yellow-800">Calculs en attente d'enregistrement</h3>
            <button
              onClick={handleSaveAll}
              disabled={generating}
              className="flex items-center gap-2 px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
            >
              <Download className="w-4 h-4" />
              Enregistrer tous
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-yellow-100">
                <tr>
                  <th className="px-3 py-2 text-left">Employe</th>
                  <th className="px-3 py-2 text-right">Jours</th>
                  <th className="px-3 py-2 text-right">H. Supp</th>
                  <th className="px-3 py-2 text-right">Base</th>
                  <th className="px-3 py-2 text-right">Supp</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-yellow-200">
                {Array.from(paiementsGeneres).map(([employeId, calcul]) => (
                  <tr key={employeId}>
                    <td className="px-3 py-2 font-medium">{getEmployeNom(employeId)}</td>
                    <td className="px-3 py-2 text-right">{calcul.joursPresent}</td>
                    <td className="px-3 py-2 text-right">{calcul.heuresSupp}h</td>
                    <td className="px-3 py-2 text-right">{formatMontant(calcul.montantBase)}</td>
                    <td className="px-3 py-2 text-right">{formatMontant(calcul.montantHeuresSupp)}</td>
                    <td className="px-3 py-2 text-right font-semibold">{formatMontant(calcul.montantTotal)}</td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => handleSavePaiement(employeId)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Enregistrer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Liste des paiements enregistres */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : paiements.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">Aucun paiement pour cette periode</p>
          <p className="text-sm text-gray-400">
            Utilisez le bouton "Calculer" pour generer les fiches de paie
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-800">Fiches de paie enregistrees</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Employe</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Jours</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">H. Supp</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Base</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Supp</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Total</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Statut</th>
                  {canManagePaiements && (
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y">
                {paiements.map(paiement => (
                  <tr key={paiement.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{getEmployeNom(paiement.employeId)}</p>
                    </td>
                    <td className="px-4 py-3 text-right">{paiement.joursPresent}</td>
                    <td className="px-4 py-3 text-right">{paiement.heuresSupp}h</td>
                    <td className="px-4 py-3 text-right">{formatMontant(paiement.montantBase)}</td>
                    <td className="px-4 py-3 text-right">{formatMontant(paiement.montantHeuresSupp)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatMontant(paiement.montantTotal)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {getStatutIcon(paiement.statut)}
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatutColor(paiement.statut)}`}>
                          {STATUTS_PAIEMENT[paiement.statut]}
                        </span>
                      </div>
                    </td>
                    {canManagePaiements && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {paiement.statut !== 'paye' && (
                            <button
                              onClick={() => handleUpdateStatut(paiement, 'paye')}
                              className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                            >
                              Marquer paye
                            </button>
                          )}
                          {paiement.statut === 'paye' && (
                            <button
                              onClick={() => handleUpdateStatut(paiement, 'en_attente')}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                            >
                              Annuler
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 font-semibold">
                <tr>
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-right">{paiements.reduce((s, p) => s + p.joursPresent, 0)}</td>
                  <td className="px-4 py-3 text-right">{paiements.reduce((s, p) => s + p.heuresSupp, 0)}h</td>
                  <td className="px-4 py-3 text-right">{formatMontant(paiements.reduce((s, p) => s + p.montantBase, 0))}</td>
                  <td className="px-4 py-3 text-right">{formatMontant(paiements.reduce((s, p) => s + p.montantHeuresSupp, 0))}</td>
                  <td className="px-4 py-3 text-right">{formatMontant(totalMontant)}</td>
                  <td colSpan={canManagePaiements ? 2 : 1}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
