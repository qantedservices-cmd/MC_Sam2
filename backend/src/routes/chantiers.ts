import { Router } from 'express';
import { prisma } from '../server.js';

const router = Router();

// GET all chantiers
router.get('/', async (req, res) => {
  try {
    const chantiers = await prisma.chantier.findMany({
      include: {
        client: true,
        moa: true,
        moe: true,
        entreprises: { include: { entreprise: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format pour compatibilité avec l'ancien format
    const formatted = chantiers.map(c => ({
      ...c,
      entrepriseIds: c.entreprises.map(e => e.entrepriseId),
      entreprises: undefined
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des chantiers' });
  }
});

// GET one chantier
router.get('/:id', async (req, res) => {
  try {
    const chantier = await prisma.chantier.findUnique({
      where: { id: req.params.id },
      include: {
        client: true,
        moa: true,
        moe: true,
        entreprises: { include: { entreprise: true } }
      }
    });

    if (!chantier) {
      return res.status(404).json({ error: 'Chantier non trouvé' });
    }

    const formatted = {
      ...chantier,
      entrepriseIds: chantier.entreprises.map(e => e.entrepriseId),
      entreprises: undefined
    };

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération du chantier' });
  }
});

// POST create chantier
router.post('/', async (req, res) => {
  try {
    const { entrepriseIds, ...data } = req.body;

    const chantier = await prisma.chantier.create({
      data: {
        ...data,
        entreprises: entrepriseIds ? {
          create: entrepriseIds.map((id: string) => ({ entrepriseId: id }))
        } : undefined
      }
    });

    res.status(201).json({ ...chantier, entrepriseIds: entrepriseIds || [] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la création du chantier' });
  }
});

// PATCH/PUT update chantier
router.patch('/:id', async (req, res) => {
  try {
    const { entrepriseIds, ...data } = req.body;

    // Update entreprises if provided
    if (entrepriseIds) {
      await prisma.chantierEntreprise.deleteMany({
        where: { chantierId: req.params.id }
      });
      await prisma.chantierEntreprise.createMany({
        data: entrepriseIds.map((id: string) => ({
          chantierId: req.params.id,
          entrepriseId: id
        }))
      });
    }

    const chantier = await prisma.chantier.update({
      where: { id: req.params.id },
      data
    });

    res.json({ ...chantier, entrepriseIds: entrepriseIds || [] });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour du chantier' });
  }
});

// PUT redirects to PATCH logic
router.put('/:id', async (req, res) => {
  try {
    const { entrepriseIds, ...data } = req.body;

    if (entrepriseIds) {
      await prisma.chantierEntreprise.deleteMany({
        where: { chantierId: req.params.id }
      });
      await prisma.chantierEntreprise.createMany({
        data: entrepriseIds.map((id: string) => ({
          chantierId: req.params.id,
          entrepriseId: id
        }))
      });
    }

    const chantier = await prisma.chantier.update({
      where: { id: req.params.id },
      data
    });

    res.json({ ...chantier, entrepriseIds: entrepriseIds || [] });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour du chantier' });
  }
});

// DELETE chantier
router.delete('/:id', async (req, res) => {
  try {
    await prisma.chantier.delete({
      where: { id: req.params.id }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression du chantier' });
  }
});

export default router;
