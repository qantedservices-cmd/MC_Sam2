import { Router } from 'express';
import { prisma } from '../server.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'monchantier-secret-key';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const APP_URL = process.env.APP_URL || 'http://localhost:5173';

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

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

// Mot de passe oublié - envoie un email avec lien de réinitialisation
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    // Toujours répondre succès pour éviter l'énumération d'emails
    if (!user) {
      return res.json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
    }

    // Créer un token de réinitialisation (expire en 1 heure)
    const resetToken = jwt.sign(
      { userId: user.id, purpose: 'reset-password' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;

    // Envoyer l'email si Resend est configuré
    if (resend) {
      await resend.emails.send({
        from: 'MonChantier <noreply@monchantier.com>',
        to: email,
        subject: 'Réinitialisation de votre mot de passe - MonChantier',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #d97706;">MonChantier</h2>
            <p>Bonjour ${user.prenom},</p>
            <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
            <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
            <a href="${resetUrl}" style="display: inline-block; background-color: #d97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
              Réinitialiser mon mot de passe
            </a>
            <p style="color: #666; font-size: 14px;">Ce lien expire dans 1 heure.</p>
            <p style="color: #666; font-size: 14px;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">MonChantier - Suivi de chantiers BTP</p>
          </div>
        `
      });
    } else {
      // En dev sans Resend, log le lien
      console.log('Reset password link:', resetUrl);
    }

    res.json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email' });
  }
});

// Réinitialiser le mot de passe avec le token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token et mot de passe requis' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    // Vérifier le token
    let decoded: { userId: string; purpose: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string; purpose: string };
    } catch {
      return res.status(400).json({ error: 'Lien invalide ou expiré' });
    }

    if (decoded.purpose !== 'reset-password') {
      return res.status(400).json({ error: 'Token invalide' });
    }

    // Mettre à jour le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Erreur lors de la réinitialisation' });
  }
});

export default router;
