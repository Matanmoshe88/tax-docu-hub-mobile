import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { generateContractText } from './contractUtils';

// Configure pdfMake with fonts
pdfMake.vfs = pdfFonts.vfs;

// Use only Roboto font which has basic Hebrew support
pdfMake.fonts = {
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf'
  }
};

// Helper function to process Hebrew text
function processHebrewText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  // Replace undefined values with underscores
  let processedText = text.replace(/undefined/g, '_________');
  
  // Don't manipulate Hebrew text - let pdfmake handle RTL
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
  console.log('🎯 Starting PDF generation with pdfMake');
  
  // Ensure contractData has all required fields
  const clientData = {
    firstName: contractData.firstName || contractData.client?.firstName || '',
    lastName: contractData.lastName || contractData.client?.lastName || '',
    idNumber: contractData.idNumber || contractData.client?.idNumber || '',
    phone: contractData.phone || contractData.client?.phone || '',
    email: contractData.email || contractData.client?.email || '',
    address: contractData.address || contractData.client?.address || '',
    commissionRate: contractData.commissionRate || contractData.client?.commissionRate || '25%',
    contractNumber: contractData.contractNumber || ''
  };
  
  console.log('Client data:', clientData);
  
  const contractText = generateContractText(clientData);
  const lines = contractText.split('\n');
  
  // Current date
  const currentDate = new Date().toLocaleDateString('he-IL');
  
  // Document definition
  const docDefinition: any = {
    pageSize: 'A4',
    pageMargins: [40, 50, 40, 50],
    
    // Default style for all content
    defaultStyle: {
      font: 'Roboto',
      fontSize: 12,
      alignment: 'right',
      direction: 'rtl',
      leadingIndent: 0,
      lineHeight: 1.6
    },
    
    // Custom styles
    styles: {
      header: {
        fontSize: 20,
        bold: true,
        alignment: 'center',
        margin: [0, 0, 0, 30]
      },
      subheader: {
        fontSize: 16,
        bold: true,
        alignment: 'right',
        margin: [0, 15, 0, 10]
      },
      body: {
        fontSize: 12,
        alignment: 'right',
        lineHeight: 1.6,
        margin: [0, 0, 0, 10]
      },
      parties: {
        fontSize: 14,
        bold: true,
        alignment: 'right',
        margin: [0, 10, 0, 10]
      },
      numbered: {
        fontSize: 12,
        bold: true,
        alignment: 'right',
        margin: [0, 15, 0, 5]
      },
      promissoryTitle: {
        fontSize: 18,
        bold: true,
        alignment: 'center',
        margin: [0, 30, 0, 20],
        pageBreak: 'before'
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
      { text: processHebrewText(`מספר חוזה: ${clientData.contractNumber || '___________'}`), width: '*', alignment: 'right' }
    ],
    margin: [0, 0, 0, 30]
  });
  
  // Process contract content line by line
  let inPromissoryNote = false;
  
  lines.forEach((line: string, index: number) => {
    const trimmedLine = line.trim();
    
    // Skip the title line we already added
    if (index === 0 && trimmedLine.includes('הסכם שירות להחזרי מס')) {
      return;
    }
    
    if (!trimmedLine) {
      // Empty line - add space
      content.push({ text: '', margin: [0, 5, 0, 0] });
    } else if (trimmedLine === 'שטר חוב') {
      // Promissory note title - start new page
      inPromissoryNote = true;
      content.push({
        text: 'שטר חוב',
        style: 'promissoryTitle',
        pageBreak: 'before'
      });
    } else if (/^\d+\./.test(trimmedLine)) {
      // Numbered section
      content.push(createContentBlock(trimmedLine, 'numbered'));
    } else if (trimmedLine.startsWith('בין:') || trimmedLine.startsWith('לבין:')) {
      // Party sections
      content.push(createContentBlock(trimmedLine, 'parties'));
    } else if (trimmedLine.startsWith('הואיל')) {
      // Whereas clauses
      content.push(createContentBlock(trimmedLine, 'body'));
    } else if (inPromissoryNote && trimmedLine.includes('פרטי עושה השטר:')) {
      // Promissory note details section
      content.push({ text: '', margin: [0, 20, 0, 0] });
      content.push(createContentBlock(trimmedLine, 'subheader'));
    } else {
      // Regular text
      content.push(createContentBlock(trimmedLine, 'body'));
    }
  });
  
  // Add signature section
  content.push({ text: '', margin: [0, 40, 0, 0] }); // Space before signatures
  
  if (signatureDataURL) {
    content.push({
      columns: [
        {
          stack: [
            { text: 'חתימת הלקוח:', style: 'parties' },
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
            { text: 'תאריך:', style: 'parties' },
            { text: currentDate, margin: [0, 20, 0, 0] }
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
            { text: 'חתימת הלקוח:', style: 'parties' },
            { text: '_______________________', margin: [0, 20, 0, 0] }
          ],
          width: '50%'
        },
        {
          stack: [
            { text: 'תאריך:', style: 'parties' },
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
        link.download = `contract_${clientData.idNumber || 'client'}_${Date.now()}.pdf`;
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
  
  // Same implementation as above but return blob only
  const clientData = {
    firstName: contractData.firstName || contractData.client?.firstName || '',
    lastName: contractData.lastName || contractData.client?.lastName || '',
    idNumber: contractData.idNumber || contractData.client?.idNumber || '',
    phone: contractData.phone || contractData.client?.phone || '',
    email: contractData.email || contractData.client?.email || '',
    address: contractData.address || contractData.client?.address || '',
    commissionRate: contractData.commissionRate || contractData.client?.commissionRate || '25%',
    contractNumber: contractData.contractNumber || ''
  };
  
  const contractText = generateContractText(clientData);
  const lines = contractText.split('\n');
  const currentDate = new Date().toLocaleDateString('he-IL');
  
  const docDefinition: any = {
    pageSize: 'A4',
    pageMargins: [40, 50, 40, 50],
    
    defaultStyle: {
      font: 'Roboto',
      fontSize: 12,
      alignment: 'right',
      direction: 'rtl',
      leadingIndent: 0,
      lineHeight: 1.6
    },
    
    styles: {
      header: {
        fontSize: 20,
        bold: true,
        alignment: 'center',
        margin: [0, 0, 0, 30]
      },
      subheader: {
        fontSize: 16,
        bold: true,
        alignment: 'right',
        margin: [0, 15, 0, 10]
      },
      body: {
        fontSize: 12,
        alignment: 'right',
        lineHeight: 1.6,
        margin: [0, 0, 0, 10]
      },
      parties: {
        fontSize: 14,
        bold: true,
        alignment: 'right',
        margin: [0, 10, 0, 10]
      },
      numbered: {
        fontSize: 12,
        bold: true,
        alignment: 'right',
        margin: [0, 15, 0, 5]
      },
      promissoryTitle: {
        fontSize: 18,
        bold: true,
        alignment: 'center',
        margin: [0, 30, 0, 20],
        pageBreak: 'before'
      }
    },
    
    content: []
  };

  const content: any[] = [];
  
  content.push(createContentBlock('הסכם שירות להחזרי מס', 'header'));
  
  content.push({
    columns: [
      { text: processHebrewText(`תאריך: ${currentDate}`), width: '*', alignment: 'right' },
      { text: processHebrewText(`מספר חוזה: ${clientData.contractNumber || '___________'}`), width: '*', alignment: 'right' }
    ],
    margin: [0, 0, 0, 30]
  });
  
  let inPromissoryNote = false;
  
  lines.forEach((line: string, index: number) => {
    const trimmedLine = line.trim();
    
    if (index === 0 && trimmedLine.includes('הסכם שירות להחזרי מס')) {
      return;
    }
    
    if (!trimmedLine) {
      content.push({ text: '', margin: [0, 5, 0, 0] });
    } else if (trimmedLine === 'שטר חוב') {
      inPromissoryNote = true;
      content.push({
        text: 'שטר חוב',
        style: 'promissoryTitle',
        pageBreak: 'before'
      });
    } else if (/^\d+\./.test(trimmedLine)) {
      content.push(createContentBlock(trimmedLine, 'numbered'));
    } else if (trimmedLine.startsWith('בין:') || trimmedLine.startsWith('לבין:')) {
      content.push(createContentBlock(trimmedLine, 'parties'));
    } else if (trimmedLine.startsWith('הואיל')) {
      content.push(createContentBlock(trimmedLine, 'body'));
    } else if (inPromissoryNote && trimmedLine.includes('פרטי עושה השטר:')) {
      content.push({ text: '', margin: [0, 20, 0, 0] });
      content.push(createContentBlock(trimmedLine, 'subheader'));
    } else {
      content.push(createContentBlock(trimmedLine, 'body'));
    }
  });
  
  content.push({ text: '', margin: [0, 40, 0, 0] });
  
  if (signatureDataURL) {
    content.push({
      columns: [
        {
          stack: [
            { text: 'חתימת הלקוח:', style: 'parties' },
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
            { text: 'תאריך:', style: 'parties' },
            { text: currentDate, margin: [0, 20, 0, 0] }
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
            { text: 'חתימת הלקוח:', style: 'parties' },
            { text: '_______________________', margin: [0, 20, 0, 0] }
          ],
          width: '50%'
        },
        {
          stack: [
            { text: 'תאריך:', style: 'parties' },
            { text: '_______________________', margin: [0, 20, 0, 0] }
          ],
          width: '50%'
        }
      ]
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