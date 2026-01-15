import { Router } from 'express';
import { prisma } from '../server.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { chantierId } = req.query;
    const taches = await prisma.tache.findMany({
      where: chantierId ? { chantierId: chantierId as string } : undefined,
      orderBy: { createdAt: 'desc' }
    });
    res.json(taches);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const tache = await prisma.tache.findUnique({ where: { id: req.params.id } });
    res.json(tache);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.post('/', async (req, res) => {
  try {
    const tache = await prisma.tache.create({ data: req.body });
    res.status(201).json(tache);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const tache = await prisma.tache.update({ where: { id: req.params.id }, data: req.body });
    res.json(tache);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.tache.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

export default router;
