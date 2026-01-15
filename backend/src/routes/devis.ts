import { Router } from 'express';
import { prisma } from '../server.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { chantierId } = req.query;
    const devisList = await prisma.devis.findMany({
      where: chantierId ? { chantierId: chantierId as string } : undefined,
      orderBy: { createdAt: 'desc' }
    });
    res.json(devisList);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const devis = await prisma.devis.findUnique({ where: { id: req.params.id } });
    res.json(devis);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.dateCreation) data.dateCreation = new Date(data.dateCreation);
    if (data.dateValidite) data.dateValidite = new Date(data.dateValidite);
    const devis = await prisma.devis.create({ data });
    res.status(201).json(devis);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.dateCreation) data.dateCreation = new Date(data.dateCreation);
    if (data.dateValidite) data.dateValidite = new Date(data.dateValidite);
    const devis = await prisma.devis.update({ where: { id: req.params.id }, data });
    res.json(devis);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.devis.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

export default router;
