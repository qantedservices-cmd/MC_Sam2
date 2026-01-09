import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Loader2, Trash2, CreditCard, Banknote,
  TrendingUp, AlertCircle
} from 'lucide-react';
import {
  getPaiementsClient, getChantier, getFacturations, createPaiementClient,
  deletePaiementClient, calculerSituationFinanciere
} from '../services/api';
import type { PaiementClient, Chantier, Facturation, ModePaiement } from '../types';
import { MODES_PAIEMENT } from '../types';
import { useToast } from '../contexts/ToastContext';
import { formatMontant, formatDate } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';

export default function PaiementsClientPage() {
  const { id: chantierId } = useParams<{ id: string }>();
  const { hasPermission } = useAuth();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [chantier, setChantier] = useState<Chantier | null>(null);
  const [paiements, setPaiements] = useState<PaiementClient[]>([]);
  const [factures, setFactures] = useState<Facturation[]>([]);
  const [situation, setSituation] = useState<{
    budgetPrevu: number;
    montantFacture: number;
    montantPaye: number;
    resteAPayer: number;
  } | null>(null);

  // Modal creation
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    montant: '',
    modePaiement: 'virement' as ModePaiement,
    facturationId: '',
    reference: '',
    commentaire: ''
  });

  const canCreate = hasPermission('canCreateFacture');

  const loadData = useCallback(async () => {
    if (!chantierId) return;

    try {
      setLoading(true);
      const [chantierData, paiementsData, facturesData, situationData] = await Promise.all([
        getChantier(chantierId),
        getPaiementsClient(chantierId),
        getFacturations(chantierId),
        calculerSituationFinanciere(chantierId)
      ]);

      setChantier(chantierData);
      setPaiements(paiementsData.sort((a, b) => b.date.localeCompare(a.date)));
      setFactures(facturesData.filter(f => f.statut === 'valide' || f.statut === 'paye'));
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

  const totalPaye = useMemo(() =>
    paiements.reduce((sum, p) => sum + p.montant, 0),
    [paiements]
  );

  const handleCreate = async () => {
    if (!chantierId || !formData.montant || parseFloat(formData.montant) <= 0) {
      showError('Veuillez entrer un montant valide');
      return;
    }

    setSaving(true);
    try {
      await createPaiementClient({
        chantierId,
        date: formData.date,
        montant: parseFloat(formData.montant),
        modePaiement: formData.modePaiement,
        facturationId: formData.facturationId || undefined,
        reference: formData.reference || undefined,
        commentaire: formData.commentaire || undefined,
        createdAt: new Date().toISOString()
      });

      showSuccess('Paiement enregistre');
      setShowModal(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        montant: '',
        modePaiement: 'virement',
        facturationId: '',
        reference: '',
        commentaire: ''
      });
      loadData();
    } catch {
      showError('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce paiement ?')) return;
    try {
      await deletePaiementClient(id);
      showSuccess('Paiement supprime');
      loadData();
    } catch {
      showError('Erreur lors de la suppression');
    }
  };

  const getFactureLabel = (facturationId: string) => {
    const facture = factures.find(f => f.id === facturationId);
    return facture ? `${facture.numero} - ${formatMontant(facture.montantTTC)}` : 'Facture inconnue';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={`/chantiers/${chantierId}`} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Paiements Client</h1>
            <p className="text-gray-500">{chantier.nom}</p>
          </div>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nouveau paiement
          </button>
        )}
      </div>

      {/* Situation financiere */}
      {situation && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Facture</span>
            </div>
            <p className="text-xl font-bold text-gray-800">{formatMontant(situation.montantFacture)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <Banknote className="w-4 h-4" />
              <span className="text-sm">Paye</span>
            </div>
            <p className="text-xl font-bold text-green-600">{formatMontant(situation.montantPaye)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-orange-600 mb-1">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Reste a payer</span>
            </div>
            <p className="text-xl font-bold text-orange-600">{formatMontant(situation.resteAPayer)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <CreditCard className="w-4 h-4" />
              <span className="text-sm">Taux encaissement</span>
            </div>
            <p className="text-xl font-bold text-blue-600">
              {situation.montantFacture > 0
                ? `${((situation.montantPaye / situation.montantFacture) * 100).toFixed(1)}%`
                : '0%'}
            </p>
          </div>
        </div>
      )}

      {/* Liste des paiements */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-800">Historique des paiements ({paiements.length})</h2>
        </div>

        {paiements.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Banknote className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucun paiement enregistre</p>
          </div>
        ) : (
          <div className="divide-y">
            {paiements.map(paiement => (
              <div key={paiement.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Banknote className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-green-600">
                        +{formatMontant(paiement.montant)}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                        {MODES_PAIEMENT[paiement.modePaiement]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {formatDate(paiement.date)}
                      {paiement.reference && ` - Ref: ${paiement.reference}`}
                    </p>
                    {paiement.facturationId && (
                      <p className="text-xs text-gray-400">
                        Facture: {getFactureLabel(paiement.facturationId)}
                      </p>
                    )}
                  </div>
                </div>

                {canCreate && (
                  <button
                    onClick={() => handleDelete(paiement.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Supprimer"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {paiements.length > 0 && (
          <div className="p-4 border-t bg-gray-50">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Total encaisse</span>
              <span className="text-xl font-bold text-green-600">{formatMontant(totalPaye)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Modal creation */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">Nouveau paiement</h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Date et Montant */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montant</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.montant}
                    onChange={e => setFormData(p => ({ ...p, montant: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Mode de paiement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mode de paiement</label>
                <select
                  value={formData.modePaiement}
                  onChange={e => setFormData(p => ({ ...p, modePaiement: e.target.value as ModePaiement }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  {Object.entries(MODES_PAIEMENT).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Facture liee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Facture (optionnel)</label>
                <select
                  value={formData.facturationId}
                  onChange={e => setFormData(p => ({ ...p, facturationId: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">-- Aucune --</option>
                  {factures.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.numero} - {formatMontant(f.montantTTC)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference (optionnel)</label>
                <input
                  type="text"
                  value={formData.reference}
                  onChange={e => setFormData(p => ({ ...p, reference: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="N de cheque, reference virement..."
                />
              </div>

              {/* Commentaire */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire</label>
                <textarea
                  value={formData.commentaire}
                  onChange={e => setFormData(p => ({ ...p, commentaire: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
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
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
