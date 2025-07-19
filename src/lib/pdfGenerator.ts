// pdfGenerator.ts
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { generateContractText } from './contractUtils';

export async function generateContractPDF(contractData: any, signatureDataURL: string) {
  console.log('🎯 Starting PDF generation with data:', contractData);
  
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  
  // Load Hebrew font
  let font;
  try {
    // Try to use Google Fonts to load Hebrew font
    const fontUrl = 'https://fonts.gstatic.com/s/notosanshebrew/v27/sJoW3LfXjm-LPr_6PjSFWhfXdGvfAOKYNKQ.woff2';
    const fontResponse = await fetch(fontUrl);
    if (fontResponse.ok) {
      const fontBytes = await fontResponse.arrayBuffer();
      font = await pdfDoc.embedFont(fontBytes);
      console.log('✅ Hebrew font loaded successfully');
    } else {
      throw new Error('Font fetch failed');
    }
  } catch (e) {
    console.log('❌ Hebrew font failed, using fallback:', e);
    font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  }
  
  let page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const margin = 50;
  let yPosition = height - margin;
  const fontSize = 12;
  const lineHeight = 20;
  
  // Helper to add text with Hebrew support
  const addText = (text: string, size: number = fontSize, x: number = margin) => {
    if (yPosition < margin + 50) {
      page = pdfDoc.addPage();
      yPosition = height - margin;
    }
    
    // Keep original text - try to render Hebrew characters
    try {
      page.drawText(text, {
        x: x,
        y: yPosition,
        size: size,
        font: font,
        color: rgb(0, 0, 0),
      });
    } catch (e) {
      // If Hebrew rendering fails, fallback to placeholder
      page.drawText(text.replace(/[\u0590-\u05FF]/g, '?'), {
        x: x,
        y: yPosition,
        size: size,
        font: font,
        color: rgb(0, 0, 0),
      });
    }
    
    yPosition -= lineHeight;
  };
  
  // Generate the actual contract text
  const contractText = generateContractText(contractData);
  console.log('📄 Generated contract text length:', contractText.length);
  
  // Add contract content
  addText('הסכם שירות להחזרי מס', 18, width/2 - 100);
  yPosition -= 30;
  
  // Split contract text into lines and add to PDF
  const lines = contractText.split('\n');
  lines.forEach((line: string) => {
    if (line.trim()) {
      // Handle long lines by wrapping them
      if (line.length > 80) {
        const words = line.split(' ');
        let currentLine = '';
        words.forEach((word: string) => {
          if (currentLine.length + word.length > 80) {
            if (currentLine) {
              addText(currentLine, fontSize, margin);
            }
            currentLine = word + ' ';
          } else {
            currentLine += word + ' ';
          }
        });
        if (currentLine) {
          addText(currentLine, fontSize, margin);
        }
      } else {
        addText(line, fontSize, margin);
      }
    } else {
      // Empty line for spacing
      yPosition -= lineHeight / 2;
    }
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
  console.log('🎯 Starting PDF blob generation with data:', contractData);
  
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  
  // Load Hebrew font
  let font;
  try {
    // Try to use Google Fonts to load Hebrew font
    const fontUrl = 'https://fonts.gstatic.com/s/notosanshebrew/v27/sJoW3LfXjm-LPr_6PjSFWhfXdGvfAOKYNKQ.woff2';
    const fontResponse = await fetch(fontUrl);
    if (fontResponse.ok) {
      const fontBytes = await fontResponse.arrayBuffer();
      font = await pdfDoc.embedFont(fontBytes);
      console.log('✅ Hebrew font loaded successfully for blob');
    } else {
      throw new Error('Font fetch failed');
    }
  } catch (e) {
    console.log('❌ Hebrew font failed for blob, using fallback:', e);
    font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  }
  
  let page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const margin = 50;
  let yPosition = height - margin;
  const fontSize = 12;
  const lineHeight = 20;
  
  // Helper to add text with Hebrew support
  const addText = (text: string, size: number = fontSize, x: number = margin) => {
    if (yPosition < margin + 50) {
      page = pdfDoc.addPage();
      yPosition = height - margin;
    }
    
    // Keep original text - try to render Hebrew characters
    try {
      page.drawText(text, {
        x: x,
        y: yPosition,
        size: size,
        font: font,
        color: rgb(0, 0, 0),
      });
    } catch (e) {
      // If Hebrew rendering fails, fallback to placeholder
      page.drawText(text.replace(/[\u0590-\u05FF]/g, '?'), {
        x: x,
        y: yPosition,
        size: size,
        font: font,
        color: rgb(0, 0, 0),
      });
    }
    
    yPosition -= lineHeight;
  };
  
  // Generate the actual contract text
  const contractText = generateContractText(contractData);
  console.log('📄 Generated contract text for blob, length:', contractText.length);
  
  // Add contract content
  addText('הסכם שירות להחזרי מס', 18, width/2 - 100);
  yPosition -= 30;
  
  // Split contract text into lines and add to PDF
  const lines = contractText.split('\n');
  lines.forEach((line: string) => {
    if (line.trim()) {
      // Handle long lines by wrapping them
      if (line.length > 80) {
        const words = line.split(' ');
        let currentLine = '';
        words.forEach((word: string) => {
          if (currentLine.length + word.length > 80) {
            if (currentLine) {
              addText(currentLine, fontSize, margin);
            }
            currentLine = word + ' ';
          } else {
            currentLine += word + ' ';
          }
        });
        if (currentLine) {
          addText(currentLine, fontSize, margin);
        }
      } else {
        addText(line, fontSize, margin);
      }
    } else {
      // Empty line for spacing
      yPosition -= lineHeight / 2;
    }
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