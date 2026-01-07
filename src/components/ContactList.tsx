import type { Contact } from '../types';
import { User, Mail, Phone, Briefcase, Trash2, Edit } from 'lucide-react';

interface ContactListProps {
  contacts: Contact[];
  onEdit?: (contact: Contact) => void;
  onDelete?: (contactId: string) => void;
  readonly?: boolean;
}

export default function ContactList({ contacts, onEdit, onDelete, readonly = false }: ContactListProps) {
  if (contacts.length === 0) {
    return (
      <p className="text-gray-500 text-sm italic py-4 text-center">
        Aucun contact enregistre
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {contacts.map(contact => (
        <div key={contact.id} className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-gray-800">
                  {contact.prenom} {contact.nom}
                </span>
              </div>
              {contact.fonction && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <span>{contact.fonction}</span>
                </div>
              )}
              <div className="flex flex-wrap gap-4 text-sm">
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                  >
                    <Mail className="w-4 h-4" />
                    {contact.email}
                  </a>
                )}
                {contact.telephone && (
                  <a
                    href={`tel:${contact.telephone}`}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                  >
                    <Phone className="w-4 h-4" />
                    {contact.telephone}
                  </a>
                )}
              </div>
            </div>
            {!readonly && (
              <div className="flex gap-1">
                {onEdit && (
                  <button
                    onClick={() => onEdit(contact)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Modifier"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(contact.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
