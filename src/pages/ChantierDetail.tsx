import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getChantier, getDepenses, deleteChantier, deleteDepense, deleteDepensesByChantier, getCategories, getCategoryLabel, getChantierActors } from '../services/api';
import type { Chantier, Depense, Categorie, Client, MOA, MOE, Entreprise } from '../types';
import { STATUTS_CHANTIER } from '../types';
import { formatMontant, formatDate } from '../utils/format';
import { useToast } from '../contexts/ToastContext';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import ChantierActorsSection from '../components/ChantierActorsSection';
import { ArrowLeft, Edit, Trash2, PlusCircle, Loader2, AlertTriangle, FileDown, Users } from 'lucide-react';
import { exportChantierPdf } from '../utils/exportPdf';

export default function ChantierDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [chantier, setChantier] = useState<Chantier | null>(null);
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [actors, setActors] = useState<{
    client: Client | null;
    moa: MOA | null;
    moe: MOE | null;
    entreprises: Entreprise[];
  }>({ client: null, moa: null, moe: null, entreprises: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    try {
      const [chantierData, depensesData, categoriesData] = await Promise.all([
        getChantier(id),
        getDepenses(id),
        getCategories()
      ]);
      setChantier(chantierData);
      setDepenses(depensesData);
      setCategories(categoriesData);

      // Load actors
      const actorsData = await getChantierActors(chantierData);
      setActors(actorsData);
    } catch (err) {
      setError('Chantier non trouve');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteDepensesByChantier(id);
      await deleteChantier(id);
      showSuccess('Chantier supprimé avec succès');
      navigate('/');
    } catch (err) {
      showError('Erreur lors de la suppression');
      setDeleting(false);
    }
  };

  const handleDeleteDepense = async (depenseId: string) => {
    try {
      await deleteDepense(depenseId);
      setDepenses(depenses.filter(d => d.id !== depenseId));
      showSuccess('Dépense supprimée');
    } catch (err) {
      showError('Erreur lors de la suppression de la dépense');
    }
  };

  // Get category style based on categorieId
  const getCategoryStyle = (categorieId: string): string => {
    if (categorieId.startsWith('travaux')) return 'bg-blue-100 text-blue-700';
    if (categorieId.startsWith('materiel')) return 'bg-orange-100 text-orange-700';
    if (categorieId === 'main_oeuvre') return 'bg-purple-100 text-purple-700';
    if (categorieId === 'location') return 'bg-cyan-100 text-cyan-700';
    if (categorieId === 'sous_traitance') return 'bg-pink-100 text-pink-700';
    return 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return <Loading message="Chargement du chantier..." />;
  }

  if (error || !chantier) {
    return (
      <ErrorMessage
        message={error || 'Chantier non trouvé'}
        onRetry={loadData}
        showHomeLink
      />
    );
  }

  const totalDepenses = depenses.reduce((sum, d) => sum + d.montant, 0);
  const reste = chantier.budgetPrevisionnel - totalDepenses;
  const progression = (totalDepenses / chantier.budgetPrevisionnel) * 100;
  const isOverBudget = progression > 100;

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6">
        <ArrowLeft className="w-5 h-5" />
        Retour au tableau de bord
      </Link>

      {/* En-tête du chantier */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{chantier.nom}</h1>
            <p className="text-gray-500">{chantier.adresse}</p>
            <p className="text-sm text-gray-400 mt-1">Créé le {formatDate(chantier.dateCreation)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              chantier.statut === 'en_cours' ? 'bg-blue-100 text-blue-800' :
              chantier.statut === 'termine' ? 'bg-green-100 text-green-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {STATUTS_CHANTIER[chantier.statut]}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => exportChantierPdf(chantier, depenses, categories, actors)}
            className="flex items-center gap-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            title="Exporter ce chantier en PDF"
          >
            <FileDown className="w-4 h-4" />
            Export PDF
          </button>
          <Link
            to={`/chantiers/${id}/modifier`}
            className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Modifier
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer
          </button>
        </div>
      </div>

      {/* Section Finances */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Finances</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Budget prévisionnel</p>
            <p className="text-xl font-bold text-blue-600">{formatMontant(chantier.budgetPrevisionnel)}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Total dépenses</p>
            <p className="text-xl font-bold text-red-600">{formatMontant(totalDepenses)}</p>
          </div>
          <div className={`${reste >= 0 ? 'bg-green-50' : 'bg-red-50'} rounded-lg p-4`}>
            <p className="text-sm text-gray-500">Reste</p>
            <p className={`text-xl font-bold ${reste >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatMontant(reste)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min(progression, 100)}%` }}
            />
          </div>
          <p className={`text-sm text-right ${isOverBudget ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
            {progression.toFixed(1)}% du budget utilisé
            {isOverBudget && ' - Dépassement !'}
          </p>
        </div>
      </div>

      {/* Section Acteurs */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-bold text-gray-800">Acteurs du chantier</h2>
        </div>
        <ChantierActorsSection
          client={actors.client}
          moa={actors.moa}
          moe={actors.moe}
          entreprises={actors.entreprises}
        />
      </div>

      {/* Liste des depenses */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">Depenses ({depenses.length})</h2>
          <Link
            to={`/chantiers/${id}/depenses/nouveau`}
            className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Nouvelle dépense
          </Link>
        </div>

        {depenses.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucune dépense enregistrée</p>
        ) : (
          <div className="space-y-3">
            {depenses
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map(depense => (
                <div key={depense.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-gray-800">{depense.description}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${getCategoryStyle(depense.categorieId)}`}>
                        {getCategoryLabel(categories, depense.categorieId)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{formatDate(depense.date)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-gray-800">{formatMontant(depense.montant)}</span>
                    <button
                      onClick={() => handleDeleteDepense(depense.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold">Confirmer la suppression</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer le chantier <strong>{chantier.nom}</strong> ?
              Cette action supprimera également toutes les dépenses associées et est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
