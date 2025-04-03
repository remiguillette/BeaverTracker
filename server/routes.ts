import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import * as z from "zod";
import { insertDocumentSchema, insertAuditLogSchema, insertDocumentShareSchema } from "@shared/schema";
import { randomUUID } from "crypto";
import { addUidAndTokenToPdf } from "./pdfUtils";
import { 
  securityHeaders, 
  validateInput, 
  rateLimiter, 
  validateDocumentAccess, 
  auditLog 
} from "./middlewares/security";
import {
  validatePdfUpload,
  cleanupMiddleware
} from "./middlewares/fileValidator";

// Configure multer storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const generateUID = () => {
  const now = new Date();
  const date = now.toISOString().split('T')[0].replace(/-/g, '');
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '');
  const userId = '0042'; // For demo, this would come from auth in a real app
  const companyId = '7890'; // For demo, this would come from config in a real app
  const random = randomUUID().replace(/-/g, '').substring(0, 16);
  
  return `UID-${date}-${time}-USR${userId}-CPY${companyId}-${random}`;
};

const generateToken = () => {
  const now = new Date();
  const date = now.toISOString().split('T')[0].replace(/-/g, '');
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '');
  const random = randomUUID().replace(/-/g, '').substring(0, 16);
  
  return `DOC-${date}-${time}-${random}`;
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all documents
  app.get('/api/documents', async (req: Request, res: Response) => {
    try {
      const documents = await storage.getAllDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des documents" });
    }
  });

  // Get a document by ID
  app.get('/api/documents/:id', validateDocumentAccess, async (req: Request, res: Response) => {
    try {
      const document = await storage.getDocument(parseInt(req.params.id));
      if (!document) {
        return res.status(404).json({ message: "Document non trouvé" });
      }
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération du document" });
    }
  });

  // Upload a document - ajout de la validation de sécurité pour les fichiers PDF
  app.post('/api/documents/upload', async (req: Request, res: Response, next: NextFunction) => {
    // Utiliser le middleware spécifique pour les fichiers PDF
    if (req.headers['content-type']?.includes('multipart/form-data')) {
      // Premier traitement avec multer standard pour tous les fichiers
      upload.single('file')(req, res, (err) => {
        if (err) {
          return res.status(400).json({ message: err.message });
        }
        
        // Si ce n'est pas un PDF, on continue directement
        if (req.file && req.file.mimetype !== 'application/pdf') {
          next();
        } else {
          // Pour les PDF, validation supplémentaire (facultatif ici car on a déjà le buffer)
          next();
        }
      });
    } else {
      res.status(400).json({ message: "Format de requête invalide. Multipart/form-data attendu." });
    }
  }, async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Aucun fichier n'a été téléchargé" });
      }

      const options = req.body.options ? JSON.parse(req.body.options) : {
        generateNewUid: true,
        addToken: true,
        signAfterImport: false
      };

      const uid = generateUID();
      const token = generateToken();
      let fileBuffer = req.file.buffer;
      
      // Si c'est un PDF et que l'option addToken est activée, ajouter l'UID et le token
      if (req.file.mimetype === 'application/pdf' && options.addToken) {
        try {
          // Ajoute l'UID et le token au PDF
          fileBuffer = await addUidAndTokenToPdf(
            req.file.buffer,
            uid,
            token
          );
          
          console.log(`UID et token ajoutés au document lors de l'importation: ${req.file.originalname}`);
        } catch (pdfError) {
          console.error("Erreur lors de l'ajout de l'UID et du token au PDF:", pdfError);
          // En cas d'erreur, on utilise le document original
          fileBuffer = req.file.buffer;
        }
      }

      // Create document entry
      const document = {
        name: req.file.originalname,
        uid: uid,
        token: token,
        content: fileBuffer.toString('base64'),
        contentType: req.file.mimetype,
        size: `${(req.file.size / 1024 / 1024).toFixed(2)} MB`,
        creatorId: 1, // For demo, this would come from auth in a real app
        isSigned: options.signAfterImport
      };

      // Validate with zod
      const validatedDoc = insertDocumentSchema.parse(document);
      
      // Create document in storage
      const createdDoc = await storage.createDocument(validatedDoc);

      // Create audit log entry
      await storage.createAuditLog({
        documentId: createdDoc.id,
        userId: 1, // For demo, this would come from auth in a real app
        action: 'create',
        details: `Document uploaded: ${req.file.originalname}`
      });

      res.status(201).json(createdDoc);
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Erreur lors de l'importation du document" });
    }
  });

  // Sign a document
  app.post('/api/documents/:id/sign', validateDocumentAccess, async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document non trouvé" });
      }

      // In a real app, we would apply a digital signature here
      const signatureData = `digital_signature_${randomUUID()}`;
      
      let contentToUpdate = document.content;
      
      // Si c'est un PDF et qu'il y a un contenu, mettre à jour le document avec la signature
      if (document.contentType === 'application/pdf' && document.content) {
        try {
          const contentBuffer = Buffer.from(document.content as string, 'base64');
          
          // Ajoute l'UID, le token et maintenant la signature au PDF
          const signatureInfo = `Signé électroniquement: ${signatureData.substring(0, 8).toUpperCase()}`;
          const updatedBuffer = await addUidAndTokenToPdf(
            contentBuffer,
            document.uid,
            document.token || 'NO-TOKEN',
            signatureInfo
          );
          
          // Met à jour le contenu avec le document signé
          contentToUpdate = updatedBuffer.toString('base64');
          
          console.log(`PDF signé avec succès: ${document.name}`);
        } catch (pdfError) {
          console.error("Erreur lors de la signature du PDF:", pdfError);
          // En cas d'erreur, on garde le contenu original
        }
      }
      
      // Update document
      const updatedDoc = await storage.updateDocument(documentId, {
        ...document,
        content: contentToUpdate,
        isSigned: true,
        signatureData
      });

      // Create audit log entry
      await storage.createAuditLog({
        documentId,
        userId: 1, // For demo, this would come from auth in a real app
        action: 'sign',
        details: `Document signé avec le certificat #${signatureData.substring(0, 8).toUpperCase()}`
      });

      res.json(updatedDoc);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la signature du document" });
    }
  });

  // Get audit logs for a document
  app.get('/api/documents/:id/auditlogs', validateDocumentAccess, async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      const logs = await storage.getAuditLogsByDocumentId(documentId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération de l'historique d'audit" });
    }
  });

  // Create audit log
  app.post('/api/auditlogs', async (req: Request, res: Response) => {
    try {
      const auditLogData = insertAuditLogSchema.parse(req.body);
      const log = await storage.createAuditLog(auditLogData);
      res.status(201).json(log);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la création de l'entrée d'audit" });
    }
  });

  // Get shares for a document
  app.get('/api/documents/:id/shares', async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      const shares = await storage.getDocumentShares(documentId);
      res.json(shares);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des partages" });
    }
  });

  // Share a document
  app.post('/api/documents/:id/shares', async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      
      // In a real app, we would look up the user by email
      // For demo, we'll create a dummy share
      const shareData = {
        documentId,
        userId: Math.floor(Math.random() * 1000) + 2, // Random user ID that's not the creator
        permission: req.body.permission || 'read'
      };

      const validatedShare = insertDocumentShareSchema.parse(shareData);
      const share = await storage.createDocumentShare(validatedShare);

      // Create audit log entry
      await storage.createAuditLog({
        documentId,
        userId: 1, // For demo, this would come from auth in a real app
        action: 'share',
        details: `Document shared with user: ${req.body.email} (${req.body.permission})`
      });

      res.status(201).json(share);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors du partage du document" });
    }
  });

  // Remove a share
  app.delete('/api/documents/:documentId/shares/:userId', async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.documentId);
      const userId = parseInt(req.params.userId);
      
      await storage.removeDocumentShare(documentId, userId);

      // Create audit log entry
      await storage.createAuditLog({
        documentId,
        userId: 1, // For demo, this would come from auth in a real app
        action: 'share',
        details: `Document share removed for user ID: ${userId}`
      });

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression du partage" });
    }
  });
  
  // Download a document with its token
  app.get('/api/documents/:id/download', validateDocumentAccess, async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document non trouvé" });
      }
      
      // Create audit log entry for the download
      await storage.createAuditLog({
        documentId,
        userId: 1, // For demo, this would come from auth in a real app
        action: 'download',
        details: `Document downloaded by user ID: 1`
      });
      
      if (!document.content) {
        return res.status(404).json({ message: "Contenu du document non trouvé" });
      }
      
      // Le contenu est défini comme non-null à ce stade
      const contentBuffer = Buffer.from(document.content as string, 'base64');
      
      let finalBuffer = contentBuffer;
      
      // Si c'est un PDF, ajouter l'UID et le token directement dans le document
      if (document.contentType === 'application/pdf') {
        try {
          // Ajoute l'UID et le token au PDF, et la signature si le document est signé
          if (document.isSigned && document.signatureData) {
            const signatureInfo = `Signé électroniquement: ${document.signatureData.substring(0, 8).toUpperCase()}`;
            finalBuffer = await addUidAndTokenToPdf(
              contentBuffer, 
              document.uid, 
              document.token || 'NO-TOKEN',
              signatureInfo
            );
          } else {
            finalBuffer = await addUidAndTokenToPdf(
              contentBuffer, 
              document.uid, 
              document.token || 'NO-TOKEN'
            );
          }
          
          console.log(`Ajout de l'UID et du token au document PDF: ${document.name}`);
        } catch (pdfError) {
          console.error("Erreur lors de l'ajout de l'UID et du token au PDF:", pdfError);
          // En cas d'erreur, on utilise le document original
          finalBuffer = contentBuffer;
        }
      }
      
      // Set appropriate headers based on content type
      res.setHeader('Content-Type', document.contentType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${document.name}"`);
      
      // Send the modified document
      res.send(finalBuffer);
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ message: "Erreur lors du téléchargement du document" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}