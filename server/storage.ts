import { 
  User, 
  InsertUser, 
  Document, 
  InsertDocument, 
  AuditLog, 
  InsertAuditLog,
  DocumentShare,
  InsertDocumentShare
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Document operations
  getAllDocuments(): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, document: Partial<Document>): Promise<Document>;
  deleteDocument(id: number): Promise<void>;
  
  // Audit log operations
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogsByDocumentId(documentId: number): Promise<AuditLog[]>;
  
  // Document share operations
  getDocumentShares(documentId: number): Promise<any[]>; // Returns user info with share details
  createDocumentShare(share: InsertDocumentShare): Promise<DocumentShare>;
  removeDocumentShare(documentId: number, userId: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private documents: Map<number, Document>;
  private auditLogs: Map<number, AuditLog>;
  private documentShares: Map<number, DocumentShare>;
  private userId: number;
  private documentId: number;
  private auditLogId: number;
  private documentShareId: number;

  constructor() {
    this.users = new Map();
    this.documents = new Map();
    this.auditLogs = new Map();
    this.documentShares = new Map();
    this.userId = 1;
    this.documentId = 1;
    this.auditLogId = 1;
    this.documentShareId = 1;
    
    // Initialize with Rémi Guillette user
    this.createUser({
      username: "remi.guillette",
      password: "password123",
      name: "Rémi Guillette",
      initials: "RG",
      company: "Rémi Guillette Consulting"
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { 
      ...insertUser, 
      id,
      // S'assurer que le champ company est défini explicitement
      company: insertUser.company || null
    };
    this.users.set(id, user);
    return user;
  }

  // Document operations
  async getAllDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values()).sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.documentId++;
    const now = new Date();
    const document: Document = { 
      ...insertDocument, 
      id,
      createdAt: now,
      updatedAt: now,
      // S'assurer que les champs nullables sont définis explicitement
      content: insertDocument.content || null,
      size: insertDocument.size || null,
      isSigned: insertDocument.isSigned || false,
      signatureData: insertDocument.signatureData || null
    };
    this.documents.set(id, document);
    return document;
  }

  async updateDocument(id: number, partialDocument: Partial<Document>): Promise<Document> {
    const document = this.documents.get(id);
    if (!document) {
      throw new Error(`Document with ID ${id} not found`);
    }
    
    const updatedDocument: Document = { 
      ...document, 
      ...partialDocument,
      updatedAt: new Date() 
    };
    
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<void> {
    this.documents.delete(id);
  }

  // Audit log operations
  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    const id = this.auditLogId++;
    const log: AuditLog = { 
      ...insertLog, 
      id,
      timestamp: new Date(),
      details: insertLog.details || null
    };
    this.auditLogs.set(id, log);
    return log;
  }

  async getAuditLogsByDocumentId(documentId: number): Promise<AuditLog[]> {
    return Array.from(this.auditLogs.values())
      .filter(log => log.documentId === documentId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Document share operations
  async getDocumentShares(documentId: number): Promise<any[]> {
    const shares = Array.from(this.documentShares.values())
      .filter(share => share.documentId === documentId);
    
    // Combine with user info for the UI
    return shares.map(share => {
      const user = this.users.get(share.userId);
      return user ? {
        id: share.userId,
        name: user.name,
        email: `${user.username}@exemple.com`, // Simulate email for demo
        initials: user.initials,
        permission: share.permission
      } : null;
    }).filter(Boolean);
  }

  async createDocumentShare(insertShare: InsertDocumentShare): Promise<DocumentShare> {
    const id = this.documentShareId++;
    const share: DocumentShare = { 
      ...insertShare, 
      id,
      createdAt: new Date()
    };
    this.documentShares.set(id, share);
    
    // Make sure the user exists, create a dummy one if not
    const user = await this.getUser(insertShare.userId);
    if (!user) {
      // Create a dummy user for the shared person
      await this.createUser({
        username: `user${insertShare.userId}`,
        password: "password123",
        name: "Marie Lefebvre",
        initials: "ML",
        company: "Entreprise XYZ"
      });
    }
    
    return share;
  }

  async removeDocumentShare(documentId: number, userId: number): Promise<void> {
    const shareId = Array.from(this.documentShares.entries())
      .find(([_, share]) => share.documentId === documentId && share.userId === userId)?.[0];
    
    if (shareId) {
      this.documentShares.delete(shareId);
    }
  }
}

export const storage = new MemStorage();
