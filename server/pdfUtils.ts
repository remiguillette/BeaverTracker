import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { createHash } from 'crypto';

/**
 * Ajoute un UID et un token comme texte semi-transparent en bas de chaque page d'un document PDF
 * Met également à jour les métadonnées du document pour une meilleure validité juridique
 * 
 * @param pdfBuffer Buffer contenant le PDF original
 * @param uid Identifiant unique du document
 * @param token Token de traçabilité du document
 * @param signatureInfo Information de signature optionnelle à ajouter 
 * @returns Buffer du PDF modifié avec UID et token
 */
export async function addUidAndTokenToPdf(
  pdfBuffer: Buffer,
  uid: string,
  token: string,
  signatureInfo?: string
): Promise<Buffer> {
  try {
    // Charge le document PDF
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    
    // Récupère une police standard
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Taille de police très petite pour le texte en pied de page
    const fontSize = 6;
    
    // Nombre de pages dans le document
    const pages = pdfDoc.getPages();
    
    // Date actuelle pour l'horodatage
    const now = new Date();
    const timestamp = now.toLocaleString('fr-FR');
    
    // Ajoute l'UID et le token à chaque page
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();
      
      // Version simplifiée en format court pour être plus lisible
      const uidShort = uid.substring(uid.length - 8);
      const tokenShort = token.substring(token.length - 8);
      
      // Texte à ajouter avec UID et token en format court
      const text = `BeaverDoc: P${i + 1}/${pages.length} | UID:${uidShort} | Token:${tokenShort}`;
      
      // Calcule la largeur du texte
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const x = width - textWidth - 10; // Aligné à droite avec une marge
      
      // Position en bas de page avec marge suffisante pour éviter le rognage
      const y = 20; // Augmenté pour éviter d'être coupé
      
      // Crée un rectangle blanc semi-transparent pour servir de fond au texte
      page.drawRectangle({
        x: x - 2,
        y: y - 2,
        width: textWidth + 4,
        height: fontSize + 4,
        color: rgb(1, 1, 1), // Blanc
        opacity: 0.7 // Semi-transparent
      });
      
      // Ajoute le texte à la page avec une couleur foncée
      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(0.3, 0.3, 0.3), // Gris foncé
        opacity: 0.9 // Bien visible
      });
      
      // Si le document est signé, ajouter l'info de signature sur une ligne séparée
      if (signatureInfo) {
        const sigText = `Signé: ${signatureInfo.split(':')[1].trim()} | ${timestamp}`;
        const sigTextWidth = font.widthOfTextAtSize(sigText, fontSize);
        const sigX = width - sigTextWidth - 10;
        const sigY = y + fontSize + 3;
        
        // Rectangle blanc pour le texte de signature
        page.drawRectangle({
          x: sigX - 2,
          y: sigY - 2,
          width: sigTextWidth + 4,
          height: fontSize + 4,
          color: rgb(1, 1, 1),
          opacity: 0.7
        });
        
        // Texte de signature
        page.drawText(sigText, {
          x: sigX,
          y: sigY,
          size: fontSize,
          font,
          color: rgb(0.3, 0.3, 0.3),
          opacity: 0.9
        });
      }
    }
    
    // Calcul d'un hash SHA-256 du contenu pour vérification d'intégrité
    const contentHash = createHash('sha256')
      .update(pdfBuffer)
      .digest('hex');
      
    // Mise à jour des métadonnées du document pour validité juridique
    pdfDoc.setTitle(`Document sécurisé - ${uid}`);
    pdfDoc.setAuthor('Rémi Guillette');
    pdfDoc.setCreator('Rémi Guillette Consulting');
    pdfDoc.setProducer('BeaverDoc Secure Document System');
    
    // Informations de sécurité complètes
    const securityInfo = `UID:${uid} | Token:${token} | Hash:${contentHash} | Timestamp:${new Date().toISOString()}`;
    const issuerInfo = `Certifié par: Rémi Guillette Consulting | Vérification: beaverdoc.verify.com`;
    
    // Définir le sujet avec informations de sécurité détaillées
    pdfDoc.setSubject(`Document authentifié par BeaverDoc - ${securityInfo} | ${issuerInfo}`);
    
    // Ajouter des informations de sécurité dans les mots-clés
    const keywords = ['document sécurisé', 'authentifié', uid, token, contentHash, 'Rémi Guillette Consulting'];
    
    if (signatureInfo) {
      keywords.push('signé électroniquement');
      keywords.push(`signature:${signatureInfo}`);
      keywords.push(`date_signature:${new Date().toISOString()}`);
    }
    
    pdfDoc.setKeywords(keywords);
    
    // Sérialise le document modifié en un nouveau buffer
    const modifiedPdfBytes = await pdfDoc.save();
    
    return Buffer.from(modifiedPdfBytes);
  } catch (error) {
    console.error('Erreur lors de la modification du PDF:', error);
    throw new Error('Impossible de modifier le PDF pour ajouter l\'UID et le token');
  }
}