import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, FileText, Loader2, CheckCircle, Trash2,
  TrendingUp, Camera, FileCheck, MessageSquare, ChevronDown, ChevronUp
} from 'lucide-react';
import {
  getEtatsAvancement, getChantier, getLotsTravaux, getFacturations,
  createEtatAvancement, updateEtatAvancement, deleteEtatAvancement,
  calculerBilanProduction, genererNumeroEtatAvancement
} from '../services/api';
import type { EtatAvancement, Chantier, LotTravaux, Facturation, BilanProduction, StatutEtatAvancement } from '../types';
import { STATUTS_ETAT_AVANCEMENT, UNITES_METRAGE } from '../types';
import { useToast } from '../contexts/ToastContext';
import { formatMontant, formatDate } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';

const STATUT_COLORS: Record<StatutEtatAvancement, string> = {
  brouillon: 'bg-gray-100 text-gray-700',
  valide: 'bg-green-100 text-green-700'
};

export default function EtatsAvancementPage() {
  const { id: chantierId } = useParams<{ id: string }>();
  const { user, hasPermission } = useAuth();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [chantier, setChantier] = useState<Chantier | null>(null);
  const [etats, setEtats] = useState<EtatAvancement[]>([]);
  const [lots, setLots] = useState<LotTravaux[]>([]);
  const [factures, setFactures] = useState<Facturation[]>([]);

  // Modal creation
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    titre: '',
    periodeDebut: '',
    periodeFin: '',
    commentaireGeneral: '',
    observations: '',
    problemesRencontres: ''
  });
  const [bilanProduction, setBilanProduction] = useState<BilanProduction[]>([]);
  const [selectedFactureIds, setSelectedFactureIds] = useState<string[]>([]);
  const [photosUrls, setPhotosUrls] = useState<string[]>([]);
  const [photosCommentaires, setPhotosCommentaires] = useState<Record<string, string>>({});

  // Modal detail / expanded
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const canCreate = hasPermission('canSaisieProduction');
  const canValidate = hasPermission('canValiderPV');

  const loadData = useCallback(async () => {
    if (!chantierId) return;

    try {
      setLoading(true);
      const [chantierData, etatsData, lotsData, facturesData] = await Promise.all([
        getChantier(chantierId),
        getEtatsAvancement(chantierId),
        getLotsTravaux(chantierId),
        getFacturations(chantierId)
      ]);

      setChantier(chantierData);
      setEtats(etatsData);
      setLots(lotsData.filter(l => l.actif));
      setFactures(facturesData);
    } catch {
      showError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [chantierId, showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreateModal = async () => {
    const today = new Date().toISOString().split('T')[0];
    const lastEtat = etats[0];
    const startDate = lastEtat?.periodeFin || today;

    setFormData({
      titre: '',
      periodeDebut: startDate,
      periodeFin: today,
      commentaireGeneral: '',
      observations: '',
      problemesRencontres: ''
    });

    // Charger le bilan de production
    try {
      const bilan = await calculerBilanProduction(chantierId!);
      setBilanProduction(bilan);
    } catch {
      setBilanProduction([]);
    }

    // Factures non liees a un etat
    const facturesLibres = factures.filter(f =>
      f.statut !== 'brouillon' && f.statut !== 'refuse' &&
      !etats.some(e => e.facturationIds.includes(f.id))
    );
    setSelectedFactureIds(facturesLibres.map(f => f.id));

    setPhotosUrls([]);
    setPhotosCommentaires({});
    setShowModal(true);
  };

  const handleAddPhotoUrl = () => {
    const url = prompt('URL de la photo:');
    if (url && url.trim()) {
      setPhotosUrls(prev => [...prev, url.trim()]);
    }
  };

  const handleRemovePhoto = (url: string) => {
    setPhotosUrls(prev => prev.filter(u => u !== url));
    setPhotosCommentaires(prev => {
      const next = { ...prev };
      delete next[url];
      return next;
    });
  };

  const handlePhotoComment = (url: string, comment: string) => {
    setPhotosCommentaires(prev => ({ ...prev, [url]: comment }));
  };

  const handleCreate = async () => {
    if (!chantierId || !formData.titre || !formData.periodeDebut || !formData.periodeFin) {
      showError('Veuillez remplir les champs obligatoires');
      return;
    }

    setSaving(true);
    try {
      const numero = await genererNumeroEtatAvancement(chantierId);
      const montantFacture = selectedFactureIds.reduce((sum, id) => {
        const f = factures.find(fac => fac.id === id);
        return sum + (f?.montantTTC || 0);
      }, 0);

      const totalPrevu = lots.reduce((sum, l) => sum + l.montantPrevu, 0);
      const totalRealise = bilanProduction.reduce((sum, b) => {
        const lot = lots.find(l => l.id === b.lotId);
        return sum + (b.quantiteRealisee * (lot?.prixUnitaire || 0));
      }, 0);
      const avancementGlobal = totalPrevu > 0 ? (totalRealise / totalPrevu) * 100 : 0;

      await createEtatAvancement({
        chantierId,
        numero,
        titre: formData.titre,
        date: new Date().toISOString().split('T')[0],
        periodeDebut: formData.periodeDebut,
        periodeFin: formData.periodeFin,
        photosUrls,
        photosCommentaires: Object.keys(photosCommentaires).length > 0 ? photosCommentaires : undefined,
        bilanProduction,
        avancementGlobal: Math.round(avancementGlobal * 10) / 10,
        facturationIds: selectedFactureIds,
        montantFacture,
        commentaireGeneral: formData.commentaireGeneral || undefined,
        observations: formData.observations || undefined,
        problemesRencontres: formData.problemesRencontres || undefined,
        statut: 'brouillon',
        createdAt: new Date().toISOString(),
        createdBy: user?.id
      });

      showSuccess('Etat d\'avancement cree');
      setShowModal(false);
      loadData();
    } catch {
      showError('Erreur lors de la creation');
    } finally {
      setSaving(false);
    }
  };

  const handleValider = async (etat: EtatAvancement) => {
    try {
      await updateEtatAvancement(etat.id, {
        statut: 'valide',
        valideLe: new Date().toISOString(),
        valideParId: user?.id
      });
      showSuccess('Etat valide');
      loadData();
    } catch {
      showError('Erreur lors de la validation');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet etat d\'avancement ?')) return;
    try {
      await deleteEtatAvancement(id);
      showSuccess('Etat supprime');
      loadData();
    } catch {
      showError('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!chantier) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Chantier non trouve</p>
        <Link to="/" className="text-amber-600 hover:underline mt-4 inline-block">Retour</Link>
      </div>
    );
  }

  const dernierEtatValide = etats.find(e => e.statut === 'valide');
  const avancementActuel = dernierEtatValide?.avancementGlobal || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={`/chantiers/${chantierId}`} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Etats d'Avancement</h1>
            <p className="text-gray-500">{chantier.nom}</p>
          </div>
        </div>
        {canCreate && (
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nouvel Etat
          </button>
        )}
      </div>

      {/* Avancement global */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-6 h-6 text-amber-600" />
          <h2 className="text-lg font-semibold">Avancement Global</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-gray-200 rounded-full h-4">
            <div
              className="bg-amber-500 h-4 rounded-full transition-all"
              style={{ width: `${Math.min(100, avancementActuel)}%` }}
            />
          </div>
          <span className="text-lg font-bold text-amber-600">{avancementActuel.toFixed(1)}%</span>
        </div>
        {dernierEtatValide && (
          <p className="text-sm text-gray-500 mt-2">
            Dernier etat valide: n{dernierEtatValide.numero} - {dernierEtatValide.titre}
          </p>
        )}
      </div>

      {/* Liste des etats */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-800">Historique ({etats.length})</h2>
        </div>

        {etats.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucun etat d'avancement</p>
          </div>
        ) : (
          <div className="divide-y">
            {etats.map(etat => (
              <div key={etat.id} className="hover:bg-gray-50">
                <div
                  className="p-4 flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedId(expandedId === etat.id ? null : etat.id)}
                >
                  <div className="flex items-center gap-4">
                    <FileText className="w-10 h-10 text-gray-400" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Etat n{etat.numero}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUT_COLORS[etat.statut]}`}>
                          {STATUTS_ETAT_AVANCEMENT[etat.statut]}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-700">{etat.titre}</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(etat.periodeDebut)} - {formatDate(etat.periodeFin)}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-sm">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          {etat.avancementGlobal.toFixed(1)}%
                        </span>
                        <span className="flex items-center gap-1">
                          <Camera className="w-4 h-4" />
                          {etat.photosUrls.length} photos
                        </span>
                        <span className="flex items-center gap-1">
                          <FileCheck className="w-4 h-4" />
                          {formatMontant(etat.montantFacture)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {etat.statut === 'brouillon' && canValidate && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleValider(etat); }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        title="Valider"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                    {etat.statut === 'brouillon' && canCreate && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(etat.id); }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Supprimer"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                    {expandedId === etat.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Detail expande */}
                {expandedId === etat.id && (
                  <div className="px-4 pb-4 border-t bg-gray-50">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                      {/* Photos */}
                      <div>
                        <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                          <Camera className="w-5 h-5" />
                          Photos ({etat.photosUrls.length})
                        </h3>
                        {etat.photosUrls.length === 0 ? (
                          <p className="text-sm text-gray-500">Aucune photo</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            {etat.photosUrls.map((url, i) => (
                              <div key={i} className="relative group">
                                <img
                                  src={url}
                                  alt={`Photo ${i + 1}`}
                                  className="w-full h-32 object-cover rounded-lg"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23ccc" width="100" height="100"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23666">Image</text></svg>';
                                  }}
                                />
                                {etat.photosCommentaires?.[url] && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 rounded-b-lg truncate">
                                    {etat.photosCommentaires[url]}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Bilan production */}
                      <div>
                        <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          Bilan Production
                        </h3>
                        <div className="border rounded-lg overflow-hidden bg-white">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-2 py-1 text-left">Lot</th>
                                <th className="px-2 py-1 text-right">Realise</th>
                                <th className="px-2 py-1 text-right">%</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {etat.bilanProduction.map((b, i) => (
                                <tr key={i}>
                                  <td className="px-2 py-1">{b.lotNom}</td>
                                  <td className="px-2 py-1 text-right">
                                    {b.quantiteRealisee} {UNITES_METRAGE[b.unite as keyof typeof UNITES_METRAGE] || b.unite}
                                  </td>
                                  <td className="px-2 py-1 text-right font-medium">
                                    {b.pourcentage.toFixed(1)}%
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Facturations liees */}
                      {etat.facturationIds.length > 0 && (
                        <div>
                          <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                            <FileCheck className="w-5 h-5" />
                            Factures liees ({etat.facturationIds.length})
                          </h3>
                          <div className="space-y-2">
                            {etat.facturationIds.map(fId => {
                              const f = factures.find(fac => fac.id === fId);
                              if (!f) return null;
                              return (
                                <div key={fId} className="bg-white border rounded-lg p-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="font-medium">{f.numero}</span>
                                    <span>{formatMontant(f.montantTTC)}</span>
                                  </div>
                                  <p className="text-gray-500 text-xs">{formatDate(f.date)}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Commentaires */}
                      <div>
                        <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                          <MessageSquare className="w-5 h-5" />
                          Commentaires
                        </h3>
                        <div className="space-y-2 text-sm">
                          {etat.commentaireGeneral && (
                            <div className="bg-white border rounded-lg p-2">
                              <span className="font-medium text-gray-600">General:</span>
                              <p>{etat.commentaireGeneral}</p>
                            </div>
                          )}
                          {etat.observations && (
                            <div className="bg-white border rounded-lg p-2">
                              <span className="font-medium text-gray-600">Observations:</span>
                              <p>{etat.observations}</p>
                            </div>
                          )}
                          {etat.problemesRencontres && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                              <span className="font-medium text-red-600">Problemes:</span>
                              <p className="text-red-700">{etat.problemesRencontres}</p>
                            </div>
                          )}
                          {!etat.commentaireGeneral && !etat.observations && !etat.problemesRencontres && (
                            <p className="text-gray-500">Aucun commentaire</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal creation */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-800">Nouvel Etat d'Avancement</h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Titre et periode */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                  <input
                    type="text"
                    value={formData.titre}
                    onChange={e => setFormData(p => ({ ...p, titre: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="Ex: Avancement semaine 12"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Debut periode</label>
                  <input
                    type="date"
                    value={formData.periodeDebut}
                    onChange={e => setFormData(p => ({ ...p, periodeDebut: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fin periode</label>
                  <input
                    type="date"
                    value={formData.periodeFin}
                    onChange={e => setFormData(p => ({ ...p, periodeFin: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Photos */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-800 flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Photos d'avancement
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddPhotoUrl}
                    className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Ajouter une photo
                  </button>
                </div>
                {photosUrls.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucune photo ajoutee</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {photosUrls.map((url, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={url}
                          alt={`Photo ${i + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23ccc" width="100" height="100"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23666">?</text></svg>';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(url)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <input
                          type="text"
                          placeholder="Commentaire..."
                          value={photosCommentaires[url] || ''}
                          onChange={(e) => handlePhotoComment(url, e.target.value)}
                          className="mt-1 w-full px-2 py-1 text-xs border rounded"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bilan production */}
              <div>
                <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Bilan de production
                </h3>
                {bilanProduction.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucun lot defini pour ce chantier</p>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left">Lot</th>
                          <th className="px-3 py-2 text-right">Prevu</th>
                          <th className="px-3 py-2 text-right">Realise</th>
                          <th className="px-3 py-2 text-right">%</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {bilanProduction.map((b, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2">{b.lotNom}</td>
                            <td className="px-3 py-2 text-right">
                              {b.quantitePrevue} {UNITES_METRAGE[b.unite as keyof typeof UNITES_METRAGE] || b.unite}
                            </td>
                            <td className="px-3 py-2 text-right">{b.quantiteRealisee}</td>
                            <td className="px-3 py-2 text-right font-medium">
                              {b.pourcentage.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Factures liees */}
              <div>
                <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <FileCheck className="w-5 h-5" />
                  Factures a lier
                </h3>
                {factures.filter(f => f.statut !== 'brouillon' && f.statut !== 'refuse').length === 0 ? (
                  <p className="text-sm text-gray-500">Aucune facture disponible</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {factures
                      .filter(f => f.statut !== 'brouillon' && f.statut !== 'refuse')
                      .filter(f => !etats.some(e => e.facturationIds.includes(f.id)))
                      .map(f => (
                        <label key={f.id} className="flex items-center gap-3 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedFactureIds.includes(f.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedFactureIds(prev => [...prev, f.id]);
                              } else {
                                setSelectedFactureIds(prev => prev.filter(id => id !== f.id));
                              }
                            }}
                            className="rounded text-amber-600"
                          />
                          <div className="flex-1">
                            <span className="font-medium">{f.numero}</span>
                            <span className="text-gray-500 text-sm ml-2">{formatDate(f.date)}</span>
                          </div>
                          <span className="font-medium">{formatMontant(f.montantTTC)}</span>
                        </label>
                      ))}
                  </div>
                )}
              </div>

              {/* Commentaires */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire general</label>
                  <textarea
                    value={formData.commentaireGeneral}
                    onChange={e => setFormData(p => ({ ...p, commentaireGeneral: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="Resume de l'avancement..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observations</label>
                  <textarea
                    value={formData.observations}
                    onChange={e => setFormData(p => ({ ...p, observations: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="Points d'attention..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Problemes rencontres</label>
                  <textarea
                    value={formData.problemesRencontres}
                    onChange={e => setFormData(p => ({ ...p, problemesRencontres: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 border-red-200"
                    placeholder="Difficultes, blocages..."
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !formData.titre}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:bg-amber-300 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Creer l'etat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
