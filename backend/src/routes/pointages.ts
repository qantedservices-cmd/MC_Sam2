import { Router } from 'express';
import { prisma } from '../server.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { chantierId, employeId } = req.query;
    const pointages = await prisma.pointage.findMany({
      where: {
        ...(chantierId && { chantierId: chantierId as string }),
        ...(employeId && { employeId: employeId as string })
      },
      orderBy: { date: 'desc' }
    });
    res.json(pointages);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const pointage = await prisma.pointage.findUnique({ where: { id: req.params.id } });
    res.json(pointage);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.post('/', async (req, res) => {
  try {
    const pointage = await prisma.pointage.create({
      data: { ...req.body, date: new Date(req.body.date) }
    });
    res.status(201).json(pointage);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.date) data.date = new Date(data.date);
    const pointage = await prisma.pointage.update({ where: { id: req.params.id }, data });
    res.json(pointage);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.pointage.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

export default router;
