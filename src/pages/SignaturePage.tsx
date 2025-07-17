
import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PortalLayout } from '@/components/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PenTool, RotateCcw, Check, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ClientData {
  firstName: string;
  lastName: string;
  idNumber: string;
  phone: string;
  email: string;
  address: string;
  commissionRate: string;
}

export const SignaturePage: React.FC = () => {
  const navigate = useNavigate();
  const { leadId } = useParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const { toast } = useToast();
  
  // Client data from Salesforce
  const [clientData, setClientData] = useState<ClientData>({
    firstName: "יוסי",
    lastName: "כהן", 
    idNumber: "123456789",
    phone: "050-1234567",
    email: "yossi.cohen@email.com",
    address: "רחוב הרצל 1, תל אביב",
    commissionRate: "25%"
  });

  // Load client data from session storage
  useEffect(() => {
    const storedClientData = sessionStorage.getItem('clientData');
    if (storedClientData) {
      try {
        const data = JSON.parse(storedClientData);
        setClientData({
          firstName: data.FirstName || "יוסי",
          lastName: data.LastName || "כהן",
          idNumber: data.Id_Number__c || "123456789",
          phone: data.Phone || "050-1234567",
          email: data.Email || "yossi.cohen@email.com",
          address: `${data.Street || "רחוב הרצל 1"}, ${data.City || "תל אביב"}`,
          commissionRate: data.Commission_Rate__c ? `${data.Commission_Rate__c}%` : "25%"
        });
      } catch (error) {
        console.error('Error parsing client data:', error);
      }
    }
  }, []);

  // Disable browser back button completely
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      window.history.pushState(null, '', window.location.pathname);
      toast({
        title: "ניווט מוגבל",
        description: "אנא השתמש בכפתורי הניווט בעמוד",
        variant: "destructive",
      });
    };

    window.history.pushState(null, '', window.location.pathname);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [toast]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    let clientX, clientY;
    
    if ('touches' in e) {
      e.preventDefault();
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let clientX, clientY;
    
    if ('touches' in e) {
      e.preventDefault();
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e40af'; // Blue color for pen-like appearance
    ctx.lineTo(x, y);
    ctx.stroke();
    
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const uploadSignatureToStorage = async (signatureBlob: Blob): Promise<string> => {
    console.log('🔄 Uploading signature to Supabase storage...');
    
    const fileName = `signature-${leadId}-${Date.now()}.png`;
    
    const { data, error } = await supabase.storage
      .from('signatures')
      .upload(fileName, signatureBlob, {
        contentType: 'image/png',
        upsert: false
      });

    if (error) {
      console.error('❌ Storage upload error:', error);
      throw new Error(`Failed to upload signature: ${error.message}`);
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('signatures')
      .getPublicUrl(fileName);

    console.log('✅ Signature uploaded successfully:', publicUrl);
    return publicUrl;
  };

  const callSalesforceIntegration = async (signatureUrl: string, documentType?: string, documentName?: string) => {
    console.log('🔄 Calling Salesforce integration...');
    
    const { data, error } = await supabase.functions.invoke('salesforce-integration', {
      body: {
        leadId,
        signatureUrl,
        documentType,
        documentName
      }
    });

    if (error) {
      console.error('❌ Salesforce integration error:', error);
      throw new Error(`Salesforce integration failed: ${error.message}`);
    }

    console.log('✅ Salesforce integration successful:', data);
    return data;
  };

  const generateSignedContract = async (signatureDataURL: string): Promise<Blob> => {
    console.log('🔄 Generating signed contract PDF...');
    
    // Create the exact same contract content as displayed in ContractPage
    const contractDiv = document.createElement('div');
    contractDiv.style.cssText = `
      width: 210mm;
      padding: 20mm;
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.5;
      color: black;
      background: white;
      direction: rtl;
      text-align: right;
    `;
    
    const currentDate = new Date().toLocaleDateString('he-IL');
    
    const contractContent = `
הסכם שירות להחזרי מס

בין: קוויק טקס (שם רשום: "ג'י.אי.אמ גלובל") ח"פ: 513218453 (להלן: "קוויקטקס" ו/או "החברה")
לבין: ${clientData.firstName} ${clientData.lastName} ת"ז: ${clientData.idNumber} (להלן: "הלקוח")
שנחתם בתאריך: ${currentDate}

הואיל וקוויקטקס עוסקת בין השאר במתן שירותי ייעוץ מס והכנת דוחות לרשויות המס;

והואיל והלקוח מעוניין לקבל מקוויקטקס שירותי הגשת דוח שנתי לפקיד השומה וטיפול בהחזר מס שנתי;

והואיל וקוויקטקס מעוניינת לתת ללקוח השירותים הנ"ל, הכל בכפוף לתנאים המפורטים להלן;

לפיכך הוסכם, הותנה והוצהר בין הצדדים כדלקמן:

1. מבוא והגדרות
1.1. המבוא להסכם זה מהווה חלק בלתי נפרד הימנו.
1.2. בהסכם זה יהיו למונחים הבאים הפירושים שלצידם:
"שירותים" - הכנת דוח שנתי והגשתו לפקיד השומה וטיפול בקבלת החזר מס שנתי עבור הלקוח.
"דמי שירות" - התמורה שישלם הלקוח לקוויקטקס תמורת השירותים, כמפורט בסעיף 4 להלן.

2. השירותים
2.1. קוויקטקס תספק ללקוח את השירותים הבאים:
א. הכנת דוח שנתי עבור הלקוח על בסיס המסמכים שיומצאו על ידי הלקוח.
ב. הגשת הדוח השנתי לפקיד השומה.
ג. מעקב אחר קבלת החזר המס ממשרד האוצר.
ד. העברת סכום החזר המס ללקוח בניכוי דמי השירות.

2.2. הלקוח מתחייב להמציא לקוויקטקס את כל המסמכים הנדרשים להכנת הדוח השנתי.

3. מחויבויות הלקוח
3.1. הלקוח מתחייב להמציא לקוויקטקס את כל המסמכים הנדרשים להכנת הדוח השנתי.
3.2. הלקוח מתחייב כי המידע שימסור לקוויקטקס יהיה מדויק ונכון.
3.3. הלקוח מתחייב לחתום על כל מסמך שיידרש לצורך הגשת הדוח והקבלת החזר המס.

4. התמורה
4.1. דמי השירות יהיו בשיעור של ${clientData.commissionRate} מסכום החזר המס שיתקבל בפועל.
4.2. דמי השירות ינוכו מסכום החזר המס טרם העברתו ללקוח.
4.3. במקרה שלא יתקבל החזר מס, לא ישלם הלקוח דמי שירות.

5. משך ההסכם
5.1. הסכם זה יהיה בתוקף לתקופה של שנה אחת ממועד חתימתו.
5.2. ההסכם יתחדש אוטומטית לתקופות נוספות של שנה, אלא אם כן הודיע אחד הצדדים על רצונו להביא ההסכם לידי סיום.

6. ביטול ההסכם
6.1. כל צד רשאי לבטל הסכם זה בהודעה מוקדמת של 30 יום.
6.2. במקרה של ביטול ההסכם, יישאר הלקוח חייב בתשלום דמי שירות עבור שירותים שכבר ניתנו.

7. אחריות ושיפוי
7.1. קוויקטקס תהיה אחראית לנזקים ישירים בלבד שייגרמו ללקוח כתוצאה מהפרת התחייבויותיה על פי הסכם זה.
7.2. אחריותה של קוויקטקס תהיה מוגבלת לסכום דמי השירות ששולמו בפועל.

8. הוראות כלליות
8.1. הסכם זה מבטא את מלוא ההסכמה בין הצדדים.
8.2. שינוי ההסכם יעשה בכתב ובחתימת שני הצדדים.
8.3. על הסכם זה יחולו דיני מדינת ישראל.

שטר חוב

שנערך ונחתם ביום ${currentDate}

אני הח"מ מתחייב/ת לשלם לפקודת ג'י.אי.אמ גלובל ניהול והשקעות בע"מ ח.פ. 513218453
את הסכום שיגיע כדמי שירות בהתאם להסכם השירות החתום ביני לבינה.

שם מלא: ${clientData.firstName} ${clientData.lastName}
מספר תעודת זהות: ${clientData.idNumber}
כתובת: ${clientData.address}
טלפון: ${clientData.phone}
אימייל: ${clientData.email}

חתימת עושה השטר:`;

    contractDiv.innerHTML = `
      <div style="white-space: pre-wrap; margin-bottom: 30px;">${contractContent}</div>
      <div>
        <img src="${signatureDataURL}" style="width: 200px; height: auto; display: block;" />
      </div>
    `;
    
    document.body.appendChild(contractDiv);
    
    try {
      const canvas = await html2canvas(contractDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      return pdf.output('blob');
    } finally {
      document.body.removeChild(contractDiv);
    }
  };

  const handleNext = async () => {
    if (!hasSignature) {
      toast({
        title: "חתימה נדרשת",
        description: "אנא חתום בתיבת החתימה לפני המעבר לשלב הבא",
        variant: "destructive",
      });
      return;
    }

    // Check signature size
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let pixelCount = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 0) pixelCount++;
    }
    
    if (pixelCount < 100) {
      toast({
        title: "החתימה קטנה מדי",
        description: "אנא חתום שוב בצורה ברורה יותר",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('🚀 Starting signature submission process...');
      
      // Convert canvas to blob
      const signatureDataURL = canvas.toDataURL('image/png');
      const response = await fetch(signatureDataURL);
      const signatureBlob = await response.blob();
      
      // Save signature locally (for PDF generation)
      localStorage.setItem(`signature-${leadId}`, signatureDataURL);
      localStorage.setItem(`clientData-${leadId}`, JSON.stringify(clientData));
      console.log('✅ Signature saved to localStorage');

      // Upload signature to Supabase storage
      toast({
        title: "מעלה חתימה...",
        description: "מעלה את החתימה לשירות האחסון",
      });
      
      const signatureUrl = await uploadSignatureToStorage(signatureBlob);
      console.log('✅ Signature uploaded to storage:', signatureUrl);

      // Generate signed contract
      toast({
        title: "יוצר הסכם חתום...",
        description: "מכין את ההסכם עם החתימה",
      });
      
      const contractBlob = await generateSignedContract(signatureDataURL);
      
      // Upload contract to storage
      const contractFileName = `contract-${leadId}-${Date.now()}.pdf`;
      const { data: contractData, error: contractError } = await supabase.storage
        .from('signatures')
        .upload(contractFileName, contractBlob, {
          contentType: 'application/pdf',
          upsert: false
        });

      if (contractError) {
        throw new Error(`Failed to upload contract: ${contractError.message}`);
      }

      const { data: { publicUrl: contractUrl } } = supabase.storage
        .from('signatures')
        .getPublicUrl(contractFileName);

      // Send signature to Salesforce
      toast({
        title: "שולח ל-Salesforce...",
        description: "מעביר את החתימה למערכת הניהול",
      });
      
      const salesforceResult = await callSalesforceIntegration(signatureUrl, "חתימה", "חתימה");
      console.log('✅ Signature uploaded to Salesforce:', salesforceResult);

      // Send contract to Salesforce
      const contractResult = await callSalesforceIntegration(contractUrl, "הסכם התקשרות", "הסכם התקשרות");
      console.log('✅ Contract uploaded to Salesforce:', contractResult);
      
      setIsSigned(true);
      toast({
        title: "החתימה נשמרה בהצלחה! 🎉",
        description: "החתימה נשלחה למערכת והמעבר לשלב הבא",
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      navigate(`/documents/${leadId}`);
      
    } catch (error) {
      console.error('💥 Signature submission error:', error);
      
      toast({
        title: "שגיאה בשמירת החתימה",
        description: error instanceof Error ? error.message : "אנא נסה שוב",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrevious = () => {
    navigate(`/contract/${leadId}`);
  };

  return (
    <PortalLayout
      currentStep={2}
      totalSteps={4}
      onNext={handleNext}
      onPrevious={handlePrevious}
      nextLabel={isSubmitting ? "שומר..." : "שמור והמשך"}
      previousLabel="חזור להסכם"
      isNextDisabled={isSubmitting}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-4 rounded-full">
              <PenTool className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">חתימה על ההסכם</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            אנא חתום בתיבת החתימה למטה כדי לאשר את הסכמתך לתנאי ההסכם.
          </p>
        </div>

        {/* Signature Card */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <PenTool className="h-5 w-5" />
                תיבת חתימה
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearSignature}
                disabled={!hasSignature}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                נקה חתימה
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg bg-muted/10 p-4">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={300}
                  className="w-full h-72 cursor-crosshair border border-border rounded bg-white touch-none"
                  style={{ touchAction: 'none' }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
              
              <div className="text-center text-sm text-muted-foreground">
                חתום בתיבה למעלה באמצעות העכבר או המגע במסך (במכשיר נייד)
              </div>

              {hasSignature && (
                <div className="flex items-center justify-center gap-2 text-success">
                  <Check className="h-4 w-4" />
                  <span className="text-sm font-medium">החתימה נרשמה בהצלחה</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Legal Notice */}
        <Card className="border-primary/20 bg-primary/5 shadow-card">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-primary">הצהרה משפטית</h3>
              <p className="text-sm text-muted-foreground">
                החתימה הדיגיטלית שלך מהווה הסכמה מלאה לכל תנאי ההסכם ובעלת תוקף משפטי.
                החתימה תישמר במערכת באופן מוצפן ובטוח.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};
