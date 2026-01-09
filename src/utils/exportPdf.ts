import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Chantier, Depense, Categorie, Client, MOA, MOE, Entreprise, Facturation, LotTravaux } from '../types';
import { STATUTS_CHANTIER, ACTOR_TYPE_LABELS, SPECIALITES_ENTREPRISE, STATUTS_FACTURATION, UNITES_METRAGE } from '../types';
import { getCategoryLabel } from '../services/api';
import { formatMontant, formatDate } from './format';

interface ChantierActors {
  client: Client | null;
  moa: MOA | null;
  moe: MOE | null;
  entreprises: Entreprise[];
}

/**
 * Exporte tous les chantiers en PDF
 */
export function exportAllChantiersPdf(
  chantiers: Chantier[],
  depenses: Depense[],
  _categories: Categorie[]
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Titre
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('MonChantier - Rapport Global', pageWidth / 2, 20, { align: 'center' });

  // Date du rapport
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Genere le ${formatDate(new Date().toISOString())}`, pageWidth / 2, 28, { align: 'center' });

  // Calculs globaux
  const budgetTotal = chantiers.reduce((sum, c) => sum + c.budgetPrevisionnel, 0);
  const depensesTotal = depenses.reduce((sum, d) => sum + d.montant, 0);
  const resteTotal = budgetTotal - depensesTotal;

  // Résumé global
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Resume Global', 14, 45);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Budget Total: ${formatMontant(budgetTotal)}`, 14, 55);
  doc.text(`Depenses Totales: ${formatMontant(depensesTotal)}`, 14, 62);
  doc.text(`Reste: ${formatMontant(resteTotal)}`, 14, 69);
  doc.text(`Nombre de chantiers: ${chantiers.length}`, 14, 76);

  // Tableau des chantiers
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Liste des Chantiers', 14, 92);

  const chantiersData = chantiers.map(chantier => {
    const depensesChantier = depenses
      .filter(d => d.chantierId === chantier.id)
      .reduce((sum, d) => sum + d.montant, 0);
    const reste = chantier.budgetPrevisionnel - depensesChantier;
    const progression = ((depensesChantier / chantier.budgetPrevisionnel) * 100).toFixed(1);

    return [
      chantier.nom,
      chantier.adresse,
      STATUTS_CHANTIER[chantier.statut],
      formatMontant(chantier.budgetPrevisionnel),
      formatMontant(depensesChantier),
      formatMontant(reste),
      `${progression}%`
    ];
  });

  autoTable(doc, {
    startY: 98,
    head: [['Nom', 'Adresse', 'Statut', 'Budget', 'Depenses', 'Reste', '%']],
    body: chantiersData,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [59, 130, 246] },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 40 },
      2: { cellWidth: 20 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25 },
      5: { cellWidth: 25 },
      6: { cellWidth: 15 }
    }
  });

  // Télécharger le PDF
  doc.save('monchantier-rapport-global.pdf');
}

/**
 * Exporte un chantier specifique en PDF avec ses depenses et acteurs
 */
