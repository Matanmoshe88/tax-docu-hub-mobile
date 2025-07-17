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

// Full contract text from ContractPage.tsx
const getContractText = (clientData: ContractData['clientData']) => `בין : קוויק טקס (שם רשום: "ג'י.אי.אמ גלובל")   ח"פ: 513218453      (להלן: "קוויקטקס" ו/או "החברה")
לבין: ${clientData.firstName} ${clientData.lastName}                                                        ת"ז: ${clientData.idNumber}                                  (להלן: "הלקוח")
שנחתם בתאריך : ${new Date().toLocaleDateString('he-IL')}

הואיל והלקוח מאשר בזאת כי הינו מבקש לבדוק את זכאותו להחזרי מס באמצעות ג'י.אי.אמ גלובל ניהול והשקעות בע"מ ח.פ. 513218453 להלן: ("קוויקטקס" ו/או "החברה") שכתובתה ת.ד. 11067, פתח-תקווה מיקוד 4934829 מול כלל הרשויות לרבות מס הכנסה וביטוח לאומי לצורך ייצוגו וטיפולו בקבלת ההחזר ממס הכנסה (להלן: "החזר המס") לשנים 2023-2018 (להלן: "תקופת המס") ולבצע עבורו את הפעולות הנדרשות על מנת לקבל החזר מס במקרה של זכאות;
והואיל והחברה - המעסיקה רו"ח ויועצי מס ועוסקת במתן שירותים אל מול רשויות המס לשם ביצוע החזרי מס לשכירים והגשת דוחות כספיים- מסכימה ליטול על עצמה את ייצוגו של הלקוח בהליך החזר המס;
לפיכך, הוצהר, הוסכם והותנה בין הצדדים כדלקמן:
1. החברה מספקת שירות לטיפול בהחזרי מס לשכירים מרשויות המס השונות, תוך ליווי הלקוח והגשת בקשות להחזר מיסים בשמו. תנאי סף לבדיקת הזכאות הוא שהלקוח היה שכיר ושילם מס הכנסה בשש השנים האחרונות, והלקוח מצהיר כי עומד בתנאי הסף כאמור לעיל. הטיפול של החברה כולל הזמנת המסמכים הרלוונטיים מרשויות המס בשם הלקוח, בחינתם על ידי אנשי מקצוע (רואי חשבון ו/או יועצי מס) ובמידה ונתוני הלקוח עונים על התנאים להחזר, תוגש בשמו של הלקוח בקשה להחזר מס (להלן: "השירות").
2. השירות הניתן הוא לטיפול בהחזר מס בלבד (לצורך הסכם זה, המונח "החזר מס" יהיה הסכום שייקבע על פי שומת מס הכנסה לתקופה הרלוונטית, לפני כל קיזוז ו/או עיקול בגין חוב המגיע ממנו לצד ג') ואינו כולל כל עניין ו/או טיפול אחרים מלבד כמפורט במפורש לעיל ולהלן. כל שירות שאינו חלק מתהליך קבלת החזרי המס כגון תיאום מס, סגירת תיקים פתוחים במס הכנסה וכד' יהיה כרוך בתשלום נוסף על פי תעריפי החברה ובהתאם לשיקול דעתה הבלעדי של החברה.
3. הלקוח מאשר בזאת לחברה לטפל עבורו בהחזרי המס לשנים 2026-2017 (להלן: "תקופת המס") ולשם כך לבצע עבור הלקוח את הפעולות הנדרשות על מנת לקבל החזרי מס ולטפל בכל הנוגע בדבר, לרבות בדיקת זכאותו להחזרי מס ומייפה את כוחה של החברה ו/או רואה חשבון מטעמה ו/או מי מטעמה לפנות בשמו ובמקומו לרשויות המס או לגופים הרלוונטיים אחרים, לרבות מס הכנסה וביטוח לאומי, וזאת על מנת לבקש, לאסוף או להגיש את המסמכים הדרושים או על מנת שיוכל לפעול בכל דרך אחרת הנדרשת לבדיקת זכאות הלקוח להחזרי מס לטובת טיפול בקבלת החזר, וזאת ללא צורך בעדכון הלקוח או קבלת אישור הלקוח לגבי כל השנים המצוינות בתקופת המס.
4. כמו כן, ידוע ללקוח כי לצורך טיפול יעיל ומהיר הוא יידרש לחתום על מסמכים לרבות בקשה לרישום ייצוג ו/או מתן ייפוי הכוח המאפשר לחברה ו/או מי מטעמה להציג ולהגיש כל מסמך ומידע השייך ללקוח לביטוח לאומי ו/או לרשויות המס, המצ"ב להסכם זה (ראה מצ"ב יפוי כח כנספח א'), לטובת ביצוע בדיקת הזכאות וטיפול בהחזר המס, והלקוח מאשר לחברה ו/או מי מטעמה לקבל עבורו את כל הנתונים והמסמכים הרלוונטיים הנדרשים לצורך הטיפול בהחזר המס, ומתחייב לשתף פעולה להשגת כלל המסמכים והנתונים הנדרשים לצורך בדיקת זכאות הלקוח להחזר מס והגשת הדו"ח.
5. אין בבדיקותיה ושירותיה של החברה להבטיח החזרת מס בפועל. כמו כן, לחברה לא תהיה כל אחריות כלפי הלקוח, במישרין ו/או בעקיפין, בכל תוצאת הבדיקה ו/או החלטה ו/או נימוק ו/או כל דרישה שהיא, בעבר, הווה ובעתיד, של רשויות המס והמוסד לביטוח לאומי מהלקוח, לרבות חבות מס ו/או שינויים בתקנות ובנהלים של רשויות המס שיש בהם כדי להשפיע על אי קבלת ההחזר, סכום ההחזר ו/או מועד קבלתו ו/או במקרה של דחיית הבקשה, באופן מלא או חלקי, או גובה ההחזר, מכל סיבה שהיא. למען הסר ספק, החברה לא מתחייבת כי הלקוח יקבל החזר מס בפועל וללקוח לא תהא כל טענה ו/או דרישה ו/או תביעה נגד החברה בקשר להחלטת הרשויות.
6. הלקוח מצהיר ומתחייב שלא לטפל בהחזרי המס בתקופת המס שבטיפול בכל דרך אחרת, לרבות בדו"ח פרטי, כמו כן מתחייב הלקוח להעביר לחברה כל מסמך ו/או אסמכתא ו/או מידע הנחוצים לטובת הייצוג ללא דיחוי. הלקוח מתחייב לאשר את הייצוג באזור האישי במס הכנסה ולשתף פעולה. הלקוח מתחייב לפעול בשקיפות מלאה עם החברה ולהעביר מידע נכון ומלא לרבות לעניין הדיווחים לרשויות המס או לגורמים אחרים ולרבות כלל הנתונים הרלוונטיים אודותיו ואודות משפחתו באופן מלא, אמיתי ומדויק ומצהיר כי ידוע לו שהחברה מתקשרת אתו על בסיס הנתונים כאמור. הלקוח מצהיר כי מסר לחברה את כל המסמכים, הנתונים והפרטים שהיו בידיו ובידיעתו כי פרט להכנסות עליהן דיווח, לא היו לו או לבת/בן זוגו/ה הכנסות נוספות בארץ או ובחו"ל, מכל מקור שהוא, בין אם ממשלח יד ובין אם ממקור אחר.
7. הלקוח מצהיר ומודע לכך כי אי שיתוף פעולה מצד הלקוח ואי מסירת המידע או מסירת מידע שאינו נכון ו/או עדכני ו/או מלא עלול לעכב את מתן השירות או לגרום לסירוב הבקשה וללקוח לא יהיה בגין עיכוב ו/או סירוב כאמור כל טענה ו/או דרישה ו/או תביעה כנגד החברה. יובהר כי החברה תגיש את הבקשה להחזר מס על סמך מידע שהתקבל מאת הלקוח כמו שהוא וכי לחברה אין אחריות ישירה ו/או שילוחית לנכונותו, כמו כן לחברה לא תהיה כל אחריות כלפי הלקוח, במישרין ו/או בעקיפין, בכל דרישה שהיא, בעבר, הווה ובעתיד, של רשויות המס והמוסד לביטוח לאומי מהלקוח, לרבות חבות מס ו/או שינויים בתקנות שיכולים להשפיע על אי קבלת ההחזר, סכום ההחזר ו/או מועד קבלתו.

8. בעת מסירת פרטים אישיים, בהזמנת שירות או מוצר, מאשר הלקוח לחברה לפנות אליו בכל אמצעי תקשורת שתראה לנכון, בהצעות ומידע שיווקי ופרסומי (לרבות על פי סעיף 30א' לחוק התקשורת) הקשור לשירותי החברה ולמוצרים המשווקים באמצעותה. אם אין הלקוח מעוניין בפניות החברה בכלל או באמצעות אמצעי תקשורת ספציפי בפרט, עליו להודיע על כך לחברה באחת מדרכי התקשורת המפורטות באתר החברה.
18. תנאי תשלום: הלקוח מתחייב לשלם לחברה עמלה בגובה של ${clientData.commissionRate} מסכום ההחזר בתוספת מע"מ (להלן: "עמלה") וזאת רק לאחר קבלת הכסף לחשבון הבנק של הלקוח. סכום העמלה כאמור ישולמו עד ארבעה (4) ימי עסקים מרגע קבלת החזר המס בפועל בחשבונו האישי של הלקוח או בן/בת זוגו. העמלות כאמור ישולמו על-ידי הלקוח לחשבון בנק על שם החברה (ג'י.אי.אמ גלובל ניהול והשקעות בע"מ) בבנק: 20-מזרחי-טפחות, סניף: 481, חשבון: 347847, או באמצעות כרטיס אשראי, בהתאם לשיקול דעתה הבלעדי החברה. 
ככל והלקוח לא יהיה ימצא זכאי להחזר לא ידרש לשלם עמלה כאמור בסעיף זה.`;

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
  
  const contractText = getContractText(contractData.clientData);
  
  tempContainer.innerHTML = `
    <div style="max-width: 720px; margin: 0 auto; background: white; padding: 40px; line-height: 1.4;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 20px; font-weight: bold;">הסכם טיפול בהחזרי מס</h1>
      </div>
      
      <div style="font-size: 11px; text-align: right; direction: rtl; line-height: 1.5; white-space: pre-wrap;">
        ${contractText}
      </div>
      
      <div style="margin-top: 50px; padding-top: 30px; border-top: 2px solid #333;">
        <h2 style="text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 25px;">שטר חוב</h2>
        
        <div style="font-size: 12px; text-align: right; direction: rtl; line-height: 1.6;">
          <p>אני הח"מ מתחייב לשלם לפקודת <strong>קוויק טקס</strong> את סכום <strong>${contractData.clientData.commissionRate}</strong> מכל סכום שיוחזר לי ממס הכנסה באמצעות החברה.</p>
          
          <p style="margin: 15px 0;">תאריך: <strong>${new Date().toLocaleDateString('he-IL')}</strong></p>
          
          <div style="margin: 30px 0; padding: 15px; border: 1px solid #ccc;">
            <h4 style="margin-bottom: 10px;">פרטי עושה השטר:</h4>
            <div style="margin-bottom: 8px;">
              <span style="display: inline-block; width: 150px;"><strong>שם מלא:</strong></span>
              <span><strong>${contractData.clientData.firstName} ${contractData.clientData.lastName}</strong></span>
              <span style="margin-right: 40px; display: inline-block; width: 120px;"><strong>מספר תעודת זהות:</strong></span>
              <span><strong>${contractData.clientData.idNumber}</strong></span>
            </div>
            <p><strong>כתובת:</strong> <strong>${contractData.clientData.address}</strong></p>
          </div>
          
          ${contractData.signature ? `
            <div style="margin: 30px 0; text-align: center;">
              <p style="margin-bottom: 10px;"><strong>חתימת עושה השטר:</strong></p>
              <div style="border: 1px solid #ccc; padding: 10px; display: inline-block;">
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