import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Edit2, Trash2, Loader2, CheckCircle,
  Clock, Circle, GripVertical, ChevronRight
} from 'lucide-react';
import { getTaches, getChantier, createTache, updateTache, deleteTache, getCategories } from '../services/api';
import type { Tache, Chantier, StatutTache, Categorie } from '../types';
import { useToast } from '../contexts/ToastContext';
import { formatMontant } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';

const COLONNES: { statut: StatutTache; label: string; color: string; icon: React.ElementType }[] = [
  { statut: 'a_faire', label: 'A faire', color: 'bg-gray-100', icon: Circle },
  { statut: 'en_cours', label: 'En cours', color: 'bg-blue-100', icon: Clock },
  { statut: 'termine', label: 'Termine', color: 'bg-green-100', icon: CheckCircle },
];

export default function TachesPage() {
  const { id: chantierId } = useParams<{ id: string }>();
  const { hasPermission } = useAuth();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [chantier, setChantier] = useState<Chantier | null>(null);
  const [taches, setTaches] = useState<Tache[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingTache, setEditingTache] = useState<Tache | null>(null);
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    categorieId: '',
    quantitePrevue: 0,
    unite: '',
    prixUnitaire: 0,
    dateDebut: '',
    dateFin: ''
  });
  const [saving, setSaving] = useState(false);

  const canEdit = hasPermission('canSaisieProduction');

  const loadData = useCallback(async () => {
    if (!chantierId) return;

    try {
      setLoading(true);
      const [chantierData, tachesData, categoriesData] = await Promise.all([
        getChantier(chantierId),
        getTaches(chantierId),
        getCategories()
      ]);

      setChantier(chantierData);
      setTaches(tachesData.sort((a, b) => a.ordre - b.ordre));
      setCategories(categoriesData);
    } catch {
      showError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [chantierId, showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getTachesByStatut = (statut: StatutTache) => {
    return taches.filter(t => t.statut === statut);
  };

  const handleOpenModal = (tache?: Tache) => {
    if (tache) {
      setEditingTache(tache);
      setFormData({
        titre: tache.titre,
        description: tache.description || '',
        categorieId: tache.categorieId || '',
        quantitePrevue: tache.quantitePrevue || 0,
        unite: tache.unite || '',
        prixUnitaire: tache.prixUnitaire || 0,
        dateDebut: tache.dateDebut || '',
        dateFin: tache.dateFin || ''
      });
    } else {
      setEditingTache(null);
      setFormData({
        titre: '',
        description: '',
        categorieId: '',
        quantitePrevue: 0,
        unite: '',
        prixUnitaire: 0,
        dateDebut: '',
        dateFin: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chantierId) return;

    setSaving(true);

    try {
      const data = {
        ...formData,
        chantierId,
        description: formData.description || undefined,
        categorieId: formData.categorieId || undefined,
        quantitePrevue: formData.quantitePrevue || undefined,
        unite: formData.unite || undefined,
        prixUnitaire: formData.prixUnitaire || undefined,
        dateDebut: formData.dateDebut || undefined,
        dateFin: formData.dateFin || undefined,
        ordre: editingTache?.ordre ?? taches.length,
        statut: editingTache?.statut ?? 'a_faire' as StatutTache,
        createdAt: editingTache?.createdAt || new Date().toISOString().split('T')[0]
      };

      if (editingTache) {
        await updateTache(editingTache.id, data);
        showSuccess('Tache modifiee');
      } else {
        await createTache(data);
        showSuccess('Tache ajoutee');
      }

      setShowModal(false);
      loadData();
    } catch {
      showError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tache: Tache) => {
    if (!confirm(`Supprimer "${tache.titre}" ?`)) return;

    try {
      await deleteTache(tache.id);
      showSuccess('Tache supprimee');
      loadData();
    } catch {
      showError('Erreur lors de la suppression');
    }
  };

  const handleChangeStatut = async (tache: Tache, newStatut: StatutTache) => {
    try {
      await updateTache(tache.id, { statut: newStatut });
      showSuccess('Statut mis a jour');
      loadData();
    } catch {
      showError('Erreur lors de la mise a jour');
    }
  };

  const getCategorieNom = (categorieId?: string) => {
    if (!categorieId) return '';
    const cat = categories.find(c => c.id === categorieId);
    return cat?.nom || '';
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
            <h1 className="text-2xl font-bold text-gray-800">Taches</h1>
            <p className="text-gray-500">{chantier.nom}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/chantiers/${chantierId}/production`}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Clock className="w-5 h-5" />
            <span className="hidden sm:inline">Saisie production</span>
          </Link>
          {canEdit && (
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Nouvelle tache</span>
            </button>
          )}
        </div>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLONNES.map(colonne => (
          <div key={colonne.statut} className={`rounded-lg ${colonne.color} p-4`}>
            <div className="flex items-center gap-2 mb-4">
              <colonne.icon className="w-5 h-5" />
              <h3 className="font-semibold">{colonne.label}</h3>
              <span className="ml-auto bg-white/50 px-2 py-0.5 rounded-full text-sm">
                {getTachesByStatut(colonne.statut).length}
              </span>
            </div>

            <div className="space-y-3">
              {getTachesByStatut(colonne.statut).map(tache => (
                <div
                  key={tache.id}
                  className="bg-white rounded-lg shadow p-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-2">
                    <GripVertical className="w-4 h-4 text-gray-300 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-800 truncate">{tache.titre}</h4>
                      {tache.description && (
                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">{tache.description}</p>
                      )}
                      {getCategorieNom(tache.categorieId) && (
                        <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                          {getCategorieNom(tache.categorieId)}
                        </span>
                      )}
                      {tache.quantitePrevue && (
                        <div className="mt-2 text-xs text-gray-500">
                          {tache.quantitePrevue} {tache.unite}
                          {tache.prixUnitaire && ` - ${formatMontant(tache.quantitePrevue * tache.prixUnitaire)}`}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <div className="flex items-center gap-1">
                      {colonne.statut !== 'a_faire' && (
                        <button
                          onClick={() => handleChangeStatut(tache, colonne.statut === 'en_cours' ? 'a_faire' : 'en_cours')}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                          title="Reculer"
                        >
                          <ChevronRight className="w-4 h-4 rotate-180" />
                        </button>
                      )}
                      {colonne.statut !== 'termine' && (
                        <button
                          onClick={() => handleChangeStatut(tache, colonne.statut === 'a_faire' ? 'en_cours' : 'termine')}
                          className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                          title="Avancer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {canEdit && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenModal(tache)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(tache)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {getTachesByStatut(colonne.statut).length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Aucune tache
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                {editingTache ? 'Modifier tache' : 'Nouvelle tache'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                <input
                  type="text"
                  value={formData.titre}
                  onChange={e => setFormData({ ...formData, titre: e.target.value })}
                  required
                  placeholder="Ex: Coulage dalle RDC"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categorie</label>
                <select
                  value={formData.categorieId}
                  onChange={e => setFormData({ ...formData, categorieId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sans categorie</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nom}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantite prevue</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unite</label>
                  <input
                    type="text"
                    value={formData.unite}
                    onChange={e => setFormData({ ...formData, unite: e.target.value })}
                    placeholder="m2, ml, u..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix unitaire</label>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date debut</label>
                  <input
                    type="date"
                    value={formData.dateDebut}
                    onChange={e => setFormData({ ...formData, dateDebut: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
                  <input
                    type="date"
                    value={formData.dateFin}
                    onChange={e => setFormData({ ...formData, dateFin: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
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
                  {editingTache ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
