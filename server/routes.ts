import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import * as z from "zod";
import { insertDocumentSchema, insertAuditLogSchema, insertDocumentShareSchema } from "@shared/schema";
import { randomUUID } from "crypto";

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
  app.get('/api/documents', async (req, res) => {
    try {
      const documents = await storage.getAllDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des documents" });
    }
  });

  // Get a document by ID
  app.get('/api/documents/:id', async (req, res) => {
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

  // Upload a document
  app.post('/api/documents/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Aucun fichier n'a été téléchargé" });
      }

      const options = req.body.options ? JSON.parse(req.body.options) : {
        generateNewUid: true,
        addToken: true,
        signAfterImport: false
      };

      // Create document entry
      const document = {
        name: req.file.originalname,
        uid: generateUID(),
        token: generateToken(),
        content: req.file.buffer.toString('base64'),
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
  app.post('/api/documents/:id/sign', async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document non trouvé" });
      }

      // In a real app, we would apply a digital signature here
      const signatureData = `digital_signature_${randomUUID()}`;
      
      // Update document
      const updatedDoc = await storage.updateDocument(documentId, {
        ...document,
        isSigned: true,
        signatureData
      });

      // Create audit log entry
      await storage.createAuditLog({
        documentId,
        userId: 1, // For demo, this would come from auth in a real app
        action: 'sign',
        details: `Document signed with certificate #${signatureData.substring(0, 8).toUpperCase()}`
      });

      res.json(updatedDoc);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la signature du document" });
    }
  });

  // Get audit logs for a document
  app.get('/api/documents/:id/auditlogs', async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const logs = await storage.getAuditLogsByDocumentId(documentId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération de l'historique d'audit" });
    }
  });

  // Create audit log
  app.post('/api/auditlogs', async (req, res) => {
    try {
      const auditLogData = insertAuditLogSchema.parse(req.body);
      const log = await storage.createAuditLog(auditLogData);
      res.status(201).json(log);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la création de l'entrée d'audit" });
    }
  });

  // Get shares for a document
  app.get('/api/documents/:id/shares', async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const shares = await storage.getDocumentShares(documentId);
      res.json(shares);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des partages" });
    }
  });

  // Share a document
  app.post('/api/documents/:id/shares', async (req, res) => {
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
  app.delete('/api/documents/:documentId/shares/:userId', async (req, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
