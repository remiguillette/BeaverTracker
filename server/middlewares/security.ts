import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';

/**
 * Génère un nonce aléatoire pour les en-têtes CSP
 */
const generateNonce = (): string => {
  return randomBytes(16).toString('base64');
};

/**
 * Applique les en-têtes de sécurité HTTP
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Générer un nonce unique pour cette requête (utilisé pour CSP)
  const nonce = generateNonce();
  
  // Appliquer les en-têtes de sécurité uniquement pour les routes d'API, pas pour les fichiers statiques Vite
  if (req.path.startsWith('/api')) {
    // Protection contre le MIME-sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Contrôle des référents
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Protection XSS
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Pas de mise en cache pour les données sensibles
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
  }
  
  // Ajouter le nonce à la requête pour l'utiliser dans les templates/rendus
  (req as any).nonce = nonce;
  
  next();
};

/**
 * Valide les entrées pour prévenir les injections
 */
export const validateInput = (req: Request, res: Response, next: NextFunction) => {
  // Appliquer uniquement sur les routes API
  if (!req.path.startsWith('/api')) {
    return next();
  }
  
  // Fonction pour nettoyer les entrées
  const sanitizeInput = (data: any): any => {
    if (typeof data === 'string') {
      // Échapper les caractères spéciaux HTML
      return data
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    } else if (Array.isArray(data)) {
      return data.map(item => sanitizeInput(item));
    } else if (data && typeof data === 'object') {
      const sanitized: any = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          // Ignorer le contenu binaire (comme les uploads de fichiers)
          if (key !== 'buffer' && key !== 'file' && key !== 'files') {
            sanitized[key] = sanitizeInput(data[key]);
          } else {
            sanitized[key] = data[key];
          }
        }
      }
      return sanitized;
    }
    return data;
  };

  // Nettoyer le corps de la requête
  if (req.body && Object.keys(req.body).length > 0 && 
      !req.is('multipart/form-data') && // Ne pas traiter les uploads de fichiers
      req.method !== 'GET') {
    req.body = sanitizeInput(req.body);
  }

  // Nettoyer les paramètres de requête
  if (req.query && Object.keys(req.query).length > 0) {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeInput(req.query[key] as string);
      }
    }
  }

  // Nettoyer les paramètres d'URL
  if (req.params && Object.keys(req.params).length > 0) {
    for (const key in req.params) {
      req.params[key] = sanitizeInput(req.params[key]);
    }
  }

  next();
};

/**
 * Protection basique contre les attaques par force brute
 */
export const rateLimiter = (() => {
  const requestCounts: Record<string, { count: number, lastReset: number }> = {};
  const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  const MAX_REQUESTS = 100; // Limite de requêtes par fenêtre de temps
  
  return (req: Request, res: Response, next: NextFunction) => {
    // Appliquer uniquement sur les routes d'API sensibles
    if (!req.path.startsWith('/api/documents')) {
      return next();
    }
    
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    // Initialiser ou réinitialiser le compteur si nécessaire
    if (!requestCounts[ip] || now - requestCounts[ip].lastReset > WINDOW_MS) {
      requestCounts[ip] = { count: 1, lastReset: now };
      return next();
    }
    
    // Incrémenter le compteur
    requestCounts[ip].count++;
    
    // Vérifier si la limite est dépassée
    if (requestCounts[ip].count > MAX_REQUESTS) {
      return res.status(429).json({ message: 'Trop de requêtes. Veuillez réessayer plus tard.' });
    }
    
    next();
  };
})();

/**
 * Validation spécifique pour les routes sensibles
 */
export const validateDocumentAccess = (req: Request, res: Response, next: NextFunction) => {
  const documentId = req.params.id;
  
  // Vérifier que l'ID est un nombre valide
  if (!/^\d+$/.test(documentId)) {
    return res.status(400).json({ message: 'Format d\'identifiant de document invalide' });
  }
  
  // Ajouter ici d'autres validations spécifiques aux documents
  
  next();
};

/**
 * Middleware d'audit pour tracer les actions sensibles
 */
export const auditLog = (req: Request, res: Response, next: NextFunction) => {
  // Enregistrer les informations de base
  const logInfo = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'] || 'Unknown'
  };
  
  // Journaliser les actions sensibles (téléchargements, signatures, etc.)
  if (req.originalUrl.includes('/documents/') && 
     (req.originalUrl.includes('/download') || req.originalUrl.includes('/sign'))) {
    console.log(`[AUDIT] Action sensible: ${JSON.stringify(logInfo)}`);
  }
  
  next();
};