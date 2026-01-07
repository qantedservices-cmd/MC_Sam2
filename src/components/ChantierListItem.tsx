import { Link } from 'react-router-dom';
import type { Chantier, Depense } from '../types';
import { STATUTS_CHANTIER } from '../types';
import { formatMontant } from '../utils/format';
import { ChevronRight } from 'lucide-react';
import { calculateBudgetStats, getStatusBadgeClasses } from '../utils/budgetHelpers';

interface ChantierListItemProps {
  chantier: Chantier;
  depenses: Depense[];
}

export default function ChantierListItem({ chantier, depenses }: ChantierListItemProps) {
  const { totalDepenses, reste, progression, isOverBudget } = calculateBudgetStats(
    chantier.budgetPrevisionnel,
    depenses
  );

  return (
    <Link
      to={`/chantiers/${chantier.id}`}
      className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow flex items-center gap-4"
      aria-label={`Voir le chantier ${chantier.nom}`}
    >
      {/* Barre de progression verticale */}
      <div className="w-2 h-16 bg-gray-200 rounded-full overflow-hidden flex flex-col-reverse">
        <div
          className={`w-full ${isOverBudget ? 'bg-red-500' : 'bg-blue-500'}`}
          style={{ height: `${Math.min(progression, 100)}%` }}
        />
      </div>

      {/* Infos principales */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-bold text-gray-800 truncate">{chantier.nom}</h3>
          <span className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${getStatusBadgeClasses(chantier.statut)}`}>
            {STATUTS_CHANTIER[chantier.statut]}
          </span>
        </div>
        <p className="text-gray-500 text-sm truncate">{chantier.adresse}</p>
      </div>

      {/* Budget */}
      <div className="text-right hidden sm:block">
        <p className="text-sm text-gray-500">Budget</p>
        <p className="font-medium text-gray-800">{formatMontant(chantier.budgetPrevisionnel)}</p>
      </div>

      {/* Dépenses */}
      <div className="text-right hidden sm:block">
        <p className="text-sm text-gray-500">Dépensé</p>
        <p className="font-medium text-red-600">{formatMontant(totalDepenses)}</p>
      </div>

      {/* Reste */}
      <div className="text-right hidden md:block">
        <p className="text-sm text-gray-500">Reste</p>
        <p className={`font-medium ${reste >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatMontant(reste)}
        </p>
      </div>

      {/* Progression */}
      <div className="text-right w-16">
        <p className={`font-bold ${isOverBudget ? 'text-red-600' : 'text-gray-800'}`}>
          {progression.toFixed(0)}%
        </p>
        <p className="text-xs text-gray-500">{depenses.length} dép.</p>
      </div>

      {/* Chevron */}
      <ChevronRight className="w-5 h-5 text-gray-400" />
    </Link>
  );
}
