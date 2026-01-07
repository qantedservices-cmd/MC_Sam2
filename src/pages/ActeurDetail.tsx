import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getClient, deleteClient,
  getMoa, deleteMoa,
  getMoe, deleteMoe,
  getEntreprise, deleteEntreprise,
  getChantiers
} from '../services/api';
import type { ActorType, BaseActor, Entreprise, Chantier } from '../types';
import { ACTOR_TYPE_LABELS, SPECIALITES_ENTREPRISE } from '../types';
import { useToast } from '../contexts/ToastContext';
import ContactList from '../components/ContactList';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import {
  ArrowLeft, Edit, Trash2, Building2, Mail, Phone, MapPin,
  FileText, HardHat
} from 'lucide-react';

export default function ActeurDetail() {
  const { type, id } = useParams<{ type: ActorType; id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [actor, setActor] = useState<BaseActor | Entreprise | null>(null);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const actorLabel = type ? ACTOR_TYPE_LABELS[type] : 'Acteur';
  const isEntreprise = type === 'entreprise';

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !type) return;

      try {
        let actorData: BaseActor | Entreprise;
        if (type === 'client') actorData = await getClient(id);
        else if (type === 'moa') actorData = await getMoa(id);
        else if (type === 'moe') actorData = await getMoe(id);
        else actorData = await getEntreprise(id);

        setActor(actorData);

        // Fetch related chantiers
        const allChantiers = await getChantiers();
        const relatedChantiers = allChantiers.filter(c => {
          if (type === 'client') return c.clientId === id;
          if (type === 'moa') return c.moaId === id;
          if (type === 'moe') return c.moeId === id;
          if (type === 'entreprise') return c.entrepriseIds?.includes(id);
          return false;
        });
        setChantiers(relatedChantiers);
      } catch (err) {
        setError('Acteur non trouve');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, type]);

  const handleDelete = async () => {
    if (!id || !type) return;

    setDeleting(true);
    try {
      if (type === 'client') await deleteClient(id);
      else if (type === 'moa') await deleteMoa(id);
      else if (type === 'moe') await deleteMoe(id);
      else await deleteEntreprise(id);

      showSuccess(`${actorLabel} supprime avec succes`);
      navigate(`/acteurs?type=${type}`);
    } catch (err) {
      showError('Erreur lors de la suppression');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return <Loading message="Chargement..." />;
  }

  if (error || !actor) {
    return <ErrorMessage message={error || 'Acteur non trouve'} showHomeLink />;
  }

  const entrepriseActor = actor as Entreprise;

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        to={`/acteurs?type=${type}`}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Retour aux {actorLabel.toLowerCase()}s
      </Link>

      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{actor.nom}</h1>
              <span className="inline-block mt-1 text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                {actorLabel}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              to={`/acteurs/${type}/${id}/modifier`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Modifier
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          </div>
        </div>

        {/* Coordonnees */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {actor.adresse && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Adresse</p>
                <p className="text-gray-800">{actor.adresse}</p>
              </div>
            </div>
          )}
          {actor.email && (
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <a href={`mailto:${actor.email}`} className="text-blue-600 hover:text-blue-800">
                  {actor.email}
                </a>
              </div>
            </div>
          )}
          {actor.telephone && (
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Telephone</p>
                <a href={`tel:${actor.telephone}`} className="text-blue-600 hover:text-blue-800">
                  {actor.telephone}
                </a>
              </div>
            </div>
          )}
          {isEntreprise && entrepriseActor.siret && (
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">SIRET</p>
                <p className="text-gray-800 font-mono">{entrepriseActor.siret}</p>
              </div>
            </div>
          )}
        </div>

        {/* Specialites Entreprise */}
        {isEntreprise && entrepriseActor.specialites && entrepriseActor.specialites.length > 0 && (
          <div className="mt-6">
            <p className="text-sm text-gray-500 mb-2">Specialites</p>
            <div className="flex flex-wrap gap-2">
              {entrepriseActor.specialites.map(spec => (
                <span key={spec} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                  {SPECIALITES_ENTREPRISE[spec as keyof typeof SPECIALITES_ENTREPRISE] || spec}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Contacts */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          Contacts ({actor.contacts?.length || 0})
        </h2>
        {actor.contacts && actor.contacts.length > 0 ? (
          <ContactList contacts={actor.contacts} />
        ) : (
          <p className="text-gray-500 text-center py-4">Aucun contact enregistre</p>
        )}
      </div>

      {/* Chantiers lies */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          Chantiers associes ({chantiers.length})
        </h2>
        {chantiers.length > 0 ? (
          <div className="space-y-3">
            {chantiers.map(chantier => (
              <Link
                key={chantier.id}
                to={`/chantiers/${chantier.id}`}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <HardHat className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-800">{chantier.nom}</p>
                    <p className="text-sm text-gray-500">{chantier.adresse}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  chantier.statut === 'en_cours' ? 'bg-green-100 text-green-700' :
                  chantier.statut === 'termine' ? 'bg-gray-100 text-gray-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {chantier.statut === 'en_cours' ? 'En cours' :
                   chantier.statut === 'termine' ? 'Termine' : 'Suspendu'}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">Aucun chantier associe</p>
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Supprimer {actorLabel.toLowerCase()} ?
            </h3>
            <p className="text-gray-600 mb-4">
              Etes-vous sur de vouloir supprimer "{actor.nom}" ? Cette action est irreversible.
            </p>
            {chantiers.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  Attention : cet acteur est associe a {chantiers.length} chantier{chantiers.length > 1 ? 's' : ''}.
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
