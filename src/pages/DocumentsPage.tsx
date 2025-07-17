import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateContractPDF } from '@/lib/pdfGenerator';

interface Document {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  required: boolean;
  uploaded: boolean;
  locked: boolean;
  file?: File;
  alternative?: string;
}

export const DocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { leadId } = useParams();
  const { toast } = useToast();
  
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: 'id-card',
      title: 'תעודת זהות',
      description: 'צילום ברור של תעודת הזהות',
      icon: CreditCard,
      required: true,
      uploaded: false,
      locked: false,
      alternative: 'driver-license'
    },
    {
      id: 'driver-license',
      title: 'רישיון נהיגה',
      description: 'צילום רישיון נהיגה תקף',
      icon: Car,
      required: true,
      uploaded: false,
      locked: false,
      alternative: 'id-card'
    },
    {
      id: 'id-supplement',
      title: 'ספח תז',
      description: 'ספח תעודת הזהות (אם יש)',
      icon: FileText,
      required: false,
      uploaded: false,
      locked: false
    },
    {
      id: 'bank-statement',
      title: 'אישור ניהול חשבון בנק',
      description: 'אישור מהבנק על ניהול חשבון עדכני',
      icon: FileText,
      required: true,
      uploaded: false,
      locked: false
    }
  ]);

  const hasIdentityDocument = documents.some(doc => 
    (doc.id === 'id-card' || doc.id === 'driver-license') && doc.uploaded
  );
  
  const hasBankStatement = documents.some(doc => 
    doc.id === 'bank-statement' && doc.uploaded
  );
  
  const canFinish = hasIdentityDocument && hasBankStatement;

  const handleFileUpload = async (docId: string, file: File) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === docId 
        ? { ...doc, file, uploaded: true, locked: true }
        : doc
    ));

    toast({
      title: "הקובץ הועלה בהצלחה",
      description: `${documents.find(d => d.id === docId)?.title} נשמר במערכת`,
    });
  };

  const handleFileInputChange = (docId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "הקובץ גדול מדי",
          description: "גודל הקובץ לא יכול לעלות על 5MB",
          variant: "destructive",
        });
        return;
      }

      handleFileUpload(docId, file);
    }
  };

  const unlockDocument = (docId: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === docId 
        ? { ...doc, locked: false }
        : doc
    ));
  };

  const removeDocument = (docId: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === docId 
        ? { ...doc, uploaded: false, file: undefined, locked: false }
        : doc
    ));
  };

  const getRequirementText = (doc: Document) => {
    if (doc.required) {
      if (doc.alternative) {
        const altDoc = documents.find(d => d.id === doc.alternative);
        if (altDoc?.uploaded) {
          return 'רשות'; // Alternative uploaded, this becomes optional
        }
      }
      return 'נדרש';
    }
    return 'רשות';
  };

  const handleNext = () => {
    if (!canFinish) {
      toast({
        title: "חסרים מסמכים נדרשים",
        description: "אנא העלה תעודת זהות או רישיון נהיגה + אישור ניהול חשבון",
        variant: "destructive",
      });
      return;
    }

    navigate(`/finish/${leadId}`);
  };

  const handlePrevious = () => {
    // Don't allow going back - document is already signed
    return;
  };

  const handleDownloadPDF = async () => {
    try {
      // Get signature from localStorage (saved in SignaturePage)
      const signature = localStorage.getItem(`signature-${leadId}`);
      
      // Sample contract data - in real app this would come from state/props
      const contractData = {
        leadId: leadId || '12345',
        signature: signature || undefined,
        loanAmount: 50000,
        interestRate: 5.2,
        repaymentPeriod: 36,
        borrowerName: 'יוחנן כהן',
        borrowerAddress: 'רחוב הרצל 123, תל אביב',
        borrowerId: '123456789',
        lenderName: 'חברת ההלוואות בע"מ',
        lenderAddress: 'רחוב רוטשילד 456, תל אביב',
        lenderId: '987654321',
      };

      await generateContractPDF(contractData);
      
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
          {documents.map((doc) => (
            <Card 
              key={doc.id} 
              className={`shadow-card hover:shadow-lg transition-all relative ${
                doc.uploaded && doc.locked ? 'ring-2 ring-success/20 bg-success/5' : ''
              }`}
            >
              {doc.uploaded && doc.locked && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="flex justify-center">
                      <Lock className="h-8 w-8 text-success" />
                    </div>
                    <h3 className="font-semibold text-lg">{doc.title}</h3>
                    <p className="text-sm text-muted-foreground">הקובץ הועלה בהצלחה</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => unlockDocument(doc.id)}
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
                    <doc.icon className="h-6 w-6" />
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{doc.title}</h3>
                        </div>
                        <p className="text-muted-foreground text-sm mt-1">{doc.description}</p>
                        <div className="text-xs text-muted-foreground mt-2">
                          {getRequirementText(doc)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {doc.uploaded && !doc.locked && (
                          <Badge variant="success" className="text-xs">הועלה</Badge>
                        )}
                      </div>
                    </div>

                    {(!doc.uploaded || !doc.locked) && (
                      <div>
                        <input
                          type="file"
                          id={`file-${doc.id}`}
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileInputChange(doc.id, e)}
                        />
                        <Button
                          variant="outline"
                          className="w-full sm:w-auto"
                          onClick={() => document.getElementById(`file-${doc.id}`)?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {doc.uploaded ? 'החלף קובץ' : 'העלה קובץ'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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