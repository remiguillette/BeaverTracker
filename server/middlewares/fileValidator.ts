import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { createHash } from 'crypto';
import fs from 'fs';

// Configuration de multer pour le téléchargement de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // S'assurer que le répertoire existe
    const uploadDir = path.join(process.cwd(), 'temp_uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Générer un nom de fichier sécurisé basé sur le timestamp et un hash
    const timestamp = Date.now();
    const randomString = createHash('sha256')
      .update(`${timestamp}-${Math.random()}`)
      .digest('hex')
      .substring(0, 16);
    const safeName = `${timestamp}-${randomString}${path.extname(file.originalname)}`;
    cb(null, safeName);
  },
});

// Filtrer les types de fichiers autorisés
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accepter uniquement les PDF
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Seuls les PDF sont acceptés.'));
  }
};

// Limiter la taille des fichiers (10 MB max)
const limits = {
  fileSize: 10 * 1024 * 1024,
};

// Middleware pour télécharger des fichiers
export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits,
}).single('file');

// Middleware de validation de fichier PDF
export const validatePdfUpload = (req: Request, res: Response, next: NextFunction) => {
  uploadMiddleware(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            message: 'Le fichier est trop volumineux. La taille maximale est de 10 MB.',
          });
        }
      }
      return res.status(400).json({ message: err.message });
    }

    // Vérifier que le fichier a bien été téléchargé
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier n\'a été téléchargé.' });
    }

    // Analyser le fichier PDF pour détecter d'éventuelles menaces
    // Cette fonction pourrait être étendue avec des bibliothèques de sécurité plus sophistiquées
    validatePdfSecurity(req.file.path)
      .then(() => {
        next();
      })
      .catch((error) => {
        // Supprimer le fichier en cas de problème
        fs.unlinkSync(req.file!.path);
        res.status(400).json({ message: error.message });
      });
  });
};

// Fonction pour vérifier la sécurité basique d'un PDF
async function validatePdfSecurity(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Lecture du début du fichier pour vérifier la signature (magic bytes) du PDF
    const buffer = Buffer.alloc(5);
    const fileDescriptor = fs.openSync(filePath, 'r');
    fs.readSync(fileDescriptor, buffer, 0, 5, 0);
    fs.closeSync(fileDescriptor);

    // Vérifier la signature PDF
    if (buffer.toString() !== '%PDF-') {
      return reject(new Error('Le fichier n\'est pas un PDF valide.'));
    }

    // Vérification de base du contenu (pourrait être étendu)
    const fileContent = fs.readFileSync(filePath);
    const content = fileContent.toString('utf-8', 0, Math.min(fileContent.length, 1024 * 50));

    // Recherche de scripts potentiellement dangereux
    if (content.includes('/JS') || content.includes('/JavaScript')) {
      return reject(new Error('Le PDF contient potentiellement du code JavaScript non autorisé.'));
    }

    // Recherche d'actions automatiques
    if (content.includes('/AA') || content.includes('/OpenAction')) {
      return reject(new Error('Le PDF contient des actions automatiques potentiellement dangereuses.'));
    }

    // Recherche d'inclusions externes
    if (content.includes('/URI') && (content.includes('http://') || content.includes('https://'))) {
      // Log l'alerte mais ne rejette pas forcément
      console.warn('Le PDF contient des liens externes (à surveiller).');
    }

    resolve();
  });
}

// Middleware pour nettoyer les fichiers temporaires
export const cleanupMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Utilisation de l'événement 'finish' pour nettoyer après envoi de la réponse
  res.on('finish', () => {
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log(`Fichier temporaire nettoyé: ${req.file.path}`);
      } catch (err) {
        console.error('Erreur lors de la suppression du fichier temporaire:', err);
      }
    }
  });

  next();
};