import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { generateContractText } from './contractUtils';

// Configure pdfMake with fonts
pdfMake.vfs = pdfFonts;

// Add custom fonts including Hebrew support
pdfMake.fonts = {
  // Use Roboto for English/numbers (it's included in pdfmake by default)
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf'
  }
};

// Helper function to handle Hebrew text with proper RTL
function processHebrewText(text: string): any {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  // Replace undefined values with underscores (proper length)
  let processedText = text.replace(/undefined/g, '_________');
  
  // Split text into segments to handle mixed Hebrew/English content
  const segments = [];
  let currentSegment = '';
  let isHebrew = false;
  
  for (let i = 0; i < processedText.length; i++) {
    const char = processedText[i];
    const charCode = char.charCodeAt(0);
    const isHebrewChar = (charCode >= 0x0590 && charCode <= 0x05FF) || 
                         (charCode >= 0xFB1D && charCode <= 0xFB4F);
    
    if (i === 0) {
      isHebrew = isHebrewChar;
      currentSegment = char;
    } else if (isHebrewChar !== isHebrew) {
      // Language change detected
      segments.push({ text: currentSegment, isHebrew });
      currentSegment = char;
      isHebrew = isHebrewChar;
    } else {
      currentSegment += char;
    }
  }
  
  if (currentSegment) {
    segments.push({ text: currentSegment, isHebrew });
  }
  
  // Process segments
  const processedSegments = segments.map(segment => {
    if (segment.isHebrew) {
      // For Hebrew segments, we need to handle word order
      // Split by spaces but preserve them
      const words = segment.text.split(/(\s+)/);
      const hebrewWords = [];
      
      for (let i = 0; i < words.length; i++) {
        if (words[i].trim()) {
          // This is a word, not whitespace
          hebrewWords.push(words[i]);
        } else {
          // This is whitespace
          hebrewWords.push(words[i]);
        }
      }
      
      // Don't reverse the entire array, as pdfmake will handle character-level RTL
      return hebrewWords.join('');
    }
    return segment.text;
  });
  
  return processedSegments.join('');
}

// Helper function to create content blocks with proper RTL handling
function createContentBlock(text: string, style: string = 'body'): any {
  const processedText = processHebrewText(text);
  
  // Check if text contains Hebrew
  const hasHebrew = /[\u0590-\u05FF\uFB1D-\uFB4F]/.test(text);
  
  return {
    text: processedText,
    style: style,
    alignment: hasHebrew ? 'right' : 'left',
    direction: hasHebrew ? 'rtl' : 'ltr'
  };
}

// Helper to create mixed content with proper alignment
function createMixedContent(parts: Array<{text: string, bold?: boolean}>): any {
  return {
    text: parts.map(part => ({
      text: processHebrewText(part.text),
      bold: part.bold || false
    })),
    alignment: 'right',
    direction: 'rtl'
  };
}

