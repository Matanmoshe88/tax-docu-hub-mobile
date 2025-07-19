// pdfGenerator.ts
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { generateContractText } from './contractUtils';

export async function generateContractPDF(contractData: any, signatureDataURL: string) {
 console.log('🎯 Starting PDF generation with Hebrew support');
 
 const pdfDoc = await PDFDocument.create();
 pdfDoc.registerFontkit(fontkit);
 
 // Load Hebrew font
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
 const lineHeight = fontSize * 1.8;
 
 // Process Hebrew text without using bidi-js (which causes the colon issue)
 const processHebrewText = (text: string): string => {
   if (!text || typeof text !== 'string') {
     return '';
   }
   
   // Replace undefined values
   let processedText = text.replace(/undefined/g, '_________');
   
   // Preserve numbers by wrapping them in strong LTR marks
   processedText = processedText
     // Year ranges (e.g., 2018-2023)
     .replace(/(\d{4}-\d{4})/g, '\u202D$1\u202C')
     // Phone numbers and IDs
     .replace(/(\d{9,10})/g, '\u202D$1\u202C')
     // Zip codes and PO boxes
     .replace(/(\d{4,6})/g, '\u202D$1\u202C')
     // Percentages
     .replace(/(\d+\.?\d*%)/g, '\u202D$1\u202C')
     // Money amounts
     .replace(/(\d+)\s*(₪)/g, '\u202D$1\u202C $2')
     // Hours (48 שעות)
     .replace(/(\d+)\s*(שעות|ימים|שנים)/g, '\u202D$1\u202C $2')
     // Section numbers
     .replace(/^(\d+)\./gm, '\u202D$1\u202C.')
     // Any remaining numbers
     .replace(/(\d+)/g, '\u202D$1\u202C');
   
   return processedText;
 };

 // Helper to add RTL text
 const addRTLText = (text: string, size: number = fontSize, isTitle: boolean = false, isBold: boolean = false) => {
   // Check for page break
   if (yPosition < margin + 50) {
     page = pdfDoc.addPage();
     yPosition = height - margin;
   }
   
   const processedText = processHebrewText(text);
   
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
       
       yPosition -= size * 2.5;
     } else {
       // For regular text, handle line wrapping
       const words = processedText.split(' ');
       let lines: string[] = [];
       let currentLine = '';
       
       for (const word of words) {
         const testLine = currentLine ? `${currentLine} ${word}` : word;
         const testWidth = font.widthOfTextAtSize(testLine, size);
         
         if (testWidth <= textAreaWidth && testLine.length < 120) {
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
       
       // If no line breaks needed
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
         
         // Consistent line spacing
         yPosition -= size * 1.8;
       });
       
       // Add extra space after paragraphs
       if (lines.length > 1 || isBold) {
         yPosition -= size * 0.5;
       }
     }
   } catch (e) {
     console.error('❌ Error rendering text:', e);
     yPosition -= lineHeight;
   }
 };
 
 // Generate contract text
 const contractText = generateContractText(contractData);
 
 // Add title
 addRTLText('הסכם שירות להחזרי מס', 18, true, true);
 
 // Add date and contract number
 const currentDate = new Date().toLocaleDateString('he-IL');
 addRTLText(`תאריך: ${currentDate}`, 12);
 addRTLText(`מספר חוזה: ${contractData.contractNumber || '___________'}`, 12);
 
 // Add extra space after header
 yPosition -= 10;
 
 // Process contract content line by line
 const lines = contractText.split('\n');
 
 lines.forEach((line: string, index: number) => {
   const trimmedLine = line.trim();
   
   // Skip the title line we already added
   if (index === 0 && trimmedLine.includes('הסכם שירות להחזרי מס')) {
     return;
   }
   
   if (!trimmedLine) {
     // Empty line - add paragraph spacing
     yPosition -= lineHeight * 0.5;
   } else if (/^\d+\./.test(trimmedLine)) {
     // Numbered section - add extra space before (except first)
     if (index > 0) {
       yPosition -= lineHeight * 0.3;
     }
     addRTLText(trimmedLine, fontSize, false, true);
   } else if (trimmedLine.startsWith('בין:') || trimmedLine.startsWith('לבין:')) {
     // Party sections - slightly larger
     addRTLText(trimmedLine, fontSize + 1, false, true);
   } else if (trimmedLine.startsWith('הואיל')) {
     // Whereas clauses
     yPosition -= lineHeight * 0.2;
     addRTLText(trimmedLine, fontSize);
   } else if (trimmedLine === 'שטר חוב') {
     // Promissory note title
     yPosition -= lineHeight;
     addRTLText(trimmedLine, 16, true, true);
   } else {
     // Regular text
     addRTLText(trimmedLine, fontSize);
   }
 });
 
 // Add signature section with proper spacing
 yPosition -= 30;
 
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
 link.download = `contract_${contractData.client?.id || contractData.idNumber || 'client'}_${Date.now()}.pdf`;
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
 
 // Load Hebrew font
 let font;
 try {
   console.log('🔄 Loading Noto Sans Hebrew font for blob...');
   const fontResponse = await fetch('/fonts/NotoSansHebrew-Regular.ttf');
   
   if (!fontResponse.ok) {
     throw new Error(`Font fetch failed: ${fontResponse.status} ${fontResponse.statusText}`);
   }
   
   const fontBytes = await fontResponse.arrayBuffer();
   font = await pdfDoc.embedFont(fontBytes);
   console.log('✅ Noto Sans Hebrew font embedded successfully for blob');
   
 } catch (e) {
   console.error('❌ Failed to load Hebrew font for blob:', e);
   font = await pdfDoc.embedFont(StandardFonts.Helvetica);
 }
 
 let page = pdfDoc.addPage();
 const { width, height } = page.getSize();
 const margin = 50;
 let yPosition = height - margin;
 const fontSize = 12;
 const lineHeight = fontSize * 1.8;
 
 // Process Hebrew text without using bidi-js
 const processHebrewText = (text: string): string => {
   if (!text || typeof text !== 'string') {
     return '';
   }
   
   // Replace undefined values
   let processedText = text.replace(/undefined/g, '_________');
   
   // Preserve numbers by wrapping them in strong LTR marks
   processedText = processedText
     // Year ranges (e.g., 2018-2023)
     .replace(/(\d{4}-\d{4})/g, '\u202D$1\u202C')
     // Phone numbers and IDs
     .replace(/(\d{9,10})/g, '\u202D$1\u202C')
     // Zip codes and PO boxes
     .replace(/(\d{4,6})/g, '\u202D$1\u202C')
     // Percentages
     .replace(/(\d+\.?\d*%)/g, '\u202D$1\u202C')
     // Money amounts
     .replace(/(\d+)\s*(₪)/g, '\u202D$1\u202C $2')
     // Hours (48 שעות)
     .replace(/(\d+)\s*(שעות|ימים|שנים)/g, '\u202D$1\u202C $2')
     // Section numbers
     .replace(/^(\d+)\./gm, '\u202D$1\u202C.')
     // Any remaining numbers
     .replace(/(\d+)/g, '\u202D$1\u202C');
   
   return processedText;
 };

 // Helper to add RTL text (same as main function)
 const addRTLText = (text: string, size: number = fontSize, isTitle: boolean = false, isBold: boolean = false) => {
   if (yPosition < margin + 50) {
     page = pdfDoc.addPage();
     yPosition = height - margin;
   }
   
   const processedText = processHebrewText(text);
   
   if (!processedText || processedText.trim() === '') {
     yPosition -= lineHeight * 0.5;
     return;
   }
   
   try {
     const textAreaWidth = width - (margin * 2);
     const rightEdge = width - margin;
     
     if (isTitle) {
       const textWidth = font.widthOfTextAtSize(processedText, size);
       const centerX = (width - textWidth) / 2;
       
       page.drawText(processedText, {
         x: centerX,
         y: yPosition,
         size: size,
         font: font,
         color: rgb(0, 0, 0),
       });
       
       yPosition -= size * 2.5;
     } else {
       const words = processedText.split(' ');
       let lines: string[] = [];
       let currentLine = '';
       
       for (const word of words) {
         const testLine = currentLine ? `${currentLine} ${word}` : word;
         const testWidth = font.widthOfTextAtSize(testLine, size);
         
         if (testWidth <= textAreaWidth && testLine.length < 120) {
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
       
       if (lines.length === 0) {
         lines = [processedText];
       }
       
       lines.forEach((line) => {
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
         
         yPosition -= size * 1.8;
       });
       
       if (lines.length > 1 || isBold) {
         yPosition -= size * 0.5;
       }
     }
   } catch (e) {
     console.error('❌ Error rendering text for blob:', e);
     yPosition -= lineHeight;
   }
 };
 
 // Generate contract text
 const contractText = generateContractText(contractData);
 
 // Add title
 addRTLText('הסכם שירות להחזרי מס', 18, true, true);
 
 // Add date and contract number
 const currentDate = new Date().toLocaleDateString('he-IL');
 addRTLText(`תאריך: ${currentDate}`, 12);
 addRTLText(`מספר חוזה: ${contractData.contractNumber || '___________'}`, 12);
 
 // Add extra space after header
 yPosition -= 10;
 
 // Process contract content line by line
 const lines = contractText.split('\n');
 
 lines.forEach((line: string, index: number) => {
   const trimmedLine = line.trim();
   
   if (index === 0 && trimmedLine.includes('הסכם שירות להחזרי מס')) {
     return;
   }
   
   if (!trimmedLine) {
     yPosition -= lineHeight * 0.5;
   } else if (/^\d+\./.test(trimmedLine)) {
     if (index > 0) {
       yPosition -= lineHeight * 0.3;
     }
     addRTLText(trimmedLine, fontSize, false, true);
   } else if (trimmedLine.startsWith('בין:') || trimmedLine.startsWith('לבין:')) {
     addRTLText(trimmedLine, fontSize + 1, false, true);
   } else if (trimmedLine.startsWith('הואיל')) {
     yPosition -= lineHeight * 0.2;
     addRTLText(trimmedLine, fontSize);
   } else if (trimmedLine === 'שטר חוב') {
     yPosition -= lineHeight;
     addRTLText(trimmedLine, 16, true, true);
   } else {
     addRTLText(trimmedLine, fontSize);
   }
 });
 
 // Add signature section with proper spacing
 yPosition -= 30;
 
 // Add signature if exists
 if (signatureDataURL) {
   try {
     if (yPosition < 100) {
       page = pdfDoc.addPage();
       yPosition = height - margin;
     }
     
     const signatureImage = await pdfDoc.embedPng(signatureDataURL);
     const dims = signatureImage.scale(0.3);
     
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
 
 // Return PDF as blob for storage
 const pdfBytes = await pdfDoc.save();
 return new Blob([pdfBytes], { type: 'application/pdf' });
}