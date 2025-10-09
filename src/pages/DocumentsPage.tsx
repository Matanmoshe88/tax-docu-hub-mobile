import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PortalLayout } from '@/components/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  CreditCard, 
  Car, 
  FileText,
  Lock,
  Unlock,
  Eye,
  Download,
  User,
  Building,
  Briefcase
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createAndDownloadPDF } from '@/lib/pdfGenerator';
import { processFileForUpload } from '@/lib/imageCompression';
import { supabase } from '@/integrations/supabase/client';
import { useSalesforceData } from '@/hooks/useSalesforceData';

// Helper function to get icon for document
const getDocumentIcon = (name: string) => {
  const lowercaseName = name.toLowerCase();
  if (lowercaseName.includes('זהות') || lowercaseName.includes('תז')) return CreditCard;
  if (lowercaseName.includes('רישיון') || lowercaseName.includes('נהיגה')) return Car;
  if (lowercaseName.includes('בנק') || lowercaseName.includes('חשבון')) return Building;
  if (lowercaseName.includes('ספח')) return FileText;
  return User;
};

export const DocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { clientData, isLoading, recordId, isDataFresh, identificationDocuments, refetchData } = useSalesforceData();
  const { toast } = useToast();
  
  // Optimistic UI state - track uploads before Salesforce confirms
  const [tempUploaded, setTempUploaded] = useState<Set<string>>(new Set());
  
  // Use documents from Salesforce data
  const documents = identificationDocuments || [];

  // Documents are already loaded with their status from Salesforce
  console.log('📋 DocumentsPage identificationDocuments:', identificationDocuments);

  // Check if all required documents are uploaded (including optimistic uploads)
  const requiredDocuments = documents.filter(doc => doc.isRequired);
  const uploadedRequiredDocuments = requiredDocuments.filter(doc => 
    doc.status === 'uploaded' || tempUploaded.has(doc.bankId)
  );
  const canFinish = requiredDocuments.length > 0 && uploadedRequiredDocuments.length === requiredDocuments.length;

  const uploadDocumentToStorage = async (file: File, bankId: string): Promise<string> => {
    console.log('🔄 Uploading document to Supabase storage...');
    
    const fileName = `document-${bankId}-${recordId}-${Date.now()}.${file.name.split('.').pop()}`;
    
    const { data, error } = await supabase.storage
      .from('signatures')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error('❌ Storage upload error:', error);
      throw new Error(`Failed to upload document: ${error.message}`);
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('signatures')
      .getPublicUrl(fileName);

    console.log('✅ Document uploaded to storage:', publicUrl);
    return publicUrl;
  };

  const sendDocumentToSalesforce = async (documentUrl: string, bankId: string) => {
    console.log('🔄 Sending document to Salesforce...');
    
    const { data, error } = await supabase.functions.invoke('salesforce-integration', {
      body: {
        leadId: recordId,
        signatureUrl: documentUrl,
        documnetBankId: bankId
      }
    });

    if (error) {
      console.error('❌ Salesforce integration error:', error);
      throw new Error(`Salesforce integration failed: ${error.message}`);
    }

    console.log('✅ Document sent to Salesforce successfully:', data);
    return data;
  };

  const handleFileUpload = async (bankId: string, file: File) => {
    const document = documents.find(doc => doc.bankId === bankId);
    if (!document) return;

    try {
      toast({
        title: "מעלה קובץ...",
        description: "מעלה את הקובץ לשירות האחסון",
      });

      // Upload to storage
      const documentUrl = await uploadDocumentToStorage(file, bankId);

      // Send to Salesforce
      toast({
        title: "שולח ל-Salesforce...",
        description: "מעביר את הקובץ למערכת הניהול",
      });

      await sendDocumentToSalesforce(documentUrl, bankId);

      // Optimistic UI - immediately show as uploaded
      setTempUploaded(prev => new Set([...prev, bankId]));

      // Background refresh with retries
      const refreshWithRetry = async (attempts = 3) => {
        for (let i = 0; i < attempts; i++) {
          try {
            await new Promise(resolve => setTimeout(resolve, 600)); // 600ms delay
            await refetchData();
            
            // Check if the real data now shows this document as uploaded
            const updatedDoc = identificationDocuments?.find(d => d.bankId === bankId);
            if (updatedDoc?.status === 'uploaded') {
              // Clear optimistic state since real data confirms upload
              setTempUploaded(prev => {
                const newSet = new Set(prev);
                newSet.delete(bankId);
                return newSet;
              });
              break;
            }
          } catch (error) {
            console.warn(`Refresh attempt ${i + 1} failed:`, error);
            if (i === attempts - 1) {
              console.error('All refresh attempts failed');
            }
          }
        }
      };
      
      // Start background refresh (don't await)
      refreshWithRetry();

      toast({
        title: "הקובץ הועלה בהצלחה! 🎉",
        description: `${document.name} נשמר במערכת ונשלח ל-Salesforce`,
      });

    } catch (error) {
      console.error('💥 Document upload error:', error);
      
      toast({
        title: "שגיאה בהעלאת הקובץ",
        description: error instanceof Error ? error.message : "אנא נסה שוב",
        variant: "destructive",
      });
    }
  };

  const handleFileInputChange = async (bankId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "סוג קובץ לא נתמך",
          description: "אנא העלה קבצי PDF, JPG או PNG בלבד",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB max for original file)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "הקובץ גדול מדי",
          description: "גודל הקובץ לא יכול לעלות על 5MB",
          variant: "destructive",
        });
        return;
      }

      // Show processing toast for images
      if (file.type.startsWith('image/')) {
        toast({
          title: "מעבד תמונה...",
          description: "דוחס וממיר את התמונה ל-PDF",
        });
      }

      // Process the file (compress and convert images to PDF)
      const processedFile = await processFileForUpload(file);
      
      console.log(`File processing complete: ${file.name} (${file.size} bytes) -> ${processedFile.name} (${processedFile.size} bytes)`);

      await handleFileUpload(bankId, processedFile);

    } catch (error) {
      console.error('💥 File processing error:', error);
      
      toast({
        title: "שגיאה בעיבוד הקובץ",
        description: error instanceof Error ? error.message : "אנא נסה שוב",
        variant: "destructive",
      });
    }
  };

  const unlockDocument = (bankId: string) => {
    // Note: In the new system, documents are managed by Salesforce
    // This would require a Salesforce call to unlock/update the document
    console.log(`🔓 Unlock requested for document: ${bankId}`);
    toast({
      title: "פונקציה זמינה בקרוב",
      description: "אפשרות העריכה תהיה זמינה בקרוב",
    });
  };

  const removeDocument = (bankId: string) => {
    // Note: In the new system, documents are managed by Salesforce
    // This would require a Salesforce call to remove the document
    console.log(`🗑️ Remove requested for document: ${bankId}`);
    toast({
      title: "פונקציה זמינה בקרוב", 
      description: "אפשרות המחיקה תהיה זמינה בקרוב",
    });
  };

  const getRequirementText = (doc: any) => {
    return doc.isRequired ? 'נדרש' : 'רשות';
  };

  const handleNext = () => {
    if (!canFinish) {
      const missingDocs = requiredDocuments.filter(doc => doc.status !== 'uploaded');
      toast({
        title: "חסרים מסמכים נדרשים",
        description: `אנא העלה: ${missingDocs.map(doc => doc.name).join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    navigate(`/finish/${recordId}`);
  };

  const handlePrevious = () => {
    // Don't allow going back - document is already signed
    return;
  };

  const handleDownloadPDF = async () => {
    try {
      // Get signature from localStorage (saved in SignaturePage)
      const signature = localStorage.getItem(`signature-${recordId}`);
      
      // Use the real clientData from Salesforce
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
          { title: 'סעיף 2 - התשלום', content: `שיעור העמלה: ${clientData.commissionRate}` }
        ],
        debtAmount: '10,000'
      };

      await createAndDownloadPDF(contractData, signature || '');
      
      toast({
        title: "PDF נוצר בהצלחה",
        description: "הקובץ הורד למחשב שלך",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "שגיאה ביצירת PDF",
        description: "אנא נסה שוב",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <PortalLayout
        currentStep={3}
        totalSteps={4}
        onNext={undefined}
        onPrevious={undefined}
      >
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">טוען נתוני מסמכים...</p>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout
      currentStep={3}
      totalSteps={4}
      onNext={handleNext}
      onPrevious={undefined}
      nextLabel="סיום העלאת מסמכים"
      previousLabel={undefined}
      isNextDisabled={!canFinish}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-4 rounded-full">
              <Upload className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">העלאת מסמכים</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            אנא העלה את המסמכים הנדרשים. הקבצים נשמרים בצורה מוצפנת ובטוחה.
          </p>
        </div>

        {/* Documents List */}
        <div className="space-y-4">
        {documents.map((doc) => {
            const DocumentIcon = getDocumentIcon(doc.name);
            const isUploaded = doc.status === 'uploaded' || tempUploaded.has(doc.bankId);
            return (
            <Card 
              key={doc.bankId} 
              className={`shadow-card hover:shadow-lg transition-all relative ${
                isUploaded ? 'ring-2 ring-success/20 bg-success/5' : ''
              }`}
            >
              {isUploaded && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="flex justify-center">
                      <Lock className="h-8 w-8 text-success" />
                    </div>
                    <h3 className="font-semibold text-lg">{doc.name}</h3>
                    <p className="text-sm text-muted-foreground">הקובץ הועלה בהצלחה</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => unlockDocument(doc.bankId)}
                      className="mt-2"
                    >
                      <Unlock className="h-4 w-4 mr-2" />
                      ערוך שוב
                    </Button>
                  </div>
                </div>
              )}
              
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 text-primary">
                    <DocumentIcon className="h-6 w-6" />
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{doc.name}</h3>
                        </div>
                        <p className="text-muted-foreground text-sm mt-1">מסמך נדרש לתהליך</p>
                        <div className="text-xs text-muted-foreground mt-2">
                          {getRequirementText(doc)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {isUploaded && (
                          <Badge variant="default" className="text-xs">הועלה</Badge>
                        )}
                      </div>
                    </div>

                    {!isUploaded && (
                      <div>
                        <input
                          type="file"
                          id={`file-${doc.bankId}`}
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileInputChange(doc.bankId, e)}
                        />
                        <Button 
                          onClick={() => document.getElementById(`file-${doc.bankId}`)?.click()}
                          className="w-full"
                          variant="outline"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          העלה {doc.name}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>

        {/* Upload Guidelines */}
        <Card className="border-primary/20 bg-primary/5 shadow-card">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-primary">הנחיות להעלאת קבצים</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• קבצים מותרים: PDF, JPG, PNG</li>
                <li>• גודל מקסימלי: 5MB לקובץ</li>
                <li>• תעודת זהות ורישיון נהיגה הם חלופיים (מספיק אחד מהם)</li>
                <li>• אישור ניהול חשבון בנק - נדרש</li>
                <li>• ספח תז - רשות</li>
                <li>• המידע יישמר בצורה מוצפנת ובטוחה</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* PDF Download */}
        <Card className="border-success/20 bg-success/5 shadow-card">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-success">הורדת הסכם PDF</h3>
              <p className="text-sm text-muted-foreground">
                לחץ כדי להוריד את ההסכם הסופי עם החתימה בפורמט PDF
              </p>
              <Button
                onClick={handleDownloadPDF}
                className="w-full sm:w-auto"
                variant="default"
              >
                <Download className="h-4 w-4 mr-2" />
                הורד הסכם PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};
