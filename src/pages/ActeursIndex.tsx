import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getClients, getMoas, getMoes, getEntreprises, getChantiers } from '../services/api';
import type { Client, MOA, MOE, Entreprise, ActorType, Chantier } from '../types';
import { ACTOR_TYPE_LABELS } from '../types';
import ActorCard from '../components/ActorCard';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { PlusCircle, Users, Building2, Briefcase, HardHat, Search, ChevronDown } from 'lucide-react';

type Actor = Client | MOA | MOE | Entreprise;

const TABS: { type: ActorType; label: string; icon: React.ReactNode }[] = [
  { type: 'client', label: 'Clients', icon: <Users className="w-4 h-4" /> },
  { type: 'moa', label: 'MOA', icon: <Building2 className="w-4 h-4" /> },
  { type: 'moe', label: 'MOE', icon: <Briefcase className="w-4 h-4" /> },
  { type: 'entreprise', label: 'Entreprises', icon: <HardHat className="w-4 h-4" /> }
];

export default function ActeursIndex() {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = (searchParams.get('type') as ActorType) || 'client';

  const [activeTab, setActiveTab] = useState<ActorType>(defaultTab);
  const [actors, setActors] = useState<{ [key in ActorType]: Actor[] }>({
    client: [],
    moa: [],
    moe: [],
    entreprise: []
  });
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [clients, moas, moes, entreprises, chantiersData] = await Promise.all([
        getClients(),
        getMoas(),
        getMoes(),
        getEntreprises(),
        getChantiers()
      ]);
      setActors({
        client: clients,
        moa: moas,
        moe: moes,
        entreprise: entreprises
      });
      setChantiers(chantiersData);
    } catch (err) {
      setError('Erreur lors du chargement des acteurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTabChange = (type: ActorType) => {
    setActiveTab(type);
    setSearchParams({ type });
    setSearchTerm('');
  };

  // Count chantiers for each actor
  const getActorChantiersCount = (actorId: string, type: ActorType): number => {
    return chantiers.filter(c => {
      if (type === 'client') return c.clientId === actorId;
      if (type === 'moa') return c.moaId === actorId;
      if (type === 'moe') return c.moeId === actorId;
      if (type === 'entreprise') return c.entrepriseIds?.includes(actorId);
      return false;
    }).length;
  };

  // Filter actors by search term
  const filteredActors = actors[activeTab].filter(actor =>
    actor.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    actor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    actor.adresse?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <Loading message="Chargement des acteurs..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadData} showHomeLink />;
  }

  const totalActors = Object.values(actors).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Acteurs</h1>
          <p className="text-gray-500">{totalActors} acteur{totalActors > 1 ? 's' : ''} au total</p>
        </div>
        <Link
          to={`/acteurs/${activeTab}/nouveau`}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusCircle className="w-5 h-5" />
          Nouveau {ACTOR_TYPE_LABELS[activeTab]}
        </Link>
      </div>

      {/* Tabs - Desktop */}
      <div className="bg-white rounded-lg shadow mb-6">
        {/* Mobile dropdown */}
        <div className="sm:hidden p-3 border-b">
          <div className="relative">
            <select
              value={activeTab}
              onChange={(e) => handleTabChange(e.target.value as ActorType)}
              className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TABS.map(tab => (
                <option key={tab.type} value={tab.type}>
                  {tab.label} ({actors[tab.type].length})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Desktop tabs */}
        <div className="hidden sm:flex border-b">
          {TABS.map(tab => (
            <button
              key={tab.type}
              onClick={() => handleTabChange(tab.type)}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.type
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.type ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
              }`}>
                {actors[tab.type].length}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={`Rechercher un ${ACTOR_TYPE_LABELS[activeTab].toLowerCase()}...`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Actor list */}
        <div className="p-4">
          {filteredActors.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm
                  ? `Aucun ${ACTOR_TYPE_LABELS[activeTab].toLowerCase()} ne correspond a votre recherche`
                  : `Aucun ${ACTOR_TYPE_LABELS[activeTab].toLowerCase()} enregistre`
                }
              </p>
              {!searchTerm && (
                <Link
                  to={`/acteurs/${activeTab}/nouveau`}
                  className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-800"
                >
                  <PlusCircle className="w-4 h-4" />
                  Ajouter un {ACTOR_TYPE_LABELS[activeTab].toLowerCase()}
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredActors.map(actor => (
                <ActorCard
                  key={actor.id}
                  actor={actor}
                  type={activeTab}
                  chantiersCount={getActorChantiersCount(actor.id, activeTab)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
