import { Router } from 'express';
import { prisma } from '../server.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { chantierId, tacheId } = req.query;
    const productions = await prisma.production.findMany({
      where: {
        ...(chantierId && { chantierId: chantierId as string }),
        ...(tacheId && { tacheId: tacheId as string })
      },
      orderBy: { date: 'desc' }
    });
    res.json(productions);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const production = await prisma.production.findUnique({ where: { id: req.params.id } });
    res.json(production);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.date) data.date = new Date(data.date);
    const production = await prisma.production.create({ data });
    res.status(201).json(production);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.date) data.date = new Date(data.date);
    const production = await prisma.production.update({ where: { id: req.params.id }, data });
    res.json(production);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.production.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

export default router;
