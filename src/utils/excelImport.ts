import * as XLSX from 'xlsx';
import type { Depense, Devis, TransfertBudget, StatutDevis, DeviseType } from '../types';
import { LOTS_FORMS_MAPPING, CHANTIERS_FORMS_MAPPING } from '../types';

// ============ TYPES ============

export interface RawFormsRow {
  'Prix en compte par Samir'?: string;
  'Commentaire'?: string;
  'Préciser le type de paiement'?: string;
  'Horodateur'?: number | string;
  'Qui paie? (Dépenses)'?: string;
  'Montant payé? (Dépenses)'?: number;
  'A qui? (Dépenses)'?: string;
  'Si besoin préciser le "A qui"'?: string;
  'Pourquoi? (Dépenses)'?: string;
  'Si besoin préciser le "Pourquoi"'?: string;
  'Commentaire dépenses'?: string;
  'Photos factures'?: string;
  'Pourquoi? (Devis)'?: string;
  'Montant total du devis?'?: number;
  'Devis pour quel lot? (devis)'?: string;
  'Si besoin préciser le "lot"'?: string;
  'Devis par qui? (Nom - prénom - Société)'?: string;
  'Commentaire devis'?: string;
  'Photos du devis'?: string;
  'Qui donne le budget?'?: string;
  'Vers qui?'?: string;
  'Montant Budget transmis?'?: number;
  'En quel devise?'?: string;
  'Taux de Change'?: number;
  'Budget transmis converti en DT'?: number;
  'Commentaire Budget'?: string;
  'Photo du Transfert'?: string;
}

export interface ParsedEntry {
  type: 'depense' | 'devis' | 'transfert';
  rawData: RawFormsRow;
  data: Omit<Depense, 'id'> | Omit<Devis, 'id'> | Omit<TransfertBudget, 'id'>;
  errors: string[];
  warnings: string[];
  rowIndex: number;
}

export interface ImportStats {
  total: number;
  depenses: number;
  devis: number;
  transferts: number;
  errors: number;
  warnings: number;
}

// ============ PARSING ============

/**
 * Parse un fichier Excel et retourne les donnees brutes
 */
export function parseExcelFile(file: File): Promise<RawFormsRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<RawFormsRow>(sheet);
        resolve(jsonData);
      } catch (error) {
        reject(new Error('Erreur lors de la lecture du fichier Excel'));
      }
    };

    reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Convertit une date Excel en date ISO
 */
function excelDateToISO(excelDate: number | string | undefined): string {
  if (!excelDate) return new Date().toISOString().split('T')[0];

  if (typeof excelDate === 'string') {
    // Deja une date string
    const parsed = new Date(excelDate);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  }

  // Nombre Excel (jours depuis 1900-01-01)
  const date = new Date((excelDate - 25569) * 86400 * 1000);
  return date.toISOString().split('T')[0];
}

/**
 * Parse les URLs de photos (separees par virgule ou espace)
 */
function parsePhotosUrls(photosString: string | undefined): string[] {
  if (!photosString) return [];
  return photosString
    .split(/[,\s]+/)
    .filter(url => url.startsWith('http'))
    .map(url => url.trim());
}

/**
 * Mappe le nom du lot Forms vers l'ID de categorie MonChantier
 */
function mapLotToCategorie(lot: string | undefined): string {
  if (!lot) return 'autre';
  const mapped = LOTS_FORMS_MAPPING[lot];
  if (mapped) return mapped;

  // Essayer une correspondance partielle
  const lotLower = lot.toLowerCase();
  for (const [key, value] of Object.entries(LOTS_FORMS_MAPPING)) {
    if (key.toLowerCase().includes(lotLower) || lotLower.includes(key.toLowerCase())) {
      return value;
    }
  }

  return 'autre';
}

/**
 * Mappe le nom du chantier Forms vers l'ID MonChantier
 */
function mapChantierToId(chantierName: string | undefined): string | null {
  if (!chantierName) return null;
  const mapped = CHANTIERS_FORMS_MAPPING[chantierName];
  if (mapped) return mapped;

  // Essayer une correspondance partielle
  const nameLower = chantierName.toLowerCase();
  for (const [key, value] of Object.entries(CHANTIERS_FORMS_MAPPING)) {
    if (key.toLowerCase().includes(nameLower) || nameLower.includes(key.toLowerCase())) {
      return value;
    }
  }

  return null;
}

/**
 * Mappe la devise Forms vers DeviseType
 */
function mapDevise(devise: string | undefined): DeviseType {
  if (!devise) return 'DNT';
  const deviseLower = devise.toLowerCase();
  if (deviseLower.includes('eur')) return 'EUR';
  if (deviseLower.includes('usd') || deviseLower.includes('dollar')) return 'USD';
  return 'DNT';
}

// ============ CONVERSION ============

/**
 * Convertit une ligne brute en entree parsee
 */
