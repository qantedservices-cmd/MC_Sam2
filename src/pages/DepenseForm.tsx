import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { createDepense } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import HierarchicalCategorySelect from '../components/HierarchicalCategorySelect';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

export default function DepenseForm() {
  const { id: chantierId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState({
    description: '',
    montant: 0,
    date: new Date().toISOString().split('T')[0],
    categorieId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chantierId) return;

    if (!formData.categorieId) {
      setError('Veuillez sélectionner une catégorie');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createDepense({
        ...formData,
        chantierId
      });
      showSuccess('Dépense ajoutée avec succès');
      navigate(`/chantiers/${chantierId}`);
    } catch (err) {
      setError('Erreur lors de l\'enregistrement de la dépense');
      showError('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        to={`/chantiers/${chantierId}`}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Retour au chantier
      </Link>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Nouvelle dépense</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <input
              type="text"
              id="description"
              required
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: Achat carrelage salle de bain"
            />
          </div>

          <div>
            <label htmlFor="montant" className="block text-sm font-medium text-gray-700 mb-1">
              Montant (€) *
            </label>
            <input
              type="number"
              id="montant"
              required
              min="0.01"
              step="0.01"
              value={formData.montant}
              onChange={e => setFormData({ ...formData, montant: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie *
            </label>
            <HierarchicalCategorySelect
              value={formData.categorieId}
              onChange={(categorieId) => setFormData({ ...formData, categorieId })}
              required
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(`/chantiers/${chantierId}`)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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
