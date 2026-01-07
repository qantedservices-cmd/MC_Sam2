import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getChantier, createChantier, updateChantier,
  getClients, getMoas, getMoes, getEntreprises
} from '../services/api';
import type { Chantier, Client, MOA, MOE, Entreprise, DeviseType } from '../types';
import { DEVISES } from '../types';
import { useToast } from '../contexts/ToastContext';
import Loading from '../components/Loading';
import ActorSelector from '../components/ActorSelector';
import ActorSelectorMultiple from '../components/ActorSelectorMultiple';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

export default function ChantierForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    nom: '',
    adresse: '',
    budgetPrevisionnel: 0,
    statut: 'en_cours' as Chantier['statut'],
    devise: 'EUR' as DeviseType,
    clientId: null as string | null,
    moaId: null as string | null,
    moeId: null as string | null,
    entrepriseIds: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Actors data
  const [clients, setClients] = useState<Client[]>([]);
  const [moas, setMoas] = useState<MOA[]>([]);
  const [moes, setMoes] = useState<MOE[]>([]);
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load actors data
        const [clientsData, moasData, moesData, entreprisesData] = await Promise.all([
          getClients(),
          getMoas(),
          getMoes(),
          getEntreprises()
        ]);
        setClients(clientsData);
        setMoas(moasData);
        setMoes(moesData);
        setEntreprises(entreprisesData);

        // Load chantier if editing
        if (id) {
          const chantier = await getChantier(id);
          setFormData({
            nom: chantier.nom,
            adresse: chantier.adresse,
            budgetPrevisionnel: chantier.budgetPrevisionnel,
            statut: chantier.statut,
            devise: chantier.devise || 'EUR',
            clientId: chantier.clientId || null,
            moaId: chantier.moaId || null,
            moeId: chantier.moeId || null,
            entrepriseIds: chantier.entrepriseIds || []
          });
        }
      } catch (err) {
        if (id) setError('Chantier non trouve');
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const chantierData = {
        nom: formData.nom,
        adresse: formData.adresse,
        budgetPrevisionnel: formData.budgetPrevisionnel,
        statut: formData.statut,
        devise: formData.devise,
        clientId: formData.clientId,
        moaId: formData.moaId,
        moeId: formData.moeId,
        entrepriseIds: formData.entrepriseIds
      };

      if (isEditing && id) {
        await updateChantier(id, chantierData);
        showSuccess('Chantier modifie avec succes');
      } else {
        await createChantier({
          ...chantierData,
          dateCreation: new Date().toISOString().split('T')[0]
        });
        showSuccess('Chantier cree avec succes');
      }
      navigate('/');
    } catch (err) {
      setError('Erreur lors de l\'enregistrement');
      showError('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return <Loading message="Chargement du chantier..." />;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6">
        <ArrowLeft className="w-5 h-5" />
        Retour au tableau de bord
      </Link>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          {isEditing ? 'Modifier le chantier' : 'Nouveau chantier'}
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1">
              Nom du chantier *
            </label>
            <input
              type="text"
              id="nom"
              required
              value={formData.nom}
              onChange={e => setFormData({ ...formData, nom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: Rénovation Appartement Dupont"
            />
          </div>

          <div>
            <label htmlFor="adresse" className="block text-sm font-medium text-gray-700 mb-1">
              Adresse
            </label>
            <textarea
              id="adresse"
              value={formData.adresse}
              onChange={e => setFormData({ ...formData, adresse: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              placeholder="Ex: 15 rue des Lilas, 75011 Paris"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
                Budget previsionnel *
              </label>
              <input
                type="number"
                id="budget"
                required
                min="0"
                step="0.01"
                value={formData.budgetPrevisionnel}
                onChange={e => setFormData({ ...formData, budgetPrevisionnel: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="devise" className="block text-sm font-medium text-gray-700 mb-1">
                Devise *
              </label>
              <select
                id="devise"
                value={formData.devise}
                onChange={e => setFormData({ ...formData, devise: e.target.value as DeviseType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.entries(DEVISES).map(([value, label]) => (
                  <option key={value} value={value}>{label} ({value})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="statut" className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              id="statut"
              value={formData.statut}
              onChange={e => setFormData({ ...formData, statut: e.target.value as Chantier['statut'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="en_cours">En cours</option>
              <option value="termine">Termine</option>
              <option value="suspendu">Suspendu</option>
            </select>
          </div>

          {/* Section Acteurs */}
          <div className="pt-4 border-t">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Acteurs du chantier</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client
                </label>
                <ActorSelector
                  type="client"
                  actors={clients}
                  value={formData.clientId}
                  onChange={clientId => setFormData({ ...formData, clientId })}
                  placeholder="Selectionner un client"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maitre d'Ouvrage (MOA)
                  </label>
                  <ActorSelector
                    type="moa"
                    actors={moas}
                    value={formData.moaId}
                    onChange={moaId => setFormData({ ...formData, moaId })}
                    placeholder="Selectionner un MOA"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maitre d'Oeuvre (MOE)
                  </label>
                  <ActorSelector
                    type="moe"
                    actors={moes}
                    value={formData.moeId}
                    onChange={moeId => setFormData({ ...formData, moeId })}
                    placeholder="Selectionner un MOE"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Entreprises
                </label>
                <ActorSelectorMultiple
                  entreprises={entreprises}
                  value={formData.entrepriseIds}
                  onChange={entrepriseIds => setFormData({ ...formData, entrepriseIds })}
                  placeholder="Selectionner des entreprises"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/')}
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
