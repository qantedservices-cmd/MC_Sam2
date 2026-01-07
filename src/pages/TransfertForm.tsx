import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createTransfert } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { ArrowLeft, Save, Loader2, ArrowRightLeft } from 'lucide-react';
import type { DeviseType } from '../types';
import { DEVISES } from '../types';

export default function TransfertForm() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    source: '',
    destination: '',
    montant: 0,
    devise: 'DNT' as DeviseType,
    tauxChange: undefined as number | undefined,
    montantConverti: undefined as number | undefined,
    commentaire: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate converted amount when devise is not DNT
  const handleDeviseChange = (devise: DeviseType) => {
    setFormData(prev => {
      const newData = { ...prev, devise };
      if (devise === 'DNT') {
        newData.tauxChange = undefined;
        newData.montantConverti = undefined;
      } else if (prev.tauxChange && prev.montant) {
        newData.montantConverti = prev.montant * prev.tauxChange;
      }
      return newData;
    });
  };

  const handleTauxChange = (taux: number) => {
    setFormData(prev => ({
      ...prev,
      tauxChange: taux,
      montantConverti: prev.montant * taux
    }));
  };

  const handleMontantChange = (montant: number) => {
    setFormData(prev => ({
      ...prev,
      montant,
      montantConverti: prev.tauxChange ? montant * prev.tauxChange : undefined
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.source) {
      setError('Veuillez renseigner la source');
      return;
    }

    if (!formData.destination) {
      setError('Veuillez renseigner la destination');
      return;
    }

    if (formData.montant <= 0) {
      setError('Le montant doit etre superieur a 0');
      return;
    }

    if (formData.devise !== 'DNT' && !formData.tauxChange) {
      setError('Veuillez renseigner le taux de change');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createTransfert(formData);
      showSuccess('Transfert ajoute avec succes');
      navigate('/dashboard');
    } catch {
      setError('Erreur lors de l\'enregistrement du transfert');
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
          <ArrowRightLeft className="w-8 h-8 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-800">Nouveau Transfert de Budget</h1>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
                Qui donne le budget? *
              </label>
              <input
                type="text"
                id="source"
                required
                value={formData.source}
                onChange={e => setFormData({ ...formData, source: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Ex: Samir, Papa, Banque..."
              />
            </div>

            <div>
              <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">
                Vers qui? *
              </label>
              <input
                type="text"
                id="destination"
                required
                value={formData.destination}
                onChange={e => setFormData({ ...formData, destination: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Ex: Wissem, Caisse Chantier..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="montant" className="block text-sm font-medium text-gray-700 mb-1">
                Montant *
              </label>
              <input
                type="number"
                id="montant"
                required
                min="0.01"
                step="0.01"
                value={formData.montant}
                onChange={e => handleMontantChange(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label htmlFor="devise" className="block text-sm font-medium text-gray-700 mb-1">
                Devise *
              </label>
              <select
                id="devise"
                value={formData.devise}
                onChange={e => handleDeviseChange(e.target.value as DeviseType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {Object.entries(DEVISES).map(([value, label]) => (
                  <option key={value} value={value}>{label} ({value})</option>
                ))}
              </select>
            </div>
          </div>

          {formData.devise !== 'DNT' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-amber-800 mb-3">Conversion en DNT</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="tauxChange" className="block text-sm font-medium text-gray-700 mb-1">
                    Taux de change *
                  </label>
                  <input
                    type="number"
                    id="tauxChange"
                    required
                    min="0.01"
                    step="0.01"
                    value={formData.tauxChange || ''}
                    onChange={e => handleTauxChange(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Ex: 3.35"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    1 {formData.devise} = ? DNT
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Montant converti (DNT)
                  </label>
                  <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-medium">
                    {formData.montantConverti
                      ? new Intl.NumberFormat('fr-TN', {
                          style: 'currency',
                          currency: 'TND'
                        }).format(formData.montantConverti)
                      : '-'}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="commentaire" className="block text-sm font-medium text-gray-700 mb-1">
              Commentaire
            </label>
            <textarea
              id="commentaire"
              rows={3}
              value={formData.commentaire}
              onChange={e => setFormData({ ...formData, commentaire: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
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
