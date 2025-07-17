import jsPDF from 'jspdf';

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
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Set RTL direction for Hebrew text
  doc.setR2L(true);
  
  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('הסכם הלוואה', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Contract details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  const contractText = `
הסכם הלוואה זה נחתם ביום ${new Date().toLocaleDateString('he-IL')} בין:

המלווה: ${contractData.lenderName}
ת.ז: ${contractData.lenderId}
כתובת: ${contractData.lenderAddress}

לבין:

הלווה: ${contractData.borrowerName}
ת.ז: ${contractData.borrowerId}
כתובת: ${contractData.borrowerAddress}

פרטי ההלוואה:
- סכום ההלוואה: ₪${contractData.loanAmount.toLocaleString()}
- שיעור ריבית: ${contractData.interestRate}% לשנה
- תקופת החזר: ${contractData.repaymentPeriod} חודשים

תנאי ההסכם:
1. הלווה מתחייב להחזיר את סכום ההלוואה בתוספת ריבית כמפורט לעיל
2. ההחזר יתבצע בתשלומים חודשיים שווים
3. במקרה של פיגור בתשלום, ייגבו ריביות פיגורים
4. הסכם זה כפוף לדיני מדינת ישראל
`;

  // Split text into lines
  const lines = doc.splitTextToSize(contractText, pageWidth - 40);
  
  lines.forEach((line: string) => {
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = 20;
    }
    doc.text(line, 20, yPosition);
    yPosition += 7;
  });

  // Add promissory note
  yPosition += 10;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('שטר חוב', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  const promissoryText = `
אני הח"מ מתחייב לשלם לפקודת ${contractData.lenderName} את סכום ₪${contractData.loanAmount.toLocaleString()}.

סכום זה אשלם בריבית של ${contractData.interestRate}% לשנה, בתשלומים חודשיים במשך ${contractData.repaymentPeriod} חודשים.

תאריך: ${new Date().toLocaleDateString('he-IL')}

פרטי עושה השטר:
שם מלא: ${contractData.borrowerName}     מספר תעודת זהות: ${contractData.borrowerId}
כתובת: ${contractData.borrowerAddress}
`;

  const promissoryLines = doc.splitTextToSize(promissoryText, pageWidth - 40);
  
  promissoryLines.forEach((line: string) => {
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }
    doc.text(line, 20, yPosition);
    yPosition += 7;
  });

  // Add signature if available
  if (contractData.signature) {
    yPosition += 10;
    doc.text('חתימת עושה השטר:', 20, yPosition);
    yPosition += 10;
    
    try {
      // Add signature image
      doc.addImage(contractData.signature, 'PNG', 20, yPosition, 80, 30);
    } catch (error) {
      console.error('Error adding signature to PDF:', error);
      doc.text('חתימה דיגיטלית נשמרה', 20, yPosition);
    }
  }

  // Save the PDF
  doc.save(`contract-${contractData.leadId}.pdf`);
};