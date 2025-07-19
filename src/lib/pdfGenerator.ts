// pdfGenerator.ts
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function generateContractPDF(contractData: any, signatureDataURL: string) {
  const pdfDoc = await PDFDocument.create();
  
  // Use font that supports Latin characters only for now
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  let page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const margin = 50;
  let yPosition = height - margin;
  const fontSize = 12;
  const lineHeight = 20;
  
  // Helper to add text (remove Hebrew characters for now)
  const addText = (text: string, size: number = fontSize, x: number = margin) => {
    if (yPosition < margin + 50) {
      page = pdfDoc.addPage();
      yPosition = height - margin;
    }
    
    // Convert Hebrew text to English or remove problematic characters
    const safeText = text.replace(/[\u0590-\u05FF]/g, '?'); // Replace Hebrew with ?
    
    page.drawText(safeText, {
      x: x,
      y: yPosition,
      size: size,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    yPosition -= lineHeight;
  };
  
  // Add content
  addText('Tax Return Service Agreement', 18, width/2 - 80);
  yPosition -= 20;
  
  addText(`Contract Number: ${contractData.contractNumber}`);
  addText(`Date: ${new Date().toLocaleDateString()}`);
  yPosition -= 20;
  
  addText('Between:');
  addText(`${contractData.company.name} ID: ${contractData.company.id}`);
  addText(contractData.company.address);
  yPosition -= 20;
  
  addText('And:');
  addText(`${contractData.client.name} ID: ${contractData.client.id}`);
  yPosition -= 20;
  
  // Add contract sections
  contractData.sections.forEach((section: any) => {
    addText(section.title, 14);
    const words = section.content.split(' ');
    let line = '';
    words.forEach((word: string) => {
      if (line.length + word.length > 80) {
        addText(line);
        line = word + ' ';
      } else {
        line += word + ' ';
      }
    });
    if (line) addText(line);
    yPosition -= 10;
  });
  
  // Add signature if exists
  if (signatureDataURL) {
    try {
      const signatureImage = await pdfDoc.embedPng(signatureDataURL);
      const dims = signatureImage.scale(0.3);
      page.drawImage(signatureImage, {
        x: margin,
        y: yPosition - dims.height,
        width: dims.width,
        height: dims.height,
      });
    } catch (e) {
      console.log('Signature embedding failed');
    }
  }
  
  // Save PDF
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `contract_${contractData.client.id}_${Date.now()}.pdf`;
  link.click();
  
  return blob;
}

export async function createAndDownloadPDF(contractData: any, signatureDataURL: string) {
  return await generateContractPDF(contractData, signatureDataURL);
}

export async function generateContractPDFBlob(contractData: any, signatureDataURL: string): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  
  // Use font that supports Latin characters only for now  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  let page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const margin = 50;
  let yPosition = height - margin;
  const fontSize = 12;
  const lineHeight = 20;
  
  // Helper to add text (remove Hebrew characters for now)
  const addText = (text: string, size: number = fontSize, x: number = margin) => {
    if (yPosition < margin + 50) {
      page = pdfDoc.addPage();
      yPosition = height - margin;
    }
    
    // Convert Hebrew text to English or remove problematic characters
    const safeText = text.replace(/[\u0590-\u05FF]/g, '?'); // Replace Hebrew with ?
    
    page.drawText(safeText, {
      x: x,
      y: yPosition,
      size: size,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    yPosition -= lineHeight;
  };
  
  // Add content
  addText('Tax Return Service Agreement', 18, width/2 - 80);
  yPosition -= 20;
  
  addText(`Contract Number: ${contractData.contractNumber}`);
  addText(`Date: ${new Date().toLocaleDateString()}`);
  yPosition -= 20;
  
  addText('Between:');
  addText(`${contractData.company.name} ID: ${contractData.company.id}`);
  addText(contractData.company.address);
  yPosition -= 20;
  
  addText('And:');
  addText(`${contractData.client.name} ID: ${contractData.client.id}`);
  yPosition -= 20;
  
  // Add contract sections
  contractData.sections.forEach((section: any) => {
    addText(section.title, 14);
    const words = section.content.split(' ');
    let line = '';
    words.forEach((word: string) => {
      if (line.length + word.length > 80) {
        addText(line);
        line = word + ' ';
      } else {
        line += word + ' ';
      }
    });
    if (line) addText(line);
    yPosition -= 10;
  });
  
  // Add signature if exists
  if (signatureDataURL) {
    try {
      const signatureImage = await pdfDoc.embedPng(signatureDataURL);
      const dims = signatureImage.scale(0.3);
      page.drawImage(signatureImage, {
        x: margin,
        y: yPosition - dims.height,
        width: dims.width,
        height: dims.height,
      });
    } catch (e) {
      console.log('Signature embedding failed');
    }
  }
  
  // Return PDF as blob for storage
  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}