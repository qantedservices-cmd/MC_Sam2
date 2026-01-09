import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Edit2, Trash2, Loader2, Package,
  GripVertical, CheckCircle, XCircle
} from 'lucide-react';
import { getLotsTravaux, getChantier, createLotTravaux, updateLotTravaux, deleteLotTravaux } from '../services/api';
import type { LotTravaux, Chantier, UniteMetrage } from '../types';
import { UNITES_METRAGE, LOTS_DEFAUT } from '../types';
import { useToast } from '../contexts/ToastContext';
import { formatMontant } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';

export default function LotsPage() {
  const { id: chantierId } = useParams<{ id: string }>();
  const { hasPermission } = useAuth();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [chantier, setChantier] = useState<Chantier | null>(null);
  const [lots, setLots] = useState<LotTravaux[]>([]);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingLot, setEditingLot] = useState<LotTravaux | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    unite: 'm2' as UniteMetrage,
    quantitePrevue: 0,
    prixUnitaire: 0
  });
  const [saving, setSaving] = useState(false);

  const canEdit = hasPermission('canCreateDepense');

  const loadData = useCallback(async () => {
    if (!chantierId) return;

    try {
      setLoading(true);
      const [chantierData, lotsData] = await Promise.all([
        getChantier(chantierId),
        getLotsTravaux(chantierId)
      ]);

      setChantier(chantierData);
      setLots(lotsData);
    } catch {
      showError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [chantierId, showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenModal = (lot?: LotTravaux) => {
    if (lot) {
      setEditingLot(lot);
      setFormData({
        nom: lot.nom,
        description: lot.description || '',
        unite: lot.unite,
        quantitePrevue: lot.quantitePrevue,
        prixUnitaire: lot.prixUnitaire
      });
    } else {
      setEditingLot(null);
      setFormData({
        nom: '',
        description: '',
        unite: 'm2',
        quantitePrevue: 0,
        prixUnitaire: 0
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chantierId) return;

    setSaving(true);

    try {
      const montantPrevu = formData.quantitePrevue * formData.prixUnitaire;
      const data = {
        ...formData,
        chantierId,
        montantPrevu,
        ordre: editingLot?.ordre ?? lots.length,
        actif: editingLot?.actif ?? true,
        createdAt: editingLot?.createdAt || new Date().toISOString().split('T')[0]
      };

      if (editingLot) {
        await updateLotTravaux(editingLot.id, data);
        showSuccess('Lot modifie');
      } else {
        await createLotTravaux(data);
        showSuccess('Lot ajoute');
      }

      setShowModal(false);
      loadData();
    } catch {
      showError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (lot: LotTravaux) => {
    if (!confirm(`Supprimer le lot "${lot.nom}" ?`)) return;

    try {
      await deleteLotTravaux(lot.id);
      showSuccess('Lot supprime');
      loadData();
    } catch {
      showError('Erreur lors de la suppression');
    }
  };

  const handleToggleActif = async (lot: LotTravaux) => {
    try {
      await updateLotTravaux(lot.id, { actif: !lot.actif });
      showSuccess(lot.actif ? 'Lot desactive' : 'Lot active');
      loadData();
    } catch {
      showError('Erreur lors de la mise a jour');
    }
  };

  const handleAddDefaultLots = async () => {
    if (!chantierId) return;
    if (!confirm('Ajouter les lots par defaut ?')) return;

    try {
      setSaving(true);
      for (let i = 0; i < LOTS_DEFAUT.length; i++) {
        const lot = LOTS_DEFAUT[i];
        await createLotTravaux({
          chantierId,
          nom: lot.nom,
          unite: lot.unite,
          quantitePrevue: 0,
          prixUnitaire: 0,
          montantPrevu: 0,
          ordre: lots.length + i,
          actif: true,
          createdAt: new Date().toISOString().split('T')[0]
        });
      }
      showSuccess('Lots par defaut ajoutes');
      loadData();
    } catch {
      showError('Erreur lors de l\'ajout');
    } finally {
      setSaving(false);
    }
  };

  // Calculs
  const totalPrevu = lots.filter(l => l.actif).reduce((sum, l) => sum + l.montantPrevu, 0);

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
            <h1 className="text-2xl font-bold text-gray-800">Lots de travaux</h1>
            <p className="text-gray-500">{chantier.nom}</p>
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
            {lots.length === 0 && (
              <button
                onClick={handleAddDefaultLots}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Package className="w-5 h-5" />
                Lots par defaut
              </button>
            )}
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nouveau lot
            </button>
          </div>
        )}
      </div>

      {/* Resume */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Nombre de lots</p>
          <p className="text-2xl font-bold text-gray-800">{lots.filter(l => l.actif).length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Montant total prevu</p>
          <p className="text-2xl font-bold text-blue-600">{formatMontant(totalPrevu)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Budget chantier</p>
          <p className="text-2xl font-bold text-gray-800">{formatMontant(chantier.budgetPrevisionnel)}</p>
        </div>
      </div>

      {/* Liste des lots */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Lot</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Unite</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Qte prevue</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Prix unit.</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Montant</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Statut</th>
                {canEdit && <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {lots.map(lot => (
                <tr key={lot.id} className={`hover:bg-gray-50 ${!lot.actif ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-gray-300" />
                      <div>
                        <p className="font-medium text-gray-800">{lot.nom}</p>
                        {lot.description && (
                          <p className="text-xs text-gray-500">{lot.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-sm">{UNITES_METRAGE[lot.unite]}</td>
                  <td className="px-4 py-3 text-right text-sm">{lot.quantitePrevue}</td>
                  <td className="px-4 py-3 text-right text-sm">{formatMontant(lot.prixUnitaire)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatMontant(lot.montantPrevu)}</td>
                  <td className="px-4 py-3 text-center">
                    {lot.actif ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                        <CheckCircle className="w-3 h-3" /> Actif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs">
                        <XCircle className="w-3 h-3" /> Inactif
                      </span>
                    )}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleToggleActif(lot)}
                          className={`p-1.5 rounded transition-colors ${
                            lot.actif
                              ? 'text-orange-600 hover:bg-orange-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={lot.actif ? 'Desactiver' : 'Activer'}
                        >
                          {lot.actif ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleOpenModal(lot)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(lot)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {lots.length === 0 && (
                <tr>
                  <td colSpan={canEdit ? 7 : 6} className="px-4 py-8 text-center text-gray-500">
                    Aucun lot. Ajoutez des lots pour commencer.
                  </td>
                </tr>
              )}
            </tbody>
            {lots.length > 0 && (
              <tfoot className="bg-gray-50 font-semibold">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-right">Total</td>
                  <td className="px-4 py-3 text-right">{formatMontant(totalPrevu)}</td>
                  <td colSpan={canEdit ? 2 : 1}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                {editingLot ? 'Modifier lot' : 'Nouveau lot'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du lot *</label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={e => setFormData({ ...formData, nom: e.target.value })}
                  required
                  placeholder="Ex: Fondations"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description optionnelle"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unite *</label>
                  <select
                    value={formData.unite}
                    onChange={e => setFormData({ ...formData, unite: e.target.value as UniteMetrage })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(UNITES_METRAGE).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qte prevue</label>
                  <input
                    type="number"
                    value={formData.quantitePrevue}
                    onChange={e => setFormData({ ...formData, quantitePrevue: Number(e.target.value) })}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix unit.</label>
                  <input
                    type="number"
                    value={formData.prixUnitaire}
                    onChange={e => setFormData({ ...formData, prixUnitaire: Number(e.target.value) })}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">
                  Montant prevu: <span className="font-semibold text-gray-800">
                    {formatMontant(formData.quantitePrevue * formData.prixUnitaire)}
                  </span>
                </p>
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
                  {editingLot ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
