/**
 * Script de migration des donnees Google Forms vers MonChantier
 *
 * Usage:
 *   npx tsx scripts/migrate-forms-data.ts
 *
 * Ce script lit le fichier Excel des reponses Forms et importe les donnees
 * dans la base de donnees JSON Server.
 */

import XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = 'http://localhost:3001';
const EXCEL_FILE = path.join(__dirname, '../11_Input/260107_Copie_Réponses_Forms_Suivi_Construction.xlsx');

// Types
interface RawFormsRow {
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

// Mappings
const LOTS_FORMS_MAPPING: Record<string, string> = {
  'Materiel': 'materiel',
  'Matériel': 'materiel',
  'Mounir (Tvx)': 'main_oeuvre',
  'Menuiserie': 'travaux_menuiserie',
  'Peinture': 'travaux_peinture',
  'Carrelage': 'travaux_carrelage',
  'Dalles': 'travaux_maconnerie',
  'Hdid': 'materiel_fournitures',
  'Aluminium': 'travaux_menuiserie',
  'Marbre': 'travaux_carrelage',
  'Meubles': 'materiel_equipement',
  'Electricite': 'travaux_electricite',
  'Électricité': 'travaux_electricite',
  'Peinture Matériel': 'materiel_fournitures'
};

const CHANTIERS_FORMS_MAPPING: Record<string, string> = {
  'Samir Maison': 'samir_maison',
  'Commun Garages': 'commun_garages',
  'Wissem Housh': 'wissem_housh',
  'Commun Autre': 'commun_autre',
  'Samir Autre': 'samir_autre',
  'Wissem Autre': 'wissem_autre',
  'Anis & Samiha': 'anis_samiha'
};

// Helpers
function excelDateToISO(excelDate: number | string | undefined): string {
  if (!excelDate) return new Date().toISOString().split('T')[0];

  if (typeof excelDate === 'string') {
    const parsed = new Date(excelDate);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  }

  const date = new Date((excelDate - 25569) * 86400 * 1000);
  return date.toISOString().split('T')[0];
}

function parsePhotosUrls(photosString: string | undefined): string[] {
  if (!photosString) return [];
  return photosString
    .split(/[,\s]+/)
    .filter(url => url.startsWith('http'))
    .map(url => url.trim());
}

function mapLotToCategorie(lot: string | undefined): string {
  if (!lot) return 'autre';
  const mapped = LOTS_FORMS_MAPPING[lot];
  if (mapped) return mapped;

  const lotLower = lot.toLowerCase();
  for (const [key, value] of Object.entries(LOTS_FORMS_MAPPING)) {
    if (key.toLowerCase().includes(lotLower) || lotLower.includes(key.toLowerCase())) {
      return value;
    }
  }

  return 'autre';
}

function mapChantierToId(chantierName: string | undefined): string | null {
  if (!chantierName) return null;
  const mapped = CHANTIERS_FORMS_MAPPING[chantierName];
  if (mapped) return mapped;

  const nameLower = chantierName.toLowerCase();
  for (const [key, value] of Object.entries(CHANTIERS_FORMS_MAPPING)) {
    if (key.toLowerCase().includes(nameLower) || nameLower.includes(key.toLowerCase())) {
      return value;
    }
  }

  return null;
}

function mapDevise(devise: string | undefined): 'DNT' | 'EUR' | 'USD' {
  if (!devise) return 'DNT';
  const deviseLower = devise.toLowerCase();
  if (deviseLower.includes('eur')) return 'EUR';
  if (deviseLower.includes('usd') || deviseLower.includes('dollar')) return 'USD';
  return 'DNT';
}

// Parse row
function parseFormsRow(row: RawFormsRow, index: number) {
  const typeRaw = row['Préciser le type de paiement']?.toLowerCase() || '';

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

    if (!chantierId || !montant || montant <= 0) {
      return null; // Skip invalid
    }

    return {
      type: 'depense',
      data: {
        chantierId,
        description: row['Si besoin préciser le "A qui"'] || row['A qui? (Dépenses)'] || 'Depense',
        montant,
        date,
        categorieId: mapLotToCategorie(row['A qui? (Dépenses)']),
        payeur: row['Qui paie? (Dépenses)'],
        beneficiaire: row['A qui? (Dépenses)'],
        commentaire: row['Commentaire dépenses'],
        photosUrls: parsePhotosUrls(row['Photos factures']),
        validated: row['Prix en compte par Samir']?.toLowerCase() === 'ok'
      }
    };
  }

