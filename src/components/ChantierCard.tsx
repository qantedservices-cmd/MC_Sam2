import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Chantier, Depense, Categorie } from '../types';
import { STATUTS_CHANTIER } from '../types';
import { formatMontant } from '../utils/format';
import { getCategoryLabel } from '../services/api';
import { calculateBudgetStats, getStatusBadgeClasses } from '../utils/budgetHelpers';
import { ChevronDown, ChevronRight, Image as ImageIcon } from 'lucide-react';

interface ChantierCardProps {
  chantier: Chantier;
  depenses: Depense[];
  categories: Categorie[];
}

interface DepensesByCategorie {
  categorieId: string;
  categorieNom: string;
  total: number;
  depenses: Depense[];
}

export default function ChantierCard({ chantier, depenses, categories }: ChantierCardProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const { totalDepenses, progression, isOverBudget } = calculateBudgetStats(
    chantier.budgetPrevisionnel,
    depenses
  );

  // Grouper les dépenses par catégorie
  const depensesParCategorie = useMemo((): DepensesByCategorie[] => {
    const grouped: Record<string, DepensesByCategorie> = {};

    depenses.forEach(depense => {
      const catId = depense.categorieId || 'autre';
      if (!grouped[catId]) {
        grouped[catId] = {
          categorieId: catId,
          categorieNom: getCategoryLabel(categories, catId),
          total: 0,
          depenses: []
        };
      }
      grouped[catId].total += depense.montant;
      grouped[catId].depenses.push(depense);
    });

    // Trier par total décroissant
    return Object.values(grouped).sort((a, b) => b.total - a.total);
  }, [depenses, categories]);

  const toggleCategorie = (catId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(catId)) {
        newSet.delete(catId);
      } else {
        newSet.add(catId);
      }
      return newSet;
    });
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
      {/* Photo de présentation */}
      <Link to={`/chantiers/${chantier.id}`}>
        <div className="relative h-40 bg-gray-100">
          {chantier.photoPresentationUrl ? (
            <img
              src={chantier.photoPresentationUrl}
              alt={chantier.nom}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <ImageIcon className="w-12 h-12 text-gray-300" />
            </div>
          )}
          {/* Badge statut sur la photo */}
          <span className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClasses(chantier.statut)}`}>
            {STATUTS_CHANTIER[chantier.statut]}
          </span>
        </div>
      </Link>

      <div className="p-4">
        {/* Titre et adresse */}
        <Link to={`/chantiers/${chantier.id}`}>
          <h3 className="font-bold text-lg text-gray-800 hover:text-blue-600">{chantier.nom}</h3>
          <p className="text-gray-500 text-sm mb-3">{chantier.adresse}</p>
        </Link>

        {/* Budget et progression */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Budget: <span className="font-medium">{formatMontant(chantier.budgetPrevisionnel, chantier.devise)}</span></span>
            <span className="text-gray-600">Dépensé: <span className={`font-medium ${isOverBudget ? 'text-red-600' : ''}`}>{formatMontant(totalDepenses, chantier.devise)}</span></span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${isOverBudget ? 'bg-red-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min(progression, 100)}%` }}
            />
          </div>
          <p className={`text-xs text-right ${isOverBudget ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
            {progression.toFixed(1)}% utilisé
            {isOverBudget && ' - Dépassement !'}
          </p>
        </div>

        {/* Dépenses par lot/catégorie */}
        <div className="border-t pt-3">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Répartition par lot ({depenses.length} opérations)
          </p>

          {depensesParCategorie.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Aucune dépense</p>
          ) : (
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {depensesParCategorie.map(cat => (
                <div key={cat.categorieId} className="border rounded-lg overflow-hidden">
                  {/* Header de la catégorie - cliquable pour expand */}
                  <button
                    onClick={(e) => toggleCategorie(cat.categorieId, e)}
                    className="w-full flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      {expandedCategories.has(cat.categorieId) ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-sm font-medium text-gray-700">{cat.categorieNom}</span>
                      <span className="text-xs text-gray-400">({cat.depenses.length})</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-800">
                      {formatMontant(cat.total, chantier.devise)}
                    </span>
                  </button>

                  {/* Détail des opérations - visible si expanded */}
                  {expandedCategories.has(cat.categorieId) && (
                    <div className="border-t bg-white">
                      {cat.depenses.map(dep => (
                        <div key={dep.id} className="flex justify-between items-center px-3 py-1.5 text-xs border-b last:border-b-0 hover:bg-gray-50">
                          <span className="text-gray-600 truncate flex-1 mr-2">{dep.description}</span>
                          <span className="text-gray-800 font-medium whitespace-nowrap">
                            {formatMontant(dep.montant, chantier.devise)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lien vers détail */}
        <Link
          to={`/chantiers/${chantier.id}`}
          className="block mt-3 text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Voir le détail
        </Link>
      </div>
    </div>
  );
}
