import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PortalLayout } from '@/components/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, User, Calendar } from 'lucide-react';

interface ClientData {
  firstName: string;
  lastName: string;
  idNumber: string;
  phone: string;
  email: string;
  address: string;
  commissionRate: string;
}

export const ContractPage: React.FC = () => {
  const navigate = useNavigate();
  const { leadId } = useParams();
  const [clientData, setClientData] = useState<ClientData>({
    firstName: "יוסי",
    lastName: "כהן", 
    idNumber: "123456789",
    phone: "050-1234567",
    email: "yossi.cohen@email.com",
    address: "רחוב הרצל 1, תל אביב",
    commissionRate: "25%"
  });

  useEffect(() => {
    // TODO: Fetch client data from Salesforce based on leadId
    console.log('Loading client data for lead:', leadId);
  }, [leadId]);

  const handleNext = () => {
    navigate(`/signature/${leadId}`);
  };

  const handlePrevious = () => {
    navigate('/');
  };

  const contractText = `בין : קוויק טקס (שם רשום: "ג'י.אי.אמ גלובל")   ח"פ: 513218453      (להלן: "קוויקטקס" ו/או "החברה")
לבין:    ${clientData.firstName} ${clientData.lastName}                                                   ת"ז: ${clientData.idNumber}                                    (להלן: "הלקוח")
שנחתם בתאריך : ${new Date().toLocaleDateString('he-IL')}

הואיל והלקוח מאשר בזאת כי הינו מבקש לבדוק את זכאותו להחזרי מס באמצעות ג'י.אי.אמ גלובל ניהול והשקעות בע"מ ח.פ. 513218453 להלן: ("קוויקטקס" ו/או "החברה") שכתובתה ת.ד. 11067, פתח-תקווה מיקוד 4934829 מול כלל הרשויות לרבות מס הכנסה וביטוח לאומי לצורך ייצוגו וטיפולו בקבלת ההחזר ממס הכנסה (להלן: "החזר המס") לשנים 2023-2018 (להלן: "תקופת המס") ולבצע עבורו את הפעולות הנדרשות על מנת לקבל החזר מס במקרה של זכאות;

והואיל והחברה - המעסיקה רו"ח ויועצי מס ועוסקת במתן שירותים אל מול רשויות המס לשם ביצוע החזרי מס לשכירים והגשת דוחות כספיים- מסכימה ליטול על עצמה את ייצוגו של הלקוח בהליך החזר המס;

לפיכך, הוצהר, הוסכם והותנה בין הצדדים כדלקמן:

1. החברה מספקת שירות לטיפול בהחזרי מס לשכירים מרשויות המס השונות, תוך ליווי הלקוח והגשת בקשות להחזר מיסים בשמו. תנאי סף לבדיקת הזכאות הוא שהלקוח היה שכיר ושילם מס הכנסה בשש השנים האחרונות, והלקוח מצהיר כי עומד בתנאי הסף כאמור לעיל.

2. השירות הניתן הוא לטיפול בהחזר מס בלבד ואינו כולל כל עניין ו/או טיפול אחרים מלבד כמפורט במפורש לעיל ולהלן.

3. הלקוח מאשר בזאת לחברה לטפל עבורו בהחזרי המס לשנים 2026-2017 ולשם כך לבצע עבור הלקוח את הפעולות הנדרשות על מנת לקבל החזרי מס ולטפל בכל הנוגע בדבר.

[... המשך תנאי החוזה ...]

18. תנאי תשלום: הלקוח מתחייב לשלם לחברה עמלה בגובה של ${clientData.commissionRate} מסכום ההחזר בתוספת מע"מ (להלן: "עמלה") וזאת רק לאחר קבלת הכסף לחשבון הבנק של הלקוח.

[... המשך תנאי החוזה עד סוף המסמך...]`;

  return (
    <PortalLayout
      currentStep={1}
      totalSteps={4}
      onNext={handleNext}
      onPrevious={handlePrevious}
      nextLabel="אני מסכים להמשך"
      previousLabel="חזור לעמוד הבית"
    >
      <div className="space-y-6 animate-fade-in">
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


        {/* Contract Content */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>תוכן ההסכם</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-right leading-relaxed">
              <pre className="text-sm leading-7 whitespace-pre-wrap font-hebrew text-right bg-muted/20 p-6 rounded-lg border">
                {contractText}
              </pre>
            </div>
          </CardContent>
        </Card>

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