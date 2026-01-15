import { Router } from 'express';
import { prisma } from '../server.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { chantierId, lotId } = req.query;
    const facturations = await prisma.facturation.findMany({
      where: {
        ...(chantierId && { chantierId: chantierId as string }),
        ...(lotId && { lotId: lotId as string })
      },
      orderBy: { date: 'desc' }
    });
    res.json(facturations);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const facturation = await prisma.facturation.findUnique({ where: { id: req.params.id } });
    res.json(facturation);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.dateFacture) data.dateFacture = new Date(data.dateFacture);
    const facturation = await prisma.facturation.create({ data });
    res.status(201).json(facturation);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.dateFacture) data.dateFacture = new Date(data.dateFacture);
    const facturation = await prisma.facturation.update({ where: { id: req.params.id }, data });
    res.json(facturation);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.facturation.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

export default router;