export function parseFormsRow(row: RawFormsRow, rowIndex: number): ParsedEntry {
  const typeRaw = row['Préciser le type de paiement']?.toLowerCase() || '';
  const errors: string[] = [];
  const warnings: string[] = [];

  // Determiner le type d'entree
  let type: 'depense' | 'devis' | 'transfert' = 'depense';
  if (typeRaw.includes('devis')) {
    type = 'devis';
  } else if (typeRaw.includes('transfert') || typeRaw.includes('budget')) {
    type = 'transfert';
  }

  const date = excelDateToISO(row['Horodateur']);

  if (type === 'depense') {
    const chantierId = mapChantierToId(row['Pourquoi? (Dépenses)']);
    const montant = row['Montant payé? (Dépenses)'];

    if (!chantierId) {
      errors.push(`Chantier non reconnu: ${row['Pourquoi? (Dépenses)']}`);
    }
    if (!montant || montant <= 0) {
      errors.push('Montant invalide ou manquant');
    }

    const depense: Omit<Depense, 'id'> = {
      chantierId: chantierId || 'unknown',
      description: row['Si besoin préciser le "A qui"'] || row['A qui? (Dépenses)'] || 'Depense',
      montant: montant || 0,
      date,
      categorieId: mapLotToCategorie(row['A qui? (Dépenses)']),
      payeur: row['Qui paie? (Dépenses)'],
      beneficiaire: row['A qui? (Dépenses)'],
      commentaire: row['Commentaire dépenses'],
      photosUrls: parsePhotosUrls(row['Photos factures']),
      validated: row['Prix en compte par Samir']?.toLowerCase() === 'ok'
    };

    return { type: 'depense', rawData: row, data: depense, errors, warnings, rowIndex };
  }

  if (type === 'devis') {
    const chantierId = mapChantierToId(row['Pourquoi? (Devis)']);
    const montant = row['Montant total du devis?'];

    if (!chantierId) {
      warnings.push(`Chantier non reconnu pour devis: ${row['Pourquoi? (Devis)']}`);
    }
    if (!montant || montant <= 0) {
      errors.push('Montant devis invalide ou manquant');
    }

    const devis: Omit<Devis, 'id'> = {
      chantierId: chantierId || 'unknown',
      categorieId: mapLotToCategorie(row['Devis pour quel lot? (devis)']),
      montant: montant || 0,
      date,
      fournisseur: row['Devis par qui? (Nom - prénom - Société)'] || 'Inconnu',
      description: row['Si besoin préciser le "lot"'],
      commentaire: row['Commentaire devis'],
      photosUrls: parsePhotosUrls(row['Photos du devis']),
      statut: 'en_attente' as StatutDevis
    };

    return { type: 'devis', rawData: row, data: devis, errors, warnings, rowIndex };
  }

  // Transfert
  const montant = row['Montant Budget transmis?'];

  if (!montant || montant <= 0) {
    errors.push('Montant transfert invalide ou manquant');
  }

  const transfert: Omit<TransfertBudget, 'id'> = {
    date,
    source: row['Qui donne le budget?'] || 'Inconnu',
    destination: row['Vers qui?'] || 'Inconnu',
    montant: montant || 0,
    devise: mapDevise(row['En quel devise?']),
    tauxChange: row['Taux de Change'],
    montantConverti: row['Budget transmis converti en DT'],
    commentaire: row['Commentaire Budget'],
    photoUrl: parsePhotosUrls(row['Photo du Transfert'])[0]
  };

  return { type: 'transfert', rawData: row, data: transfert, errors, warnings, rowIndex };
}

/**
 * Parse toutes les lignes d'un fichier Forms
 */
export function parseAllFormsRows(rows: RawFormsRow[]): ParsedEntry[] {
  return rows.map((row, index) => parseFormsRow(row, index + 1));
}

/**
 * Calcule les statistiques d'import
 */
export function getImportStats(entries: ParsedEntry[]): ImportStats {
  return {
    total: entries.length,
    depenses: entries.filter(e => e.type === 'depense').length,
    devis: entries.filter(e => e.type === 'devis').length,
    transferts: entries.filter(e => e.type === 'transfert').length,
    errors: entries.filter(e => e.errors.length > 0).length,
    warnings: entries.filter(e => e.warnings.length > 0).length
  };
}

/**
 * Filtre les entrees valides (sans erreurs)
 */
export function getValidEntries(entries: ParsedEntry[]): ParsedEntry[] {
  return entries.filter(e => e.errors.length === 0);
}

/**
 * Separe les entrees par type
 */
export function separateByType(entries: ParsedEntry[]): {
  depenses: Omit<Depense, 'id'>[];
  devis: Omit<Devis, 'id'>[];
  transferts: Omit<TransfertBudget, 'id'>[];
} {
  const depenses: Omit<Depense, 'id'>[] = [];
  const devis: Omit<Devis, 'id'>[] = [];
  const transferts: Omit<TransfertBudget, 'id'>[] = [];

  for (const entry of entries) {
    if (entry.errors.length > 0) continue;

    if (entry.type === 'depense') {
      depenses.push(entry.data as Omit<Depense, 'id'>);
    } else if (entry.type === 'devis') {
      devis.push(entry.data as Omit<Devis, 'id'>);
    } else {
      transferts.push(entry.data as Omit<TransfertBudget, 'id'>);
    }
  }

  return { depenses, devis, transferts };
}
