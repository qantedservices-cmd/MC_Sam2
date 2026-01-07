import type { DeviseType } from '../types';

/**
 * Formate un montant dans la devise specifiee
 * @param montant - Le montant à formater
 * @param devise - La devise (DNT, EUR, USD)
 * @returns Le montant formaté
 */
export function formatMontant(montant: number, devise: DeviseType = 'EUR'): string {
  const currencyMap: Record<DeviseType, string> = {
    DNT: 'TND',
    EUR: 'EUR',
    USD: 'USD'
  };

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currencyMap[devise]
  }).format(montant);
}

/**
 * Taux de change par defaut (vers DNT)
 */
export const DEFAULT_EXCHANGE_RATES: Record<DeviseType, number> = {
  DNT: 1,
  EUR: 3.35,  // 1 EUR = 3.35 DNT
  USD: 3.10   // 1 USD = 3.10 DNT
};

/**
 * Convertit un montant d'une devise vers DNT
 */
export function convertToDNT(
  montant: number,
  fromDevise: DeviseType,
  rates: Record<DeviseType, number> = DEFAULT_EXCHANGE_RATES
): number {
  return montant * rates[fromDevise];
}

/**
 * Convertit un montant de DNT vers une autre devise
 */
export function convertFromDNT(
  montantDNT: number,
  toDevise: DeviseType,
  rates: Record<DeviseType, number> = DEFAULT_EXCHANGE_RATES
): number {
  return montantDNT / rates[toDevise];
}

/**
 * Convertit un montant entre deux devises
 */
export function convertCurrency(
  montant: number,
  fromDevise: DeviseType,
  toDevise: DeviseType,
  rates: Record<DeviseType, number> = DEFAULT_EXCHANGE_RATES
): number {
  if (fromDevise === toDevise) return montant;
  const inDNT = convertToDNT(montant, fromDevise, rates);
  return convertFromDNT(inDNT, toDevise, rates);
}

/**
 * Formate une date en format français court
 * @param dateStr - La date au format ISO (ex: "2025-12-21")
 * @returns La date formatée (ex: "21 déc. 2025")
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Formate une date en format français long
 * @param dateStr - La date au format ISO
 * @returns La date formatée (ex: "21 décembre 2025")
 */
export function formatDateLong(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Formate un pourcentage
 * @param value - La valeur (ex: 0.75 pour 75%)
 * @param decimals - Nombre de décimales (défaut: 1)
 * @returns Le pourcentage formaté (ex: "75,0 %")
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value / 100);
}
