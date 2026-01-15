import { Router, Request, Response } from 'express';
import { prisma } from '../server.js';

const router = Router();

// Determine model based on route path
const getModel = (req: Request) => {
  const path = req.baseUrl;
  if (path.includes('clients')) return prisma.client;
  if (path.includes('moas')) return prisma.moa;
  if (path.includes('moes')) return prisma.moe;
  if (path.includes('entreprises')) return prisma.entreprise;
  return prisma.client;
};

// GET all
router.get('/', async (req: Request, res: Response) => {
  try {
    const model = getModel(req) as any;
    const items = await model.findMany({ orderBy: { nom: 'asc' } });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

// GET one
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const model = getModel(req) as any;
    const item = await model.findUnique({ where: { id: req.params.id } });
    if (!item) {
      return res.status(404).json({ error: 'Non trouvé' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

// POST create
router.post('/', async (req: Request, res: Response) => {
  try {
    const model = getModel(req) as any;
    const item = await model.create({ data: req.body });
    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la création' });
  }
});

// PATCH update
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const model = getModel(req) as any;
    const item = await model.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
});

// DELETE
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const model = getModel(req) as any;
    await model.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

export default router;
