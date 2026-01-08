import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, Plus, Search, Edit2, Trash2, Truck, Loader2,
  Wrench, Clock, CheckCircle, XCircle
} from 'lucide-react';
import { getMateriels, deleteMateriel, createMateriel, updateMateriel } from '../services/api';
import type { Materiel, MaterielType, ProprietaireMateriel } from '../types';
import { TYPES_MATERIEL, PROPRIETAIRES_MATERIEL } from '../types';
import { useToast } from '../contexts/ToastContext';
import { formatMontant } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';

export default function MaterielIndex() {
  const { hasPermission } = useAuth();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [materiels, setMateriels] = useState<Materiel[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<MaterielType | 'all'>('all');
  const [filterProprietaire, setFilterProprietaire] = useState<ProprietaireMateriel | 'all'>('all');
  const [filterActif, setFilterActif] = useState<'all' | 'actif' | 'inactif'>('all');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingMateriel, setEditingMateriel] = useState<Materiel | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    type: 'outillage' as MaterielType,
    proprietaire: 'entreprise' as ProprietaireMateriel,
    coutJournalier: 0,
    immatriculation: '',
    description: '',
    actif: true
  });
  const [saving, setSaving] = useState(false);

  const canEdit = hasPermission('canViewCoutsInternes');

  const loadData = useCallback(async () => {
    try {
      const data = await getMateriels();
      setMateriels(data);
    } catch {
      showError('Erreur lors du chargement du materiel');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredMateriels = materiels.filter(m => {
    const matchSearch = search === '' ||
      m.nom.toLowerCase().includes(search.toLowerCase()) ||
      (m.immatriculation && m.immatriculation.toLowerCase().includes(search.toLowerCase()));
    const matchType = filterType === 'all' || m.type === filterType;
    const matchProprietaire = filterProprietaire === 'all' || m.proprietaire === filterProprietaire;
    const matchActif = filterActif === 'all' ||
      (filterActif === 'actif' && m.actif) ||
      (filterActif === 'inactif' && !m.actif);
    return matchSearch && matchType && matchProprietaire && matchActif;
  });

  const handleOpenModal = (materiel?: Materiel) => {
    if (materiel) {
      setEditingMateriel(materiel);
      setFormData({
        nom: materiel.nom,
        type: materiel.type,
        proprietaire: materiel.proprietaire,
        coutJournalier: materiel.coutJournalier || 0,
        immatriculation: materiel.immatriculation || '',
        description: materiel.description || '',
        actif: materiel.actif
      });
    } else {
      setEditingMateriel(null);
      setFormData({
        nom: '',
        type: 'outillage',
        proprietaire: 'entreprise',
        coutJournalier: 0,
        immatriculation: '',
        description: '',
        actif: true
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
        ...formData,
        coutJournalier: formData.coutJournalier || undefined,
        immatriculation: formData.immatriculation || undefined,
        description: formData.description || undefined,
        createdAt: editingMateriel?.createdAt || new Date().toISOString().split('T')[0]
      };

      if (editingMateriel) {
        await updateMateriel(editingMateriel.id, data);
        showSuccess('Materiel modifie');
      } else {
        await createMateriel(data);
        showSuccess('Materiel ajoute');
      }

      setShowModal(false);
      loadData();
    } catch {
      showError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (materiel: Materiel) => {
    if (!confirm(`Supprimer "${materiel.nom}" ?`)) return;

    try {
      await deleteMateriel(materiel.id);
      showSuccess('Materiel supprime');
      loadData();
    } catch {
      showError('Erreur lors de la suppression');
    }
  };

  const getTypeIcon = (type: MaterielType) => {
    switch (type) {
      case 'vehicule_utilitaire':
      case 'camion':
        return <Truck className="w-5 h-5" />;
      default:
        return <Wrench className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: MaterielType) => {
    switch (type) {
      case 'vehicule_utilitaire':
      case 'camion':
        return 'bg-blue-100 text-blue-600';
      case 'betonniere':
      case 'grue':
        return 'bg-orange-100 text-orange-600';
      case 'echafaudage':
        return 'bg-yellow-100 text-yellow-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Materiel</h1>
          <p className="text-gray-500">{materiels.length} equipement(s)</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/materiel/utilisation"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Clock className="w-5 h-5" />
            <span className="hidden sm:inline">Pointage</span>
          </Link>
          {canEdit && (
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Ajouter</span>
            </button>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as MaterielType | 'all')}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous types</option>
            {Object.entries(TYPES_MATERIEL).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            value={filterProprietaire}
            onChange={e => setFilterProprietaire(e.target.value as ProprietaireMateriel | 'all')}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous proprietaires</option>
            {Object.entries(PROPRIETAIRES_MATERIEL).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            value={filterActif}
            onChange={e => setFilterActif(e.target.value as 'all' | 'actif' | 'inactif')}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous</option>
            <option value="actif">Actifs</option>
            <option value="inactif">Inactifs</option>
          </select>
        </div>
      </div>

      {/* Liste */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMateriels.map(materiel => (
          <div key={materiel.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getTypeColor(materiel.type)}`}>
                  {getTypeIcon(materiel.type)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{materiel.nom}</h3>
                  <p className="text-sm text-gray-500">{TYPES_MATERIEL[materiel.type]}</p>
                </div>
              </div>
              <span className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                materiel.actif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {materiel.actif ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {materiel.actif ? 'Actif' : 'Inactif'}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-gray-600">
                <span>Proprietaire:</span>
                <span className="font-medium">{PROPRIETAIRES_MATERIEL[materiel.proprietaire]}</span>
              </div>
              {materiel.immatriculation && (
                <div className="flex items-center justify-between text-gray-600">
                  <span>Immatriculation:</span>
                  <span className="font-medium">{materiel.immatriculation}</span>
                </div>
              )}
              {materiel.coutJournalier && canEdit && (
                <div className="flex items-center justify-between text-gray-600">
                  <span>Cout/jour:</span>
                  <span className="font-medium">{formatMontant(materiel.coutJournalier)}</span>
                </div>
              )}
              {materiel.description && (
                <p className="text-gray-500 text-xs mt-2 line-clamp-2">{materiel.description}</p>
              )}
            </div>

            {canEdit && (
              <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t">
                <button
                  onClick={() => handleOpenModal(materiel)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(materiel)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredMateriels.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucun materiel trouve</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                {editingMateriel ? 'Modifier materiel' : 'Nouveau materiel'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={e => setFormData({ ...formData, nom: e.target.value })}
                  required
                  placeholder="Ex: Betonniere 350L, Camion Iveco..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as MaterielType })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(TYPES_MATERIEL).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proprietaire *</label>
                  <select
                    value={formData.proprietaire}
                    onChange={e => setFormData({ ...formData, proprietaire: e.target.value as ProprietaireMateriel })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(PROPRIETAIRES_MATERIEL).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Immatriculation</label>
                  <input
                    type="text"
                    value={formData.immatriculation}
                    onChange={e => setFormData({ ...formData, immatriculation: e.target.value })}
                    placeholder="Ex: 123 TUN 456"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cout journalier (DNT)</label>
                  <input
                    type="number"
                    value={formData.coutJournalier}
                    onChange={e => setFormData({ ...formData, coutJournalier: Number(e.target.value) })}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="actif"
                  checked={formData.actif}
                  onChange={e => setFormData({ ...formData, actif: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="actif" className="text-sm text-gray-700">Materiel actif</label>
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
                  {editingMateriel ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
