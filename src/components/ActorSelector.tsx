import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { BaseActor, ActorType, Entreprise } from '../types';
import { ACTOR_TYPE_LABELS, SPECIALITES_ENTREPRISE } from '../types';
import { ChevronDown, Search, X, PlusCircle, User, HardHat, Check } from 'lucide-react';

// Props communes
interface BaseActorSelectorProps {
  placeholder?: string;
}

// Props pour selection simple
interface SingleSelectProps extends BaseActorSelectorProps {
  multiple?: false;
  type: ActorType;
  actors: BaseActor[];
  value: string | null;
  onChange: (actorId: string | null) => void;
}

// Props pour selection multiple (entreprises)
interface MultipleSelectProps extends BaseActorSelectorProps {
  multiple: true;
  type?: 'entreprise';
  actors: Entreprise[];
  value: string[];
  onChange: (actorIds: string[]) => void;
}

type ActorSelectorProps = SingleSelectProps | MultipleSelectProps;

export default function ActorSelector(props: ActorSelectorProps) {
  const { actors, placeholder, multiple } = props;
  const type = props.type || 'entreprise';

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const label = ACTOR_TYPE_LABELS[type];
  const isEntreprise = type === 'entreprise';
  const colorClass = isEntreprise ? 'orange' : 'blue';

  // Filtrage
  const filteredActors = actors.filter(actor => {
    const matchName = actor.nom.toLowerCase().includes(search.toLowerCase());
    const matchEmail = 'email' in actor && actor.email?.toLowerCase().includes(search.toLowerCase());
    const matchSpecialites = 'specialites' in actor && (actor as Entreprise).specialites?.some(s =>
      (SPECIALITES_ENTREPRISE[s as keyof typeof SPECIALITES_ENTREPRISE] || s)
        .toLowerCase().includes(search.toLowerCase())
    );
    return matchName || matchEmail || matchSpecialites;
  });

  // Click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handlers
  const handleSelect = (actorId: string) => {
    if (multiple) {
      const currentValue = props.value as string[];
      if (currentValue.includes(actorId)) {
        props.onChange(currentValue.filter(id => id !== actorId));
      } else {
        props.onChange([...currentValue, actorId]);
      }
    } else {
      (props as SingleSelectProps).onChange(actorId);
      setIsOpen(false);
      setSearch('');
    }
  };

  const handleClear = (e: React.MouseEvent, actorId?: string) => {
    e.stopPropagation();
    if (multiple && actorId) {
      const currentValue = props.value as string[];
      props.onChange(currentValue.filter(id => id !== actorId));
    } else if (!multiple) {
      (props as SingleSelectProps).onChange(null);
    }
  };

  const isSelected = (actorId: string): boolean => {
    if (multiple) {
      return (props.value as string[]).includes(actorId);
    }
    return props.value === actorId;
  };

  // Rendu du trigger
  const renderTriggerContent = (): ReactNode => {
    if (multiple) {
      const selectedActors = actors.filter(a => (props.value as string[]).includes(a.id));
      if (selectedActors.length > 0) {
        return (
          <div className="flex flex-wrap gap-1 min-w-0 flex-1">
            {selectedActors.map(actor => (
              <span
                key={actor.id}
                className={`inline-flex items-center gap-1 px-2 py-0.5 bg-${colorClass}-100 text-${colorClass}-700 rounded text-sm`}
              >
                {actor.nom}
                <button
                  type="button"
                  onClick={(e) => handleClear(e, actor.id)}
                  className={`hover:text-${colorClass}-900`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        );
      }
    } else {
      const selectedActor = actors.find(a => a.id === props.value);
      if (selectedActor) {
        return (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <User className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="truncate text-gray-800">{selectedActor.nom}</span>
          </div>
        );
      }
    }
    return (
      <span className="text-gray-400">
        {placeholder || `Selectionner ${multiple ? 'des' : 'un'} ${label.toLowerCase()}${multiple ? 's' : ''}`}
      </span>
    );
  };

  // Rendu d'un item de la liste
  const renderActorItem = (actor: BaseActor | Entreprise): ReactNode => {
    const selected = isSelected(actor.id);
    const Icon = isEntreprise ? HardHat : User;

    return (
      <button
        key={actor.id}
        type="button"
        onClick={() => handleSelect(actor.id)}
        className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
          selected ? `bg-${colorClass}-50` : ''
        }`}
      >
        <div className={`p-1.5 rounded ${selected ? `bg-${colorClass}-100` : 'bg-gray-100'}`}>
          <Icon className={`w-4 h-4 ${selected ? `text-${colorClass}-600` : 'text-gray-500'}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-sm truncate ${selected ? `text-${colorClass}-700 font-medium` : 'text-gray-800'}`}>
            {actor.nom}
          </p>
          {'email' in actor && actor.email && !isEntreprise && (
            <p className="text-xs text-gray-500 truncate">{actor.email}</p>
          )}
          {'specialites' in actor && (actor as Entreprise).specialites?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-0.5">
              {(actor as Entreprise).specialites!.slice(0, 3).map(spec => (
                <span key={spec} className="text-xs text-gray-500">
                  {SPECIALITES_ENTREPRISE[spec as keyof typeof SPECIALITES_ENTREPRISE] || spec}
                </span>
              ))}
              {(actor as Entreprise).specialites!.length > 3 && (
                <span className="text-xs text-gray-400">+{(actor as Entreprise).specialites!.length - 3}</span>
              )}
            </div>
          )}
        </div>
        {multiple && selected && (
          <Check className={`w-4 h-4 text-${colorClass}-600 shrink-0`} />
        )}
      </button>
    );
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-h-[42px] flex items-center justify-between px-3 py-2 border rounded-lg transition-colors ${
          isOpen ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        {renderTriggerContent()}
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {!multiple && props.value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          {/* Search */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={isEntreprise ? 'Rechercher par nom ou specialite...' : 'Rechercher...'}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                autoFocus
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-60 overflow-y-auto">
            {filteredActors.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                {search ? 'Aucun resultat' : `Aucun ${label.toLowerCase()}`}
              </div>
            ) : (
              filteredActors.map(actor => renderActorItem(actor))
            )}
          </div>

          {/* Create new */}
          <div className="border-t p-2">
            <Link
              to={`/acteurs/${type}/nouveau`}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Creer {isEntreprise ? 'une nouvelle' : 'un nouveau'} {label.toLowerCase()}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
