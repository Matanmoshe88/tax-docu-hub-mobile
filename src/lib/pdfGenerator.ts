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
    commissionRate: contractData.commissionRate || contractData.client?.commissionRate || '25%',
    contractNumber: contractData.contractNumber || ''
  };
  
  // Log the data to debug
  console.log('Client Data being used:', clientData);
  
  const contractText = generateContractText(clientData);
  const currentDate = new Date().toLocaleDateString('he-IL');
  
  // Create a hidden div to render the contract
  const container = document.createElement('div');
  container.id = 'pdf-container';
  container.style.cssText = `
    position: absolute;
    left: -9999px;
    top: 0;
    width: 794px;
    min-height: 1123px;
    padding: 40px 60px;
    background: white;
    font-family: Arial, 'Arial Hebrew', David, sans-serif;
    font-size: 14px;
    line-height: 1.8;
    direction: rtl;
    text-align: right;
    color: #000;
  `;
  
  // Build HTML content with better structure
  let htmlContent = `
    <style>
      @page {
        size: A4;
        margin: 20mm;
      }
      
      * {
        box-sizing: border-box;
      }
      
      .contract-page {
        width: 100%;
        min-height: 1050px;
        background: white;
        position: relative;
        page-break-after: auto;
        page-break-inside: avoid;
      }
      
      .contract-header {
        text-align: center;
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 40px;
        color: #000;
      }
      
      .contract-info {
        display: flex;
        justify-content: space-between;
        width: 100%;
        margin-bottom: 40px;
        font-size: 14px;
      }
      
      .contract-info > div {
        flex: 1;
      }
      
      .contract-info > div:first-child {
        text-align: right;
      }
      
      .contract-info > div:last-child {
        text-align: left;
      }
      
      .contract-info span {
        font-weight: bold;
      }
      
      .party-section {
        font-weight: bold;
        font-size: 16px;
        margin: 20px 0;
        color: #000;
        line-height: 1.8;
      }
      
      .numbered-section {
        font-weight: bold;
        margin: 25px 0 15px 0;
        color: #000;
        font-size: 14px;
        line-height: 1.8;
      }
      
      .promissory-title {
        text-align: center;
        font-size: 22px;
        font-weight: bold;
        margin: 50px 0 40px 0;
        color: #000;
      }
      
      .signature-section {
        display: flex;
        justify-content: space-between;
        width: 100%;
        margin-top: 80px;
        page-break-inside: avoid;
      }
      
      .signature-box {
        flex: 1;
        text-align: right;
      }
      
      .signature-line {
        border-bottom: 2px solid black;
        width: 200px;
        margin-top: 20px;
        display: inline-block;
      }
      
      .contract-body {
        text-align: right;
        direction: rtl;
        width: 100%;
      }
      
      p {
        margin: 15px 0;
        text-align: right;
        color: #000;
        font-size: 14px;
        line-height: 1.8;
        word-spacing: 2px;
      }
      
      /* Ensure text doesn't break awkwardly */
      .keep-together {
        page-break-inside: avoid;
      }
      
      /* Better print styles */
      @media print {
        body { margin: 0; }
        .contract-page { page-break-after: always; }
      }
    </style>
    <div class="contract-body">
      <div class="contract-page">
        <div class="contract-header">הסכם שירות להחזרי מס</div>
        <div class="contract-info">
          <div><span>תאריך:</span> ${currentDate}</div>
          <div><span>מספר חוזה:</span> ${clientData.contractNumber || '___________'}</div>
        </div>
  `;
  
  // Process contract lines
  const lines = contractText.split('\n').slice(1); // Skip title
  let currentPageContent = '';
  let pageNumber = 1;
  let inPromissoryNote = false;
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      currentPageContent += '<br/>';
    } else if (trimmedLine === 'שטר חוב') {
      // Close current page and start new page for promissory note
      if (pageNumber === 1) {
        htmlContent += currentPageContent + '</div>';
        currentPageContent = '<div class="contract-page" style="page-break-before: always;">';
      }
      currentPageContent += `<div class="promissory-title">שטר חוב</div>`;
      inPromissoryNote = true;
      pageNumber++;
    } else if (/^\d+\./.test(trimmedLine)) {
      currentPageContent += `<p class="numbered-section">${trimmedLine}</p>`;
    } else if (trimmedLine.startsWith('בין:') || trimmedLine.startsWith('לבין:')) {
      currentPageContent += `<p class="party-section">${trimmedLine}</p>`;
    } else {
      currentPageContent += `<p>${trimmedLine}</p>`;
    }
  });
  
  // Add remaining content
  htmlContent += currentPageContent;
  
  // Add signature section
  const signatureHTML = `
    <div class="signature-section">
      <div class="signature-box">
        <div style="font-weight: bold;">חתימת הלקוח:</div>
        ${signatureDataURL ? 
          `<img src="${signatureDataURL}" style="width: 200px; height: 80px; margin-top: 15px; border: 1px solid #ddd;" />` : 
          '<div class="signature-line"></div>'
        }
      </div>
      <div class="signature-box">
        <div style="font-weight: bold;">תאריך:</div>
        <div style="margin-top: 15px;">${currentDate}</div>
      </div>
    </div>
  `;
  
  // Close the divs and add final signature
  htmlContent += signatureHTML + '</div></div>';
  
  container.innerHTML = htmlContent;
  document.body.appendChild(container);
  
  try {
    // Wait for content to render
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Get all pages
    const pages = container.querySelectorAll('.contract-page');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Process each page
    for (let i = 0; i < pages.length; i++) {
      if (i > 0) {
        pdf.addPage();
      }
      
      // Convert each page to canvas with better settings
      const canvas = await html2canvas(pages[i] as HTMLElement, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794,
        windowHeight: 1123,
        scrollY: 0,
        scrollX: 0,
        onclone: (clonedDoc) => {
          // Ensure Hebrew text is properly displayed in cloned document
          const clonedContainer = clonedDoc.getElementById('pdf-container');
          if (clonedContainer) {
            clonedContainer.style.direction = 'rtl';
            clonedContainer.style.textAlign = 'right';
            // Force render all content
            clonedContainer.style.position = 'relative';
            clonedContainer.style.left = '0';
          }
        }
      });
      
      // Add to PDF with better compression
      const imgData = canvas.toDataURL('image/jpeg', 0.85); // Slightly higher quality
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    }
    
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
  console.log('🎯 Generating PDF blob');
  
  // Same implementation but return blob only
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
  const currentDate = new Date().toLocaleDateString('he-IL');
  
  const container = document.createElement('div');
  container.id = 'pdf-container';
  container.style.cssText = `
    position: absolute;
    left: -9999px;
    top: 0;
    width: 794px;
    padding: 60px;
    background: white;
    font-family: Arial, 'Arial Hebrew', David, sans-serif;
    font-size: 12pt;
    line-height: 1.6;
    direction: rtl;
    text-align: right;
    color: #000;
  `;
  
  // Use same HTML generation as above...
  let htmlContent = `
    <style>
      @page {
        size: A4;
        margin: 20mm;
      }
      
      * {
        box-sizing: border-box;
      }
      
      .contract-page {
        width: 100%;
        min-height: 100%;
        background: white;
        position: relative;
      }
      
      .contract-header {
        text-align: center;
        font-size: 20pt;
        font-weight: bold;
        margin-bottom: 30px;
        color: #000;
      }
      
      .contract-info {
        display: table;
        width: 100%;
        margin-bottom: 30px;
      }
      
      .contract-info > div {
        display: table-cell;
        width: 50%;
      }
      
      .contract-info > div:first-child {
        text-align: right;
      }
      
      .contract-info > div:last-child {
        text-align: left;
      }
      
      .contract-info span {
        font-weight: bold;
      }
      
      .party-section {
        font-weight: bold;
        font-size: 13pt;
        margin: 15px 0;
        color: #000;
      }
      
      .numbered-section {
        font-weight: bold;
        margin: 20px 0 10px 0;
        color: #000;
      }
      
      .promissory-title {
        text-align: center;
        font-size: 18pt;
        font-weight: bold;
        margin: 40px 0 30px 0;
        page-break-before: always;
        color: #000;
      }
      
      .signature-section {
        display: table;
        width: 100%;
        margin-top: 60px;
        page-break-inside: avoid;
      }
      
      .signature-box {
        display: table-cell;
        width: 50%;
        text-align: right;
        vertical-align: top;
      }
      
      .signature-box:last-child {
        padding-right: 50px;
      }
      
      .signature-line {
        border-bottom: 2px solid black;
        width: 200px;
        margin-top: 15px;
        display: inline-block;
      }
      
      .contract-body {
        text-align: right;
        direction: rtl;
      }
      
      p {
        margin: 12px 0;
        text-align: right;
        color: #000;
      }
      
      .keep-together {
        page-break-inside: avoid;
      }
      
      @media print {
        body { margin: 0; }
        .contract-page { page-break-after: always; }
      }
    </style>
    <div class="contract-body">
      <div class="contract-page">
        <div class="contract-header">הסכם שירות להחזרי מס</div>
        <div class="contract-info">
          <div><span>תאריך:</span> ${currentDate}</div>
          <div><span>מספר חוזה:</span> ${clientData.contractNumber || '___________'}</div>
        </div>
  `;
  
  const lines = contractText.split('\n').slice(1);
  
  lines.forEach((line) => {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      htmlContent += '<br/>';
    } else if (trimmedLine === 'שטר חוב') {
      htmlContent += `</div><div class="contract-page"><div class="promissory-title">שטר חוב</div>`;
    } else if (/^\d+\./.test(trimmedLine)) {
      htmlContent += `<p class="numbered-section keep-together">${trimmedLine}</p>`;
    } else if (trimmedLine.startsWith('בין:') || trimmedLine.startsWith('לבין:')) {
      htmlContent += `<p class="party-section">${trimmedLine}</p>`;
    } else {
      htmlContent += `<p>${trimmedLine}</p>`;
    }
  });
  
  const signatureHTML = `
    <div class="signature-section">
      <div class="signature-box">
        <div style="font-weight: bold;">חתימת הלקוח:</div>
        ${signatureDataURL ? 
          `<img src="${signatureDataURL}" style="width: 200px; height: 80px; margin-top: 15px; border: 1px solid #ddd;" />` : 
          '<div class="signature-line"></div>'
        }
      </div>
      <div class="signature-box">
        <div style="font-weight: bold;">תאריך:</div>
        <div style="margin-top: 15px;">${currentDate}</div>
      </div>
    </div>
  `;
  
  htmlContent += signatureHTML + '</div></div>';
  
  container.innerHTML = htmlContent;
  document.body.appendChild(container);
  
  try {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const pages = container.querySelectorAll('.contract-page');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    for (let i = 0; i < pages.length; i++) {
      if (i > 0) {
        pdf.addPage();
      }
      
      const canvas = await html2canvas(pages[i] as HTMLElement, {
        scale: 1.5, // Reduced scale for smaller file size
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794,
        windowHeight: 1123,
        onclone: (clonedDoc) => {
          const clonedContainer = clonedDoc.getElementById('pdf-container');
          if (clonedContainer) {
            clonedContainer.style.direction = 'rtl';
            clonedContainer.style.textAlign = 'right';
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.8); // JPEG compression
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    }
    
    document.body.removeChild(container);
    
    return pdf.output('blob');
    
  } catch (error) {
    console.error('❌ PDF blob generation failed:', error);
    document.body.removeChild(container);
    throw error;
  }
}