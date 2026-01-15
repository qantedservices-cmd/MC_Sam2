import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

interface DbJson {
  clients?: any[];
  moas?: any[];
  moes?: any[];
  entreprises?: any[];
  chantiers?: any[];
  categories?: any[];
  depenses?: any[];
  users?: any[];
  employes?: any[];
  pointages?: any[];
  'paiements-employes'?: any[];
  materiels?: any[];
  'utilisations-materiel'?: any[];
  taches?: any[];
  productions?: any[];
  'lots-travaux'?: any[];
  facturations?: any[];
  'pv-avancements'?: any[];
  'paiements-client'?: any[];
  'photos-chantier'?: any[];
  'etats-avancement'?: any[];
  devis?: any[];
  transferts?: any[];
  config?: any;
}

async function seed() {
  console.log('🌱 Starting database seed...');

  // Read db.json - path relative to project root
  const dbPath = process.env.DB_JSON_PATH || join(__dirname, '../../data/db.json');
  console.log(`📄 Reading data from: ${dbPath}`);

  let db: DbJson;
  try {
    const data = readFileSync(dbPath, 'utf-8');
    db = JSON.parse(data);
  } catch (error) {
    console.error('❌ Could not read db.json:', error);
    process.exit(1);
  }

  // Helper to safely parse dates
  const parseDate = (dateStr: string | undefined | null): Date => {
    if (!dateStr) return new Date();
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? new Date() : date;
  };

  try {
    // 1. Config
    if (db.config) {
      console.log('⚙️ Migrating config...');
      const configData = {
        deviseAffichage: db.config.deviseAffichage || 'DNT',
        tauxChange: db.config.tauxChange || { EUR: 3.35, USD: 3.10, DNT: 1 },
        lastUpdated: parseDate(db.config.lastUpdated)
      };
      await prisma.config.upsert({
        where: { id: 'config' },
        update: configData,
        create: { id: 'config', ...configData }
      });
    }

    // 2. Clients
    if (db.clients?.length) {
      console.log(`👤 Migrating ${db.clients.length} clients...`);
      for (const client of db.clients) {
        await prisma.client.upsert({
          where: { id: client.id },
          update: client,
          create: client
        });
      }
    }

    // 3. MOAs
    if (db.moas?.length) {
      console.log(`🏛️ Migrating ${db.moas.length} moas...`);
      for (const moa of db.moas) {
        await prisma.moa.upsert({
          where: { id: moa.id },
          update: moa,
          create: moa
        });
      }
    }

    // 4. MOEs
    if (db.moes?.length) {
      console.log(`📐 Migrating ${db.moes.length} moes...`);
      for (const moe of db.moes) {
        await prisma.moe.upsert({
          where: { id: moe.id },
          update: moe,
          create: moe
        });
      }
    }

    // 5. Entreprises
    if (db.entreprises?.length) {
      console.log(`🏢 Migrating ${db.entreprises.length} entreprises...`);
      for (const entreprise of db.entreprises) {
        await prisma.entreprise.upsert({
          where: { id: entreprise.id },
          update: entreprise,
          create: entreprise
        });
      }
    }

    // 6. Categories
    if (db.categories?.length) {
      console.log(`📁 Migrating ${db.categories.length} categories...`);
      for (const cat of db.categories) {
        await prisma.categorie.upsert({
          where: { id: cat.id },
          update: cat,
          create: cat
        });
      }
    }

    // 7. Users (skip - we already created admin user with hashed password)
    // The db.json users have plaintext passwords which won't work with bcrypt
    console.log(`👥 Skipping users from db.json (admin already created)...`);

    // 8. Employes
    if (db.employes?.length) {
      console.log(`👷 Migrating ${db.employes.length} employes...`);
      for (const emp of db.employes) {
        const { chantierIds, ...empData } = emp;
        // Convert dates
        if (empData.dateEmbauche) empData.dateEmbauche = parseDate(empData.dateEmbauche);
        if (empData.dateFin) empData.dateFin = parseDate(empData.dateFin);
        if (empData.createdAt) empData.createdAt = parseDate(empData.createdAt);
        await prisma.employe.upsert({
          where: { id: emp.id },
          update: empData,
          create: empData
        });
      }
    }

    // 9. Materiels
    if (db.materiels?.length) {
      console.log(`🔧 Migrating ${db.materiels.length} materiels...`);
      for (const mat of db.materiels) {
        await prisma.materiel.upsert({
          where: { id: mat.id },
          update: mat,
          create: mat
        });
      }
    }

    // 10. Chantiers (with relations)
    if (db.chantiers?.length) {
      console.log(`🏗️ Migrating ${db.chantiers.length} chantiers...`);
      for (const chantier of db.chantiers) {
        const { entrepriseIds, ...chantierData } = chantier;

        // Convert dates
        if (chantierData.dateDebut) chantierData.dateDebut = parseDate(chantierData.dateDebut);
        if (chantierData.dateFin) chantierData.dateFin = parseDate(chantierData.dateFin);
        if (chantierData.dateCreation) chantierData.dateCreation = parseDate(chantierData.dateCreation);
        if (chantierData.createdAt) chantierData.createdAt = parseDate(chantierData.createdAt);
        if (chantierData.updatedAt) chantierData.updatedAt = parseDate(chantierData.updatedAt);

        await prisma.chantier.upsert({
          where: { id: chantier.id },
          update: chantierData,
          create: chantierData
        });

        // Create ChantierEntreprise relations
        if (entrepriseIds?.length) {
          for (const entId of entrepriseIds) {
            await prisma.chantierEntreprise.upsert({
              where: { chantierId_entrepriseId: { chantierId: chantier.id, entrepriseId: entId } },
              update: {},
              create: { chantierId: chantier.id, entrepriseId: entId }
            });
          }
        }
      }

      // Create UserChantier relations
      if (db.users?.length) {
        for (const user of db.users) {
          if (user.chantierIds?.length) {
            for (const chId of user.chantierIds) {
              await prisma.userChantier.upsert({
                where: { userId_chantierId: { userId: user.id, chantierId: chId } },
                update: {},
                create: { userId: user.id, chantierId: chId }
              });
            }
          }
        }
      }

      // Create ChantierEmploye relations
      if (db.employes?.length) {
        for (const emp of db.employes) {
          if (emp.chantierIds?.length) {
            for (const chId of emp.chantierIds) {
              await prisma.chantierEmploye.upsert({
                where: { employeId_chantierId: { employeId: emp.id, chantierId: chId } },
                update: {},
                create: { chantierId: chId, employeId: emp.id }
              });
            }
          }
        }
      }
    }

    // 11. Depenses
    if (db.depenses?.length) {
      console.log(`💰 Migrating ${db.depenses.length} depenses...`);
      for (const dep of db.depenses) {
        // Remove fields not in Prisma schema
        const { payeur, beneficiaire, photosUrls, validated, commentaire, ...depData } = dep;
        if (depData.date) depData.date = parseDate(depData.date);
        if (depData.createdAt) depData.createdAt = parseDate(depData.createdAt);
        await prisma.depense.upsert({
          where: { id: dep.id },
          update: depData,
          create: depData
        });
      }
    }

    // 12. Devis
    if (db.devis?.length) {
      console.log(`📋 Migrating ${db.devis.length} devis...`);
      for (const d of db.devis) {
        // Remove fields not in Prisma schema
        const { categorieId, commentaire, photosUrls, dateCreation, ...devisData } = d;
        if (devisData.date) devisData.date = parseDate(devisData.date);
        if (devisData.dateValidite) devisData.dateValidite = parseDate(devisData.dateValidite);
        if (devisData.createdAt) devisData.createdAt = parseDate(devisData.createdAt);
        if (devisData.updatedAt) devisData.updatedAt = parseDate(devisData.updatedAt);
        // Ensure required fields have defaults
        if (!devisData.description) devisData.description = '';
        await prisma.devis.upsert({
          where: { id: d.id },
          update: devisData,
          create: devisData
        });
      }
    }

    // 13. Transferts
    if (db.transferts?.length) {
      console.log(`🔄 Migrating ${db.transferts.length} transferts...`);
      for (const t of db.transferts) {
        const tData = { ...t };
        if (tData.date) tData.date = parseDate(tData.date);
        await prisma.transfertBudget.upsert({
          where: { id: t.id },
          update: tData,
          create: tData
        });
      }
    }

    // 14. Pointages
    if (db.pointages?.length) {
      console.log(`⏰ Migrating ${db.pointages.length} pointages...`);
      for (const p of db.pointages) {
        const pData = { ...p };
        if (pData.date) pData.date = parseDate(pData.date);
        await prisma.pointage.upsert({
          where: { id: p.id },
          update: pData,
          create: pData
        });
      }
    }

    // 15. Paiements Employes
    const paiementsEmp = db['paiements-employes'];
    if (paiementsEmp?.length) {
      console.log(`💵 Migrating ${paiementsEmp.length} paiements-employes...`);
      for (const p of paiementsEmp) {
        const pData = { ...p };
        if (pData.datePaiement) pData.datePaiement = parseDate(pData.datePaiement);
        await prisma.paiementEmploye.upsert({
          where: { id: p.id },
          update: pData,
          create: pData
        });
      }
    }

    // 16. Utilisations Materiel
    const utilMat = db['utilisations-materiel'];
    if (utilMat?.length) {
      console.log(`🛠️ Migrating ${utilMat.length} utilisations-materiel...`);
      for (const u of utilMat) {
        const uData = { ...u };
        if (uData.date) uData.date = parseDate(uData.date);
        await prisma.utilisationMateriel.upsert({
          where: { id: u.id },
          update: uData,
          create: uData
        });
      }
    }

    // 17. Taches
    if (db.taches?.length) {
      console.log(`📝 Migrating ${db.taches.length} taches...`);
      for (const t of db.taches) {
        await prisma.tache.upsert({
          where: { id: t.id },
          update: t,
          create: t
        });
      }
    }

    // 18. Productions
    if (db.productions?.length) {
      console.log(`🏭 Migrating ${db.productions.length} productions...`);
      for (const p of db.productions) {
        const pData = { ...p };
        if (pData.date) pData.date = parseDate(pData.date);
        await prisma.production.upsert({
          where: { id: p.id },
          update: pData,
          create: pData
        });
      }
    }

    // 19. Lots Travaux
    const lotsTravaux = db['lots-travaux'];
    if (lotsTravaux?.length) {
      console.log(`📦 Migrating ${lotsTravaux.length} lots-travaux...`);
      for (const l of lotsTravaux) {
        await prisma.lotTravaux.upsert({
          where: { id: l.id },
          update: l,
          create: l
        });
      }
    }

    // 20. Facturations
    if (db.facturations?.length) {
      console.log(`🧾 Migrating ${db.facturations.length} facturations...`);
      for (const f of db.facturations) {
        const fData = { ...f };
        if (fData.dateFacture) fData.dateFacture = parseDate(fData.dateFacture);
        await prisma.facturation.upsert({
          where: { id: f.id },
          update: fData,
          create: fData
        });
      }
    }

    // 21. PV Avancements
    const pvAvancements = db['pv-avancements'];
    if (pvAvancements?.length) {
      console.log(`📊 Migrating ${pvAvancements.length} pv-avancements...`);
      for (const pv of pvAvancements) {
        const pvData = { ...pv };
        if (pvData.date) pvData.date = parseDate(pvData.date);
        await prisma.pVAvancement.upsert({
          where: { id: pv.id },
          update: pvData,
          create: pvData
        });
      }
    }

    // 22. Paiements Client
    const paiementsClient = db['paiements-client'];
    if (paiementsClient?.length) {
      console.log(`💳 Migrating ${paiementsClient.length} paiements-client...`);
      for (const p of paiementsClient) {
        const pData = { ...p };
        if (pData.datePaiement) pData.datePaiement = parseDate(pData.datePaiement);
        await prisma.paiementClient.upsert({
          where: { id: p.id },
          update: pData,
          create: pData
        });
      }
    }

    // 23. Photos Chantier
    const photosChantier = db['photos-chantier'];
    if (photosChantier?.length) {
      console.log(`📷 Migrating ${photosChantier.length} photos-chantier...`);
      for (const ph of photosChantier) {
        await prisma.photoChantier.upsert({
          where: { id: ph.id },
          update: ph,
          create: ph
        });
      }
    }

    // 24. Etats Avancement
    const etatsAvancement = db['etats-avancement'];
    if (etatsAvancement?.length) {
      console.log(`📈 Migrating ${etatsAvancement.length} etats-avancement...`);
      for (const e of etatsAvancement) {
        const eData = { ...e };
        if (eData.date) eData.date = parseDate(eData.date);
        await prisma.etatAvancement.upsert({
          where: { id: e.id },
          update: eData,
          create: eData
        });
      }
    }

    console.log('✅ Database seed completed successfully!');
  } catch (error) {
    console.error('❌ Error during seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed();
