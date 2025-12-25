import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from '@/hooks/use-toast';
import { Loader2, ArrowRight } from 'lucide-react';
import quicktaxLogo from '@/assets/quicktax-logo-new.png';

export default function AuthPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const { user, signInWithGoogle, sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Web OTP API for auto-fill
  useEffect(() => {
    if (step !== 'otp') return;
    
    const abortController = new AbortController();
    
    const getOTP = async () => {
      if ('OTPCredential' in window) {
        try {
          const content = await navigator.credentials.get({
            // @ts-ignore - OTP is not in the types yet
            otp: { transport: ['sms'] },
            signal: abortController.signal,
          });
          // @ts-ignore
          if (content?.code) {
            // @ts-ignore
            setOtp(content.code);
          }
        } catch (err) {
          // User cancelled or API not supported - silently ignore
          console.log('WebOTP not available or cancelled');
        }
      }
    };
    
    getOTP();
    
    return () => {
      abortController.abort();
    };
  }, [step]);

  const formatPhoneDisplay = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d-]/g, '');
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 10) {
      setPhone(formatPhoneDisplay(digits));
    }
  };

  const validatePhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return digits.length === 10 && digits.startsWith('05');
  };

  const handleSendOtp = async () => {
    if (!validatePhone(phone)) {
      toast({
        title: 'מספר לא תקין',
        description: 'אנא הזן מספר טלפון ישראלי תקין (05X-XXXXXXX)',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const { error } = await sendOtp(phone.replace(/\D/g, ''));
    setIsLoading(false);

    if (error) {
      toast({
        title: 'שגיאה',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setStep('otp');
    setCountdown(60);
    toast({
      title: 'קוד נשלח',
      description: 'קוד אימות נשלח למספר הטלפון שלך',
    });
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast({
        title: 'קוד לא תקין',
        description: 'אנא הזן קוד בן 6 ספרות',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const { error } = await verifyOtp(phone.replace(/\D/g, ''), otp);
    setIsLoading(false);

    if (error) {
      toast({
        title: 'שגיאה',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'התחברת בהצלחה',
      description: 'ברוך הבא ל-QuickTax!',
    });
    navigate('/');
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const { error } = await signInWithGoogle();
    
    if (error) {
      setIsLoading(false);
      toast({
        title: 'שגיאה',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    
    setIsLoading(true);
    const { error } = await sendOtp(phone.replace(/\D/g, ''));
    setIsLoading(false);

    if (error) {
      toast({
        title: 'שגיאה',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setCountdown(60);
    setOtp('');
    toast({
      title: 'קוד נשלח',
      description: 'קוד חדש נשלח למספר הטלפון שלך',
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <img 
            src={quicktaxLogo} 
            alt="QuickTax Logo" 
            className="h-24 object-contain"
          />
        </div>

        {step === 'phone' ? (
          <div className="space-y-6">
            {/* Google Sign In */}
            <Button
              variant="outline"
              className="w-full h-12 text-base font-medium gap-3"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              התחבר עם Google
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-background px-4 text-muted-foreground">או</span>
              </div>
            </div>

            {/* Phone Input */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">מספר טלפון</label>
              <div className="relative">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  🇮🇱 +972
                </span>
                <Input
                  type="tel"
                  placeholder="050-1234567"
                  value={phone}
                  onChange={handlePhoneChange}
                  className="pr-20 h-12 text-base"
                  dir="ltr"
                />
              </div>
            </div>

            <Button
              className="w-full h-12 text-base font-medium"
              onClick={handleSendOtp}
              disabled={isLoading || !validatePhone(phone)}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'שלח קוד אימות'
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* OTP Header */}
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-foreground">הזן את הקוד שנשלח</h2>
              <p className="text-muted-foreground">
                שלחנו קוד בן 6 ספרות ל-{phone}
              </p>
            </div>

            {/* OTP Input */}
            <div className="flex justify-center" dir="ltr">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={setOtp}
                autoComplete="one-time-code"
              >
                <InputOTPGroup className="gap-2">
                  <InputOTPSlot index={0} className="h-12 w-12 text-xl" />
                  <InputOTPSlot index={1} className="h-12 w-12 text-xl" />
                  <InputOTPSlot index={2} className="h-12 w-12 text-xl" />
                  <InputOTPSlot index={3} className="h-12 w-12 text-xl" />
                  <InputOTPSlot index={4} className="h-12 w-12 text-xl" />
                  <InputOTPSlot index={5} className="h-12 w-12 text-xl" />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              className="w-full h-12 text-base font-medium"
              onClick={handleVerifyOtp}
              disabled={isLoading || otp.length !== 6}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'אימות'
              )}
            </Button>

            {/* Resend & Back */}
            <div className="flex flex-col items-center gap-3 text-sm">
              <button
                onClick={handleResendOtp}
                disabled={countdown > 0}
                className={`${
                  countdown > 0 
                    ? 'text-muted-foreground cursor-not-allowed' 
                    : 'text-primary hover:underline'
                }`}
              >
                {countdown > 0 
                  ? `שלח שוב (${countdown}s)` 
                  : 'לא קיבלת? שלח שוב'}
              </button>
              
              <button
                onClick={() => {
                  setStep('phone');
                  setOtp('');
                }}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <ArrowRight className="h-4 w-4" />
                חזור לשינוי מספר
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
