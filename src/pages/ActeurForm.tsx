import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getClient, createClient, updateClient,
  getMoa, createMoa, updateMoa,
  getMoe, createMoe, updateMoe,
  getEntreprise, createEntreprise, updateEntreprise
} from '../services/api';
import type { Contact, ActorType, BaseActor, Entreprise } from '../types';
import { ACTOR_TYPE_LABELS, SPECIALITES_ENTREPRISE } from '../types';
import { useToast } from '../contexts/ToastContext';
import ContactList from '../components/ContactList';
import ContactFormModal from '../components/ContactFormModal';
import Loading from '../components/Loading';
import { ArrowLeft, Save, Loader2, PlusCircle } from 'lucide-react';

export default function ActeurForm() {
  const { type, id } = useParams<{ type: ActorType; id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState<{
    nom: string;
    adresse: string;
    email: string;
    telephone: string;
    siret: string;
    specialites: string[];
    contacts: Contact[];
  }>({
    nom: '',
    adresse: '',
    email: '',
    telephone: '',
    siret: '',
    specialites: [],
    contacts: []
  });

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(!!id);
  const [error, setError] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const isEditing = !!id;
  const isEntreprise = type === 'entreprise';
  const actorLabel = type ? ACTOR_TYPE_LABELS[type] : 'Acteur';

  useEffect(() => {
    if (id && type) {
      const fetchActor = async () => {
        try {
          let actor: BaseActor | Entreprise;
          if (type === 'client') actor = await getClient(id);
          else if (type === 'moa') actor = await getMoa(id);
          else if (type === 'moe') actor = await getMoe(id);
          else actor = await getEntreprise(id);

          setFormData({
            nom: actor.nom,
            adresse: actor.adresse,
            email: actor.email,
            telephone: actor.telephone,
            siret: (actor as Entreprise).siret || '',
            specialites: (actor as Entreprise).specialites || [],
            contacts: actor.contacts || []
          });
        } catch (err) {
          setError('Acteur non trouve');
        } finally {
          setLoadingData(false);
        }
      };
      fetchActor();
    }
  }, [id, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type) return;

    setLoading(true);
    setError(null);

    try {
      const actorData = {
        nom: formData.nom,
        adresse: formData.adresse,
        email: formData.email,
        telephone: formData.telephone,
        contacts: formData.contacts,
        ...(isEntreprise && {
          siret: formData.siret,
          specialites: formData.specialites
        })
      };

      if (isEditing && id) {
        if (type === 'client') await updateClient(id, actorData);
        else if (type === 'moa') await updateMoa(id, actorData);
        else if (type === 'moe') await updateMoe(id, actorData);
        else await updateEntreprise(id, actorData as Partial<Entreprise>);
        showSuccess(`${actorLabel} modifie avec succes`);
      } else {
        if (type === 'client') await createClient(actorData as Omit<BaseActor, 'id'>);
        else if (type === 'moa') await createMoa(actorData as Omit<BaseActor, 'id'>);
        else if (type === 'moe') await createMoe(actorData as Omit<BaseActor, 'id'>);
        else await createEntreprise(actorData as Omit<Entreprise, 'id'>);
        showSuccess(`${actorLabel} cree avec succes`);
      }

      navigate(`/acteurs?type=${type}`);
    } catch (err) {
      setError(`Erreur lors de l'enregistrement`);
      showError('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = (contactData: Omit<Contact, 'id'> | Contact) => {
    if ('id' in contactData) {
      // Editing existing contact
      setFormData({
        ...formData,
        contacts: formData.contacts.map(c =>
          c.id === contactData.id ? contactData : c
        )
      });
    } else {
      // Adding new contact
      const newContact: Contact = {
        ...contactData,
        id: `contact_${Date.now()}`
      };
      setFormData({
        ...formData,
        contacts: [...formData.contacts, newContact]
      });
    }
    setShowContactModal(false);
    setEditingContact(null);
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setShowContactModal(true);
  };

  const handleDeleteContact = (contactId: string) => {
    setFormData({
      ...formData,
      contacts: formData.contacts.filter(c => c.id !== contactId)
    });
  };

  const toggleSpecialite = (spec: string) => {
    if (formData.specialites.includes(spec)) {
      setFormData({
        ...formData,
        specialites: formData.specialites.filter(s => s !== spec)
      });
    } else {
      setFormData({
        ...formData,
        specialites: [...formData.specialites, spec]
      });
    }
  };

  if (loadingData) {
    return <Loading message="Chargement..." />;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        to={`/acteurs?type=${type}`}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Retour aux {actorLabel.toLowerCase()}s
      </Link>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          {isEditing ? `Modifier ${actorLabel}` : `Nouveau ${actorLabel}`}
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations generales */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-800 border-b pb-2">Informations generales</h2>

            <div>
              <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1">
                Nom *
              </label>
              <input
                type="text"
                id="nom"
                required
                value={formData.nom}
                onChange={e => setFormData({ ...formData, nom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={`Nom du ${actorLabel.toLowerCase()}`}
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
                placeholder="Adresse complete"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="email@exemple.fr"
                />
              </div>
              <div>
                <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-1">
                  Telephone
                </label>
                <input
                  type="tel"
                  id="telephone"
                  value={formData.telephone}
                  onChange={e => setFormData({ ...formData, telephone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0123456789"
                />
              </div>
            </div>
          </div>

          {/* Champs specifiques Entreprise */}
          {isEntreprise && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-800 border-b pb-2">Informations entreprise</h2>

              <div>
                <label htmlFor="siret" className="block text-sm font-medium text-gray-700 mb-1">
                  SIRET
                </label>
                <input
                  type="text"
                  id="siret"
                  value={formData.siret}
                  onChange={e => setFormData({ ...formData, siret: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="12345678901234"
                  maxLength={14}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialites
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(SPECIALITES_ENTREPRISE).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleSpecialite(key)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        formData.specialites.includes(key)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Contacts */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="text-lg font-medium text-gray-800">
                Contacts ({formData.contacts.length})
              </h2>
              <button
                type="button"
                onClick={() => {
                  setEditingContact(null);
                  setShowContactModal(true);
                }}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
              >
                <PlusCircle className="w-4 h-4" />
                Ajouter
              </button>
            </div>

            <ContactList
              contacts={formData.contacts}
              onEdit={handleEditContact}
              onDelete={handleDeleteContact}
            />
          </div>

          {/* Boutons */}
          <div className="flex gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate(`/acteurs?type=${type}`)}
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

      {/* Modal contact */}
      {showContactModal && (
        <ContactFormModal
          contact={editingContact}
          onSave={handleAddContact}
          onClose={() => {
            setShowContactModal(false);
            setEditingContact(null);
          }}
        />
      )}
    </div>
  );
}
