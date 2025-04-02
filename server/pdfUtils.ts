import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/**
 * Ajoute un UID et un token comme texte semi-transparent en bas de chaque page d'un document PDF
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
    
    // Date actuelle pour le horodatage
    const now = new Date();
    const timestamp = now.toLocaleString('fr-FR');
    
    // Ajoute l'UID et le token à chaque page
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();
      
      // Texte à ajouter avec UID, token et numéro de page
      let text = `BeaverDoc - UID: ${uid} | Token: ${token} | Page ${i + 1}/${pages.length}`;
      
      // Ajoute des informations de signature si disponibles
      if (signatureInfo) {
        text = `${text} | ${signatureInfo} | Horodaté le ${timestamp}`;
      }
      
      // Calcule la largeur du texte pour le centrer
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const x = (width - textWidth) / 2;
      
      // Position en bas de page avec une petite marge
      const y = 10;
      
      // Ajoute le texte à la page avec une couleur gris pâle semi-transparente
      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(0.7, 0.7, 0.7), // Gris pâle
        opacity: 0.5 // Semi-transparent
      });
    }
    
    // Sérialise le document modifié en un nouveau buffer
    const modifiedPdfBytes = await pdfDoc.save();
    
    return Buffer.from(modifiedPdfBytes);
  } catch (error) {
    console.error('Erreur lors de la modification du PDF:', error);
    throw new Error('Impossible de modifier le PDF pour ajouter l\'UID et le token');
  }
}