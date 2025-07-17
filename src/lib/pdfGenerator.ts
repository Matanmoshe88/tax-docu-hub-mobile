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
    <div style="max-width: 720px; margin: 0 auto; background: white; padding: 40px; line-height: 1.4;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 20px; font-weight: bold;">הסכם טיפול בהחזרי מס</h1>
      </div>
      
      <div style="font-size: 12px; text-align: right; direction: rtl;">
        <p>בין : קוויק טקס (שם רשום: "ג'י.אי.אמ גלובל") ח"פ: 513218453 (להלן: "קוויקטקס" ו/או "החברה")</p>
        <p>לבין: <strong>${contractData.clientData.firstName} ${contractData.clientData.lastName}</strong> ת"ז: <strong>${contractData.clientData.idNumber}</strong> (להלן: "הלקוח")</p>
        <p>שנחתם בתאריך: <strong>${new Date().toLocaleDateString('he-IL')}</strong></p>
        <br>
        
        <p><strong>הואיל</strong> והלקוח מאשר בזאת כי הינו מבקש לבדוק את זכאותו להחזרי מס באמצעות ג'י.אי.אמ גלובל ניהול והשקעות בע"מ ח.פ. 513218453 להלן: ("קוויקטקס" ו/או "החברה") שכתובתה ת.ד. 11067, פתח-תקווה מיקוד 4934829 מול כלל הרשויות לרבות מס הכנסה וביטוח לאומי לצורך ייצוגו וטיפולו בקבלת ההחזר ממס הכנסה (להלן: "החזר המס") לשנים 2023-2018 (להלן: "תקופת המס") ולבצע עבורו את הפעולות הנדרשות על מנת לקבל החזר מס במקרה של זכאות;</p>
        
        <p><strong>והואיל</strong> והחברה - המעסיקה רו"ח ויועצי מס ועוסקת במתן שירותים אל מול רשויות המס לשם ביצוע החזרי מס לשכירים והגשת דוחות כספיים- מסכימה ליטול על עצמה את ייצוגו של הלקוח בהליך החזר המס;</p>
        
        <p><strong>לפיכך, הוצהר, הוסכם והותנה בין הצדדים כדלקמן:</strong></p>
        
        <p><strong>1.</strong> החברה מספקת שירות לטיפול בהחזרי מס לשכירים מרשויות המס השונות, תוך ליווי הלקוח והגשת בקשות להחזר מיסים בשמו. תנאי סף לבדיקת הזכאות הוא שהלקוח היה שכיר ושילם מס הכנסה בשש השנים האחרונות, והלקוח מצהיר כי עומד בתנאי הסף כאמור לעיל. הטיפול של החברה כולל הזמנת המסמכים הרלוונטיים מרשויות המס בשם הלקוח, בחינתם על ידי אנשי מקצוע (רואי חשבון ו/או יועצי מס) ובמידה ונתוני הלקוח עונים על התנאים להחזר, תוגש בשמו של הלקוח בקשה להחזר מס (להלן: "השירות").</p>
        
        <p><strong>2.</strong> השירות הניתן הוא לטיפול בהחזר מס בלבד (לצורך הסכם זה, המונח "החזר מס" יהיה הסכום שייקבע על פי שומת מס הכנסה לתקופה הרלוונטית, לפני כל קיזוז ו/או עיקול בגין חוב המגיע ממנו לצד ג') ואינו כולל כל עניין ו/או טיפול אחרים מלבד כמפורט במפורש לעיל ולהלן.</p>
        
        <p><strong>3.</strong> הלקוח מאשר בזאת לחברה לטפל עבורו בהחזרי המס לשנים 2026-2017 (להלן: "תקופת המס") ולשם כך לבצע עבור הלקוח את הפעולות הנדרשות על מנת לקבל החזרי מס ולטפל בכל הנוגע בדבר.</p>
        
        <p><strong>4.</strong> הלקוח מתחייב לחתום על מסמכים לרבות בקשה לרישום ייצוג ו/או מתן ייפוי הכוח המאפשר לחברה ו/או מי מטעמה להציג ולהגיש כל מסמך ומידע השייך ללקוח לביטוח לאומי ו/או לרשויות המס.</p>
        
        <p><strong>5.</strong> אין בבדיקותיה ושירותיה של החברה להבטיח החזרת מס בפועל. כמו כן, לחברה לא תהיה כל אחריות כלפי הלקוח, במישרין ו/או בעקיפין, בכל תוצאת הבדיקה.</p>
        
        <p><strong>6.</strong> סכום התמורה בגין השירותים הנ"ל יהיה <strong>${contractData.clientData.commissionRate}</strong> מהסכום שיוחזר בפועל.</p>
        
        <p><strong>7.</strong> התמורה תשולם לחברה כהפרש בין הסכום המוחזר לבין הסכום שיועבר ללקוח.</p>
        
        <p><strong>8.</strong> הלקוח מתחייב להעביר לחברה צילום ברור של ת.ז. שלו, של בן/בת זוגו ושל ילדיו, כולל ספח וכן צילום ברור של רישיון נהיגה ו/או צילום דרכון ו/או מסמכים נוספים הנדרשים לצורך בדיקת הזכאות.</p>
        
        <p><strong>9.</strong> הלקוח מתחייב להודיע על קבלת ההחזר ממס הכנסה עד 48 שעות מיום קבלת ההחזר וכן להציג ו/או להעביר כל מסמך ו/או הודעה ממס הכנסה ו/או מהרשויות השונות בעניין החזר המס.</p>
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