  if (type === 'devis') {
    const chantierId = mapChantierToId(row['Pourquoi? (Devis)']);
    const montant = row['Montant total du devis?'];

    if (!montant || montant <= 0) {
      return null; // Skip invalid
    }

    return {
      type: 'devis',
      data: {
        chantierId: chantierId || 'unknown',
        categorieId: mapLotToCategorie(row['Devis pour quel lot? (devis)']),
        montant,
        date,
        fournisseur: row['Devis par qui? (Nom - prénom - Société)'] || 'Inconnu',
        description: row['Si besoin préciser le "lot"'],
        commentaire: row['Commentaire devis'],
        photosUrls: parsePhotosUrls(row['Photos du devis']),
        statut: 'en_attente'
      }
    };
  }

  // Transfert
  const montant = row['Montant Budget transmis?'];

  if (!montant || montant <= 0) {
    return null; // Skip invalid
  }

  return {
    type: 'transfert',
    data: {
      date,
      source: row['Qui donne le budget?'] || 'Inconnu',
      destination: row['Vers qui?'] || 'Inconnu',
      montant,
      devise: mapDevise(row['En quel devise?']),
      tauxChange: row['Taux de Change'],
      montantConverti: row['Budget transmis converti en DT'],
      commentaire: row['Commentaire Budget'],
      photoUrl: parsePhotosUrls(row['Photo du Transfert'])[0]
    }
  };
}

// API calls
async function postData(endpoint: string, data: unknown) {
  const response = await fetch(`${API_URL}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    throw new Error(`Failed to POST to ${endpoint}: ${response.statusText}`);
  }
  return response.json();
}

// Main
async function main() {
  console.log('=== Migration des donnees Google Forms ===\n');

  // Check if Excel file exists
  if (!fs.existsSync(EXCEL_FILE)) {
    console.error(`Fichier Excel non trouve: ${EXCEL_FILE}`);
    process.exit(1);
  }

  // Read Excel file
  console.log('Lecture du fichier Excel...');
  const workbook = XLSX.readFile(EXCEL_FILE);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows: RawFormsRow[] = XLSX.utils.sheet_to_json(sheet);

  console.log(`${rows.length} lignes trouvees\n`);

  // Parse all rows
  const depenses: unknown[] = [];
  const devis: unknown[] = [];
  const transferts: unknown[] = [];
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const parsed = parseFormsRow(rows[i], i + 1);
    if (!parsed) {
      skipped++;
      continue;
    }

    if (parsed.type === 'depense') {
      depenses.push(parsed.data);
    } else if (parsed.type === 'devis') {
      devis.push(parsed.data);
    } else {
      transferts.push(parsed.data);
    }
  }

  console.log('Statistiques:');
  console.log(`  - Depenses: ${depenses.length}`);
  console.log(`  - Devis: ${devis.length}`);
  console.log(`  - Transferts: ${transferts.length}`);
  console.log(`  - Ignores (invalides): ${skipped}\n`);

  // Check if JSON server is running
  try {
    await fetch(API_URL);
  } catch {
    console.error('JSON Server non accessible sur http://localhost:3001');
    console.log('Lancez: npm run server');
    process.exit(1);
  }

  // Import data
  console.log('Import des depenses...');
  let importedDepenses = 0;
  for (const d of depenses) {
    try {
      await postData('depenses', d);
      importedDepenses++;
    } catch (e) {
      console.error('Erreur:', e);
    }
  }
  console.log(`  ${importedDepenses} depenses importees`);

  console.log('Import des devis...');
  let importedDevis = 0;
  for (const d of devis) {
    try {
      await postData('devis', d);
      importedDevis++;
    } catch (e) {
      console.error('Erreur:', e);
    }
  }
  console.log(`  ${importedDevis} devis importes`);

  console.log('Import des transferts...');
  let importedTransferts = 0;
  for (const t of transferts) {
    try {
      await postData('transferts', t);
      importedTransferts++;
    } catch (e) {
      console.error('Erreur:', e);
    }
  }
  console.log(`  ${importedTransferts} transferts importes`);

  console.log('\n=== Migration terminee ===');
  console.log(`Total: ${importedDepenses + importedDevis + importedTransferts} entrees importees`);

  // Calculate totals
  const totalDepenses = depenses.reduce((sum: number, d: any) => sum + (d.montant || 0), 0);
  console.log(`\nTotal depenses: ${totalDepenses.toLocaleString('fr-FR')} DNT`);
}

main().catch(console.error);