export async function generateContractPDF(contractData: any, signatureDataURL: string) {
  console.log('🎯 Starting PDF generation with Hebrew support fix');
  
  const contractText = generateContractText(contractData);
  const lines = contractText.split('\n');
  
  // Current date
  const currentDate = new Date().toLocaleDateString('he-IL');
  
  // Document definition
  const docDefinition: any = {
    pageSize: 'A4',
    pageMargins: [40, 50, 40, 50],
    
    // Default style
    defaultStyle: {
      font: 'Roboto',
      fontSize: 11,
      alignment: 'right',
      direction: 'rtl'
    },
    
    // Custom styles
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        alignment: 'center',
        margin: [0, 0, 0, 20]
      },
      subheader: {
        fontSize: 14,
        bold: true,
        alignment: 'right',
        margin: [0, 10, 0, 5]
      },
      body: {
        fontSize: 11,
        alignment: 'right',
        lineHeight: 1.5,
        margin: [0, 0, 0, 8]
      },
      parties: {
        fontSize: 12,
        bold: true,
        alignment: 'right',
        margin: [0, 5, 0, 5]
      },
      numbered: {
        fontSize: 11,
        bold: true,
        alignment: 'right',
        margin: [0, 8, 0, 3]
      },
      promissoryTitle: {
        fontSize: 16,
        bold: true,
        alignment: 'center',
        margin: [0, 20, 0, 10]
      },
      underline: {
        decoration: 'underline',
        decorationStyle: 'solid'
      }
    },
    
    content: []
  };

  // Build content array
  const content: any[] = [];
  
  // Title
  content.push({
    text: 'הסכם שירות להחזרי מס',
    style: 'header'
  });
  
  // Date and contract number with proper formatting
  content.push({
    columns: [
      { 
        text: [
          { text: 'תאריך: ', bold: true },
          { text: currentDate }
        ],
        alignment: 'right',
        width: '*'
      },
      { 
        text: [
          { text: 'מספר חוזה: ', bold: true },
          { text: contractData.contractNumber || '___________' }
        ],
        alignment: 'right',
        width: '*'
      }
    ],
    margin: [0, 0, 0, 20]
  });
  
  // Process contract content line by line
  lines.forEach((line: string, index: number) => {
    const trimmedLine = line.trim();
    
    // Skip the title line we already added
    if (index === 0 && trimmedLine.includes('הסכם שירות להחזרי מס')) {
      return;
    }
    
    if (!trimmedLine) {
      // Empty line - add space
      content.push({ text: '', margin: [0, 5, 0, 0] });
    } else if (/^\d+\./.test(trimmedLine)) {
      // Numbered section - preserve the number at the beginning
      content.push({
        text: trimmedLine,
        style: 'numbered',
        alignment: 'right',
        preserveLeadingSpaces: true
      });
    } else if (trimmedLine.startsWith('בין:') || trimmedLine.startsWith('לבין:')) {
      // Party sections - handle carefully to preserve structure
      content.push({
        text: trimmedLine,
        style: 'parties',
        alignment: 'right'
      });
    } else if (trimmedLine.startsWith('הואיל')) {
      // Whereas clauses
      content.push({
        text: trimmedLine,
        style: 'body',
        alignment: 'right'
      });
    } else if (trimmedLine === 'שטר חוב') {
      // Promissory note title
      content.push({
        text: 'שטר חוב',
        style: 'promissoryTitle'
      });
    } else if (trimmedLine.includes('₪') && trimmedLine.includes('___')) {
      // Handle amount lines specially
      content.push({
        text: trimmedLine,
        style: 'body',
        alignment: 'right'
      });
    } else {
      // Regular text
      content.push({
        text: trimmedLine,
        style: 'body',
        alignment: 'right'
      });
    }
  });
  
  // Add signature section
  content.push({ text: '', margin: [0, 30, 0, 0] }); // Space before signatures
  
  if (signatureDataURL) {
    content.push({
      columns: [
        {
          stack: [
            { text: 'חתימת הלקוח:', style: 'body' },
            {
              image: signatureDataURL,
              width: 150,
              height: 75,
              margin: [0, 10, 0, 0]
            }
          ],
          width: '50%',
          alignment: 'right'
        },
        {
          stack: [
            { text: 'תאריך:', style: 'body' },
            { text: currentDate, margin: [0, 20, 0, 0] }
          ],
          width: '50%',
          alignment: 'right'
        }
      ],
      columnGap: 20
    });
  } else {
    content.push({
      columns: [
        {
          stack: [
            { text: 'חתימת הלקוח:', style: 'body' },
            { text: '_______________________', margin: [0, 20, 0, 0] }
          ],
          width: '50%',
          alignment: 'right'
        },
        {
          stack: [
            { text: 'תאריך:', style: 'body' },
            { text: '_______________________', margin: [0, 20, 0, 0] }
          ],
          width: '50%',
          alignment: 'right'
        }
      ],
      columnGap: 20
    });
  }
  
  docDefinition.content = content;
  
  // Generate and download PDF
  try {
    const pdfDocGenerator = pdfMake.createPdf(docDefinition);
    
    return new Promise<Blob>((resolve, reject) => {
      pdfDocGenerator.getBlob((blob: Blob) => {
        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `contract_${contractData.client?.id || contractData.idNumber || 'client'}_${Date.now()}.pdf`;
        link.click();
        
        // Clean up
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        console.log('✅ PDF generated and downloaded successfully');
        resolve(blob);
      });
    });
  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    throw error;
  }
}

export async function createAndDownloadPDF(contractData: any, signatureDataURL: string) {
  return await generateContractPDF(contractData, signatureDataURL);
}

