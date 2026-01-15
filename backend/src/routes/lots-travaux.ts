import { Router } from 'express';
import { prisma } from '../server.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { chantierId } = req.query;
    const lots = await prisma.lotTravaux.findMany({
      where: chantierId ? { chantierId: chantierId as string } : undefined,
      orderBy: { ordre: 'asc' }
    });
    res.json(lots);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const lot = await prisma.lotTravaux.findUnique({ where: { id: req.params.id } });
    res.json(lot);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.post('/', async (req, res) => {
  try {
    const lot = await prisma.lotTravaux.create({ data: req.body });
    res.status(201).json(lot);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const lot = await prisma.lotTravaux.update({ where: { id: req.params.id }, data: req.body });
    res.json(lot);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.lotTravaux.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

export default router;
