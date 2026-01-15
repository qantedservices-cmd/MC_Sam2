import { Router } from 'express';
import { prisma } from '../server.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { chantierId, type } = req.query;
    const photos = await prisma.photoChantier.findMany({
      where: {
        ...(chantierId && { chantierId: chantierId as string }),
        ...(type && { type: type as string })
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(photos);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const photo = await prisma.photoChantier.findUnique({ where: { id: req.params.id } });
    res.json(photo);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.post('/', async (req, res) => {
  try {
    const photo = await prisma.photoChantier.create({ data: req.body });
    res.status(201).json(photo);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const photo = await prisma.photoChantier.update({ where: { id: req.params.id }, data: req.body });
    res.json(photo);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.photoChantier.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

export default router;
