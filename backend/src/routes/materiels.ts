import { Router } from 'express';
import { prisma } from '../server.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const materiels = await prisma.materiel.findMany({ orderBy: { nom: 'asc' } });
    res.json(materiels);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const materiel = await prisma.materiel.findUnique({ where: { id: req.params.id } });
    res.json(materiel);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.post('/', async (req, res) => {
  try {
    const materiel = await prisma.materiel.create({ data: req.body });
    res.status(201).json(materiel);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const materiel = await prisma.materiel.update({ where: { id: req.params.id }, data: req.body });
    res.json(materiel);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.materiel.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

export default router;
