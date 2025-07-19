import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { generateContractText } from './contractUtils';

// Configure pdfMake with default fonts
pdfMake.vfs = pdfFonts;

// Load Hebrew font dynamically
async function loadHebrewFont() {
  try {
    const fontResponse = await fetch('/fonts/NotoSansHebrew-Regular.ttf');
    if (fontResponse.ok) {
      const fontArrayBuffer = await fontResponse.arrayBuffer();
      const fontBase64 = btoa(String.fromCharCode(...new Uint8Array(fontArrayBuffer)));
      
      // Add Hebrew font to vfs
      pdfMake.vfs['NotoSansHebrew-Regular.ttf'] = fontBase64;
      
      // Configure fonts
      pdfMake.fonts = {
        NotoSansHebrew: {
          normal: 'NotoSansHebrew-Regular.ttf',
          bold: 'NotoSansHebrew-Regular.ttf', // Use regular for bold until we get bold font
          italics: 'NotoSansHebrew-Regular.ttf',
          bolditalics: 'NotoSansHebrew-Regular.ttf'
        },
        Roboto: {
          normal: 'Roboto-Regular.ttf',
          bold: 'Roboto-Medium.ttf',
          italics: 'Roboto-Italic.ttf',
          bolditalics: 'Roboto-MediumItalic.ttf'
        }
      };
      
      console.log('✅ Hebrew font loaded successfully');
      return true;
    }
  } catch (error) {
    console.error('❌ Failed to load Hebrew font:', error);
  }
  
  // Fallback to Roboto
  pdfMake.fonts = {
    Roboto: {
      normal: 'Roboto-Regular.ttf',
      bold: 'Roboto-Medium.ttf',
      italics: 'Roboto-Italic.ttf',
      bolditalics: 'Roboto-MediumItalic.ttf'
    }
  };
  
  return false;
}

// Helper function to process Hebrew text
function processHebrewText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  // Replace undefined values
  let processedText = text.replace(/undefined/g, '_________');
  
  // Numbers in Hebrew context should be displayed normally in pdfmake
  // No need for bidi-js workarounds
  return processedText;
}

// Helper function to create content blocks
function createContentBlock(text: string, style: string = 'body'): any {
  const processedText = processHebrewText(text);
  
  return {
    text: processedText,
    style: style
  };
}

