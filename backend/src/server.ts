import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

// Routes
import chantiersRouter from './routes/chantiers.js';
import depensesRouter from './routes/depenses.js';
import acteursRouter from './routes/acteurs.js';
import categoriesRouter from './routes/categories.js';
import usersRouter from './routes/users.js';
import authRouter from './routes/auth.js';
import employesRouter from './routes/employes.js';
import pointagesRouter from './routes/pointages.js';
import paiementsEmployeRouter from './routes/paiements-employes.js';
import materielsRouter from './routes/materiels.js';
import utilisationsMaterielRouter from './routes/utilisations-materiel.js';
import tachesRouter from './routes/taches.js';
import productionsRouter from './routes/productions.js';
import lotsTravauxRouter from './routes/lots-travaux.js';
import facturationsRouter from './routes/facturations.js';
import pvAvancementsRouter from './routes/pv-avancements.js';
import paiementsClientRouter from './routes/paiements-client.js';
import photosChantierRouter from './routes/photos-chantier.js';
import etatsAvancementRouter from './routes/etats-avancement.js';
import configRouter from './routes/config.js';
import devisRouter from './routes/devis.js';
import transfertsRouter from './routes/transferts.js';

export const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', database: 'postgresql' });
});

// Routes API
app.use('/chantiers', chantiersRouter);
app.use('/depenses', depensesRouter);
app.use('/clients', acteursRouter);
app.use('/moas', acteursRouter);
app.use('/moes', acteursRouter);
app.use('/entreprises', acteursRouter);
app.use('/categories', categoriesRouter);
app.use('/users', usersRouter);
app.use('/auth', authRouter);
app.use('/employes', employesRouter);
app.use('/pointages', pointagesRouter);
app.use('/paiements-employes', paiementsEmployeRouter);
app.use('/materiels', materielsRouter);
app.use('/utilisations-materiel', utilisationsMaterielRouter);
app.use('/taches', tachesRouter);
app.use('/productions', productionsRouter);
app.use('/lots-travaux', lotsTravauxRouter);
app.use('/facturations', facturationsRouter);
app.use('/pv-avancements', pvAvancementsRouter);
app.use('/paiements-client', paiementsClientRouter);
app.use('/photos-chantier', photosChantierRouter);
app.use('/etats-avancement', etatsAvancementRouter);
app.use('/config', configRouter);
app.use('/devis', devisRouter);
app.use('/transferts', transfertsRouter);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Erreur serveur' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database: PostgreSQL via Prisma`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
