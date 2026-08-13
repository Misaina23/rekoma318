import { prisma } from '../lib/prisma.js';
import jwt from 'jsonwebtoken';

export const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: "Jeton d'authentification manquant" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Récupérer l'utilisateur depuis la base de données
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: {
                member: true,
                userRoles: {
                    include: {
                        role: {
                            include: {
                                rolePermissions: {
                                    include: { permission: true }
                                }
                            }
                        }
                    }
                },
                userPermissions: {
                    include: { permission: true }
                }
            }
        });

        if (!user || !user.isActive) {
            return res.status(403).json({ error: "Compte inactif ou utilisateur introuvable" });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ error: "Jeton invalide ou expiré" });
    }
};