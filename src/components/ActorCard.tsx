import { Link } from 'react-router-dom';
import type { Client, MOA, MOE, Entreprise, ActorType } from '../types';
import { ACTOR_TYPE_LABELS, SPECIALITES_ENTREPRISE } from '../types';
import { Building2, Users, Mail, Phone, MapPin, ChevronRight } from 'lucide-react';

type Actor = Client | MOA | MOE | Entreprise;

interface ActorCardProps {
  actor: Actor;
  type: ActorType;
  chantiersCount?: number;
}

function isEntreprise(_actor: Actor, type: ActorType): _actor is Entreprise {
  return type === 'entreprise';
}

const TYPE_COLORS: Record<ActorType, { bg: string; text: string; border: string }> = {
  client: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  moa: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  moe: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  entreprise: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' }
};

export default function ActorCard({ actor, type, chantiersCount = 0 }: ActorCardProps) {
  const colors = TYPE_COLORS[type];

  return (
    <Link
      to={`/acteurs/${type}/${actor.id}`}
      className="bg-white rounded-lg shadow p-5 hover:shadow-lg transition-shadow block border border-gray-100"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colors.bg}`}>
            <Building2 className={`w-5 h-5 ${colors.text}`} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">{actor.nom}</h3>
            <span className={`text-xs px-2 py-0.5 rounded ${colors.bg} ${colors.text}`}>
              {ACTOR_TYPE_LABELS[type]}
            </span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>

      {actor.adresse && (
        <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
          <span className="line-clamp-2">{actor.adresse}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-sm mb-3">
        {actor.email && (
          <span className="flex items-center gap-1 text-gray-600">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="truncate max-w-[150px]">{actor.email}</span>
          </span>
        )}
        {actor.telephone && (
          <span className="flex items-center gap-1 text-gray-600">
            <Phone className="w-4 h-4 text-gray-400" />
            {actor.telephone}
          </span>
        )}
      </div>

      {/* Specialites pour Entreprise */}
      {isEntreprise(actor, type) && actor.specialites && actor.specialites.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {actor.specialites.slice(0, 3).map(spec => (
            <span key={spec} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
              {SPECIALITES_ENTREPRISE[spec as keyof typeof SPECIALITES_ENTREPRISE] || spec}
            </span>
          ))}
          {actor.specialites.length > 3 && (
            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
              +{actor.specialites.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Users className="w-4 h-4" />
          <span>{actor.contacts?.length || 0} contact{(actor.contacts?.length || 0) > 1 ? 's' : ''}</span>
        </div>
        {chantiersCount > 0 && (
          <span className="text-sm text-gray-500">
            {chantiersCount} chantier{chantiersCount > 1 ? 's' : ''}
          </span>
        )}
      </div>
    </Link>
  );
}
