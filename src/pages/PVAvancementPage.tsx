import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, FileText, Loader2, Send, CheckCircle,
  XCircle, Eye, Trash2, ClipboardCheck, TrendingUp
} from 'lucide-react';
import {
  getPVAvancements, getChantier, getLotsTravaux, createPVAvancement,
  updatePVAvancement, deletePVAvancement
} from '../services/api';
import type { PVAvancement, Chantier, LotTravaux, StatutPV, LotAvancement } from '../types';
import { STATUTS_PV, UNITES_METRAGE } from '../types';
import { useToast } from '../contexts/ToastContext';
import { formatMontant, formatDate } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';

const STATUT_COLORS: Record<StatutPV, string> = {
  brouillon: 'bg-gray-100 text-gray-700',
  soumis: 'bg-blue-100 text-blue-700',
  valide: 'bg-green-100 text-green-700',
  refuse: 'bg-red-100 text-red-700'
};

export default function PVAvancementPage() {
  const { id: chantierId } = useParams<{ id: string }>();
  const { hasPermission } = useAuth();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [chantier, setChantier] = useState<Chantier | null>(null);
  const [pvs, setPvs] = useState<PVAvancement[]>([]);
  const [lots, setLots] = useState<LotTravaux[]>([]);

  // Modal creation PV
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    periodeDebut: '',
    periodeFin: '',
    commentaire: ''
  });
  const [lotsAvancement, setLotsAvancement] = useState<LotAvancement[]>([]);

  // Modal detail
  const [selectedPV, setSelectedPV] = useState<PVAvancement | null>(null);

  const canCreate = hasPermission('canSaisieProduction');
  const canValidate = hasPermission('canValiderFacture');

  const loadData = useCallback(async () => {
    if (!chantierId) return;

    try {
      setLoading(true);
      const [chantierData, pvsData, lotsData] = await Promise.all([
        getChantier(chantierId),
        getPVAvancements(chantierId),
        getLotsTravaux(chantierId)
      ]);

      setChantier(chantierData);
      setPvs(pvsData.sort((a, b) => b.numero - a.numero));
      setLots(lotsData.filter(l => l.actif));
    } catch {
      showError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [chantierId, showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calcule le dernier avancement connu par lot
  const getLastAvancement = useCallback((lotId: string): number => {
    const sortedPVs = [...pvs].filter(pv => pv.statut === 'valide').sort((a, b) => b.numero - a.numero);
    for (const pv of sortedPVs) {
      const lot = pv.lots.find(l => l.lotId === lotId);
      if (lot) return lot.quantiteRealisee;
    }
    return 0;
  }, [pvs]);

  const handleOpenCreateModal = () => {
    const today = new Date().toISOString().split('T')[0];
    const lastPV = pvs.find(pv => pv.statut === 'valide');
    const startDate = lastPV ? lastPV.periodeFin : today;

    setFormData({
      periodeDebut: startDate,
      periodeFin: today,
      commentaire: ''
    });

    // Initialiser les lots avec l'avancement precedent
    const initialLots: LotAvancement[] = lots.map(lot => {
      const lastQty = getLastAvancement(lot.id);
      return {
        lotId: lot.id,
        lotNom: lot.nom,
        unite: lot.unite,
        quantitePrevue: lot.quantitePrevue,
        quantiteRealisee: lastQty,
        pourcentage: lot.quantitePrevue > 0 ? (lastQty / lot.quantitePrevue) * 100 : 0,
        montant: lastQty * lot.prixUnitaire
      };
    });

    setLotsAvancement(initialLots);
    setShowModal(true);
  };

  const handleLotChange = (lotId: string, quantiteRealisee: number) => {
    setLotsAvancement(prev => prev.map(la => {
      if (la.lotId !== lotId) return la;
      const lot = lots.find(l => l.id === lotId);
      if (!lot) return la;
      const pourcentage = lot.quantitePrevue > 0 ? (quantiteRealisee / lot.quantitePrevue) * 100 : 0;
      return {
        ...la,
        quantiteRealisee,
        pourcentage: Math.min(100, pourcentage),
        montant: quantiteRealisee * lot.prixUnitaire
      };
    }));
  };

  const handleCreate = async () => {
    if (!chantierId || !formData.periodeDebut || !formData.periodeFin) {
      showError('Veuillez remplir les dates');
      return;
    }

    setSaving(true);
    try {
      const numero = pvs.length > 0 ? Math.max(...pvs.map(p => p.numero)) + 1 : 1;
      const montantCumule = lotsAvancement.reduce((sum, l) => sum + l.montant, 0);
      const totalPrevu = lots.reduce((sum, l) => sum + (l.quantitePrevue * l.prixUnitaire), 0);
      const avancementGlobal = totalPrevu > 0 ? (montantCumule / totalPrevu) * 100 : 0;

      await createPVAvancement({
        chantierId,
        numero,
        date: new Date().toISOString().split('T')[0],
        periodeDebut: formData.periodeDebut,
        periodeFin: formData.periodeFin,
        lots: lotsAvancement,
        avancementGlobal: Math.round(avancementGlobal * 10) / 10,
        montantCumule,
        photosUrls: [],
        statut: 'brouillon',
        commentaire: formData.commentaire || undefined,
        createdAt: new Date().toISOString()
      });

      showSuccess('PV cree');
      setShowModal(false);
      loadData();
    } catch {
      showError('Erreur lors de la creation');
    } finally {
      setSaving(false);
    }
  };

  const handleSoumettre = async (pv: PVAvancement) => {
    try {
      await updatePVAvancement(pv.id, {
        statut: 'soumis',
        soumisLe: new Date().toISOString()
      });
      showSuccess('PV soumis pour validation');
      loadData();
    } catch {
      showError('Erreur lors de la soumission');
    }
  };

  const handleValider = async (pv: PVAvancement, approuve: boolean) => {
    try {
      await updatePVAvancement(pv.id, {
        statut: approuve ? 'valide' : 'refuse',
        valideLe: approuve ? new Date().toISOString() : undefined,
        refuseLe: !approuve ? new Date().toISOString() : undefined
      });
      showSuccess(approuve ? 'PV valide' : 'PV refuse');
      setSelectedPV(null);
      loadData();
    } catch {
      showError('Erreur lors de la validation');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce PV ?')) return;
    try {
      await deletePVAvancement(id);
      showSuccess('PV supprime');
      loadData();
    } catch {
      showError('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!chantier) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Chantier non trouve</p>
        <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block">Retour</Link>
      </div>
    );
  }

  // Calcul avancement global actuel
  const dernierPVValide = pvs.find(pv => pv.statut === 'valide');
  const avancementActuel = dernierPVValide?.avancementGlobal || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={`/chantiers/${chantierId}`} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">PV d'Avancement</h1>
            <p className="text-gray-500">{chantier.nom}</p>
          </div>
        </div>
        {canCreate && (
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nouveau PV
          </button>
        )}
      </div>

      {/* Avancement global */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-semibold">Avancement Global</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-gray-200 rounded-full h-4">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all"
              style={{ width: `${Math.min(100, avancementActuel)}%` }}
            />
          </div>
          <span className="text-lg font-bold text-blue-600">{avancementActuel.toFixed(1)}%</span>
        </div>
        {dernierPVValide && (
          <p className="text-sm text-gray-500 mt-2">
            Dernier PV valide: n{dernierPVValide.numero} du {formatDate(dernierPVValide.date)}
          </p>
        )}
      </div>

      {/* Liste des PV */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-800">Historique des PV ({pvs.length})</h2>
        </div>

        {pvs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucun PV d'avancement</p>
          </div>
        ) : (
          <div className="divide-y">
            {pvs.map(pv => (
              <div key={pv.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <FileText className="w-10 h-10 text-gray-400" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">PV n{pv.numero}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUT_COLORS[pv.statut]}`}>
                        {STATUTS_PV[pv.statut]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {formatDate(pv.periodeDebut)} - {formatDate(pv.periodeFin)}
                    </p>
                    <p className="text-sm">
                      Avancement: <span className="font-medium">{pv.avancementGlobal.toFixed(1)}%</span>
                      {' - '}
                      Montant: <span className="font-medium">{formatMontant(pv.montantCumule)}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedPV(pv)}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                    title="Voir details"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  {pv.statut === 'brouillon' && canCreate && (
                    <>
                      <button
                        onClick={() => handleSoumettre(pv)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Soumettre"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(pv.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Supprimer"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal creation */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">Nouveau PV d'Avancement</h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Periode */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Debut periode</label>
                  <input
                    type="date"
                    value={formData.periodeDebut}
                    onChange={e => setFormData(p => ({ ...p, periodeDebut: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fin periode</label>
                  <input
                    type="date"
                    value={formData.periodeFin}
                    onChange={e => setFormData(p => ({ ...p, periodeFin: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Avancement par lot */}
              <div>
                <h3 className="font-medium text-gray-800 mb-3">Avancement par lot</h3>
                {lotsAvancement.length === 0 ? (
                  <p className="text-gray-500 text-sm">Aucun lot defini. Creez d'abord des lots.</p>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left">Lot</th>
                          <th className="px-3 py-2 text-right">Prevu</th>
                          <th className="px-3 py-2 text-right">Realise</th>
                          <th className="px-3 py-2 text-right">%</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {lotsAvancement.map(la => (
                          <tr key={la.lotId}>
                            <td className="px-3 py-2">{la.lotNom}</td>
                            <td className="px-3 py-2 text-right">{la.quantitePrevue} {UNITES_METRAGE[la.unite]}</td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min="0"
                                max={la.quantitePrevue}
                                step="0.1"
                                value={la.quantiteRealisee}
                                onChange={e => handleLotChange(la.lotId, parseFloat(e.target.value) || 0)}
                                className="w-24 px-2 py-1 border rounded text-right"
                              />
                            </td>
                            <td className="px-3 py-2 text-right font-medium">
                              {la.pourcentage.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Commentaire */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire</label>
                <textarea
                  value={formData.commentaire}
                  onChange={e => setFormData(p => ({ ...p, commentaire: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Observations, remarques..."
                />
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || lotsAvancement.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Creer le PV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detail */}
      {selectedPV && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">PV n{selectedPV.numero}</h2>
                <p className="text-sm text-gray-500">
                  {formatDate(selectedPV.periodeDebut)} - {formatDate(selectedPV.periodeFin)}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUT_COLORS[selectedPV.statut]}`}>
                {STATUTS_PV[selectedPV.statut]}
              </span>
            </div>

            <div className="p-6 space-y-4">
              {/* Resume */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Avancement global</span>
                  <span className="text-xl font-bold text-blue-600">{selectedPV.avancementGlobal.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-gray-700">Montant cumule</span>
                  <span className="font-medium">{formatMontant(selectedPV.montantCumule)}</span>
                </div>
              </div>

              {/* Detail par lot */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Lot</th>
                      <th className="px-3 py-2 text-right">Realise</th>
                      <th className="px-3 py-2 text-right">%</th>
                      <th className="px-3 py-2 text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedPV.lots.map((lot, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2">{lot.lotNom}</td>
                        <td className="px-3 py-2 text-right">{lot.quantiteRealisee} {UNITES_METRAGE[lot.unite]}</td>
                        <td className="px-3 py-2 text-right">{lot.pourcentage.toFixed(1)}%</td>
                        <td className="px-3 py-2 text-right font-medium">{formatMontant(lot.montant)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedPV.commentaire && (
                <div className="bg-yellow-50 rounded-lg p-3 text-sm">
                  <strong>Commentaire:</strong> {selectedPV.commentaire}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setSelectedPV(null)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Fermer
                </button>
                {canValidate && selectedPV.statut === 'soumis' && (
                  <>
                    <button
                      onClick={() => handleValider(selectedPV, false)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Refuser
                    </button>
                    <button
                      onClick={() => handleValider(selectedPV, true)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Valider
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
