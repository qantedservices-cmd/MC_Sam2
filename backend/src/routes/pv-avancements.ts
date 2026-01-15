import { Router } from 'express';
import { prisma } from '../server.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { chantierId } = req.query;
    const pvAvancements = await prisma.pVAvancement.findMany({
      where: chantierId ? { chantierId: chantierId as string } : undefined,
      orderBy: { date: 'desc' }
    });
    res.json(pvAvancements);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const pvAvancement = await prisma.pVAvancement.findUnique({ where: { id: req.params.id } });
    res.json(pvAvancement);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.date) data.date = new Date(data.date);
    const pvAvancement = await prisma.pVAvancement.create({ data });
    res.status(201).json(pvAvancement);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.date) data.date = new Date(data.date);
    const pvAvancement = await prisma.pVAvancement.update({ where: { id: req.params.id }, data });
    res.json(pvAvancement);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.pVAvancement.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

export default router;
