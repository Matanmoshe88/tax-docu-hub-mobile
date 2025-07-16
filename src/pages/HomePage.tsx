import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  FileText, 
  PenTool, 
  Upload, 
  CheckCircle,
  Phone,
  Mail,
  MapPin,
  ArrowLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [leadId, setLeadId] = useState('');

  const handleStartProcess = () => {
    if (!leadId.trim()) {
      toast({
        title: "נדרש מספר לקוח",
        description: "אנא הזן את מספר הלקוח שלך",
        variant: "destructive",
      });
      return;
    }

    navigate(`/contract/${leadId.trim()}`);
  };

  const processSteps = [
    {
      icon: FileText,
      title: "קריאת החוזה",
      description: "קרא את תנאי ההסכם והבן את זכויותיך"
    },
    {
      icon: PenTool,
      title: "חתימה דיגיטלית",
      description: "חתום על ההסכם באופן דיגיטלי ובטוח"
    },
    {
      icon: Upload,
      title: "העלאת מסמכים",
      description: "העלה את המסמכים הנדרשים למערכת"
    },
    {
      icon: CheckCircle,
      title: "סיום התהליך",
      description: "קבל אישור והמתן לבדיקת הזכאות"
    }
  ];

  const companyInfo = {
    name: "קוויק טקס",
    legalName: "ג'י.אי.אמ גלובל ניהול והשקעות בע\"מ",
    registration: "ח.פ. 513218453",
    address: "ת.ד. 11067, פתח-תקווה מיקוד 4934829",
    phone: "03-1234567",
    email: "office@quicktaxs.com"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 font-hebrew">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-primary mb-2">
              {companyInfo.name}
            </h1>
            <p className="text-lg text-muted-foreground">
              פורטל לקוחות - החזרי מס דיגיטלי
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Welcome Card */}
          <Card className="shadow-card animate-fade-in">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">ברוכים הבאים לפורטל הלקוחות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-center text-muted-foreground">
                התחל את תהליך החזר המס הדיגיטלי שלך בצורה פשוטה, מהירה ובטוחה
              </p>
              
              <div className="max-w-md mx-auto space-y-4">
                <div>
                  <Label htmlFor="leadId">מספר לקוח</Label>
                  <Input
                    id="leadId"
                    type="text"
                    placeholder="הזן את מספר הלקוח שלך"
                    value={leadId}
                    onChange={(e) => setLeadId(e.target.value)}
                    className="text-center"
                    dir="ltr"
                  />
                </div>
                
                <Button 
                  onClick={handleStartProcess}
                  className="w-full flex items-center gap-2"
                  size="lg"
                >
                  התחל תהליך
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Process Steps */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-center">שלבי התהליך</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {processSteps.map((step, index) => (
                  <div key={index} className="text-center space-y-3">
                    <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                      <step.icon className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                    <div className="text-2xl font-bold text-primary">{index + 1}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* About Section */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>אודות השירות</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  אנחנו מתמחים בהחזרי מס לשכירים ומספקים שירות מקצועי ואמין.
                  הצוות שלנו כולל רואי חשבון ויועצי מס מנוסים.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span>בדיקת זכאות ללא עלות מראש</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span>עמלה רק במקרה של החזר בפועל</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span>ליווי מקצועי לאורך כל התהליך</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>פרטי יצירת קשר</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-primary" />
                    <span className="text-sm">{companyInfo.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="text-sm">{companyInfo.email}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-primary mt-1" />
                    <span className="text-sm">{companyInfo.address}</span>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-border">
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>{companyInfo.legalName}</div>
                    <div>{companyInfo.registration}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Notice */}
          <Card className="border-primary/20 bg-primary/5 shadow-card">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-primary">אבטחת מידע</h3>
                <p className="text-sm text-muted-foreground">
                  כל המידע והמסמכים נשמרים בצורה מוצפנת ובטוחה בהתאם לתקני האבטחה הגבוהים ביותר.
                  אנו מקפידים על הגנת הפרטיות שלך ועל שמירת סודיות המידע.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};