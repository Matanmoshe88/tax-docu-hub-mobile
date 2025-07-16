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
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
    navigate(`/signature/${leadId}`);
  };

  return (
    <PortalLayout
      currentStep={3}
      totalSteps={4}
      onNext={handleNext}
      onPrevious={handlePrevious}
      nextLabel="סיום העלאת מסמכים"
      previousLabel="חזור לחתימה"
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
              className={`shadow-card hover:shadow-lg transition-all ${
                doc.uploaded ? 'ring-2 ring-success/20 bg-success/5' : ''
              }`}
            >
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
                          {doc.uploaded && (
                            <Lock className="h-4 w-4 text-success" />
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm mt-1">{doc.description}</p>
                        <div className="text-xs text-muted-foreground mt-2">
                          {getRequirementText(doc)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {doc.uploaded ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="success" className="text-xs">הועלה</Badge>
                            {doc.locked ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => unlockDocument(doc.id)}
                              >
                                <Unlock className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeDocument(doc.id)}
                              >
                                <Upload className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {!doc.uploaded && (
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
                          העלה קובץ
                        </Button>
                      </div>
                    )}

                    {doc.uploaded && doc.file && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        <span>{doc.file.name}</span>
                        <span>({(doc.file.size / 1024 / 1024).toFixed(1)} MB)</span>
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
      </div>
    </PortalLayout>
  );
};