import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, FileText, Loader2, Send, CheckCircle,
  XCircle, Eye, Trash2, Receipt
} from 'lucide-react';
import {
  getFacturations, getChantier, getLotsTravaux, createFacturation,
  updateFacturation, deleteFacturation, genererNumeroFacture,
  calculerSituationFinanciere
} from '../services/api';
import type { Facturation, Chantier, LotTravaux, StatutFacturation, LigneFacturation } from '../types';
import { STATUTS_FACTURATION, UNITES_METRAGE } from '../types';
import { useToast } from '../contexts/ToastContext';
import { formatMontant } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';

const STATUT_COLORS: Record<StatutFacturation, string> = {
  brouillon: 'bg-gray-100 text-gray-700',
  soumis: 'bg-blue-100 text-blue-700',
  valide: 'bg-green-100 text-green-700',
  refuse: 'bg-red-100 text-red-700',
  paye: 'bg-purple-100 text-purple-700'
};

export default function FacturationPage() {
  const { id: chantierId } = useParams<{ id: string }>();
  const { hasPermission } = useAuth();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [chantier, setChantier] = useState<Chantier | null>(null);
  const [factures, setFactures] = useState<Facturation[]>([]);
  const [lots, setLots] = useState<LotTravaux[]>([]);
  const [situation, setSituation] = useState<{
    budgetPrevu: number;
    montantFacture: number;
    montantPaye: number;
    resteAPayer: number;
  } | null>(null);

  // Modal creation facture
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    periodeDebut: '',
    periodeFin: '',
    tauxTva: 19,
    commentaire: ''
  });
  const [lignesFacture, setLignesFacture] = useState<LigneFacturation[]>([]);

  // Modal detail
  const [selectedFacture, setSelectedFacture] = useState<Facturation | null>(null);

  const canCreate = hasPermission('canCreateFacture');
  const canValidate = hasPermission('canValiderFacture');

  const loadData = useCallback(async () => {
    if (!chantierId) return;

    try {
      setLoading(true);
      const [chantierData, facturesData, lotsData, situationData] = await Promise.all([
        getChantier(chantierId),
        getFacturations(chantierId),
        getLotsTravaux(chantierId),
        calculerSituationFinanciere(chantierId)
      ]);

      setChantier(chantierData);
      setFactures(facturesData.sort((a, b) => b.date.localeCompare(a.date)));
      setLots(lotsData.filter(l => l.actif));
      setSituation(situationData);
    } catch {
      showError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [chantierId, showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreateModal = async () => {
    if (!chantierId) return;

    // Initialiser les lignes avec les lots actifs
    const lignes: LigneFacturation[] = lots.map(lot => ({
      lotId: lot.id,
      lotNom: lot.nom,
      unite: lot.unite,
      quantiteRealisee: 0, // A calculer depuis production
      quantiteFacturee: 0, // A calculer depuis factures precedentes
      quantiteAFacturer: 0,
      prixUnitaire: lot.prixUnitaire,
      montant: 0
    }));

    setLignesFacture(lignes);
    setFormData({
      periodeDebut: new Date().toISOString().split('T')[0],
      periodeFin: new Date().toISOString().split('T')[0],
      tauxTva: 19,
      commentaire: ''
    });
    setShowModal(true);
  };

  const handleUpdateLigne = (index: number, quantite: number) => {
    setLignesFacture(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        quantiteAFacturer: quantite,
        montant: quantite * updated[index].prixUnitaire
      };
      return updated;
    });
  };

  const totaux = useMemo(() => {
    const ht = lignesFacture.reduce((sum, l) => sum + l.montant, 0);
    const tva = ht * (formData.tauxTva / 100);
    const ttc = ht + tva;
    return { ht, tva, ttc };
  }, [lignesFacture, formData.tauxTva]);

  const handleCreateFacture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chantierId) return;

    setSaving(true);
    try {
      const numero = await genererNumeroFacture(chantierId);
      const lignesNonVides = lignesFacture.filter(l => l.quantiteAFacturer > 0);

      if (lignesNonVides.length === 0) {
        showError('Ajoutez au moins une ligne avec une quantite');
        setSaving(false);
        return;
      }

      const factureData: Omit<Facturation, 'id'> = {
        chantierId,
        numero,
        date: new Date().toISOString().split('T')[0],
        periodeDebut: formData.periodeDebut,
        periodeFin: formData.periodeFin,
        lignes: lignesNonVides,
        montantHT: totaux.ht,
        tva: totaux.tva,
        tauxTva: formData.tauxTva,
        montantTTC: totaux.ttc,
        statut: 'brouillon',
        commentaire: formData.commentaire || undefined,
        createdAt: new Date().toISOString().split('T')[0]
      };

      await createFacturation(factureData);
      showSuccess('Facture creee');
      setShowModal(false);
      loadData();
    } catch {
      showError('Erreur lors de la creation');
    } finally {
      setSaving(false);
    }
  };

  const handleSoumettre = async (facture: Facturation) => {
    try {
      await updateFacturation(facture.id, {
        statut: 'soumis',
        soumisLe: new Date().toISOString().split('T')[0]
      });
      showSuccess('Facture soumise au client');
      loadData();
    } catch {
      showError('Erreur lors de la soumission');
    }
  };

  const handleValider = async (facture: Facturation, valider: boolean) => {
    try {
      await updateFacturation(facture.id, {
        statut: valider ? 'valide' : 'refuse',
        valideLe: valider ? new Date().toISOString().split('T')[0] : undefined,
        refuseLe: !valider ? new Date().toISOString().split('T')[0] : undefined
      });
      showSuccess(valider ? 'Facture validee' : 'Facture refusee');
      setSelectedFacture(null);
      loadData();
    } catch {
      showError('Erreur lors de la validation');
    }
  };

  const handleDelete = async (facture: Facturation) => {
    if (facture.statut !== 'brouillon') {
      showError('Seules les factures brouillon peuvent etre supprimees');
      return;
    }
    if (!confirm(`Supprimer la facture ${facture.numero} ?`)) return;

    try {
      await deleteFacturation(facture.id);
      showSuccess('Facture supprimee');
      loadData();
    } catch {
      showError('Erreur lors de la suppression');
    }
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to={`/chantiers/${chantierId}`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Facturation</h1>
            <p className="text-gray-500">{chantier.nom}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/chantiers/${chantierId}/lots`}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Receipt className="w-5 h-5" />
            Lots
          </Link>
          {canCreate && (
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nouvelle facture
            </button>
          )}
        </div>
      </div>

      {/* Situation financiere */}
      {situation && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Budget prevu</p>
            <p className="text-xl font-bold text-gray-800">{formatMontant(situation.budgetPrevu)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Facture</p>
            <p className="text-xl font-bold text-blue-600">{formatMontant(situation.montantFacture)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Paye</p>
            <p className="text-xl font-bold text-green-600">{formatMontant(situation.montantPaye)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Reste a payer</p>
            <p className="text-xl font-bold text-orange-600">{formatMontant(situation.resteAPayer)}</p>
          </div>
        </div>
      )}

      {/* Liste factures */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-800">Factures</h3>
        </div>

        {factures.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucune facture</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Numero</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Periode</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Montant TTC</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Statut</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {factures.map(facture => (
                  <tr key={facture.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{facture.numero}</td>
                    <td className="px-4 py-3 text-sm">{new Date(facture.date).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(facture.periodeDebut).toLocaleDateString('fr-FR')} - {new Date(facture.periodeFin).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{formatMontant(facture.montantTTC)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${STATUT_COLORS[facture.statut]}`}>
                        {STATUTS_FACTURATION[facture.statut]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedFacture(facture)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                          title="Voir detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canCreate && facture.statut === 'brouillon' && (
                          <>
                            <button
                              onClick={() => handleSoumettre(facture)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                              title="Soumettre"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(facture)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal creation */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">Nouvelle facture</h2>
            </div>

            <form onSubmit={handleCreateFacture} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date debut periode</label>
                  <input
                    type="date"
                    value={formData.periodeDebut}
                    onChange={e => setFormData({ ...formData, periodeDebut: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date fin periode</label>
                  <input
                    type="date"
                    value={formData.periodeFin}
                    onChange={e => setFormData({ ...formData, periodeFin: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Lignes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lignes de facturation</label>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Lot</th>
                        <th className="px-3 py-2 text-center">Unite</th>
                        <th className="px-3 py-2 text-right">Prix unit.</th>
                        <th className="px-3 py-2 text-right">Qte a facturer</th>
                        <th className="px-3 py-2 text-right">Montant</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {lignesFacture.map((ligne, index) => (
                        <tr key={ligne.lotId}>
                          <td className="px-3 py-2">{ligne.lotNom}</td>
                          <td className="px-3 py-2 text-center">{UNITES_METRAGE[ligne.unite]}</td>
                          <td className="px-3 py-2 text-right">{formatMontant(ligne.prixUnitaire)}</td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={ligne.quantiteAFacturer}
                              onChange={e => handleUpdateLigne(index, Number(e.target.value))}
                              min="0"
                              step="0.01"
                              className="w-24 px-2 py-1 border rounded text-right"
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-medium">{formatMontant(ligne.montant)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Taux TVA (%)</label>
                  <input
                    type="number"
                    value={formData.tauxTva}
                    onChange={e => setFormData({ ...formData, tauxTva: Number(e.target.value) })}
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire</label>
                  <input
                    type="text"
                    value={formData.commentaire}
                    onChange={e => setFormData({ ...formData, commentaire: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Totaux */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span>Total HT</span>
                  <span className="font-medium">{formatMontant(totaux.ht)}</span>
                </div>
                <div className="flex justify-between">
                  <span>TVA ({formData.tauxTva}%)</span>
                  <span className="font-medium">{formatMontant(totaux.tva)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total TTC</span>
                  <span>{formatMontant(totaux.ttc)}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Creer facture
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal detail */}
      {selectedFacture && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Facture {selectedFacture.numero}</h2>
                <p className="text-sm text-gray-500">
                  {new Date(selectedFacture.date).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUT_COLORS[selectedFacture.statut]}`}>
                {STATUTS_FACTURATION[selectedFacture.statut]}
              </span>
            </div>

            <div className="p-6 space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Lot</th>
                      <th className="px-3 py-2 text-right">Quantite</th>
                      <th className="px-3 py-2 text-right">Prix unit.</th>
                      <th className="px-3 py-2 text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedFacture.lignes.map((ligne, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2">{ligne.lotNom}</td>
                        <td className="px-3 py-2 text-right">{ligne.quantiteAFacturer} {UNITES_METRAGE[ligne.unite]}</td>
                        <td className="px-3 py-2 text-right">{formatMontant(ligne.prixUnitaire)}</td>
                        <td className="px-3 py-2 text-right font-medium">{formatMontant(ligne.montant)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span>Total HT</span>
                  <span>{formatMontant(selectedFacture.montantHT)}</span>
                </div>
                <div className="flex justify-between">
                  <span>TVA ({selectedFacture.tauxTva}%)</span>
                  <span>{formatMontant(selectedFacture.tva)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total TTC</span>
                  <span>{formatMontant(selectedFacture.montantTTC)}</span>
                </div>
              </div>

              {selectedFacture.commentaire && (
                <div className="bg-yellow-50 rounded-lg p-3 text-sm">
                  <strong>Commentaire:</strong> {selectedFacture.commentaire}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setSelectedFacture(null)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Fermer
                </button>
                {canValidate && selectedFacture.statut === 'soumis' && (
                  <>
                    <button
                      onClick={() => handleValider(selectedFacture, false)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Refuser
                    </button>
                    <button
                      onClick={() => handleValider(selectedFacture, true)}
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
