import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from './middleware/auth.js';

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

// CORS - restreint aux origines autorisées
const allowedOrigins = [
  'http://localhost:5173',           // Dev local Vite
  'http://localhost:8080',           // Dev local Docker
  'http://72.61.105.112:8080',       // Production
  process.env.FRONTEND_URL           // Variable d'environnement si définie
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origin (curl, Postman, etc.) en dev
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Health check (public)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', database: 'postgresql' });
});

// Routes publiques (sans auth)
app.use('/auth', authRouter);
app.use('/config', configRouter);  // Config publique pour charger les taux

// Middleware auth pour toutes les routes protégées
app.use(authMiddleware);

// Routes protégées (requièrent authentification)
app.use('/chantiers', chantiersRouter);
app.use('/depenses', depensesRouter);
app.use('/clients', acteursRouter);
app.use('/moas', acteursRouter);
app.use('/moes', acteursRouter);
app.use('/entreprises', acteursRouter);
app.use('/categories', categoriesRouter);
app.use('/users', usersRouter);
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
