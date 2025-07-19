// pdfGenerator.ts
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { generateContractText } from './contractUtils';
import bidi from 'bidi-js';

export async function generateContractPDF(contractData: any, signatureDataURL: string) {
  console.log('🎯 Starting PDF generation with Hebrew support');
  
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  
  // Load Noto Sans Hebrew font from public folder
  let font;
  try {
    console.log('🔄 Loading Noto Sans Hebrew font...');
    const fontResponse = await fetch('/fonts/NotoSansHebrew-Regular.ttf');
    
    if (!fontResponse.ok) {
      throw new Error(`Font fetch failed: ${fontResponse.status} ${fontResponse.statusText}`);
    }
    
    const fontBytes = await fontResponse.arrayBuffer();
    console.log('📦 Font bytes loaded:', fontBytes.byteLength, 'bytes');
    
    font = await pdfDoc.embedFont(fontBytes);
    console.log('✅ Noto Sans Hebrew font embedded successfully');
    
  } catch (e) {
    console.error('❌ Failed to load Hebrew font:', e);
    console.log('📝 Falling back to Times-Roman');
    try {
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
  
  // Helper function to process Hebrew text with RTL support
  const processHebrewText = (text: string): string => {
    // Ensure we have a valid string
    if (!text || typeof text !== 'string') {
      console.log('⚠️ Invalid text input:', text, typeof text);
      return '';
    }
    
    try {
      // Clean and process the text for proper RTL display
      let cleanText = String(text) // Ensure it's a string
        .replace(/[\u202A\u202B\u202C\u202D\u202E]/g, '') // Remove directional marks
        .replace(/\u00A0/g, ' ') // Replace non-breaking spaces
        .replace(/undefined/g, '_______') // Replace undefined with placeholders
        .trim();
      
      // Use bidi-js to process Hebrew text with proper RTL handling
      cleanText = bidi(cleanText, { dir: 'rtl' });
      
      // Fix numbers that might appear as colons - wrap them in LTR markers
      cleanText = cleanText.replace(/(\d[\d\-\/\.]*\d|\d)/g, '\u202D$1\u202C');
      
      return cleanText;
    } catch (e) {
      console.log('⚠️ Bidi processing failed, using fallback:', e);
      // Fallback: manual number fix with string conversion
      const fallbackText = String(text || '');
      return fallbackText.replace(/:/g, '').replace(/(\d[\d\-\/\.]*\d|\d)/g, '\u202D$1\u202C');
    }
  };

  // Helper to add RTL text with proper margins and positioning
  const addRTLText = (text: string, size: number = fontSize, isTitle: boolean = false, isBold: boolean = false) => {
    if (yPosition < margin + 50) {
      page = pdfDoc.addPage();
      yPosition = height - margin;
    }
    
    const processedText = processHebrewText(text);
    if (!processedText) {
      // Still decrement position for empty lines to maintain spacing
      yPosition -= lineHeight * 0.5;
      return;
    }
    
    console.log('📝 Adding RTL text at Y:', yPosition, 'Text:', processedText.substring(0, 50) + '...');
    
    try {
      // Calculate proper text area and positioning
      const pageMargins = {
        left: margin,
        right: margin,
        top: margin,
        bottom: margin
      };
      
      const textAreaWidth = width - pageMargins.left - pageMargins.right;
      const rightEdge = width - pageMargins.right;
      
      if (isTitle) {
        // Center titles
        const textWidth = font.widthOfTextAtSize(processedText, size);
        const centerX = (width - textWidth) / 2;
        
        page.drawText(processedText, {
          x: Math.max(pageMargins.left, centerX),
          y: yPosition,
          size: size,
          font: font,
          color: rgb(0, 0, 0),
        });
        
        // Always decrement position for titles
        yPosition -= lineHeight * 1.5;
      } else {
        // Right-align text with proper width constraints
        const words = processedText.split(' ');
        let currentLine = '';
        let lines = [];
        
        // Break text into lines that fit within the text area
        words.forEach(word => {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const lineWidth = font.widthOfTextAtSize(testLine, size);
          
          if (lineWidth <= textAreaWidth) {
            currentLine = testLine;
          } else {
            if (currentLine) {
              lines.push(currentLine);
              currentLine = word;
            } else {
              // Word is too long, add as is
              lines.push(word);
            }
          }
        });
        
        if (currentLine) {
          lines.push(currentLine);
        }
        
        // Draw each line with proper RTL positioning
        lines.forEach((line, index) => {
          // Check for page break before each line
          if (yPosition < pageMargins.bottom + 50) {
            page = pdfDoc.addPage();
            yPosition = height - pageMargins.top;
          }
          
          const lineWidth = font.widthOfTextAtSize(line, size);
          const xPosition = rightEdge - lineWidth;
          
          page.drawText(line, {
            x: Math.max(pageMargins.left, xPosition),
            y: yPosition,
            size: size,
            font: font,
            color: rgb(0, 0, 0),
          });
          
          // Consistent line spacing - always decrement after each line
          yPosition -= lineHeight * (isBold ? 1.3 : 1.2);
        });
      }
      
    } catch (e) {
      console.log('❌ Error rendering RTL text:', e.message);
      // Fallback with simple positioning
      try {
        const fallbackText = `[Hebrew Text: ${text.length} chars]`;
        const textWidth = font.widthOfTextAtSize(fallbackText, size);
        const xPosition = Math.max(margin, width - margin - textWidth);
        
        page.drawText(fallbackText, {
          x: xPosition,
          y: yPosition,
          size: size,
          font: font,
          color: rgb(0.5, 0.5, 0.5),
        });
        
        // Always decrement position even for fallback
        yPosition -= lineHeight * 1.2;
      } catch (e2) {
        console.log('❌ Even fallback failed:', e2);
        // Still decrement to prevent overlap
        yPosition -= lineHeight;
      }
    }
  };
  
  // Generate and process the contract text
  const contractText = generateContractText(contractData);
  console.log('📄 Processing contract text with RTL support, length:', contractText.length);
  
  // Add title - centered
  addRTLText('הסכם שירות להחזרי מס', 18, true, true);
  yPosition -= 20;
  
  // Add contract details with proper RTL formatting
  const currentDate = new Date().toLocaleDateString('he-IL');
  addRTLText(`תאריך: ${currentDate}`, 12);
  addRTLText(`מספר חוזה: ${contractData.contractNumber || 'לא צוין'}`, 12);
  yPosition -= 15;
  
  // Process contract content in sections with consistent spacing
  const sections = contractText.split('\n\n');
  
  sections.forEach((section: string, index: number) => {
    const trimmedSection = section.trim();
    if (trimmedSection) {
      // Check if this is a numbered section (starts with number)
      const isNumberedSection = /^\d+\./.test(trimmedSection);
      
      if (isNumberedSection) {
        // Add spacing before numbered sections (only if not first section)
        if (index > 0) {
          yPosition -= 8;
        }
        addRTLText(trimmedSection, 12, false, true);
      } else {
        // Regular paragraph text - process line by line
        const lines = trimmedSection.split('\n');
        lines.forEach((line: string) => {
          const trimmedLine = line.trim();
          if (trimmedLine) {
            addRTLText(trimmedLine, fontSize);
          } else {
            // Empty line - add small spacing
            yPosition -= lineHeight * 0.3;
          }
        });
      }
    } else {
      // Empty section - add paragraph spacing
      yPosition -= lineHeight * 0.5;
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
  console.log('🎯 Starting PDF blob generation with Hebrew support');
  
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  
  // Load Noto Sans Hebrew font from public folder
  let font;
  try {
    console.log('🔄 Loading Noto Sans Hebrew font for blob...');
    const fontResponse = await fetch('/fonts/NotoSansHebrew-Regular.ttf');
    
    if (!fontResponse.ok) {
      throw new Error(`Font fetch failed: ${fontResponse.status} ${fontResponse.statusText}`);
    }
    
    const fontBytes = await fontResponse.arrayBuffer();
    console.log('📦 Font bytes loaded for blob:', fontBytes.byteLength, 'bytes');
    
    font = await pdfDoc.embedFont(fontBytes);
    console.log('✅ Noto Sans Hebrew font embedded successfully for blob');
    
  } catch (e) {
    console.error('❌ Failed to load Hebrew font for blob:', e);
    console.log('📝 Falling back to Times-Roman for blob');
    try {
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
  
  // Helper function to process Hebrew text with RTL support (same as main function)
  const processHebrewText = (text: string): string => {
    // Ensure we have a valid string
    if (!text || typeof text !== 'string') {
      console.log('⚠️ Invalid text input for blob:', text, typeof text);
      return '';
    }
    
    try {
      // Clean and process the text for proper RTL display
      let cleanText = String(text) // Ensure it's a string
        .replace(/[\u202A\u202B\u202C\u202D\u202E]/g, '') // Remove directional marks
        .replace(/\u00A0/g, ' ') // Replace non-breaking spaces
        .replace(/undefined/g, '_______') // Replace undefined with placeholders
        .trim();
      
      // Use bidi-js to process Hebrew text with proper RTL handling
      cleanText = bidi(cleanText, { dir: 'rtl' });
      
      // Fix numbers that might appear as colons - wrap them in LTR markers
      cleanText = cleanText.replace(/(\d[\d\-\/\.]*\d|\d)/g, '\u202D$1\u202C');
      
      return cleanText;
    } catch (e) {
      console.log('⚠️ Bidi processing failed for blob, using fallback:', e);
      // Fallback: manual number fix with string conversion
      const fallbackText = String(text || '');
      return fallbackText.replace(/:/g, '').replace(/(\d[\d\-\/\.]*\d|\d)/g, '\u202D$1\u202C');
    }
  };

  // Helper to add RTL text with proper margins and positioning (same as main function)
  const addRTLText = (text: string, size: number = fontSize, isTitle: boolean = false, isBold: boolean = false) => {
    if (yPosition < margin + 50) {
      page = pdfDoc.addPage();
      yPosition = height - margin;
    }
    
    const processedText = processHebrewText(text);
    if (!processedText) {
      yPosition -= lineHeight * 0.5;
      return;
    }
    
    try {
      // Calculate proper text area and positioning
      const pageMargins = {
        left: margin,
        right: margin,
        top: margin,
        bottom: margin
      };
      
      const textAreaWidth = width - pageMargins.left - pageMargins.right;
      const rightEdge = width - pageMargins.right;
      
      if (isTitle) {
        // Center titles
        const textWidth = font.widthOfTextAtSize(processedText, size);
        const centerX = (width - textWidth) / 2;
        
        page.drawText(processedText, {
          x: Math.max(pageMargins.left, centerX),
          y: yPosition,
          size: size,
          font: font,
          color: rgb(0, 0, 0),
        });
        
        yPosition -= lineHeight * 1.5;
      } else {
        // Right-align text with proper width constraints
        const words = processedText.split(' ');
        let currentLine = '';
        let lines = [];
        
        // Break text into lines that fit within the text area
        words.forEach(word => {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const lineWidth = font.widthOfTextAtSize(testLine, size);
          
          if (lineWidth <= textAreaWidth) {
            currentLine = testLine;
          } else {
            if (currentLine) {
              lines.push(currentLine);
              currentLine = word;
            } else {
              lines.push(word);
            }
          }
        });
        
        if (currentLine) {
          lines.push(currentLine);
        }
        
        // Draw each line with proper RTL positioning
        lines.forEach((line, index) => {
          if (yPosition < pageMargins.bottom + 50) {
            page = pdfDoc.addPage();
            yPosition = height - pageMargins.top;
          }
          
          const lineWidth = font.widthOfTextAtSize(line, size);
          const xPosition = rightEdge - lineWidth;
          
          page.drawText(line, {
            x: Math.max(pageMargins.left, xPosition),
            y: yPosition,
            size: size,
            font: font,
            color: rgb(0, 0, 0),
          });
          
          yPosition -= lineHeight * (isBold ? 1.3 : 1.2);
        });
      }
      
    } catch (e) {
      console.log('❌ Error rendering RTL text for blob:', e.message);
      try {
        const fallbackText = `[Hebrew Text: ${text.length} chars]`;
        const textWidth = font.widthOfTextAtSize(fallbackText, size);
        const xPosition = Math.max(margin, width - margin - textWidth);
        
        page.drawText(fallbackText, {
          x: xPosition,
          y: yPosition,
          size: size,
          font: font,
          color: rgb(0.5, 0.5, 0.5),
        });
        
        yPosition -= lineHeight * 1.2;
      } catch (e2) {
        console.log('❌ Even fallback failed for blob:', e2);
        yPosition -= lineHeight;
      }
    }
  };
  
  // Generate and process the contract text
  const contractText = generateContractText(contractData);
  console.log('📄 Processing contract text with RTL support for blob, length:', contractText.length);
  
  // Add title - centered
  addRTLText('הסכם שירות להחזרי מס', 18, true, true);
  yPosition -= 20;
  
  // Add contract details with proper RTL formatting
  const currentDate = new Date().toLocaleDateString('he-IL');
  addRTLText(`תאריך: ${currentDate}`, 12);
  addRTLText(`מספר חוזה: ${contractData.contractNumber || 'לא צוין'}`, 12);
  yPosition -= 15;
  
  // Process contract content in sections with consistent spacing
  const sections = contractText.split('\n\n');
  
  sections.forEach((section: string, index: number) => {
    const trimmedSection = section.trim();
    if (trimmedSection) {
      const isNumberedSection = /^\d+\./.test(trimmedSection);
      
      if (isNumberedSection) {
        if (index > 0) {
          yPosition -= 8;
        }
        addRTLText(trimmedSection, 12, false, true);
      } else {
        const lines = trimmedSection.split('\n');
        lines.forEach((line: string) => {
          const trimmedLine = line.trim();
          if (trimmedLine) {
            addRTLText(trimmedLine, fontSize);
          } else {
            yPosition -= lineHeight * 0.3;
          }
        });
      }
    } else {
      yPosition -= lineHeight * 0.5;
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