import { jsPDF } from 'jspdf';
import { generateContractText } from './contractUtils';

// Alternative PDF generation using HTML and proper RTL support
const generatePDFFromHTML = async (contractData: any, signatureDataURL: string): Promise<Blob> => {
  console.log('🎯 Generating PDF using HTML approach with proper RTL support');
  console.log('📊 Contract data received:', contractData);
  
  const clientData = {
    firstName: contractData.firstName || contractData.client?.name?.split(' ')[0] || contractData.clientData?.firstName || contractData.Name?.split(' ')[0] || '',
    lastName: contractData.lastName || contractData.client?.name?.split(' ').slice(1).join(' ') || contractData.clientData?.lastName || contractData.Name?.split(' ').slice(1).join(' ') || '',
    idNumber: contractData.idNumber || contractData.client?.id || contractData.clientData?.idNumber || contractData.PersonalNumber__c || '',
    phone: contractData.phone || contractData.client?.phone || contractData.clientData?.phone || contractData.MobilePhone || '',
    email: contractData.email || contractData.client?.email || contractData.clientData?.email || contractData.PersonEmail || '',
    address: contractData.address || contractData.client?.address || contractData.clientData?.address || contractData.PersonMailingStreet || '',
    commissionRate: contractData.commissionRate || contractData.client?.commissionRate || contractData.clientData?.commissionRate || contractData.commission_rate__c || '22%',
    contractNumber: contractData.contractNumber || contractData.Id || ''
  };

  console.log('📋 Processed client data:', clientData);

  const contractText = generateContractText(clientData);
  const currentDate = new Date().toLocaleDateString('he-IL');
  
  // Create QuickTax logo as text since we can't access the image file
  const logoHtml = '<div style="color: #2563eb; font-size: 24px; font-weight: bold;">QuickTax</div>';
  
  // Create HTML with proper RTL support and UTF-8 encoding
  const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@400;700&display=swap');
        
        * {
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Noto Sans Hebrew', Arial, sans-serif;
          direction: rtl;
          text-align: right;
          margin: 40px;
          padding: 0;
          line-height: 1.6;
          font-size: 12px;
          background: white;
          color: black;
        }
        
        .contract-container {
          max-width: 800px;
          margin: 0 auto;
          direction: rtl;
          text-align: right;
          padding: 30px;
          background: white;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #ddd;
          padding-bottom: 20px;
        }
        
        .logo {
          max-height: 60px;
          max-width: 200px;
        }
        
        .title {
          text-align: center;
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 20px;
        }
        
        .header-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          font-size: 12px;
        }
        
        .content-section {
          margin-bottom: 15px;
          direction: rtl;
          text-align: right;
        }
        
        .numbered-section {
          font-weight: bold;
          margin-top: 10px;
          margin-bottom: 5px;
        }
        
        .party-section {
          font-weight: bold;
          font-size: 14px;
          margin-top: 10px;
        }
        
        .promissory-note {
          page-break-before: always;
          text-align: center;
          font-size: 14px;
          font-weight: bold;
          margin-top: 0;
          padding-top: 50px;
          min-height: 100vh;
        }
        
        .promissory-content {
          margin-top: 30px;
          text-align: right;
          font-size: 12px;
          font-weight: normal;
          page-break-inside: avoid;
        }
        
        .main-contract {
          page-break-after: always;
        }
        
        .page-break {
          page-break-before: always;
          display: block;
          height: 0;
          margin: 0;
          padding: 0;
        }
        
        .signature-section {
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .signature-line {
          border-bottom: 1px solid black;
          width: 200px;
          height: 50px;
          margin-top: 10px;
        }
        
        .date-section {
          text-align: left;
        }
        
        @media print {
          body { 
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <div class="contract-container">
        <div class="header">
          ${logoHtml}
          <div>
            <div>תאריך: ${currentDate}</div>
            <div>מספר חוזה: ${clientData.contractNumber || '___________'}</div>
          </div>
        </div>
        
        <div class="title">הסכם שירות להחזרי מס</div>
        
        <div class="main-contract">
          <div class="content">
            ${contractText.split('\n').map(line => {
              const trimmedLine = line.trim();
              if (!trimmedLine) return '<div style="height: 10px;"></div>';
              if (trimmedLine.includes('הסכם שירות להחזרי מס')) return ''; // Skip title
              if (trimmedLine === 'שטר חוב') {
                return '</div></div><div class="page-break"></div><div class="promissory-note">שטר חוב<div class="promissory-content">';
              }
              if (/^\d+\./.test(trimmedLine)) return `<div class="numbered-section">${trimmedLine}</div>`;
              if (trimmedLine.startsWith('בין:') || trimmedLine.startsWith('לבין:')) {
                return `<div class="party-section">${trimmedLine}</div>`;
              }
              if (trimmedLine.includes('פרטי עושה השטר:')) {
                return `<div class="numbered-section">${trimmedLine}</div>`;
              }
              return `<div class="content-section">${trimmedLine}</div>`;
            }).join('')}
          </div>
        </div>
        
        <div class="signature-section">
          <div>
            <div>חתימת הלקוח:</div>
          ${signatureDataURL ? 
            `<img src="${signatureDataURL}" style="width: 150px; height: 60px; position: relative; top: -15px; right: 20px;" />` : 
            '<div class="signature-line"></div>'
          }
          </div>
          <div class="date-section">
            <div>תאריך:</div>
            <div>${currentDate}</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  // Use html2canvas and jsPDF for better Hebrew support
  const { jsPDF } = await import('jspdf');
  const html2canvas = (await import('html2canvas')).default;
  
  // Create a temporary element to render the HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.width = '800px';
  document.body.appendChild(tempDiv);
  
  try {
    // Convert HTML to canvas with compression settings
    const canvas = await html2canvas(tempDiv.querySelector('.contract-container') as HTMLElement, {
      allowTaint: true,
      useCORS: true,
      scale: 1.2, // Reduced scale for smaller file size
      backgroundColor: '#ffffff',
      width: 800,
      windowWidth: 800
    });
    
    const imgData = canvas.toDataURL('image/jpeg', 0.7); // JPEG with 70% quality for compression
    
    // Create PDF from the canvas
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    
    // Add first page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    return pdf.output('blob');
  } finally {
    // Clean up
    document.body.removeChild(tempDiv);
  }
};

// Proper Hebrew text processing
const processHebrewText = (text: string): string => {
  // Simple approach for RTL - reverse the text for Hebrew content
  const hebrewPattern = /[\u0590-\u05FF]/;
  
  if (!hebrewPattern.test(text)) {
    return text;
  }
  
  // For Hebrew text, we need to handle RTL properly
  // This is a simplified approach - split by spaces and reverse words
  const words = text.split(' ');
  return words.reverse().join(' ');
};

export async function generateContractPDF(contractData: any, signatureDataURL: string) {
  console.log('🎯 Using HTML-based PDF generation for better Hebrew support');
  
  // Use the new HTML-based approach for better RTL support
  const blob = await generatePDFFromHTML(contractData, signatureDataURL);
  
  // Also trigger download
  const fileName = `contract_${contractData.idNumber || contractData.client?.idNumber || 'client'}_${Date.now()}.pdf`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  return blob;
}

export async function createAndDownloadPDF(contractData: any, signatureDataURL: string) {
  return await generateContractPDF(contractData, signatureDataURL);
}

export async function generateContractPDFBlob(contractData: any, signatureDataURL: string): Promise<Blob> {
  console.log('🎯 Using HTML-based PDF generation for blob');
  
  // Use the new HTML-based approach for better RTL support
  return await generatePDFFromHTML(contractData, signatureDataURL);
}