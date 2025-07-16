import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PortalLayout } from '@/components/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  CreditCard, 
  Car, 
  Check, 
  X, 
  Eye,
  AlertCircle 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Document {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  required: boolean;
  uploaded: boolean;
  category: 'identity' | 'financial' | 'business';
  file?: File;
  uploadProgress?: number;
}

export const DocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { leadId } = useParams();
  const { toast } = useToast();
  
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: 'id-card',
      title: 'תעודת זהות',
      description: 'צילום ברור של תעודת הזהות (שני צדדים)',
      icon: CreditCard,
      required: true,
      uploaded: false,
      category: 'identity'
    },
    {
      id: 'driver-license',
      title: 'רישיון נהיגה',
      description: 'צילום רישיון נהיגה תקף',
      icon: Car,
      required: true,
      uploaded: false,
      category: 'identity'
    },
    {
      id: 'bank-statement',
      title: 'אישור ניהול חשבון',
      description: 'אישור מהבנק על ניהול חשבון עדכני',
      icon: FileText,
      required: true,
      uploaded: false,
      category: 'financial'
    },
    {
      id: 'tax-documents',
      title: 'מסמכי מס',
      description: 'דוחות מס קודמים (אם יש)',
      icon: FileText,
      required: false,
      uploaded: false,
      category: 'financial'
    }
  ]);

  const totalDocuments = documents.length;
  const uploadedDocuments = documents.filter(doc => doc.uploaded).length;
  const requiredDocuments = documents.filter(doc => doc.required);
  const uploadedRequiredDocuments = requiredDocuments.filter(doc => doc.uploaded).length;
  const allRequiredUploaded = uploadedRequiredDocuments === requiredDocuments.length;

  const handleFileUpload = async (docId: string, file: File) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === docId 
        ? { ...doc, file, uploadProgress: 0 }
        : doc
    ));

    // Simulate upload progress
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setDocuments(prev => prev.map(doc => 
        doc.id === docId 
          ? { ...doc, uploadProgress: progress }
          : doc
      ));
    }

    // Mark as uploaded
    setDocuments(prev => prev.map(doc => 
      doc.id === docId 
        ? { ...doc, uploaded: true, uploadProgress: undefined }
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

  const removeDocument = (docId: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === docId 
        ? { ...doc, uploaded: false, file: undefined, uploadProgress: undefined }
        : doc
    ));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'identity': return <CreditCard className="h-4 w-4" />;
      case 'financial': return <FileText className="h-4 w-4" />;
      case 'business': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'identity': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'financial': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'business': return 'bg-purple-500/10 text-purple-700 border-purple-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const handleNext = () => {
    if (!allRequiredUploaded) {
      toast({
        title: "חסרים מסמכים נדרשים",
        description: "אנא העלה את כל המסמכים הנדרשים לפני המעבר לשלב הבא",
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
      isNextDisabled={!allRequiredUploaded}
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

        {/* Progress Overview */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>התקדמות העלאת מסמכים</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>הועלו {uploadedDocuments} מתוך {totalDocuments} מסמכים</span>
              <span className="text-muted-foreground">
                {Math.round((uploadedDocuments / totalDocuments) * 100)}%
              </span>
            </div>
            <Progress value={(uploadedDocuments / totalDocuments) * 100} className="h-3" />
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-success rounded-full"></div>
                <span>נדרשים: {uploadedRequiredDocuments}/{requiredDocuments.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-muted rounded-full"></div>
                <span>אופציונליים</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        <div className="space-y-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="shadow-card hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${getCategoryColor(doc.category)}`}>
                    <doc.icon className="h-6 w-6" />
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{doc.title}</h3>
                          {doc.required ? (
                            <Badge variant="destructive" className="text-xs">נדרש</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">אופציונלי</Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm mt-1">{doc.description}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {doc.uploaded ? (
                          <>
                            <div className="flex items-center gap-1 text-success text-sm">
                              <Check className="h-4 w-4" />
                              <span>הועלה</span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeDocument(doc.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <div className="text-muted-foreground text-sm flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            <span>לא הועלה</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {doc.uploadProgress !== undefined ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>מעלה קובץ...</span>
                          <span>{doc.uploadProgress}%</span>
                        </div>
                        <Progress value={doc.uploadProgress} className="h-2" />
                      </div>
                    ) : !doc.uploaded ? (
                      <div>
                        <input
                          type="file"
                          id={`file-${doc.id}`}
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileInputChange(doc.id, e)}
                        />
                        <Button
                          variant="upload"
                          className="w-full sm:w-auto"
                          onClick={() => document.getElementById(`file-${doc.id}`)?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          העלה קובץ
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        <span>{doc.file?.name}</span>
                        <span>({(doc.file?.size || 0 / 1024 / 1024).toFixed(1)} MB)</span>
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
                <li>• ודא שהמסמכים ברורים וקריאים</li>
                <li>• המידע יישמר בצורה מוצפנת ובטוחה</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};