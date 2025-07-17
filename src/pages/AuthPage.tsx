import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn, signUp, user } = useAuth();
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
      if (!email || !password) {
        toast({
          title: "שגיאה",
          description: "אנא מלא את כל השדות",
          variant: "destructive",
        });
        return;
      }

      if (password.length < 6) {
        toast({
          title: "שגיאה",
          description: "הסיסמה חייבת להכיל לפחות 6 תווים",
          variant: "destructive",
        });
        return;
      }

      const { error } = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password);

      if (error) {
        console.error('Auth error:', error);
        
        let errorMessage = "אירעה שגיאה";
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = "פרטי התחברות שגויים";
        } else if (error.message.includes('User already registered')) {
          errorMessage = "משתמש כבר רשום במערכת";
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = "אנא אמת את כתובת המייל שלך";
        }

        toast({
          title: isSignUp ? "שגיאה בהרשמה" : "שגיאה בהתחברות",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        if (isSignUp) {
          toast({
            title: "הרשמה הושלמה",
            description: "נשלח מייל לאימות. אנא בדוק את תיבת הדואר שלך",
          });
        } else {
          toast({
            title: "התחברת בהצלחה",
            description: "ברוך הבא למערכת",
          });
          navigate('/');
        }
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            {isSignUp ? 'הרשמה למערכת' : 'התחברות למערכת'}
          </CardTitle>
          <CardDescription>
            {isSignUp 
              ? 'צור חשבון חדש כדי להתחיל' 
              : 'הכנס את פרטי ההתחברות שלך'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">כתובת מייל</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={isLoading}
                dir="ltr"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  dir="ltr"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {isSignUp && (
                <p className="text-sm text-muted-foreground">
                  הסיסמה חייבת להכיל לפחות 6 תווים
                </p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
              ) : isSignUp ? (
                <UserPlus className="h-4 w-4 mr-2" />
              ) : (
                <LogIn className="h-4 w-4 mr-2" />
              )}
              {isLoading ? 'טוען...' : isSignUp ? 'הרשמה' : 'התחברות'}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <Button
              type="button"
              variant="link"
              onClick={() => setIsSignUp(!isSignUp)}
              disabled={isLoading}
              className="text-sm"
            >
              {isSignUp 
                ? 'כבר יש לך חשבון? התחבר כאן' 
                : 'אין לך חשבון? הרשם כאן'
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}