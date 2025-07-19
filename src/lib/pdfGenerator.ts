// pdfGenerator.ts
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { generateContractText } from './contractUtils';
import bidi from 'bidi-js';

export async function generateContractPDF(contractData: any, signatureDataURL: string) {
  console.log('🎯 Starting PDF generation with Hebrew support');
  
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  
  // Load font
  let font;
  try {
    console.log('🔄 Loading Noto Sans Hebrew font...');
    const fontResponse = await fetch('/fonts/NotoSansHebrew-Regular.ttf');
    
    if (!fontResponse.ok) {
      throw new Error(`Font fetch failed: ${fontResponse.status} ${fontResponse.statusText}`);
    }
    
    const fontBytes = await fontResponse.arrayBuffer();
    font = await pdfDoc.embedFont(fontBytes);
    console.log('✅ Noto Sans Hebrew font embedded successfully');
    
  } catch (e) {
    console.error('❌ Failed to load Hebrew font:', e);
    font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  }
  
  let page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const margin = 50;
  let yPosition = height - margin;
  const fontSize = 12;
  const lineHeight = fontSize * 1.5; // Better line spacing
  
  // FIX 1: Better Hebrew text processing
  const processHebrewText = (text: string): string => {
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    try {
      // First, clean the text
      let cleanText = String(text)
        .replace(/undefined/g, '_________')
        .trim();
      
      // IMPORTANT: Process with bidi BEFORE adding LTR markers
      cleanText = bidi(cleanText, { dir: 'rtl' });
      
      // FIX: Better regex for numbers - includes dates, phone numbers, etc.
      // This regex captures:
      // - Single digits: 1, 2, 3
      // - Multi-digit numbers: 123, 2024
      // - Numbers with separators: 12-34, 12.34, 12/34
      // - Percentages: 14.65%
      cleanText = cleanText.replace(/(\d+(?:[.,\-\/]\d+)*%?)/g, '\u202D$1\u202C');
      
      // Also wrap punctuation that should stay with numbers
      cleanText = cleanText.replace(/(\(\d+\))/g, '\u202D$1\u202C');
      
      return cleanText;
    } catch (e) {
      console.log('⚠️ Bidi processing failed:', e);
      return text.replace(/undefined/g, '_________');
    }
  };

  // FIX 2: Better text rendering with consistent spacing
  const addRTLText = (text: string, size: number = fontSize, isTitle: boolean = false, isBold: boolean = false) => {
    // Always check for page break FIRST
    if (yPosition < margin + 50) {
      page = pdfDoc.addPage();
      yPosition = height - margin;
    }
    
    const processedText = processHebrewText(text);
    
    // Handle empty lines
    if (!processedText || processedText.trim() === '') {
      yPosition -= lineHeight * 0.5;
      return;
    }
    
    try {
      const textAreaWidth = width - (margin * 2);
      const rightEdge = width - margin;
      
      if (isTitle) {
        // Center titles
        const textWidth = font.widthOfTextAtSize(processedText, size);
        const centerX = (width - textWidth) / 2;
        
        page.drawText(processedText, {
          x: centerX,
          y: yPosition,
          size: size,
          font: font,
          color: rgb(0, 0, 0),
        });
        
        // FIX: Consistent spacing after title
        yPosition -= size * 2;
      } else {
        // FIX 3: Better line wrapping algorithm
        const words = processedText.split(' ');
        let lines: string[] = [];
        let currentLine = '';
        
        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const testWidth = font.widthOfTextAtSize(testLine, size);
          
          if (testWidth <= textAreaWidth) {
            currentLine = testLine;
          } else {
            if (currentLine) {
              lines.push(currentLine);
            }
            currentLine = word;
          }
        }
        
        if (currentLine) {
          lines.push(currentLine);
        }
        
        // If no line breaks needed, just add the text
        if (lines.length === 0) {
          lines = [processedText];
        }
        
        // Draw each line
        lines.forEach((line) => {
          // Check page break before each line
          if (yPosition < margin + 30) {
            page = pdfDoc.addPage();
            yPosition = height - margin;
          }
          
          const lineWidth = font.widthOfTextAtSize(line, size);
          const xPosition = rightEdge - lineWidth;
          
          page.drawText(line, {
            x: Math.max(margin, xPosition),
            y: yPosition,
            size: size,
            font: font,
            color: rgb(0, 0, 0),
          });
          
          // FIX: Always decrement yPosition after drawing
          yPosition -= size * 1.5;
        });
        
        // Add extra space after paragraphs
        if (lines.length > 1) {
          yPosition -= size * 0.5;
        }
      }
    } catch (e) {
      console.error('❌ Error rendering text:', e);
      // Still decrement position on error
      yPosition -= lineHeight;
    }
  };
  
  // Generate contract text
  const contractText = generateContractText(contractData);
  
  // Add title
  addRTLText('הסכם שירות להחזרי מס', 18, true, true);
  
  // Add date and contract number with proper formatting
  const currentDate = new Date().toLocaleDateString('he-IL');
  addRTLText(`תאריך: ${currentDate}`, 12);
  addRTLText(`מספר חוזה: ${contractData.contractNumber || '___________'}`, 12);
  
  // Add extra space after header
  yPosition -= 10;
  
  // FIX 4: Better section processing
  const lines = contractText.split('\n');
  
  lines.forEach((line: string) => {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      // Empty line - add paragraph spacing
      yPosition -= lineHeight * 0.5;
    } else if (/^\d+\./.test(trimmedLine)) {
      // Numbered section - add extra space before
      yPosition -= lineHeight * 0.3;
      addRTLText(trimmedLine, fontSize, false, true);
    } else if (trimmedLine.startsWith('בין:') || trimmedLine.startsWith('לבין:')) {
      // Party sections - slightly larger
      addRTLText(trimmedLine, fontSize + 2, false, true);
    } else {
      // Regular text
      addRTLText(trimmedLine, fontSize);
    }
  });
  
  // Add signature section with proper spacing
  yPosition -= 30;
  
  // Signature fields
  addRTLText('חתימת הלקוח: _____________________', fontSize);
  
  // Add signature image if provided
  if (signatureDataURL) {
    try {
      // Check if we need a new page for signature
      if (yPosition < 100) {
        page = pdfDoc.addPage();
        yPosition = height - margin;
      }
      
      const signatureImage = await pdfDoc.embedPng(signatureDataURL);
      const dims = signatureImage.scale(0.3);
      
      // Position signature on the right side
      page.drawImage(signatureImage, {
        x: width - margin - dims.width,
        y: yPosition - dims.height - 10,
        width: dims.width,
        height: dims.height,
      });
    } catch (e) {
      console.error('Signature embedding failed:', e);
    }
  }
  
  // Save PDF
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `contract_${contractData.client.id || 'client'}_${Date.now()}.pdf`;
  link.click();
  
  return blob;
}

// Apply the same fixes to generateContractPDFBlob function...