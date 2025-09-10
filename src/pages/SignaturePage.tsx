import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PortalLayout } from '@/components/PortalLayout';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PenTool, RotateCcw, Check, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSalesforceData } from '@/hooks/useSalesforceData';
import { generateContractPDFBlob } from '@/lib/pdfGenerator';

export const SignaturePage: React.FC = () => {
  const navigate = useNavigate();
  const { clientData, recordId, registerDocuments } = useSalesforceData();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
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

  const callSalesforceIntegration = async (signatureUrl: string, documnetBankId: string, documentName?: string) => {
    console.log('🔄 Calling Salesforce integration...', { documnetBankId, documentName });
    
    const { data, error } = await supabase.functions.invoke('salesforce-integration', {
      body: {
        leadId: recordId,
        signatureUrl,
        documnetBankId,
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
    
    // Transform data to match new API structure
    const contractData = {
      ...clientData, // Spread all clientData fields including checkYears
      contractNumber: recordId || '12345',
      company: {
        name: 'קוויק טקס (ג\'י.אי.אמ גלובל)',
        id: '513218453',
        address: 'רחוב הרצל 123, תל אביב'
      },
      client: {
        name: `${clientData.firstName} ${clientData.lastName}`,
        id: clientData.idNumber,
        phone: clientData.phone,
        email: clientData.email,
        address: clientData.address,
        commissionRate: clientData.commissionRate,
        checkYears: clientData.checkYears // Include checkYears for PDF generation
      },
      sections: [
        { title: 'סעיף 1 - השירות', content: 'החברה מתחייבת לבצע החזרי מס עבור הלקוח' },
        { title: 'סעיף 2 - התשלום', content: `שיעור העמלה: ${clientData.commissionRate}` },
        { title: 'סעיף 3 - תנאים', content: 'הלקוח מתחייב לספק את כל המסמכים הנדרשים' }
      ],
      debtAmount: '10,000'
    };

    // Use the new PDF generator
    const pdf = await generateContractPDFBlob(contractData, signatureDataURL);
    return pdf;
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
    setShowLoading(true);
    
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

      // Find register documents for signature and contract using documentType first, then name fallback
      console.log('📋 All Register documents:', registerDocuments);
      console.log('📋 Register documents length:', registerDocuments?.length);
      
      const signatureDoc = registerDocuments?.find(doc => {
        console.log('🔍 Checking doc for signature:', doc.name, 'documentType:', doc.documentType);
        // Prioritize matching by documentType
        if (doc.documentType === 'Signature') return true;
        // Fallback to name matching
        return doc.name.includes('חתימה') || doc.name.toLowerCase().includes('signature');
      });
      
      const contractDoc = registerDocuments?.find(doc => {
        console.log('🔍 Checking doc for contract:', doc.name, 'documentType:', doc.documentType);
        // Prioritize matching by documentType
        if (doc.documentType === 'Agreement') return true;
        // Fallback to name matching
        return doc.name.includes('הסכם') || doc.name.toLowerCase().includes('contract') || doc.name.includes('התקשרות');
      });

      console.log('✍️ Found signature doc:', signatureDoc);
      console.log('📄 Found contract doc:', contractDoc);

      // Send signature to Salesforce (only if we have a matching document type)
      if (signatureDoc) {
        toast({
          title: "שולח חתימה ל-Salesforce...",
          description: `מעביר את החתימה למערכת הניהול (Bank ID: ${signatureDoc.bankId})`,
        });
        
        console.log('🔄 Upserting signature with bankId:', signatureDoc.bankId);
        const salesforceResult = await callSalesforceIntegration(signatureUrl, signatureDoc.bankId, "חתימה");
        console.log('✅ Signature uploaded to Salesforce:', salesforceResult);
        
        toast({
          title: "חתימה נשלחה בהצלחה!",
          description: "החתימה עודכנה במערכת הניהול",
        });
      } else {
        console.log('⚠️ No signature document type found in register documents');
        toast({
          title: "שגיאה",
          description: "לא נמצא סוג מסמך חתימה ברשימת המסמכים",
          variant: "destructive",
        });
      }

      // Send contract to Salesforce (only if we have a matching document type) - Sequential after signature
      if (contractDoc) {
        toast({
          title: "שולח הסכם ל-Salesforce...",
          description: `מעביר את ההסכם למערכת הניהול (Bank ID: ${contractDoc.bankId})`,
        });
        
        console.log('🔄 Upserting contract with bankId:', contractDoc.bankId);
        const contractResult = await callSalesforceIntegration(contractUrl, contractDoc.bankId, "הסכם התקשרות");
        console.log('✅ Contract uploaded to Salesforce:', contractResult);
        
        toast({
          title: "הסכם נשלח בהצלחה!",
          description: "ההסכם עודכן במערכת הניהול",
        });
      } else {
        console.log('⚠️ No contract document type found in register documents');
        toast({
          title: "שגיאה",
          description: "לא נמצא סוג מסמך הסכם ברשימת המסמכים",
          variant: "destructive",
        });
      }
      
      setIsSigned(true);
      toast({
        title: "החתימה נשמרה בהצלחה! 🎉",
        description: "החתימה נשלחה למערכת והמעבר לשלב הבא",
      });
      
      // Keep loading animation for a moment before navigation
      await new Promise(resolve => setTimeout(resolve, 1500));
      setShowLoading(false);
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
      setShowLoading(false);
    }
  };

  const handlePrevious = () => {
    navigate(`/contract/${recordId}`);
  };

  return (
    <>
      <LoadingOverlay isVisible={showLoading} />
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
    </>
  );
};
