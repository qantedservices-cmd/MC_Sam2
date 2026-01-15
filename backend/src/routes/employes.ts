import { Router } from 'express';
import { prisma } from '../server.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const employes = await prisma.employe.findMany({
      include: { chantiers: true },
      orderBy: { nom: 'asc' }
    });
    res.json(employes.map(e => ({
      ...e,
      chantierIds: e.chantiers.map(c => c.chantierId),
      chantiers: undefined
    })));
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const employe = await prisma.employe.findUnique({
      where: { id: req.params.id },
      include: { chantiers: true }
    });
    if (!employe) return res.status(404).json({ error: 'Non trouvé' });
    res.json({
      ...employe,
      chantierIds: employe.chantiers.map(c => c.chantierId),
      chantiers: undefined
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { chantierIds, dateEmbauche, dateFin, ...data } = req.body;
    const employe = await prisma.employe.create({
      data: {
        ...data,
        dateEmbauche: new Date(dateEmbauche),
        dateFin: dateFin ? new Date(dateFin) : null,
        chantiers: chantierIds ? {
          create: chantierIds.map((id: string) => ({ chantierId: id }))
        } : undefined
      }
    });
    res.status(201).json({ ...employe, chantierIds: chantierIds || [] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { chantierIds, dateEmbauche, dateFin, ...data } = req.body;

    if (chantierIds) {
      await prisma.chantierEmploye.deleteMany({ where: { employeId: req.params.id } });
      await prisma.chantierEmploye.createMany({
        data: chantierIds.map((id: string) => ({ employeId: req.params.id, chantierId: id }))
      });
    }

    if (dateEmbauche) data.dateEmbauche = new Date(dateEmbauche);
    if (dateFin) data.dateFin = new Date(dateFin);

    const employe = await prisma.employe.update({
      where: { id: req.params.id },
      data
    });
    res.json({ ...employe, chantierIds: chantierIds || [] });
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.employe.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

export default router;
