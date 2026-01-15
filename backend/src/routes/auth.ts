import { Router } from 'express';
import { prisma } from '../server.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'monchantier-secret-key';

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { chantiers: true }
    });

    if (!user || !user.actif) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      session: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        fonction: user.fonction,
        telephone: user.telephone,
        role: user.role,
        chantierIds: user.chantiers.map(c => c.chantierId)
      },
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur de connexion' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { email, password, nom, prenom, telephone, fonction } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nom,
        prenom,
        telephone,
        fonction,
        role: 'client'
      }
    });

    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la création du compte' });
  }
});

export default router;
