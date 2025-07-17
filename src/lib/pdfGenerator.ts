import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { generateContractText } from './contractUtils';

interface ContractData {
  leadId: string;
  signature?: string;
  clientData: {
    firstName: string;
    lastName: string;
    idNumber: string;
    phone: string;
    email: string;
    address: string;
    commissionRate: string;
  };
}

const createContractHTML = (contractData: ContractData): string => {
  const contractText = generateContractText(contractData.clientData);
  const currentDate = new Date().toLocaleDateString('he-IL');
  const currentTime = new Date().toLocaleTimeString('he-IL');
  
  // Split contract text into main contract and shtar sections
  const contractParts = contractText.split('שטר חוב');
  const mainContract = contractParts[0].trim();
  const shtarText = contractParts[1] ? `שטר חוב${contractParts[1]}` : '';
  
  // Split main contract into numbered sections for better organization
  const contractSections = mainContract.split(/(?=\d+\.)/);
  const preambleText = contractSections[0];
  const numberedSections = contractSections.slice(1);
  
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: 'David', 'Arial', serif;
          direction: rtl;
          text-align: right;
          line-height: 1.7;
          color: #1a1a1a;
          background: white;
          font-size: 11px;
        }
        
        .page {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 30mm 25mm;
          background: white;
          page-break-after: always;
          box-sizing: border-box;
        }
        
        .page:last-child {
          page-break-after: avoid;
        }
        
        /* Modern Header */
        .header {
          text-align: center;
          margin-bottom: 35px;
          padding: 25px;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border: 2px solid #2c3e50;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .header h1 {
          font-size: 22px;
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 8px;
          letter-spacing: 0.5px;
        }
        
        .header .subtitle {
          font-size: 12px;
          color: #6c757d;
          font-style: italic;
        }
        
        /* Contract parties section */
        .parties-section {
          background: #f8f9fa;
          padding: 20px;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          margin-bottom: 25px;
          border-right: 4px solid #007bff;
        }
        
        .parties-title {
          font-size: 14px;
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 15px;
          text-align: center;
        }
        
        .party-info {
          margin-bottom: 12px;
          padding: 8px 0;
          border-bottom: 1px dotted #dee2e6;
        }
        
        .party-info:last-child {
          border-bottom: none;
        }
        
        .party-label {
          font-weight: bold;
          color: #495057;
        }
        
        .contract-date {
          text-align: center;
          margin-top: 15px;
          font-weight: bold;
          color: #007bff;
          padding: 8px;
          background: white;
          border-radius: 5px;
        }
        
        /* Preamble styling */
        .preamble {
          background: #fff9e6;
          padding: 20px;
          border: 1px solid #ffc107;
          border-radius: 8px;
          margin-bottom: 30px;
          font-style: italic;
          line-height: 1.8;
          border-right: 4px solid #ffc107;
        }
        
        /* Content sections */
        .content {
          margin-bottom: 30px;
        }
        
        .section {
          margin-bottom: 25px;
          padding: 18px;
          background: #fdfdfd;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          border-right: 3px solid #28a745;
        }
        
        .section-number {
          font-weight: bold;
          color: #28a745;
          font-size: 13px;
          margin-bottom: 8px;
        }
        
        .section-content {
          line-height: 1.8;
          text-align: justify;
        }
        
        /* Signature sections */
        .signature-page {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          min-height: 70vh;
        }
        
        .signature-section {
          width: 100%;
          max-width: 500px;
          padding: 30px;
          background: #f8f9fa;
          border: 2px solid #007bff;
          border-radius: 12px;
          text-align: center;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .signature-title {
          font-size: 18px;
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 20px;
          border-bottom: 2px solid #007bff;
          padding-bottom: 10px;
        }
        
        .signature-text {
          margin-bottom: 25px;
          line-height: 1.6;
          color: #495057;
        }
        
        .signature-box {
          margin: 25px 0;
          padding: 15px;
          border: 2px dashed #007bff;
          border-radius: 8px;
          background: white;
          min-height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .signature-image {
          max-width: 280px;
          max-height: 80px;
          border: 1px solid #dee2e6;
          border-radius: 4px;
        }
        
        .signature-details {
          margin-top: 20px;
          display: flex;
          justify-content: space-between;
          padding-top: 15px;
          border-top: 1px solid #dee2e6;
          font-size: 11px;
          color: #6c757d;
        }
        
        /* Shtar page styling */
        .shtar-header {
          text-align: center;
          margin-bottom: 30px;
          padding: 20px;
          background: linear-gradient(135deg, #fff5f5 0%, #ffe6e6 100%);
          border: 2px solid #dc3545;
          border-radius: 10px;
        }
        
        .shtar-header h2 {
          font-size: 20px;
          font-weight: bold;
          color: #dc3545;
          margin-bottom: 5px;
        }
        
        .shtar-content {
          background: #fafafa;
          padding: 20px;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          margin-bottom: 25px;
          line-height: 1.8;
          text-align: justify;
        }
        
        .client-details {
          background: #e8f4fd;
          padding: 20px;
          border: 1px solid #007bff;
          border-radius: 8px;
          margin: 25px 0;
        }
        
        .client-details h3 {
          color: #007bff;
          margin-bottom: 15px;
          font-size: 14px;
          border-bottom: 1px solid #007bff;
          padding-bottom: 8px;
        }
        
        .client-info {
          margin: 8px 0;
          padding: 5px 0;
        }
        
        /* Print optimizations */
        @media print {
          body { font-size: 10px; }
          .page { margin: 0; padding: 20mm; }
          .header { box-shadow: none; }
          .signature-section { box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <!-- Main Contract Page -->
      <div class="page">
        <div class="header">
          <h1>הסכם שירות להחזרי מס</h1>
          <div class="subtitle">מסמך משפטי מחייב - יש לקרוא בעיון</div>
        </div>
        
        <div class="parties-section">
          <div class="parties-title">צדדים להסכם</div>
          <div class="party-info">
            <span class="party-label">בין:</span> קוויק טקס (שם רשום: "ג'י.אי.אמ גלובל") ח"פ: 513218453<br>
            (להלן: "קוויקטקס" ו/או "החברה")
          </div>
          <div class="party-info">
            <span class="party-label">לבין:</span> ${contractData.clientData.firstName} ${contractData.clientData.lastName}<br>
            ת"ז: ${contractData.clientData.idNumber} (להלן: "הלקוח")
          </div>
          <div class="contract-date">תאריך חתימת ההסכם: ${currentDate}</div>
        </div>
        
        <div class="preamble">
          ${preambleText.trim()}
        </div>
        
        <div class="content">
          ${numberedSections.map((section, index) => `
            <div class="section">
              <div class="section-content">${section.trim()}</div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <!-- Contract Signature Page -->
      <div class="page">
        <div class="signature-page">
          <div class="signature-section">
            <div class="signature-title">הסכמה וחתימה על ההסכם</div>
            <div class="signature-text">
              אני החתום/ה מטה מאשר/ת בזאת שקראתי והבנתי את כל תנאי ההסכם המפורטים לעיל,<br>
              ומסכים/ה לכל התנאים והתניות המפורטים בהסכם זה ללא סייגים.
            </div>
            ${contractData.signature ? `
              <div class="signature-box">
                <img src="${contractData.signature}" class="signature-image" />
              </div>
            ` : `
              <div class="signature-box" style="color: #6c757d; font-style: italic;">
                אזור חתימת הלקוח
              </div>
            `}
            <div class="signature-details">
              <div><strong>תאריך:</strong> ${currentDate}</div>
              <div><strong>שעה:</strong> ${currentTime}</div>
            </div>
          </div>
        </div>
      </div>
      
      ${shtarText ? `
      <!-- Shtar Page -->
      <div class="page">
        <div class="shtar-header">
          <h2>שטר חוב</h2>
          <div style="font-size: 12px; color: #6c757d;">מסמך משפטי נוסף</div>
        </div>
        
        <div class="shtar-content">
          ${shtarText.replace(/שטר חוב/, '').trim()}
        </div>
        
        <div class="client-details">
          <h3>פרטי עושה השטר</h3>
          <div class="client-info"><strong>שם מלא:</strong> ${contractData.clientData.firstName} ${contractData.clientData.lastName}</div>
          <div class="client-info"><strong>מספר תעודת זהות:</strong> ${contractData.clientData.idNumber}</div>
          <div class="client-info"><strong>כתובת:</strong> ${contractData.clientData.address}</div>
        </div>
        
        <div class="signature-section">
          <div class="signature-title">אישור וחתימה על השטר</div>
          <div class="signature-text">
            אני החתום/ה מטה מאשר/ת שקראתי והבנתי את תנאי השטר המפורטים לעיל<br>
            ומסכים/ה לכל התנאים המפורטים בשטר זה.
          </div>
          ${contractData.signature ? `
            <div class="signature-box">
              <img src="${contractData.signature}" class="signature-image" />
            </div>
          ` : `
            <div class="signature-box" style="color: #6c757d; font-style: italic;">
              אזור חתימת הלקוח
            </div>
          `}
          <div class="signature-details">
            <div><strong>תאריך:</strong> ${currentDate}</div>
            <div><strong>שעה:</strong> ${currentTime}</div>
          </div>
        </div>
      </div>
      ` : ''}
    </body>
    </html>
  `;
};

export const generateContractPDF = async (contractData: ContractData): Promise<void> => {
  try {
    // Create beautifully formatted HTML
    const htmlContent = createContractHTML(contractData);
    
    // Create a temporary container for HTML rendering
    const contractContainer = document.createElement('div');
    contractContainer.style.position = 'absolute';
    contractContainer.style.left = '-9999px';
    contractContainer.style.top = '-9999px';
    contractContainer.style.width = '210mm';
    contractContainer.style.backgroundColor = 'white';
    contractContainer.innerHTML = htmlContent;
    
    document.body.appendChild(contractContainer);
    
    // Optimized settings for maximum file size reduction
    const canvas = await html2canvas(contractContainer, {
      useCORS: true,
      allowTaint: true,
      scale: 0.5, // Further reduced for smaller file size
      width: Math.floor(210 * 2.8), // Reduced resolution for smaller file
      backgroundColor: 'white',
      removeContainer: true,
      logging: false
    });
    
    // Create PDF with optimized settings
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Convert canvas to highly compressed JPEG for smallest file size
    const imgData = canvas.toDataURL('image/jpeg', 0.5); // 50% quality for maximum compression
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;
    
    // Add first page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    // Add additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    // Clean up
    document.body.removeChild(contractContainer);
    
    // Save the PDF
    pdf.save(`contract-${contractData.leadId}.pdf`);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};