import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PortalLayout } from '@/components/PortalLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, LogIn, LogOut, User } from 'lucide-react';
import { useSalesforceData } from '@/hooks/useSalesforceData';
import { useAuth } from '@/hooks/useAuth';
import { generateContractText } from '@/lib/contractUtils';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { clientData, isLoading, recordId } = useSalesforceData();
  const { user, signOut } = useAuth();

  const handleNext = () => {
    navigate(`/signature/${recordId || 'demo'}`);
  };

  const handleAuthAction = () => {
    if (user) {
      signOut();
    } else {
      navigate('/auth');
    }
  };

  const contractText = generateContractText(clientData);

  if (isLoading) {
    return (
      <PortalLayout
        currentStep={1}
        totalSteps={4}
        nextLabel="טוען..."
        onNext={() => {}}
      >
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">טוען נתוני לקוח...</p>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout
      currentStep={1}
      totalSteps={4}
      onNext={handleNext}
      nextLabel="אני מסכים להמשך"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Auth Section */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {user ? `מחובר כ: ${user.email}` : 'לא מחובר'}
          </div>
          <Button
            variant={user ? "outline" : "default"}
            size="sm"
            onClick={handleAuthAction}
            className="gap-2"
          >
            {user ? (
              <>
                <LogOut className="h-4 w-4" />
                התנתקות
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                התחברות
              </>
            )}
          </Button>
        </div>

        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-4 rounded-full">
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">הסכם שירות</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            אנא קרא את הסכם השירות בעיון לפני המעבר לשלב הבא. החוזה מפרט את התנאים והזכויות שלך.
          </p>
        </div>

        {/* Contract Content - Full Width */}
        <div className="w-screen -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-12">
          <div className="px-4 sm:px-6 lg:px-8 xl:px-12 py-6 bg-background">
            <div className="text-xs sm:text-sm leading-6 sm:leading-7 whitespace-pre-wrap font-hebrew text-right max-w-none">
              {contractText}
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <Card className="border-warning shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="bg-warning/10 p-2 rounded-full mt-1">
                <FileText className="h-4 w-4 text-warning" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-warning">שים לב</h3>
                <p className="text-sm text-muted-foreground">
                  על ידי לחיצה על "אני מסכים להמשך" אתה מאשר שקראת והבנת את תנאי ההסכם ומסכים לכל התנאים המפורטים בו.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};