import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PortalLayout } from '@/components/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PenTool, RotateCcw, Check, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useSalesforceData } from '@/hooks/useSalesforceData';
import { generateContractText } from '@/lib/contractUtils';

export const SignaturePage: React.FC = () => {
  const navigate = useNavigate();
  const { clientData, recordId } = useSalesforceData();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const { toast } = useToast();

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
    
    const fileName = `signature-${recordId}-${Date.now()}.png`;
    
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
        leadId: recordId,
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
    
    const contractText = generateContractText(clientData);
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

    const contractDiv = document.createElement('div');
    contractDiv.innerHTML = `
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
              <span class="party-label">לבין:</span> ${clientData.firstName} ${clientData.lastName}<br>
              ת"ז: ${clientData.idNumber} (להלן: "הלקוח")
            </div>
            <div class="contract-date">תאריך חתימת ההסכם: ${currentDate}</div>
          </div>
          
          <div class="preamble">
            ${preambleText.trim()}
          </div>
          
          <div class="content">
            ${numberedSections.map((section) => `
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
              <div class="signature-box">
                <img src="${signatureDataURL}" class="signature-image" />
              </div>
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
            <div class="client-info"><strong>שם מלא:</strong> ${clientData.firstName} ${clientData.lastName}</div>
            <div class="client-info"><strong>מספר תעודת זהות:</strong> ${clientData.idNumber}</div>
            <div class="client-info"><strong>כתובת:</strong> ${clientData.address}</div>
          </div>
          
          <div class="signature-section">
            <div class="signature-title">אישור וחתימה על השטר</div>
            <div class="signature-text">
              אני החתום/ה מטה מאשר/ת שקראתי והבנתי את תנאי השטר המפורטים לעיל<br>
              ומסכים/ה לכל התנאים המפורטים בשטר זה.
            </div>
            <div class="signature-box">
              <img src="${signatureDataURL}" class="signature-image" />
            </div>
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
    
    document.body.appendChild(contractDiv);
    
    try {
      // Optimized settings for maximum file size reduction
      const canvas = await html2canvas(contractDiv, {
        useCORS: true,
        allowTaint: true,
        scale: 0.5, // Reduced scale for smaller file size
        width: Math.floor(210 * 2.8),
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
      localStorage.setItem(`signature-${recordId}`, signatureDataURL);
      localStorage.setItem(`clientData-${recordId}`, JSON.stringify(clientData));
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
      const contractFileName = `contract-${recordId}-${Date.now()}.pdf`;
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
      navigate(`/documents/${recordId}`);
      
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
    navigate(`/contract/${recordId}`);
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
