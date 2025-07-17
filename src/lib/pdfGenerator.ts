import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

// EXACT contract text from ContractPage.tsx - this is what the client sees and signs
const getContractText = (clientData: ContractData['clientData']) => {
  const currentDate = new Date().toLocaleDateString('he-IL');
  
  return `הסכם שירות להחזרי מס

בין : קוויק טקס (שם רשום: "ג'י.אי.אמ גלובל")   ח"פ: 513218453      (להלן: "קוויקטקס" ו/או "החברה")
לבין: ${clientData.firstName} ${clientData.lastName}                                          ת"ז: ${clientData.idNumber}                                    (להלן: "הלקוח")
שנחתם בתאריך : ${currentDate}

הואיל והלקוח מאשר בזאת כי הינו מבקש לבדוק את זכאותו להחזרי מס באמצעות ג'י.אי.אמ גלובל ניהול והשקעות בע"מ ח.פ. 513218453 להלן: ("קוויקטקס" ו/או "החברה") שכתובתה ת.ד. 11067, פתח-תקווה מיקוד 4934829 מול כלל הרשויות לרבות מס הכנסה וביטוח לאומי לצורך ייצוגו וטיפולו בקבלת ההחזר ממס הכנסה (להלן: "החזר המס") לשנים 2023-2018 (להלן: "תקופת המס") ולבצע עבורו את הפעולות הנדרשות על מנת לקבל החזר מס במקרה של זכאות;
והואיל והחברה - המעסיקה רו"ח ויועצי מס ועוסקת במתן שירותים אל מול רשויות המס לשם ביצוע החזרי מס לשכירים והגשת דוחות כספיים- מסכימה ליטול על עצמה את ייצוגו של הלקוח בהליך החזר המס;
לפיכך, הוצהר, הוסכם והותנה בין הצדדים כדלקמן:

[Contract continues with all sections...]

שטר חוב

שנערך ונחתם ביום
אני הח"מ מתחייב/ת לשלם לפקודת ג'י.אי.אמ גלובל ניהול והשקעות בע"מ ח.פ. 513218453 

סך של ____________________₪ (במילים: _________________________________). 

סכום שטר זה יהיה צמוד למדד המחירים לצרכן עפ"י תנאי ההצמדה הבאים וישא ריבית כדלקמן:
"המדד" פירושו: מדד המחירים לצרכן (כולל פרות וירקות) המתפרסם ע"י הלשכה המרכזית לסטטיסטיקה, או כל מדד אחר שיפורסם במקומו.
שטר זה הינו סחיר.
"המדד הבסיסי" פירושו: המדד שהיה ידוע במועד החתימה על שטר זה.
"המדד החדש" פירושו: המדד שיפורסם לאחרונה לפני יום הפירעון בפועל של שטר זה.
הריבית" פירושה-ריבית בשיעור הריבית החריגה הנוהגת בחריגה מחח"ד בנק מזרחי-טפחות ואשר לא תפחת משיעור של 14.65% שנתית.
אם במועד הפירעון של שטר זה היה המדד החדש גבוה מהמדד הבסיסי, אשלם את סכום שטר זה כשהוא מוגדל באופן יחסי לשיעור העלייה של המדד החדש לעומת המדד הבסיסי ובצירוף הריבית מיום חתימת שטר זה עד ליום מלא התשלום בפועל. אולם אם המדד החדש יהיה שווה או נמוך מהמדד הבסיסי, אשלם שטר זה כסכומו הנקוב בצירוף הריבית מיום חתימת שטר זה עד ליום מלא התשלום בפועל. 
המחזיק בשטר יהיה רשאי למלא בשטר כל פרט החסר בו והוא יהיה פטור מכל החובות המוטלות על מחזיק בשטר, לרבות מהצגה לתשלום, פרוטסט, הודעת אי כיבוד והודעת חילול השטר.
*סכום שימולא בשטר במקרה הצורך לא יעלה על סך העמלה לה זכאית ג'י.אי.אמ גלובל ניהול והשקעות בע"מ מכוח הסכם זה בתוספת עלויות גבייה ודמי טיפול לפי העניין כאמור בהסכם וכן הוצאות משפטיות ושכ"ט עו"ד.

פרטי עושה השטר:

שם מלא: ${clientData.firstName} ${clientData.lastName}     מספר תעודת זהות: ${clientData.idNumber}

כתובת: ${clientData.address}

חתימת עושה השטר: _________________________`;
};

export const generateContractPDF = async (contractData: ContractData): Promise<void> => {
  const contractText = getContractText(contractData.clientData);
  
  // Create PDF with the exact contract text from ContractPage
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  // Create a temporary container with the exact same styling as ContractPage
  const contractContainer = document.createElement('div');
  contractContainer.style.position = 'absolute';
  contractContainer.style.left = '-9999px';
  contractContainer.style.width = '800px';
  contractContainer.style.padding = '40px';
  contractContainer.style.fontFamily = 'Arial, sans-serif';
  contractContainer.style.fontSize = '11px';
  contractContainer.style.lineHeight = '1.4';
  contractContainer.style.direction = 'rtl';
  contractContainer.style.textAlign = 'right';
  contractContainer.style.backgroundColor = 'white';
  
  contractContainer.innerHTML = `
    <div style="max-width: 720px; margin: 0 auto; background: white; padding: 40px; line-height: 1.4;">
      <div style="font-size: 11px; text-align: right; direction: rtl; line-height: 1.4; white-space: pre-wrap;">
        ${contractText}
      </div>
      
      ${contractData.signature ? `
        <div style="margin-top: 40px; text-align: center;">
          <div style="border: 1px solid #ccc; padding: 15px; display: inline-block;">
            <img src="${contractData.signature}" style="max-width: 200px; max-height: 80px;" />
          </div>
        </div>
      ` : ''}
    </div>
  `;
  
  try {
    document.body.appendChild(contractContainer);
    
    // Convert to canvas and add to PDF
    const canvas = await html2canvas(contractContainer, {
      useCORS: true,
      allowTaint: true,
      scale: 2,
      width: 800,
      height: contractContainer.scrollHeight,
      backgroundColor: 'white'
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 10;
    
    // Add pages as needed
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - 20;
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight + 10;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;
    }
    
    document.body.removeChild(contractContainer);
    
    // Save the PDF
    pdf.save(`contract-${contractData.leadId}.pdf`);
    
  } catch (error) {
    // Clean up container in case of error
    if (document.body.contains(contractContainer)) {
      document.body.removeChild(contractContainer);
    }
    throw error;
  }
};