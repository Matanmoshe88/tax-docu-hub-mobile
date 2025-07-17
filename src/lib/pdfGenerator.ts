import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ContractData {
  leadId: string;
  signature?: string;
  loanAmount: number;
  interestRate: number;
  repaymentPeriod: number;
  borrowerName: string;
  borrowerAddress: string;
  borrowerId: string;
  lenderName: string;
  lenderAddress: string;
  lenderId: string;
}

export const generateContractPDF = async (contractData: ContractData): Promise<void> => {
  // Create a temporary HTML element with proper Hebrew styling
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'absolute';
  tempContainer.style.left = '-9999px';
  tempContainer.style.width = '800px';
  tempContainer.style.padding = '40px';
  tempContainer.style.fontFamily = 'Arial, sans-serif';
  tempContainer.style.fontSize = '14px';
  tempContainer.style.lineHeight = '1.6';
  tempContainer.style.direction = 'rtl';
  tempContainer.style.textAlign = 'right';
  tempContainer.style.backgroundColor = 'white';
  
  tempContainer.innerHTML = `
    <div style="max-width: 720px; margin: 0 auto; background: white; padding: 40px;">
      <h1 style="text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 30px; color: #1f2937;">
        הסכם הלוואה
      </h1>
      
      <div style="margin-bottom: 20px; line-height: 1.8;">
        <p>הסכם הלוואה זה נחתם ביום <strong>${new Date().toLocaleDateString('he-IL')}</strong> בין:</p>
        
        <div style="margin: 20px 0; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <p><strong>המלווה:</strong> ${contractData.lenderName}</p>
          <p><strong>ת.ז:</strong> ${contractData.lenderId}</p>
          <p><strong>כתובת:</strong> ${contractData.lenderAddress}</p>
        </div>
        
        <p style="margin: 15px 0;">לבין:</p>
        
        <div style="margin: 20px 0; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <p><strong>הלווה:</strong> ${contractData.borrowerName}</p>
          <p><strong>ת.ז:</strong> ${contractData.borrowerId}</p>
          <p><strong>כתובת:</strong> ${contractData.borrowerAddress}</p>
        </div>
        
        <div style="margin: 30px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
          <h3 style="margin-bottom: 15px; color: #374151;">פרטי ההלוואה:</h3>
          <p>• <strong>סכום ההלוואה:</strong> ₪${contractData.loanAmount.toLocaleString()}</p>
          <p>• <strong>שיעור ריבית:</strong> ${contractData.interestRate}% לשנה</p>
          <p>• <strong>תקופת החזר:</strong> ${contractData.repaymentPeriod} חודשים</p>
        </div>
        
        <div style="margin: 30px 0;">
          <h3 style="margin-bottom: 15px; color: #374151;">תנאי ההסכם:</h3>
          <ol style="padding-right: 20px;">
            <li style="margin-bottom: 8px;">הלווה מתחייב להחזיר את סכום ההלוואה בתוספת ריבית כמפורט לעיל</li>
            <li style="margin-bottom: 8px;">ההחזר יתבצע בתשלומים חודשיים שווים</li>
            <li style="margin-bottom: 8px;">במקרה של פיגור בתשלום, ייגבו ריביות פיגורים</li>
            <li style="margin-bottom: 8px;">הסכם זה כפוף לדיני מדינת ישראל</li>
          </ol>
        </div>
      </div>
      
      <div style="margin-top: 50px; padding-top: 30px; border-top: 2px solid #e5e7eb;">
        <h2 style="text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 25px; color: #1f2937;">
          שטר חוב
        </h2>
        
        <div style="line-height: 1.8; margin-bottom: 30px;">
          <p>אני הח"מ מתחייב לשלם לפקודת <strong>${contractData.lenderName}</strong> את סכום <strong>₪${contractData.loanAmount.toLocaleString()}</strong>.</p>
          
          <p style="margin: 15px 0;">סכום זה אשלם בריבית של <strong>${contractData.interestRate}%</strong> לשנה, בתשלומים חודשיים במשך <strong>${contractData.repaymentPeriod}</strong> חודשים.</p>
          
          <p style="margin: 20px 0;"><strong>תאריך:</strong> ${new Date().toLocaleDateString('he-IL')}</p>
        </div>
        
        <div style="margin: 30px 0; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h4 style="margin-bottom: 15px; color: #374151;">פרטי עושה השטר:</h4>
          <div style="display: flex; gap: 40px; margin-bottom: 10px;">
            <span><strong>שם מלא:</strong> ${contractData.borrowerName}</span>
            <span><strong>מספר תעודת זהות:</strong> ${contractData.borrowerId}</span>
          </div>
          <p><strong>כתובת:</strong> ${contractData.borrowerAddress}</p>
        </div>
        
        ${contractData.signature ? `
          <div style="margin: 30px 0; text-align: center;">
            <p style="margin-bottom: 10px;"><strong>חתימת עושה השטר:</strong></p>
            <div style="border: 1px solid #e5e7eb; padding: 10px; display: inline-block; border-radius: 8px;">
              <img src="${contractData.signature}" style="max-width: 200px; max-height: 80px;" />
            </div>
          </div>
        ` : `
          <div style="margin: 30px 0; text-align: center;">
            <p><strong>חתימת עושה השטר:</strong> _________________________</p>
          </div>
        `}
      </div>
    </div>
  `;
  
  document.body.appendChild(tempContainer);
  
  try {
    // Convert HTML to canvas
    const canvas = await html2canvas(tempContainer, {
      useCORS: true,
      allowTaint: true,
      scale: 2,
      width: 800,
      height: tempContainer.scrollHeight,
      backgroundColor: 'white'
    });
    
    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth - 20; // 10mm margin on each side
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 10; // 10mm top margin
    
    // Add first page
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight - 20; // Account for margins
    
    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight + 10;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight - 20;
    }
    
    // Save the PDF
    pdf.save(`contract-${contractData.leadId}.pdf`);
    
  } finally {
    // Clean up
    document.body.removeChild(tempContainer);
  }
};