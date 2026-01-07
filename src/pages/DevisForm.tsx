import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createDevis, getChantiers } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import HierarchicalCategorySelect from '../components/HierarchicalCategorySelect';
import { ArrowLeft, Save, Loader2, FileText } from 'lucide-react';
import type { Chantier, StatutDevis } from '../types';
import { STATUTS_DEVIS } from '../types';

export default function DevisForm() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [formData, setFormData] = useState({
    chantierId: '',
    categorieId: '',
    montant: 0,
    date: new Date().toISOString().split('T')[0],
    fournisseur: '',
    description: '',
    commentaire: '',
    statut: 'en_attente' as StatutDevis
  });
  const [loading, setLoading] = useState(false);
  const [loadingChantiers, setLoadingChantiers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadChantiers() {
      try {
        const data = await getChantiers();
        setChantiers(data);
      } catch {
        showError('Erreur lors du chargement des chantiers');
      } finally {
        setLoadingChantiers(false);
      }
    }
    loadChantiers();
  }, [showError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.chantierId) {
      setError('Veuillez selectionner un chantier');
      return;
    }

    if (!formData.categorieId) {
      setError('Veuillez selectionner une categorie');
      return;
    }

    if (!formData.fournisseur) {
      setError('Veuillez renseigner le fournisseur');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createDevis(formData);
      showSuccess('Devis ajoute avec succes');
      navigate('/dashboard');
    } catch {
      setError('Erreur lors de l\'enregistrement du devis');
      showError('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        to="/dashboard"
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Retour au dashboard
      </Link>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-8 h-8 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-800">Nouveau Devis</h1>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="chantierId" className="block text-sm font-medium text-gray-700 mb-1">
              Chantier *
            </label>
            {loadingChantiers ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Chargement...
              </div>
            ) : (
              <select
                id="chantierId"
                required
                value={formData.chantierId}
                onChange={e => setFormData({ ...formData, chantierId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Selectionner un chantier</option>
                {chantiers.map(c => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categorie/Lot *
            </label>
            <HierarchicalCategorySelect
              value={formData.categorieId}
              onChange={(categorieId) => setFormData({ ...formData, categorieId })}
              required
            />
          </div>

          <div>
            <label htmlFor="fournisseur" className="block text-sm font-medium text-gray-700 mb-1">
              Fournisseur *
            </label>
            <input
              type="text"
              id="fournisseur"
              required
              value={formData.fournisseur}
              onChange={e => setFormData({ ...formData, fournisseur: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Nom - Prenom - Societe"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="montant" className="block text-sm font-medium text-gray-700 mb-1">
                Montant (DNT) *
              </label>
              <input
                type="number"
                id="montant"
                required
                min="0.01"
                step="0.01"
                value={formData.montant}
                onChange={e => setFormData({ ...formData, montant: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                id="date"
                required
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="statut" className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              id="statut"
              value={formData.statut}
              onChange={e => setFormData({ ...formData, statut: e.target.value as StatutDevis })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {Object.entries(STATUTS_DEVIS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              id="description"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Details supplementaires..."
            />
          </div>

          <div>
            <label htmlFor="commentaire" className="block text-sm font-medium text-gray-700 mb-1">
              Commentaire
            </label>
            <textarea
              id="commentaire"
              rows={3}
              value={formData.commentaire}
              onChange={e => setFormData({ ...formData, commentaire: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Notes ou remarques..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
