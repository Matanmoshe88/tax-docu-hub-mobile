import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  CreditCard, 
  IdCard, 
  Camera, 
  Upload, 
  CheckCircle, 
  Clock, 
  Shield,
  Users
} from 'lucide-react';

interface Document {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  required: boolean;
  uploaded: boolean;
  category: 'identity' | 'financial' | 'business';
}

const documents: Document[] = [
  {
    id: 'id-front',
    title: 'צילום תז קדימה',
    description: 'תעודת זהות - צד קדמי',
    icon: IdCard,
    required: true,
    uploaded: false,
    category: 'identity'
  },
  {
    id: 'id-appendix',
    title: 'ספח תז',
    description: 'ספח לתעודת זהות',
    icon: FileText,
    required: true,
    uploaded: false,
    category: 'identity'
  },
  {
    id: 'bank-account-confirmation',
    title: 'אישור ניהול חשבון',
    description: 'אישור מהבנק על ניהול חשבון',
    icon: CreditCard,
    required: true,
    uploaded: false,
    category: 'financial'
  },
  {
    id: 'drivers-license',
    title: 'צילום רישיון נהיגה',
    description: 'רישיון נהיגה תקף',
    icon: Camera,
    required: true,
    uploaded: false,
    category: 'identity'
  }
];

export function DocumentPortal() {
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  
  const uploadedCount = documents.filter(doc => doc.uploaded).length;
  const requiredCount = documents.filter(doc => doc.required).length;
  const requiredUploadedCount = documents.filter(doc => doc.required && doc.uploaded).length;
  const progressPercentage = (requiredUploadedCount / requiredCount) * 100;

  const handleUpload = (docId: string) => {
    setUploadingId(docId);
    // Simulate upload process
    setTimeout(() => {
      setUploadingId(null);
      // In real app, update document status
    }, 2000);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'identity': return <IdCard className="h-4 w-4" />;
      case 'financial': return <CreditCard className="h-4 w-4" />;
      case 'business': return <Users className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'identity': return 'bg-primary/10 text-primary';
      case 'financial': return 'bg-secondary/10 text-secondary';
      case 'business': return 'bg-warning/10 text-warning';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <div className="bg-card shadow-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Document Portal
              </h1>
              <p className="text-muted-foreground">
                Upload your tax documents securely to get started
              </p>
            </div>
            
            {/* Progress Overview */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-foreground">Upload Progress</h3>
                    <p className="text-sm text-muted-foreground">
                      {requiredUploadedCount} of {requiredCount} required documents uploaded
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {Math.round(progressPercentage)}%
                    </div>
                    <p className="text-xs text-muted-foreground">Complete</p>
                  </div>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Document List */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-4 md:gap-6">
          {documents.map((doc) => {
            const IconComponent = doc.icon;
            const isUploading = uploadingId === doc.id;
            
            return (
              <Card 
                key={doc.id} 
                className={`transition-all duration-300 hover:shadow-card ${
                  doc.uploaded ? 'ring-2 ring-success/20 bg-success/5' : ''
                } ${isUploading ? 'animate-pulse-glow' : ''}`}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`
                      flex-shrink-0 p-3 rounded-lg
                      ${doc.uploaded 
                        ? 'bg-success/10 text-success' 
                        : 'bg-primary/10 text-primary'
                      }
                    `}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">
                              {doc.title}
                            </h3>
                            {doc.required && (
                              <Badge variant="outline" className="text-xs">
                                Required
                              </Badge>
                            )}
                            <div className={`
                              inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs
                              ${getCategoryColor(doc.category)}
                            `}>
                              {getCategoryIcon(doc.category)}
                              <span className="capitalize">{doc.category}</span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {doc.description}
                          </p>
                        </div>
                        
                        {/* Status & Action */}
                        <div className="flex-shrink-0 text-right">
                          {doc.uploaded ? (
                            <div className="flex items-center gap-2 text-success mb-2">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm font-medium">Uploaded</span>
                            </div>
                          ) : isUploading ? (
                            <div className="flex items-center gap-2 text-primary mb-2">
                              <Clock className="h-4 w-4 animate-spin" />
                              <span className="text-sm font-medium">Uploading...</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                              <Upload className="h-4 w-4" />
                              <span className="text-sm font-medium">Pending</span>
                            </div>
                          )}
                          
                          <Button
                            variant={doc.uploaded ? "outline" : "upload"}
                            size="sm"
                            onClick={() => handleUpload(doc.id)}
                            disabled={isUploading}
                            className="w-full sm:w-auto"
                          >
                            <Upload className="h-4 w-4" />
                            {doc.uploaded ? 'Replace' : 'Upload'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {/* Submit Section */}
        <Card className="mt-8">
          <CardContent className="p-6 text-center">
            <h3 className="font-semibold text-foreground mb-2">
              Ready to Submit?
            </h3>
            <p className="text-muted-foreground mb-4">
              Upload all required documents to proceed with your tax return
            </p>
            <Button 
              variant="gradient"
              size="lg"
              disabled={requiredUploadedCount < requiredCount}
              className="w-full sm:w-auto"
            >
              Submit Documents
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}