import { Link } from 'react-router-dom';
import type { Chantier, Depense, Categorie } from '../types';
import { STATUTS_CHANTIER } from '../types';
import { formatMontant } from '../utils/format';
import { getCategoryLabel } from '../services/api';
import { calculateBudgetStats, getStatusBadgeClasses, getCategoryStyle } from '../utils/budgetHelpers';

interface ChantierCardProps {
  chantier: Chantier;
  depenses: Depense[];
  categories: Categorie[];
}

export default function ChantierCard({ chantier, depenses, categories }: ChantierCardProps) {
  const { totalDepenses, progression, isOverBudget } = calculateBudgetStats(
    chantier.budgetPrevisionnel,
    depenses
  );

  return (
    <Link
      to={`/chantiers/${chantier.id}`}
      className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow block"
      aria-label={`Voir le chantier ${chantier.nom}`}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-lg text-gray-800">{chantier.nom}</h3>
        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClasses(chantier.statut)}`}>
          {STATUTS_CHANTIER[chantier.statut]}
        </span>
      </div>
      <p className="text-gray-500 text-sm mb-4">{chantier.adresse}</p>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Budget: {formatMontant(chantier.budgetPrevisionnel)}</span>
          <span>Dépensé: {formatMontant(totalDepenses)}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-blue-500'}`}
            style={{ width: `${Math.min(progression, 100)}%` }}
          />
        </div>
        <p className={`text-xs text-right ${isOverBudget ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
          {progression.toFixed(1)}% utilisé
          {isOverBudget && ' - Dépassement !'}
        </p>
      </div>

      {/* Dépenses du chantier */}
      <div className="mt-4 border-t pt-4">
        <p className="text-sm font-medium text-gray-700 mb-2">
          Dépenses ({depenses.length})
        </p>
        {depenses.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Aucune dépense</p>
        ) : (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {depenses.map(depense => (
              <div key={depense.id} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-gray-800">{depense.description}</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs ${getCategoryStyle(depense.categorieId)}`}>
                    {getCategoryLabel(categories, depense.categorieId)}
                  </span>
                </div>
                <span className="font-medium text-gray-700">{formatMontant(depense.montant)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