export async function generateContractPDF(contractData: any, signatureDataURL: string) {
  console.log('🎯 Starting PDF generation with pdfMake and Hebrew support');
  
  // Load Hebrew font
  const hebrewFontLoaded = await loadHebrewFont();
  const fontFamily = hebrewFontLoaded ? 'NotoSansHebrew' : 'Roboto';
  
  const contractText = generateContractText(contractData);
  const lines = contractText.split('\n');
  
  // Current date
  const currentDate = new Date().toLocaleDateString('he-IL');
  
  // Document definition
  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 50, 40, 50],
    
    // Default style for all content
    defaultStyle: {
      font: fontFamily,
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
      }
    },
    
    content: []
  };

  // Build content array
  const content: any[] = [];
  
  // Title
  content.push(createContentBlock('הסכם שירות להחזרי מס', 'header'));
  
  // Date and contract number
  content.push({
    columns: [
      { text: processHebrewText(`תאריך: ${currentDate}`), width: '*', alignment: 'right' },
      { text: processHebrewText(`מספר חוזה: ${contractData.contractNumber || '___________'}`), width: '*', alignment: 'right' }
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
      // Numbered section
      content.push(createContentBlock(trimmedLine, 'numbered'));
    } else if (trimmedLine.startsWith('בין:') || trimmedLine.startsWith('לבין:')) {
      // Party sections
      content.push(createContentBlock(trimmedLine, 'parties'));
    } else if (trimmedLine.startsWith('הואיל')) {
      // Whereas clauses
      content.push(createContentBlock(trimmedLine, 'body'));
    } else if (trimmedLine === 'שטר חוב') {
      // Promissory note title
      content.push(createContentBlock(trimmedLine, 'promissoryTitle'));
    } else {
      // Regular text
      content.push(createContentBlock(trimmedLine, 'body'));
    }
  });
  
  // Add signature section
  content.push({ text: '', margin: [0, 30, 0, 0] }); // Space before signatures
  
  if (signatureDataURL) {
    content.push({
      columns: [
        {
          stack: [
            { text: processHebrewText('חתימת הלקוח:'), style: 'body' },
            {
              image: signatureDataURL,
              width: 150,
              height: 75,
              margin: [0, 10, 0, 0]
            }
          ],
          width: '50%'
        },
        {
          stack: [
            { text: processHebrewText('תאריך:'), style: 'body' },
            { text: processHebrewText(currentDate), margin: [0, 20, 0, 0] }
          ],
          width: '50%'
        }
      ]
    });
  } else {
    content.push({
      columns: [
        {
          stack: [
            { text: processHebrewText('חתימת הלקוח:'), style: 'body' },
            { text: '_______________________', margin: [0, 20, 0, 0] }
          ],
          width: '50%'
        },
        {
          stack: [
            { text: processHebrewText('תאריך:'), style: 'body' },
            { text: '_______________________', margin: [0, 20, 0, 0] }
          ],
          width: '50%'
        }
      ]
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
  console.log('🎯 Starting PDF blob generation with pdfMake and Hebrew support');
  
  // Load Hebrew font
  const hebrewFontLoaded = await loadHebrewFont();
  const fontFamily = hebrewFontLoaded ? 'NotoSansHebrew' : 'Roboto';
  
  const contractText = generateContractText(contractData);
  const lines = contractText.split('\n');
  
  // Current date
  const currentDate = new Date().toLocaleDateString('he-IL');
  
  // Document definition (same as above but for blob only)
  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 50, 40, 50],
    
    defaultStyle: {
      font: fontFamily,
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

  // Build content array (same logic as above)
  const content: any[] = [];
  
  content.push(createContentBlock('הסכם שירות להחזרי מס', 'header'));
  
  content.push({
    columns: [
      { text: processHebrewText(`תאריך: ${currentDate}`), width: '*', alignment: 'right' },
      { text: processHebrewText(`מספר חוזה: ${contractData.contractNumber || '___________'}`), width: '*', alignment: 'right' }
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
      content.push(createContentBlock(trimmedLine, 'numbered'));
    } else if (trimmedLine.startsWith('בין:') || trimmedLine.startsWith('לבין:')) {
      content.push(createContentBlock(trimmedLine, 'parties'));
    } else if (trimmedLine.startsWith('הואיל')) {
      content.push(createContentBlock(trimmedLine, 'body'));
    } else if (trimmedLine === 'שטר חוב') {
      content.push(createContentBlock(trimmedLine, 'promissoryTitle'));
    } else {
      content.push(createContentBlock(trimmedLine, 'body'));
    }
  });
  
  // Add signature section
  content.push({ text: '', margin: [0, 30, 0, 0] });
  
  if (signatureDataURL) {
    content.push({
      columns: [
        {
          stack: [
            { text: processHebrewText('חתימת הלקוח:'), style: 'body' },
            {
              image: signatureDataURL,
              width: 150,
              height: 75,
              margin: [0, 10, 0, 0]
            }
          ],
          width: '50%'
        },
        {
          stack: [
            { text: processHebrewText('תאריך:'), style: 'body' },
            { text: processHebrewText(currentDate), margin: [0, 20, 0, 0] }
          ],
          width: '50%'
        }
      ]
    });
  } else {
    content.push({
      columns: [
        {
          stack: [
            { text: processHebrewText('חתימת הלקוח:'), style: 'body' },
            { text: '_______________________', margin: [0, 20, 0, 0] }
          ],
          width: '50%'
        },
        {
          stack: [
            { text: processHebrewText('תאריך:'), style: 'body' },
            { text: '_______________________', margin: [0, 20, 0, 0] }
          ],
          width: '50%'
        }
      ]
    });
  }
  
  docDefinition.content = content;
  
  // Generate PDF blob
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