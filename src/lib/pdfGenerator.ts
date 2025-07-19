import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { generateContractText } from './contractUtils';

export async function generateContractPDF(contractData: any, signatureDataURL: string) {
  console.log('🎯 Starting PDF generation with HTML approach for Hebrew support');
  
  // Ensure contractData has all required fields
  const clientData = {
    firstName: contractData.firstName || contractData.client?.firstName || '',
    lastName: contractData.lastName || contractData.client?.lastName || '',
    idNumber: contractData.idNumber || contractData.client?.idNumber || '',
    phone: contractData.phone || contractData.client?.phone || '',
    email: contractData.email || contractData.client?.email || '',
    address: contractData.address || contractData.client?.address || '',
    commissionRate: contractData.commissionRate || contractData.client?.commissionRate || '25%'
  };
  
  const contractText = generateContractText(clientData);
  const currentDate = new Date().toLocaleDateString('he-IL');
  
  // Create a hidden div to render the contract
  const container = document.createElement('div');
  container.style.cssText = `
    position: absolute;
    left: -9999px;
    top: 0;
    width: 210mm;
    padding: 20mm;
    background: white;
    font-family: Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.5;
    direction: rtl;
    text-align: right;
  `;
  
  // Build HTML content
  let htmlContent = `
    <style>
      .contract-header {
        text-align: center;
        font-size: 18pt;
        font-weight: bold;
        margin-bottom: 20px;
      }
      .contract-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 30px;
        direction: rtl;
      }
      .contract-info span {
        font-weight: bold;
      }
      .party-section {
        font-weight: bold;
        font-size: 12pt;
        margin: 10px 0;
      }
      .numbered-section {
        font-weight: bold;
        margin: 15px 0 5px 0;
      }
      .promissory-title {
        text-align: center;
        font-size: 16pt;
        font-weight: bold;
        margin: 30px 0 20px 0;
      }
      .signature-section {
        display: flex;
        justify-content: space-between;
        margin-top: 50px;
        direction: rtl;
      }
      .signature-box {
        text-align: right;
      }
      .signature-line {
        border-bottom: 1px solid black;
        width: 150px;
        margin-top: 10px;
        display: inline-block;
      }
      .contract-body {
        text-align: right;
        direction: rtl;
      }
      p {
        margin: 8px 0;
      }
    </style>
    <div class="contract-body">
      <div class="contract-header">הסכם שירות להחזרי מס</div>
      <div class="contract-info">
        <div><span>תאריך:</span> ${currentDate}</div>
        <div><span>מספר חוזה:</span> ${clientData.contractNumber || '___________'}</div>
      </div>
  `;
  
  // Process contract lines
  const lines = contractText.split('\n').slice(1); // Skip title
  
  lines.forEach((line) => {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      htmlContent += '<br/>';
    } else if (/^\d+\./.test(trimmedLine)) {
      htmlContent += `<p class="numbered-section">${trimmedLine}</p>`;
    } else if (trimmedLine.startsWith('בין:') || trimmedLine.startsWith('לבין:')) {
      htmlContent += `<p class="party-section">${trimmedLine}</p>`;
    } else if (trimmedLine === 'שטר חוב') {
      htmlContent += `<div class="promissory-title">שטר חוב</div>`;
    } else {
      htmlContent += `<p>${trimmedLine}</p>`;
    }
  });
  
  // Add signature section
  htmlContent += `
    <div class="signature-section">
      <div class="signature-box">
        <div>חתימת הלקוח:</div>
        ${signatureDataURL ? 
          `<img src="${signatureDataURL}" style="width: 150px; height: 75px; margin-top: 10px;" />` : 
          '<div class="signature-line"></div>'
        }
      </div>
      <div class="signature-box">
        <div>תאריך:</div>
        <div style="margin-top: 10px;">${currentDate}</div>
      </div>
    </div>
    </div>
  `;
  
  container.innerHTML = htmlContent;
  document.body.appendChild(container);
  
  try {
    // Convert HTML to canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    
    // Convert canvas to PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight) * 25.4 / 2; // Convert to mm
    
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 0;
    
    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    
    // Save the PDF
    const fileName = `contract_${clientData.idNumber || 'client'}_${Date.now()}.pdf`;
    pdf.save(fileName);
    
    // Clean up
    document.body.removeChild(container);
    
    // Return as blob
    return pdf.output('blob');
    
  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    document.body.removeChild(container);
    throw error;
  }
}

export async function createAndDownloadPDF(contractData: any, signatureDataURL: string) {
  return await generateContractPDF(contractData, signatureDataURL);
}

export async function generateContractPDFBlob(contractData: any, signatureDataURL: string): Promise<Blob> {
  // Same implementation but without the save() call
  return await generateContractPDF(contractData, signatureDataURL);
}