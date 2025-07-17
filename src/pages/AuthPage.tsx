import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, CheckCircle, Upload, Shield, FileText } from 'lucide-react';

export default function AuthPage() {
  const [clientNumber, setClientNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!clientNumber) {
        toast({
          title: "שגיאה",
          description: "אנא הכנס מספר לקוח",
          variant: "destructive",
        });
        return;
      }

      // For demo purposes, use client number as both email and password
      const demoEmail = `${clientNumber}@demo.com`;
      const demoPassword = clientNumber;

      const { error } = await signIn(demoEmail, demoPassword);

      if (error) {
        console.error('Auth error:', error);
        toast({
          title: "שגיאה בהתחברות",
          description: "מספר לקוח שגוי או לא קיים במערכת",
          variant: "destructive",
        });
      } else {
        toast({
          title: "התחברת בהצלחה",
          description: "ברוך הבא לפורטל הלקוחות",
        });
        navigate('/');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה לא צפויה",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      {/* Header */}
      <div className="text-center mb-8 pt-8">
        <h1 className="text-4xl font-bold text-blue-600 mb-2">קוויק סקן</h1>
        <p className="text-gray-600">פורטל לקוחות - חתירי מס דיגיטלי</p>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Login Card */}
        <Card className="p-8">
          <CardContent className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                ברוכים הבאים לפורטל הלקוחות
              </h2>
              <p className="text-gray-600 mb-6">
                התחל את המילוי הזהיר הפכם הדיגיטלי שלך באורח פשוטה, מהירה ובטוחה
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clientNumber" className="text-right">מספר לקוח</Label>
                <Input
                  id="clientNumber"
                  type="text"
                  value={clientNumber}
                  onChange={(e) => setClientNumber(e.target.value)}
                  placeholder="הכן את מספר הלקוח שלך"
                  required
                  disabled={isLoading}
                  className="text-right"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
                disabled={isLoading}
              >
                <ArrowLeft className="h-5 w-5 ml-2" />
                {isLoading ? 'טוען...' : 'התחל מהיר'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Process Steps */}
        <div className="space-y-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-8">שלבי התהליך</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Step 4 */}
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="font-bold text-gray-800 mb-2">סיום התהליך</h4>
              <p className="text-sm text-gray-600 mb-2">
                קבל אישור והמלת לבדיקת תקינות
              </p>
              <div className="text-2xl font-bold text-blue-600">4</div>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Upload className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="font-bold text-gray-800 mb-2">העלאת מסמכים</h4>
              <p className="text-sm text-gray-600 mb-2">
                העלה את המסמכים הנדרשים למערכת
              </p>
              <div className="text-2xl font-bold text-blue-600">3</div>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="font-bold text-gray-800 mb-2">חתימה דיגיטלית</h4>
              <p className="text-sm text-gray-600 mb-2">
                חתום על המסמך באופן דיגיטלי בטוח
              </p>
              <div className="text-2xl font-bold text-blue-600">2</div>
            </div>

            {/* Step 1 */}
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="font-bold text-gray-800 mb-2">קריאת המסמך</h4>
              <p className="text-sm text-gray-600 mb-2">
                קרא את תמצית המסמך והבן את צרכיו
              </p>
              <div className="text-2xl font-bold text-blue-600">1</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="max-w-6xl mx-auto mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <CardContent>
            <h4 className="font-bold text-gray-800 mb-4 text-center">פרטי יצירת קשר</h4>
            <div className="space-y-2 text-sm text-gray-600 text-center">
              <p>טלפון: 03-1234567</p>
              <p>אימייל: info@quickscan.co.il</p>
              <p>כתובת: רחוב הטכנולוגיה 1, תל אביב</p>
            </div>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardContent>
            <h4 className="font-bold text-gray-800 mb-4 text-center">אודות השירות</h4>
            <div className="space-y-2 text-sm text-gray-600 text-center">
              <p>שעות פעילות: א'-ה' 08:00-18:00</p>
              <p>מוקד תמיכה: 24/7</p>
              <p>זמינות מערכת: 99.9%</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}