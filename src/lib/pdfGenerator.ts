// pdfGenerator.ts
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { generateContractText } from './contractUtils';

export async function generateContractPDF(contractData: any, signatureDataURL: string) {
  console.log('🎯 Starting PDF generation with data:', contractData);
  
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  
  
  // Load Hebrew font with proper Unicode support
  let font;
  try {
    // Use a different approach - load TTF font directly from Google Fonts
    const fontUrl = 'https://fonts.gstatic.com/s/notosanshebrew/v27/sJoD3LfXjm-LPr_6PjSFWhfXdAmYYCm4WDaKJW5j.ttf';
    const fontResponse = await fetch(fontUrl);
    if (fontResponse.ok) {
      const fontBytes = await fontResponse.arrayBuffer();
      font = await pdfDoc.embedFont(fontBytes);
      console.log('✅ Hebrew TTF font loaded successfully');
    } else {
      throw new Error('Font fetch failed');
    }
  } catch (e) {
    console.log('❌ Hebrew font failed, trying alternative method:', e);
    try {
      // Fallback: try to embed standard font and handle Hebrew differently
      font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    } catch (e2) {
      font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }
  }
  
  let page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const margin = 50;
  let yPosition = height - margin;
  const fontSize = 12;
  const lineHeight = 20;
  
  // Helper to add text with Hebrew support and encoding fixes
  const addText = (text: string, size: number = fontSize, x: number = margin) => {
    if (yPosition < margin + 50) {
      page = pdfDoc.addPage();
      yPosition = height - margin;
    }
    
    // Clean and prepare Hebrew text
    try {
      // Remove or replace problematic characters that can't be encoded
      const cleanText = text
        .replace(/[\u202A\u202B\u202C\u202D\u202E]/g, '') // Remove directional marks
        .replace(/\u00A0/g, ' ') // Replace non-breaking spaces
        .trim();
      
      console.log('Adding text:', cleanText.substring(0, 50) + '...');
      
      page.drawText(cleanText, {
        x: x,
        y: yPosition,
        size: size,
        font: font,
        color: rgb(0, 0, 0),
      });
    } catch (e) {
      console.log('❌ Text rendering error for:', text.substring(0, 30), e);
      // Fallback: replace Hebrew characters with transliteration or skip
      try {
        const fallbackText = text.replace(/[\u0590-\u05FF]/g, '???');
        page.drawText(fallbackText, {
          x: x,
          y: yPosition,
          size: size,
          font: font,
          color: rgb(0, 0, 0),
        });
      } catch (e2) {
        console.log('❌ Even fallback failed:', e2);
        // Skip this text
      }
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
  
  
  // Load Hebrew font with proper Unicode support
  let font;
  try {
    // Use a different approach - load TTF font directly from Google Fonts
    const fontUrl = 'https://fonts.gstatic.com/s/notosanshebrew/v27/sJoD3LfXjm-LPr_6PjSFWhfXdAmYYCm4WDaKJW5j.ttf';
    const fontResponse = await fetch(fontUrl);
    if (fontResponse.ok) {
      const fontBytes = await fontResponse.arrayBuffer();
      font = await pdfDoc.embedFont(fontBytes);
      console.log('✅ Hebrew TTF font loaded successfully for blob');
    } else {
      throw new Error('Font fetch failed');
    }
  } catch (e) {
    console.log('❌ Hebrew font failed for blob, trying alternative method:', e);
    try {
      // Fallback: try to embed standard font and handle Hebrew differently
      font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    } catch (e2) {
      font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }
  }
  
  let page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const margin = 50;
  let yPosition = height - margin;
  const fontSize = 12;
  const lineHeight = 20;
  
  // Helper to add text with Hebrew support and encoding fixes
  const addText = (text: string, size: number = fontSize, x: number = margin) => {
    if (yPosition < margin + 50) {
      page = pdfDoc.addPage();
      yPosition = height - margin;
    }
    
    // Clean and prepare Hebrew text
    try {
      // Remove or replace problematic characters that can't be encoded
      const cleanText = text
        .replace(/[\u202A\u202B\u202C\u202D\u202E]/g, '') // Remove directional marks
        .replace(/\u00A0/g, ' ') // Replace non-breaking spaces
        .trim();
      
      page.drawText(cleanText, {
        x: x,
        y: yPosition,
        size: size,
        font: font,
        color: rgb(0, 0, 0),
      });
    } catch (e) {
      console.log('❌ Text rendering error for blob:', text.substring(0, 30), e);
      // Fallback: replace Hebrew characters with transliteration or skip
      try {
        const fallbackText = text.replace(/[\u0590-\u05FF]/g, '???');
        page.drawText(fallbackText, {
          x: x,
          y: yPosition,
          size: size,
          font: font,
          color: rgb(0, 0, 0),
        });
      } catch (e2) {
        console.log('❌ Even fallback failed for blob:', e2);
        // Skip this text
      }
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