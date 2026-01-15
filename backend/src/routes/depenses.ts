import { Router } from 'express';
import { prisma } from '../server.js';

const router = Router();

// GET all depenses (with optional chantierId filter)
router.get('/', async (req, res) => {
  try {
    const { chantierId } = req.query;
    const depenses = await prisma.depense.findMany({
      where: chantierId ? { chantierId: chantierId as string } : undefined,
      orderBy: { date: 'desc' }
    });
    res.json(depenses);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des dépenses' });
  }
});

// GET one depense
router.get('/:id', async (req, res) => {
  try {
    const depense = await prisma.depense.findUnique({
      where: { id: req.params.id }
    });
    if (!depense) {
      return res.status(404).json({ error: 'Dépense non trouvée' });
    }
    res.json(depense);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération de la dépense' });
  }
});

// POST create depense
router.post('/', async (req, res) => {
  try {
    const depense = await prisma.depense.create({
      data: {
        ...req.body,
        date: new Date(req.body.date)
      }
    });
    res.status(201).json(depense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la création de la dépense' });
  }
});

// PATCH update depense
router.patch('/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.date) data.date = new Date(data.date);

    const depense = await prisma.depense.update({
      where: { id: req.params.id },
      data
    });
    res.json(depense);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la dépense' });
  }
});

// DELETE depense
router.delete('/:id', async (req, res) => {
  try {
    await prisma.depense.delete({
      where: { id: req.params.id }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression de la dépense' });
  }
});

export default router;