export function exportChantierPdf(
  chantier: Chantier,
  depenses: Depense[],
  categories: Categorie[],
  actors?: ChantierActors
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Titre
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('MonChantier', pageWidth / 2, 20, { align: 'center' });

  // Nom du chantier
  doc.setFontSize(16);
  doc.text(chantier.nom, pageWidth / 2, 32, { align: 'center' });

  // Date du rapport
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Rapport genere le ${formatDate(new Date().toISOString())}`, pageWidth / 2, 40, { align: 'center' });

  // Informations du chantier
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Informations', 14, 55);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Adresse: ${chantier.adresse || 'Non renseignee'}`, 14, 65);
  doc.text(`Statut: ${STATUTS_CHANTIER[chantier.statut]}`, 14, 72);
  doc.text(`Date de creation: ${formatDate(chantier.dateCreation)}`, 14, 79);

  // Finances
  const totalDepenses = depenses.reduce((sum, d) => sum + d.montant, 0);
  const reste = chantier.budgetPrevisionnel - totalDepenses;
  const progression = ((totalDepenses / chantier.budgetPrevisionnel) * 100).toFixed(1);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Finances', 14, 95);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Budget previsionnel: ${formatMontant(chantier.budgetPrevisionnel)}`, 14, 105);
  doc.text(`Total depenses: ${formatMontant(totalDepenses)}`, 14, 112);
  doc.text(`Reste: ${formatMontant(reste)}`, 14, 119);
  doc.text(`Progression: ${progression}%`, 14, 126);

  if (totalDepenses > chantier.budgetPrevisionnel) {
    doc.setTextColor(220, 38, 38);
    doc.text('DEPASSEMENT DE BUDGET', 14, 133);
    doc.setTextColor(0, 0, 0);
  }

  // Section Acteurs
  let currentY = 145;
  const hasActors = actors && (actors.client || actors.moa || actors.moe || actors.entreprises.length > 0);

  if (hasActors) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Intervenants', 14, currentY);
    currentY += 8;

    const actorsData: string[][] = [];

    if (actors.client) {
      actorsData.push([
        ACTOR_TYPE_LABELS.client,
        actors.client.nom,
        actors.client.telephone || '-',
        actors.client.email || '-'
      ]);
    }

    if (actors.moa) {
      actorsData.push([
        ACTOR_TYPE_LABELS.moa,
        actors.moa.nom,
        actors.moa.telephone || '-',
        actors.moa.email || '-'
      ]);
    }

    if (actors.moe) {
      actorsData.push([
        ACTOR_TYPE_LABELS.moe,
        actors.moe.nom,
        actors.moe.telephone || '-',
        actors.moe.email || '-'
      ]);
    }

    actors.entreprises.forEach(ent => {
      const specs = ent.specialites?.map(s =>
        SPECIALITES_ENTREPRISE[s as keyof typeof SPECIALITES_ENTREPRISE] || s
      ).join(', ') || '';
      actorsData.push([
        `${ACTOR_TYPE_LABELS.entreprise}${specs ? ` (${specs})` : ''}`,
        ent.nom,
        ent.telephone || '-',
        ent.email || '-'
      ]);
    });

    if (actorsData.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [['Role', 'Nom', 'Telephone', 'Email']],
        body: actorsData,
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [139, 92, 246] },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 50 },
          2: { cellWidth: 35 },
          3: { cellWidth: 55 }
        }
      });
      currentY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || currentY + 30;
      currentY += 10;
    }
  }

  // Tableau des depenses
  if (depenses.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Depenses (${depenses.length})`, 14, currentY);

    const depensesData = depenses
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(depense => [
        formatDate(depense.date),
        depense.description,
        getCategoryLabel(categories, depense.categorieId),
        formatMontant(depense.montant)
      ]);

    autoTable(doc, {
      startY: currentY + 6,
      head: [['Date', 'Description', 'Categorie', 'Montant']],
      body: depensesData,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 80 },
        2: { cellWidth: 35 },
        3: { cellWidth: 30 }
      },
      foot: [['', '', 'TOTAL', formatMontant(totalDepenses)]],
      footStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: 'bold' }
    });
  } else {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    doc.text('Aucune depense enregistree', 14, currentY + 10);
  }

  // Répartition par catégorie
  const depensesByCategorie = depenses.reduce((acc, d) => {
    acc[d.categorieId] = (acc[d.categorieId] || 0) + d.montant;
    return acc;
  }, {} as Record<string, number>);

  if (Object.keys(depensesByCategorie).length > 0) {
    const lastTableY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 180;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Repartition par Categorie', 14, lastTableY + 15);

    const categorieData = Object.entries(depensesByCategorie).map(([catId, montant]) => [
      getCategoryLabel(categories, catId),
      formatMontant(montant),
      `${((montant / totalDepenses) * 100).toFixed(1)}%`
    ]);

    autoTable(doc, {
      startY: lastTableY + 21,
      head: [['Categorie', 'Montant', 'Part']],
      body: categorieData,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [16, 185, 129] },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 50 },
        2: { cellWidth: 30 }
      }
    });
  }

  // Télécharger le PDF
  const fileName = `chantier-${chantier.nom.toLowerCase().replace(/\s+/g, '-')}.pdf`;
  doc.save(fileName);
}

/**
 * Exporte une facture en PDF
 */
export function exportFacturePdf(
  facture: Facturation,
  chantier: Chantier,
  _lots: LotTravaux[],
  client?: Client | null
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // En-tête entreprise (gauche)
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('MonChantier', 14, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Gestion de chantiers BTP', 14, 27);

  // FACTURE (droite)
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(59, 130, 246);
  doc.text('FACTURE', pageWidth - 14, 20, { align: 'right' });

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`N° ${facture.numero}`, pageWidth - 14, 28, { align: 'right' });

  // Statut
  const statutLabel = STATUTS_FACTURATION[facture.statut];
  const statutColor = facture.statut === 'paye' ? [34, 197, 94] :
                      facture.statut === 'valide' ? [59, 130, 246] :
                      facture.statut === 'refuse' ? [239, 68, 68] : [107, 114, 128];
  doc.setTextColor(statutColor[0], statutColor[1], statutColor[2]);
  doc.text(statutLabel.toUpperCase(), pageWidth - 14, 35, { align: 'right' });
  doc.setTextColor(0, 0, 0);

  // Ligne séparatrice
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 42, pageWidth - 14, 42);

  // Informations client (gauche)
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Client', 14, 52);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  if (client) {
    doc.text(client.nom, 14, 59);
    if (client.adresse) doc.text(client.adresse, 14, 65);
    if (client.email) doc.text(client.email, 14, 71);
    if (client.telephone) doc.text(client.telephone, 14, 77);
  } else {
    doc.text('Client non renseigne', 14, 59);
  }

  // Informations facture (droite)
  doc.setFont('helvetica', 'bold');
  doc.text('Details', pageWidth - 80, 52);

  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${formatDate(facture.date)}`, pageWidth - 80, 59);
  doc.text(`Periode: ${formatDate(facture.periodeDebut)} - ${formatDate(facture.periodeFin)}`, pageWidth - 80, 65);
  doc.text(`Chantier: ${chantier.nom}`, pageWidth - 80, 71);

  // Tableau des lignes de facture
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Details des travaux', 14, 95);

  const lignesData = facture.lignes.map(ligne => {
    return [
      ligne.lotNom || 'Lot inconnu',
      `${ligne.quantiteAFacturer} ${UNITES_METRAGE[ligne.unite] || ''}`,
      formatMontant(ligne.prixUnitaire),
      formatMontant(ligne.montant)
    ];
  });

  autoTable(doc, {
    startY: 100,
    head: [['Designation', 'Quantite', 'Prix unitaire', 'Montant HT']],
    body: lignesData,
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' }
    }
  });

  // Totaux
  const lastY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 150;

  const totauxStartX = pageWidth - 80;
  let currentY = lastY + 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Montant HT
  doc.text('Total HT:', totauxStartX, currentY);
  doc.text(formatMontant(facture.montantHT), pageWidth - 14, currentY, { align: 'right' });
  currentY += 7;

  // TVA
  doc.text(`TVA (${facture.tauxTva}%):`, totauxStartX, currentY);
  doc.text(formatMontant(facture.tva), pageWidth - 14, currentY, { align: 'right' });
  currentY += 7;

  // Ligne séparatrice
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.5);
  doc.line(totauxStartX, currentY, pageWidth - 14, currentY);
  currentY += 7;

  // Total TTC
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Total TTC:', totauxStartX, currentY);
  doc.setTextColor(59, 130, 246);
  doc.text(formatMontant(facture.montantTTC), pageWidth - 14, currentY, { align: 'right' });
  doc.setTextColor(0, 0, 0);

  // Commentaire si present
  if (facture.commentaire) {
    currentY += 20;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Commentaire:', 14, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(facture.commentaire, 14, currentY + 6);
  }

  // Pied de page
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(128, 128, 128);
  doc.text('Document genere par MonChantier - Application de gestion BTP', pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Télécharger
  const fileName = `facture-${facture.numero.replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
}
