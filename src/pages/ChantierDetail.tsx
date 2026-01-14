import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getChantier, getDepenses, deleteChantier, deleteDepense, deleteDepensesByChantier, getCategories, getCategoryLabel, getChantierActors, getPhotosChantier, createPhotoChantier, deletePhotoChantier, updateChantier } from '../services/api';
import type { Chantier, Depense, Categorie, Client, MOA, MOE, Entreprise, PhotoChantier } from '../types';
import { STATUTS_CHANTIER } from '../types';
import { formatMontant, formatDate } from '../utils/format';
import { useToast } from '../contexts/ToastContext';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import ChantierActorsSection from '../components/ChantierActorsSection';
import { ArrowLeft, Edit, Trash2, PlusCircle, Loader2, AlertTriangle, FileDown, Users, ListTodo, Package, Receipt, ClipboardCheck, Banknote, TrendingUp, Camera, Plus, Image as ImageIcon, X, Upload } from 'lucide-react';
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
  const [photos, setPhotos] = useState<PhotoChantier[]>([]);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoType, setPhotoType] = useState<'presentation' | 'phase'>('presentation');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoPhase, setNewPhotoPhase] = useState('');
  const [newPhotoComment, setNewPhotoComment] = useState('');
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    try {
      const [chantierData, depensesData, categoriesData, photosData] = await Promise.all([
        getChantier(id),
        getDepenses(id),
        getCategories(),
        getPhotosChantier(id)
      ]);
      setChantier(chantierData);
      setDepenses(depensesData);
      setCategories(categoriesData);
      setPhotos(photosData);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setNewPhotoUrl(''); // Clear URL if file selected
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Erreur lors de l\'upload');
    }

    const data = await response.json();
    return data.url;
  };

  const handleAddPhoto = async () => {
    if (!id) return;

    // Check if we have either a file or URL
    if (!selectedFile && !newPhotoUrl.trim()) {
      showError('Selectionnez une image ou entrez une URL');
      return;
    }

    setSavingPhoto(true);
    setUploading(true);
    try {
      let imageUrl = newPhotoUrl.trim();

      // Upload file if selected
      if (selectedFile) {
        imageUrl = await uploadFile(selectedFile);
      }

      const photosPhase = photos.filter(p => p.type === 'phase');

      if (photoType === 'presentation') {
        // Pour la presentation, on met a jour le chantier aussi
        await updateChantier(id, { photoPresentationUrl: imageUrl });

        // Et on cree la photo dans la collection
        await createPhotoChantier({
          chantierId: id,
          type: 'presentation',
          url: imageUrl,
          titre: 'Photo de presentation',
          commentaire: newPhotoComment.trim() || undefined,
          ordre: 0,
          createdAt: new Date().toISOString()
        });
      } else {
        // Photo de phase
        await createPhotoChantier({
          chantierId: id,
          type: 'phase',
          url: imageUrl,
          titre: newPhotoPhase.trim() || 'Phase',
          phase: newPhotoPhase.trim() || undefined,
          commentaire: newPhotoComment.trim() || undefined,
          ordre: photosPhase.length + 1,
          createdAt: new Date().toISOString()
        });
      }

      showSuccess('Photo ajoutee');
      setShowPhotoModal(false);
      setNewPhotoUrl('');
      setNewPhotoPhase('');
      setNewPhotoComment('');
      setSelectedFile(null);
      setPreviewUrl('');
      loadData();
    } catch (err) {
      showError('Erreur lors de l\'ajout de la photo');
    } finally {
      setSavingPhoto(false);
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photo: PhotoChantier) => {
    if (!confirm('Supprimer cette photo ?')) return;
    try {
      await deletePhotoChantier(photo.id);
      if (photo.type === 'presentation' && chantier) {
        await updateChantier(chantier.id, { photoPresentationUrl: undefined });
      }
      showSuccess('Photo supprimee');
      loadData();
    } catch (err) {
      showError('Erreur lors de la suppression');
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
          <Link
            to={`/chantiers/${id}/taches`}
            className="flex items-center gap-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <ListTodo className="w-4 h-4" />
            Taches
          </Link>
          <Link
            to={`/chantiers/${id}/lots`}
            className="flex items-center gap-1 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
          >
            <Package className="w-4 h-4" />
            Lots
          </Link>
          <Link
            to={`/chantiers/${id}/facturation`}
            className="flex items-center gap-1 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
          >
            <Receipt className="w-4 h-4" />
            Facturation
          </Link>
          <Link
            to={`/chantiers/${id}/pv-avancement`}
            className="flex items-center gap-1 px-4 py-2 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors"
          >
            <ClipboardCheck className="w-4 h-4" />
            PV Avancement
          </Link>
          <Link
            to={`/chantiers/${id}/etats-avancement`}
            className="flex items-center gap-1 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            Etats Avancement
          </Link>
          <Link
            to={`/chantiers/${id}/paiements`}
            className="flex items-center gap-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
          >
            <Banknote className="w-4 h-4" />
            Paiements
          </Link>
          <button
            onClick={() => exportChantierPdf(chantier, depenses, categories, actors)}
            className="flex items-center gap-1 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
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

      {/* Section Photos */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-bold text-gray-800">Photos du chantier</h2>
          </div>
          <button
            onClick={() => {
              setPhotoType('presentation');
              setShowPhotoModal(true);
            }}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>

        {/* Photo de presentation */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Photo de presentation</h3>
          {photos.find(p => p.type === 'presentation') || chantier.photoPresentationUrl ? (
            <div className="relative group w-full max-w-md">
              <img
                src={photos.find(p => p.type === 'presentation')?.url || chantier.photoPresentationUrl}
                alt="Presentation du chantier"
                className="w-full h-48 object-cover rounded-lg shadow"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect fill="%23e5e7eb" width="400" height="200"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="14">Image non disponible</text></svg>';
                }}
              />
              {photos.find(p => p.type === 'presentation') && (
                <button
                  onClick={() => handleDeletePhoto(photos.find(p => p.type === 'presentation')!)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Supprimer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {photos.find(p => p.type === 'presentation')?.commentaire && (
                <p className="mt-2 text-sm text-gray-600 italic">
                  {photos.find(p => p.type === 'presentation')?.commentaire}
                </p>
              )}
            </div>
          ) : (
            <div
              onClick={() => {
                setPhotoType('presentation');
                setShowPhotoModal(true);
              }}
              className="w-full max-w-md h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-colors"
            >
              <div className="text-center text-gray-500">
                <ImageIcon className="w-8 h-8 mx-auto mb-1" />
                <p className="text-sm">Cliquez pour ajouter</p>
              </div>
            </div>
          )}
        </div>

        {/* Photos de phase */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Photos de phase</h3>
            <button
              onClick={() => {
                setPhotoType('phase');
                setShowPhotoModal(true);
              }}
              className="text-sm text-amber-600 hover:text-amber-700"
            >
              + Ajouter une phase
            </button>
          </div>
          {photos.filter(p => p.type === 'phase').length === 0 ? (
            <p className="text-sm text-gray-500">Aucune photo de phase</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {photos
                .filter(p => p.type === 'phase')
                .sort((a, b) => a.ordre - b.ordre)
                .map(photo => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.url}
                      alt={photo.phase || 'Phase'}
                      className="w-full h-28 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120"><rect fill="%23e5e7eb" width="200" height="120"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="12">?</text></svg>';
                      }}
                    />
                    <button
                      onClick={() => handleDeletePhoto(photo)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Supprimer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="mt-1">
                      {photo.phase && (
                        <p className="text-xs font-medium text-gray-700 truncate">{photo.phase}</p>
                      )}
                      {photo.commentaire && (
                        <p className="text-xs text-gray-500 truncate">{photo.commentaire}</p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal ajout photo */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {photoType === 'presentation' ? 'Photo de presentation' : 'Photo de phase'}
            </h3>

            <div className="space-y-4">
              {/* Upload fichier */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Selectionner une image</label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">
                      {selectedFile ? selectedFile.name : 'Cliquez ou glissez une image'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF jusqu'a 10MB</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>

              {/* Ou URL */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">ou entrez une URL</span>
                </div>
              </div>

              <div>
                <input
                  type="url"
                  value={newPhotoUrl}
                  onChange={(e) => {
                    setNewPhotoUrl(e.target.value);
                    setSelectedFile(null);
                    setPreviewUrl('');
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  placeholder="https://exemple.com/photo.jpg"
                  disabled={!!selectedFile}
                />
              </div>

              {photoType === 'phase' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la phase</label>
                  <input
                    type="text"
                    value={newPhotoPhase}
                    onChange={(e) => setNewPhotoPhase(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="Ex: Fondations, Gros oeuvre..."
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire</label>
                <textarea
                  value={newPhotoComment}
                  onChange={(e) => setNewPhotoComment(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  rows={2}
                  placeholder="Description optionnelle..."
                />
              </div>

              {/* Apercu */}
              {(previewUrl || newPhotoUrl) && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Apercu:</p>
                  <img
                    src={previewUrl || newPhotoUrl}
                    alt="Apercu"
                    className="w-full h-32 object-cover rounded-lg border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect fill="%23fef3c7" width="200" height="100"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23d97706" font-size="12">URL invalide</text></svg>';
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPhotoModal(false);
                  setNewPhotoUrl('');
                  setNewPhotoPhase('');
                  setNewPhotoComment('');
                  setSelectedFile(null);
                  setPreviewUrl('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleAddPhoto}
                disabled={savingPhoto || (!selectedFile && !newPhotoUrl.trim())}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:bg-amber-300"
              >
                {savingPhoto ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {uploading ? 'Upload...' : 'Enregistrement...'}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Ajouter
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
