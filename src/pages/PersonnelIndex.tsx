import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Plus, Search, Edit2, Trash2, Phone, Briefcase,
  Calendar, DollarSign, Loader2, UserCheck, UserX, Clock
} from 'lucide-react';
import { getEmployes, getChantiers, deleteEmploye, createEmploye, updateEmploye } from '../services/api';
import type { Employe, Chantier, TypeContrat, StatutEmploye } from '../types';
import { TYPES_CONTRAT, STATUTS_EMPLOYE } from '../types';
import { useToast } from '../contexts/ToastContext';
import { formatMontant } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';

export default function PersonnelIndex() {
  const { hasPermission } = useAuth();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState<StatutEmploye | 'all'>('all');
  const [filterChantier, setFilterChantier] = useState<string>('all');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingEmploye, setEditingEmploye] = useState<Employe | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    poste: '',
    typeContrat: 'journalier' as TypeContrat,
    tauxJournalier: 0,
    tauxHeuresSupp: 0,
    chantierIds: [] as string[],
    statut: 'actif' as StatutEmploye,
    dateEmbauche: new Date().toISOString().split('T')[0],
    dateFin: '',
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  const canEdit = hasPermission('canViewCoutsInternes');

  const loadData = useCallback(async () => {
    try {
      const [employesData, chantiersData] = await Promise.all([
        getEmployes(),
        getChantiers()
      ]);
      setEmployes(employesData);
      setChantiers(chantiersData);
    } catch {
      showError('Erreur lors du chargement des donnees');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredEmployes = employes.filter(e => {
    const matchSearch = search === '' ||
      e.nom.toLowerCase().includes(search.toLowerCase()) ||
      e.prenom.toLowerCase().includes(search.toLowerCase()) ||
      e.poste.toLowerCase().includes(search.toLowerCase());
    const matchStatut = filterStatut === 'all' || e.statut === filterStatut;
    const matchChantier = filterChantier === 'all' || e.chantierIds.includes(filterChantier);
    return matchSearch && matchStatut && matchChantier;
  });

  const handleOpenModal = (employe?: Employe) => {
    if (employe) {
      setEditingEmploye(employe);
      setFormData({
        nom: employe.nom,
        prenom: employe.prenom,
        telephone: employe.telephone || '',
        poste: employe.poste,
        typeContrat: employe.typeContrat,
        tauxJournalier: employe.tauxJournalier,
        tauxHeuresSupp: employe.tauxHeuresSupp || 0,
        chantierIds: employe.chantierIds,
        statut: employe.statut,
        dateEmbauche: employe.dateEmbauche,
        dateFin: employe.dateFin || '',
        notes: employe.notes || ''
      });
    } else {
      setEditingEmploye(null);
      setFormData({
        nom: '',
        prenom: '',
        telephone: '',
        poste: '',
        typeContrat: 'journalier',
        tauxJournalier: 0,
        tauxHeuresSupp: 0,
        chantierIds: [],
        statut: 'actif',
        dateEmbauche: new Date().toISOString().split('T')[0],
        dateFin: '',
        notes: ''
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
        telephone: formData.telephone || undefined,
        tauxHeuresSupp: formData.tauxHeuresSupp || undefined,
        dateFin: formData.dateFin || undefined,
        notes: formData.notes || undefined,
        createdAt: editingEmploye?.createdAt || new Date().toISOString().split('T')[0]
      };

      if (editingEmploye) {
        await updateEmploye(editingEmploye.id, data);
        showSuccess('Employe modifie');
      } else {
        await createEmploye(data);
        showSuccess('Employe ajoute');
      }

      setShowModal(false);
      loadData();
    } catch {
      showError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (employe: Employe) => {
    if (!confirm(`Supprimer ${employe.prenom} ${employe.nom} ?`)) return;

    try {
      await deleteEmploye(employe.id);
      showSuccess('Employe supprime');
      loadData();
    } catch {
      showError('Erreur lors de la suppression');
    }
  };

  const getChantierNames = (ids: string[]) => {
    return ids
      .map(id => chantiers.find(c => c.id === id)?.nom)
      .filter(Boolean)
      .join(', ') || 'Aucun';
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
          <h1 className="text-2xl font-bold text-gray-800">Personnel</h1>
          <p className="text-gray-500">{employes.length} employe(s)</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/personnel/pointage"
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
            value={filterStatut}
            onChange={e => setFilterStatut(e.target.value as StatutEmploye | 'all')}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous statuts</option>
            {Object.entries(STATUTS_EMPLOYE).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            value={filterChantier}
            onChange={e => setFilterChantier(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous chantiers</option>
            {chantiers.map(c => (
              <option key={c.id} value={c.id}>{c.nom}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Liste */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployes.map(employe => (
          <div key={employe.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  employe.statut === 'actif' ? 'bg-green-100' :
                  employe.statut === 'conge' ? 'bg-yellow-100' : 'bg-gray-100'
                }`}>
                  {employe.statut === 'actif' ? (
                    <UserCheck className="w-6 h-6 text-green-600" />
                  ) : employe.statut === 'conge' ? (
                    <Calendar className="w-6 h-6 text-yellow-600" />
                  ) : (
                    <UserX className="w-6 h-6 text-gray-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{employe.prenom} {employe.nom}</h3>
                  <p className="text-sm text-gray-500">{employe.poste}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                employe.statut === 'actif' ? 'bg-green-100 text-green-700' :
                employe.statut === 'conge' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {STATUTS_EMPLOYE[employe.statut]}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              {employe.telephone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{employe.telephone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <Briefcase className="w-4 h-4" />
                <span>{TYPES_CONTRAT[employe.typeContrat]}</span>
              </div>
              {canEdit && (
                <div className="flex items-center gap-2 text-gray-600">
                  <DollarSign className="w-4 h-4" />
                  <span>{formatMontant(employe.tauxJournalier)} / jour</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-4 h-4" />
                <span className="truncate">{getChantierNames(employe.chantierIds)}</span>
              </div>
            </div>

            {canEdit && (
              <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t">
                <button
                  onClick={() => handleOpenModal(employe)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(employe)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredEmployes.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucun employe trouve</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                {editingEmploye ? 'Modifier employe' : 'Nouvel employe'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prenom *</label>
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={e => setFormData({ ...formData, prenom: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={e => setFormData({ ...formData, nom: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telephone</label>
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={e => setFormData({ ...formData, telephone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Poste *</label>
                  <input
                    type="text"
                    value={formData.poste}
                    onChange={e => setFormData({ ...formData, poste: e.target.value })}
                    required
                    placeholder="Ex: Macon, Chef d'equipe..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type de contrat *</label>
                  <select
                    value={formData.typeContrat}
                    onChange={e => setFormData({ ...formData, typeContrat: e.target.value as TypeContrat })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(TYPES_CONTRAT).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Statut *</label>
                  <select
                    value={formData.statut}
                    onChange={e => setFormData({ ...formData, statut: e.target.value as StatutEmploye })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(STATUTS_EMPLOYE).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Taux journalier (DNT) *</label>
                  <input
                    type="number"
                    value={formData.tauxJournalier}
                    onChange={e => setFormData({ ...formData, tauxJournalier: Number(e.target.value) })}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Taux heures supp (DNT/h)</label>
                  <input
                    type="number"
                    value={formData.tauxHeuresSupp}
                    onChange={e => setFormData({ ...formData, tauxHeuresSupp: Number(e.target.value) })}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date d'embauche *</label>
                  <input
                    type="date"
                    value={formData.dateEmbauche}
                    onChange={e => setFormData({ ...formData, dateEmbauche: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                  <input
                    type="date"
                    value={formData.dateFin}
                    onChange={e => setFormData({ ...formData, dateFin: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chantiers assignes</label>
                <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                  {chantiers.map(chantier => (
                    <label key={chantier.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.chantierIds.includes(chantier.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setFormData({ ...formData, chantierIds: [...formData.chantierIds, chantier.id] });
                          } else {
                            setFormData({ ...formData, chantierIds: formData.chantierIds.filter(id => id !== chantier.id) });
                          }
                        }}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{chantier.nom}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
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
                  {editingEmploye ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