export async function generateContractPDFBlob(contractData: any, signatureDataURL: string): Promise<Blob> {
  console.log('🎯 Starting PDF blob generation');
  
  // Use the same logic as generateContractPDF but return blob only
  const contractText = generateContractText(contractData);
  const lines = contractText.split('\n');
  const currentDate = new Date().toLocaleDateString('he-IL');
  
  const docDefinition: any = {
    pageSize: 'A4',
    pageMargins: [40, 50, 40, 50],
    
    defaultStyle: {
      font: 'Roboto',
      fontSize: 11,
      alignment: 'right',
      direction: 'rtl'
    },
    
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        alignment: 'center',
        margin: [0, 0, 0, 20]
      },
      subheader: {
        fontSize: 14,
        bold: true,
        alignment: 'right',
        margin: [0, 10, 0, 5]
      },
      body: {
        fontSize: 11,
        alignment: 'right',
        lineHeight: 1.5,
        margin: [0, 0, 0, 8]
      },
      parties: {
        fontSize: 12,
        bold: true,
        alignment: 'right',
        margin: [0, 5, 0, 5]
      },
      numbered: {
        fontSize: 11,
        bold: true,
        alignment: 'right',
        margin: [0, 8, 0, 3]
      },
      promissoryTitle: {
        fontSize: 16,
        bold: true,
        alignment: 'center',
        margin: [0, 20, 0, 10]
      }
    },
    
    content: []
  };

  // Build content (same as above)
  const content: any[] = [];
  
  content.push({
    text: 'הסכם שירות להחזרי מס',
    style: 'header'
  });
  
  content.push({
    columns: [
      { 
        text: [
          { text: 'תאריך: ', bold: true },
          { text: currentDate }
        ],
        alignment: 'right',
        width: '*'
      },
      { 
        text: [
          { text: 'מספר חוזה: ', bold: true },
          { text: contractData.contractNumber || '___________' }
        ],
        alignment: 'right',
        width: '*'
      }
    ],
    margin: [0, 0, 0, 20]
  });
  
  lines.forEach((line: string, index: number) => {
    const trimmedLine = line.trim();
    
    if (index === 0 && trimmedLine.includes('הסכם שירות להחזרי מס')) {
      return;
    }
    
    if (!trimmedLine) {
      content.push({ text: '', margin: [0, 5, 0, 0] });
    } else if (/^\d+\./.test(trimmedLine)) {
      content.push({
        text: trimmedLine,
        style: 'numbered',
        alignment: 'right',
        preserveLeadingSpaces: true
      });
    } else if (trimmedLine.startsWith('בין:') || trimmedLine.startsWith('לבין:')) {
      content.push({
        text: trimmedLine,
        style: 'parties',
        alignment: 'right'
      });
    } else if (trimmedLine.startsWith('הואיל')) {
      content.push({
        text: trimmedLine,
        style: 'body',
        alignment: 'right'
      });
    } else if (trimmedLine === 'שטר חוב') {
      content.push({
        text: 'שטר חוב',
        style: 'promissoryTitle'
      });
    } else if (trimmedLine.includes('₪') && trimmedLine.includes('___')) {
      content.push({
        text: trimmedLine,
        style: 'body',
        alignment: 'right'
      });
    } else {
      content.push({
        text: trimmedLine,
        style: 'body',
        alignment: 'right'
      });
    }
  });
  
  content.push({ text: '', margin: [0, 30, 0, 0] });
  
  if (signatureDataURL) {
    content.push({
      columns: [
        {
          stack: [
            { text: 'חתימת הלקוח:', style: 'body' },
            {
              image: signatureDataURL,
              width: 150,
              height: 75,
              margin: [0, 10, 0, 0]
            }
          ],
          width: '50%',
          alignment: 'right'
        },
        {
          stack: [
            { text: 'תאריך:', style: 'body' },
            { text: currentDate, margin: [0, 20, 0, 0] }
          ],
          width: '50%',
          alignment: 'right'
        }
      ],
      columnGap: 20
    });
  } else {
    content.push({
      columns: [
        {
          stack: [
            { text: 'חתימת הלקוח:', style: 'body' },
            { text: '_______________________', margin: [0, 20, 0, 0] }
          ],
          width: '50%',
          alignment: 'right'
        },
        {
          stack: [
            { text: 'תאריך:', style: 'body' },
            { text: '_______________________', margin: [0, 20, 0, 0] }
          ],
          width: '50%',
          alignment: 'right'
        }
      ],
      columnGap: 20
    });
  }
  
  docDefinition.content = content;
  
  try {
    const pdfDocGenerator = pdfMake.createPdf(docDefinition);
    
    return new Promise<Blob>((resolve, reject) => {
      pdfDocGenerator.getBlob((blob: Blob) => {
        console.log('✅ PDF blob generated successfully');
        resolve(blob);
      });
    });
  } catch (error) {
    console.error('❌ PDF blob generation failed:', error);
    throw error;
  }
}