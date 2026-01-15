import { Router } from 'express';
import { prisma } from '../server.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    let config = await prisma.config.findUnique({ where: { id: 'config' } });

    if (!config) {
      config = await prisma.config.create({
        data: {
          id: 'config',
          deviseAffichage: 'DNT',
          tauxChange: { EUR: 3.35, USD: 3.10, DNT: 1 }
        }
      });
    }

    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.patch('/', async (req, res) => {
  try {
    const config = await prisma.config.upsert({
      where: { id: 'config' },
      update: { ...req.body, lastUpdated: new Date() },
      create: { id: 'config', ...req.body }
    });
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

export default router;
