import { Router } from 'express';
import { prisma } from '../server.js';
import bcrypt from 'bcryptjs';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { email } = req.query;
    const users = await prisma.user.findMany({
      where: email ? { email: email as string } : undefined,
      orderBy: { nom: 'asc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { chantiers: true }
    });
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    res.json({
      ...user,
      chantierIds: user.chantiers.map(c => c.chantierId),
      chantiers: undefined
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { chantierIds, password, ...data } = req.body;

    // Check if email exists
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        chantiers: chantierIds ? {
          create: chantierIds.map((id: string) => ({ chantierId: id }))
        } : undefined
      }
    });

    res.status(201).json({ ...user, chantierIds: chantierIds || [] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { chantierIds, password, ...data } = req.body;

    // Update chantiers if provided
    if (chantierIds) {
      await prisma.userChantier.deleteMany({ where: { userId: req.params.id } });
      await prisma.userChantier.createMany({
        data: chantierIds.map((id: string) => ({ userId: req.params.id, chantierId: id }))
      });
    }

    // Hash password if provided
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data
    });

    res.json({ ...user, chantierIds: chantierIds || [] });
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

export default router;
