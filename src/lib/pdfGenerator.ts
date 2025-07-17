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
  
  // Split main contract into sections for better organization
  const contractSections = mainContract.split(/(?=\d+\.)/);
  const header = contractSections[0];
  const sections = contractSections.slice(1);
  
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
          font-family: 'Arial', 'David', 'Times New Roman', serif;
          margin: 0;
          padding: 0;
          direction: rtl;
          text-align: right;
          line-height: 1.6;
          color: #000;
          background: white;
        }
        
        .page {
          width: 210mm;
          min-height: 297mm;
          padding: 25mm 20mm;
          margin: 0;
          box-sizing: border-box;
          page-break-after: always;
          background: white;
        }
        
        .page:last-child {
          page-break-after: avoid;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px solid #333;
        }
        
        .header h1 {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 15px;
          color: #333;
          letter-spacing: 1px;
        }
        
        .contract-details {
          background: #f8f9fa;
          padding: 20px;
          border: 2px solid #333;
          border-radius: 8px;
          margin-bottom: 25px;
          font-size: 14px;
          line-height: 1.8;
        }
        
        .contract-details .parties {
          margin-bottom: 15px;
        }
        
        .contract-details .date {
          font-weight: bold;
          margin-top: 10px;
        }
        
        .content {
          font-size: 12px;
          line-height: 1.7;
          text-align: justify;
        }
        
        .section {
          margin-bottom: 20px;
          padding: 15px 0;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .section:last-child {
          border-bottom: none;
        }
        
        .section-number {
          font-weight: bold;
          color: #333;
          margin-bottom: 10px;
        }
        
        .preamble {
          background: #fafafa;
          padding: 20px;
          border-right: 4px solid #333;
          margin-bottom: 25px;
          font-style: italic;
          line-height: 1.8;
        }
        
        .signature-section {
          margin-top: 40px;
          padding: 25px;
          border: 2px solid #333;
          border-radius: 8px;
          background: #f8f9fa;
          page-break-inside: avoid;
        }
        
        .signature-title {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 20px;
          text-align: center;
          color: #333;
        }
        
        .signature-text {
          margin-bottom: 20px;
          font-size: 13px;
          line-height: 1.6;
        }
        
        .signature-box {
          display: flex;
          justify-content: center;
          margin: 30px 0;
        }
        
        .signature-image {
          border: 2px solid #333;
          padding: 10px;
          border-radius: 5px;
          background: white;
        }
        
        .signature-details {
          margin-top: 25px;
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }
        
        .shtar-page {
          page-break-before: always;
        }
        
        .shtar-header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px solid #333;
        }
        
        .shtar-header h2 {
          font-size: 22px;
          font-weight: bold;
          color: #333;
          letter-spacing: 1px;
        }
        
        .shtar-content {
          font-size: 12px;
          line-height: 1.7;
          text-align: justify;
        }
        
        .shtar-section {
          margin-bottom: 15px;
          padding: 10px 0;
        }
        
        .client-details {
          background: #f8f9fa;
          padding: 20px;
          border: 2px solid #333;
          border-radius: 8px;
          margin: 25px 0;
        }
        
        .client-details h3 {
          margin-bottom: 15px;
          font-size: 14px;
          font-weight: bold;
        }
        
        @media print {
          .page {
            margin: 0;
            padding: 25mm 20mm;
          }
          
          body {
            font-size: 11px;
          }
        }
      </style>
    </head>
    <body>
      <!-- Main Contract Page -->
      <div class="page">
        <div class="header">
          <h1>הסכם שירות להחזרי מס</h1>
        </div>
        
        <div class="contract-details">
          <div class="parties">
            <strong>בין:</strong> קוויק טקס (שם רשום: "ג'י.אי.אמ גלובל") ח"פ: 513218453 (להלן: "קוויקטקס" ו/או "החברה")<br>
            <strong>לבין:</strong> ${contractData.clientData.firstName} ${contractData.clientData.lastName} ת"ז: ${contractData.clientData.idNumber} (להלן: "הלקוח")
          </div>
          <div class="date">שנחתם בתאריך: ${currentDate}</div>
        </div>
        
        <div class="preamble">
          הואיל והלקוח מאשר בזאת כי הינו מבקש לבדוק את זכאותו להחזרי מס באמצעות ג'י.אי.אמ גלובל ניהול והשקעות בע"מ ח.פ. 513218453 להלן: ("קוויקטקס" ו/או "החברה") שכתובתה ת.ד. 11067, פתח-תקווה מיקוד 4934829 מול כלל הרשויות לרבות מס הכנסה וביטוח לאומי לצורך ייצוגו וטיפולו בקבלת ההחזר ממס הכנסה (להלן: "החזר המס") לשנים 2023-2018 (להלן: "תקופת המס") ולבצע עבורו את הפעולות הנדרשות על מנת לקבל החזר מס במקרה של זכאות;
          והואיל והחברה - המעסיקה רו"ח ויועצי מס ועוסקת במתן שירותים אל מול רשויות המס לשם ביצוע החזרי מס לשכירים והגשת דוחות כספיים- מסכימה ליטול על עצמה את ייצוגו של הלקוח בהליך החזר המס;
          לפיכך, הוצהר, הוסכם והותנה בין הצדדים כדלקמן:
        </div>
        
        <div class="content">
          ${sections.map(section => `
            <div class="section">
              <div class="section-content">${section.trim()}</div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <!-- Signature Page for Contract -->
      <div class="page">
        <div class="signature-section">
          <div class="signature-title">הסכמה וחתימה על ההסכם</div>
          <div class="signature-text">
            אני מאשר/ת שקראתי והבנתי את כל תנאי ההסכם המפורטים לעיל ומסכים/ה לכל התנאים והתניות המפורטים בהסכם זה.
          </div>
          ${contractData.signature ? `
            <div class="signature-box">
              <img src="${contractData.signature}" class="signature-image" style="width: 300px; height: 80px;" />
            </div>
          ` : `
            <div style="border: 1px solid #333; height: 80px; width: 300px; margin: 30px auto; text-align: center; line-height: 80px; color: #666;">
              אזור חתימה
            </div>
          `}
          <div class="signature-details">
            <div><strong>תאריך:</strong> ${currentDate}</div>
            <div><strong>שעה:</strong> ${currentTime}</div>
          </div>
        </div>
      </div>
      
      ${shtarText ? `
      <!-- Shtar Page -->
      <div class="page shtar-page">
        <div class="shtar-header">
          <h2>שטר חוב</h2>
        </div>
        
        <div class="shtar-content">
          ${shtarText.split('\n').map(line => `
            <div class="shtar-section">${line.trim()}</div>
          `).join('')}
        </div>
        
        <div class="client-details">
          <h3>פרטי עושה השטר:</h3>
          <div><strong>שם מלא:</strong> ${contractData.clientData.firstName} ${contractData.clientData.lastName}</div>
          <div><strong>מספר תעודת זהות:</strong> ${contractData.clientData.idNumber}</div>
          <div><strong>כתובת:</strong> ${contractData.clientData.address}</div>
        </div>
        
        <div class="signature-section">
          <div class="signature-title">אישור וחתימה על השטר</div>
          <div class="signature-text">
            אני מאשר/ת שקראתי והבנתי את תנאי השטר המפורטים לעיל ומסכים/ה לכל התנאים המפורטים בשטר זה.
          </div>
          ${contractData.signature ? `
            <div class="signature-box">
              <img src="${contractData.signature}" class="signature-image" style="width: 300px; height: 80px;" />
            </div>
          ` : `
            <div style="border: 1px solid #333; height: 80px; width: 300px; margin: 30px auto; text-align: center; line-height: 80px; color: #666;">
              אזור חתימה
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
    
    // Use lower scale and quality for smaller file size
    const canvas = await html2canvas(contractContainer, {
      useCORS: true,
      allowTaint: true,
      scale: 0.7, // Reduced from 2 to 0.7 for smaller file size
      width: Math.floor(210 * 3.779), // 210mm to pixels at 96 DPI
      backgroundColor: 'white',
      removeContainer: true,
      logging: false
    });
    
    // Create PDF with optimized settings
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Convert canvas to compressed JPEG instead of PNG for smaller size
    const imgData = canvas.toDataURL('image/jpeg', 0.7); // 70% quality for smaller size
    
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