import { Router } from 'express';
import { prisma } from '../server.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { chantierId } = req.query;
    const etats = await prisma.etatAvancement.findMany({
      where: chantierId ? { chantierId: chantierId as string } : undefined,
      orderBy: { date: 'desc' }
    });
    res.json(etats);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const etat = await prisma.etatAvancement.findUnique({ where: { id: req.params.id } });
    res.json(etat);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.date) data.date = new Date(data.date);
    const etat = await prisma.etatAvancement.create({ data });
    res.status(201).json(etat);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.date) data.date = new Date(data.date);
    const etat = await prisma.etatAvancement.update({ where: { id: req.params.id }, data });
    res.json(etat);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.etatAvancement.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

export default router;
