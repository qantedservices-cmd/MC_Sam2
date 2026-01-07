import type { Depense, StatutChantier } from '../types';

export interface BudgetStats {
  totalDepenses: number;
  reste: number;
  progression: number;
  isOverBudget: boolean;
}

/**
 * Calcule les statistiques budgetaires pour un chantier
 */
export function calculateBudgetStats(budget: number, depenses: Depense[]): BudgetStats {
  const totalDepenses = depenses.reduce((sum, d) => sum + d.montant, 0);
  const reste = budget - totalDepenses;
  const progression = budget > 0 ? (totalDepenses / budget) * 100 : 0;
  const isOverBudget = progression > 100;
  return { totalDepenses, reste, progression, isOverBudget };
}

/**
 * Retourne les classes CSS pour le badge de statut d'un chantier
 */
export function getStatusBadgeClasses(statut: StatutChantier): string {
  switch (statut) {
    case 'en_cours': return 'bg-blue-100 text-blue-800';
    case 'termine': return 'bg-green-100 text-green-800';
    case 'suspendu': return 'bg-yellow-100 text-yellow-800';
  }
}

/**
 * Retourne les classes CSS pour un badge de categorie
 */
export function getCategoryStyle(categorieId: string): string {
  if (categorieId.startsWith('travaux')) return 'bg-blue-100 text-blue-700';
  if (categorieId.startsWith('materiel')) return 'bg-orange-100 text-orange-700';
  if (categorieId === 'main_oeuvre') return 'bg-purple-100 text-purple-700';
  if (categorieId === 'location') return 'bg-cyan-100 text-cyan-700';
  if (categorieId === 'sous_traitance') return 'bg-pink-100 text-pink-700';
  return 'bg-gray-100 text-gray-700';
}
