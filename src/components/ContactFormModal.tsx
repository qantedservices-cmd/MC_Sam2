import { useState, useEffect } from 'react';
import type { Contact } from '../types';
import { X, Save, Loader2 } from 'lucide-react';

interface ContactFormModalProps {
  contact?: Contact | null;
  onSave: (contact: Omit<Contact, 'id'> | Contact) => void;
  onClose: () => void;
}

export default function ContactFormModal({ contact, onSave, onClose }: ContactFormModalProps) {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    fonction: '',
    email: '',
    telephone: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (contact) {
      setFormData({
        nom: contact.nom,
        prenom: contact.prenom,
        fonction: contact.fonction,
        email: contact.email,
        telephone: contact.telephone
      });
    }
  }, [contact]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (contact) {
      onSave({ ...formData, id: contact.id });
    } else {
      onSave(formData);
    }
  };

  const isEditing = !!contact;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">
            {isEditing ? 'Modifier le contact' : 'Ajouter un contact'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="prenom" className="block text-sm font-medium text-gray-700 mb-1">
                Prenom *
              </label>
              <input
                type="text"
                id="prenom"
                required
                value={formData.prenom}
                onChange={e => setFormData({ ...formData, prenom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
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
              />
            </div>
          </div>

          <div>
            <label htmlFor="fonction" className="block text-sm font-medium text-gray-700 mb-1">
              Fonction
            </label>
            <input
              type="text"
              id="fonction"
              value={formData.fonction}
              onChange={e => setFormData({ ...formData, fonction: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: Chef de projet, Gerant..."
            />
          </div>

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
              placeholder="0612345678"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
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
