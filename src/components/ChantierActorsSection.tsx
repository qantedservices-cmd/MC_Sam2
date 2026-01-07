import { Link } from 'react-router-dom';
import type { Client, MOA, MOE, Entreprise, Contact } from '../types';
import { ACTOR_TYPE_LABELS, SPECIALITES_ENTREPRISE } from '../types';
import { Building2, Users, Briefcase, HardHat, Mail, Phone, User, ChevronRight } from 'lucide-react';

interface ChantierActorsSectionProps {
  client?: Client | null;
  moa?: MOA | null;
  moe?: MOE | null;
  entreprises?: Entreprise[];
}

interface ActorBlockProps {
  type: 'client' | 'moa' | 'moe' | 'entreprise';
  actor: Client | MOA | MOE | Entreprise;
  icon: React.ReactNode;
  colorClass: string;
}

function ContactItem({ contact }: { contact: Contact }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
      <div className="flex items-center gap-2 min-w-0">
        <User className="w-4 h-4 text-gray-400 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">
            {contact.prenom} {contact.nom}
          </p>
          {contact.fonction && (
            <p className="text-xs text-gray-500">{contact.fonction}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {contact.email && (
          <a
            href={`mailto:${contact.email}`}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title={contact.email}
          >
            <Mail className="w-4 h-4" />
          </a>
        )}
        {contact.telephone && (
          <a
            href={`tel:${contact.telephone}`}
            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
            title={contact.telephone}
          >
            <Phone className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}

function ActorBlock({ type, actor, icon, colorClass }: ActorBlockProps) {
  const isEntreprise = type === 'entreprise';
  const entrepriseActor = actor as Entreprise;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <Link
        to={`/acteurs/${type}/${actor.id}`}
        className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colorClass}`}>
            {icon}
          </div>
          <div>
            <p className="font-medium text-gray-800">{actor.nom}</p>
            <p className="text-xs text-gray-500">{ACTOR_TYPE_LABELS[type]}</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </Link>

      {/* Body */}
      <div className="p-3 space-y-3">
        {/* Contact info */}
        <div className="flex flex-wrap gap-3 text-sm">
          {actor.email && (
            <a
              href={`mailto:${actor.email}`}
              className="flex items-center gap-1 text-gray-600 hover:text-blue-600"
            >
              <Mail className="w-4 h-4" />
              <span className="truncate max-w-[180px]">{actor.email}</span>
            </a>
          )}
          {actor.telephone && (
            <a
              href={`tel:${actor.telephone}`}
              className="flex items-center gap-1 text-gray-600 hover:text-green-600"
            >
              <Phone className="w-4 h-4" />
              {actor.telephone}
            </a>
          )}
        </div>

        {/* Specialites for Entreprise */}
        {isEntreprise && entrepriseActor.specialites && entrepriseActor.specialites.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {entrepriseActor.specialites.map(spec => (
              <span key={spec} className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded">
                {SPECIALITES_ENTREPRISE[spec as keyof typeof SPECIALITES_ENTREPRISE] || spec}
              </span>
            ))}
          </div>
        )}

        {/* Contacts */}
        {actor.contacts && actor.contacts.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Contacts ({actor.contacts.length})
            </p>
            <div className="space-y-1">
              {actor.contacts.slice(0, 2).map(contact => (
                <ContactItem key={contact.id} contact={contact} />
              ))}
              {actor.contacts.length > 2 && (
                <Link
                  to={`/acteurs/${type}/${actor.id}`}
                  className="block text-center text-sm text-blue-600 hover:text-blue-800 py-1"
                >
                  Voir {actor.contacts.length - 2} autre{actor.contacts.length > 3 ? 's' : ''} contact{actor.contacts.length > 3 ? 's' : ''}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChantierActorsSection({
  client,
  moa,
  moe,
  entreprises = []
}: ChantierActorsSectionProps) {
  const hasActors = client || moa || moe || entreprises.length > 0;

  if (!hasActors) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p>Aucun acteur associe a ce chantier</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {client && (
        <ActorBlock
          type="client"
          actor={client}
          icon={<Users className="w-5 h-5 text-blue-600" />}
          colorClass="bg-blue-100"
        />
      )}

      {moa && (
        <ActorBlock
          type="moa"
          actor={moa}
          icon={<Building2 className="w-5 h-5 text-purple-600" />}
          colorClass="bg-purple-100"
        />
      )}

      {moe && (
        <ActorBlock
          type="moe"
          actor={moe}
          icon={<Briefcase className="w-5 h-5 text-green-600" />}
          colorClass="bg-green-100"
        />
      )}

      {entreprises.map(entreprise => (
        <ActorBlock
          key={entreprise.id}
          type="entreprise"
          actor={entreprise}
          icon={<HardHat className="w-5 h-5 text-orange-600" />}
          colorClass="bg-orange-100"
        />
      ))}
    </div>
  );
}
