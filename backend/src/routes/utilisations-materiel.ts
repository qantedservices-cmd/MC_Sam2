import { Router } from 'express';
import { prisma } from '../server.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { chantierId } = req.query;
    const utilisations = await prisma.utilisationMateriel.findMany({
      where: chantierId ? { chantierId: chantierId as string } : undefined,
      orderBy: { date: 'desc' }
    });
    res.json(utilisations);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const utilisation = await prisma.utilisationMateriel.findUnique({ where: { id: req.params.id } });
    res.json(utilisation);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.post('/', async (req, res) => {
  try {
    const utilisation = await prisma.utilisationMateriel.create({
      data: { ...req.body, date: new Date(req.body.date) }
    });
    res.status(201).json(utilisation);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.date) data.date = new Date(data.date);
    const utilisation = await prisma.utilisationMateriel.update({ where: { id: req.params.id }, data });
    res.json(utilisation);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.utilisationMateriel.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

export default router;
