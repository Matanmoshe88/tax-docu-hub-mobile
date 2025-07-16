import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PortalLayout } from '@/components/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export const PromisoaryNotePage: React.FC = () => {
  const navigate = useNavigate();
  const { leadId } = useParams();

  const handleNext = () => {
    navigate(`/signature/${leadId}`);
  };

  const handlePrevious = () => {
    navigate(`/contract/${leadId}`);
  };

  const promisoryText = `שטר חוב
שנערך ונחתם ביום
אני הח"מ מתחייב/ת לשלם לפקודת ג'י.אי.אמ גלובל ניהול והשקעות בע"מ ח.פ. 513218453 

סך של ____________________₪ (במילים: _________________________________). 

סכום שטר זה יהיה צמוד למדד המחירים לצרכן עפ"י תנאי ההצמדה הבאים וישא ריבית כדלקמן:
"המדד" פירושו: מדד המחירים לצרכן (כולל פרות וירקות) המתפרסם ע"י הלשכה המרכזית לסטטיסטיקה, או כל מדד אחר שיפורסם במקומו.
שטר זה הינו סחיר.
"המדד הבסיסי" פירושו: המדד שהיה ידוע במועד החתימה על שטר זה.
"המדד החדש" פירושו: המדד שיפורסם לאחרונה לפני יום הפירעון בפועל של שטר זה.
הריבית" פירושה-ריבית בשיעור הריבית החריגה הנוהגת בחריגה מחח"ד בנק מזרחי-טפחות ואשר לא תפחת משיעור של 14.65% שנתית.
אם במועד הפירעון של שטר זה היה המדד החדש גבוה מהמדד הבסיסי, אשלם את סכום שטר זה כשהוא מוגדל באופן יחסי לשיעור העלייה של המדד החדש לעומת המדד הבסיסי ובצירוף הריבית מיום חתימת שטר זה עד ליום מלא התשלום בפועל. אולם אם המדד החדש יהיה שווה או נמוך מהמדד הבסיסי, אשלם שטר זה כסכומו הנקוב בצירוף הריבית מיום חתימת שטר זה עד ליום מלא התשלום בפועל. 
המחזיק בשטר יהיה רשאי למלא בשטר כל פרט החסר בו והוא יהיה פטור מכל החובות המוטלות על מחזיק בשטר, לרבות מהצגה לתשלום, פרוטסט, הודעת אי כיבוד והודעת חילול השטר.
*סכום שימולא בשטר במקרה הצורך לא יעלה על סך העמלה לה זכאית ג'י.אי.אמ גלובל ניהול והשקעות בע"מ מכוח הסכם זה בתוספת עלויות גבייה ודמי טיפול לפי העניין כאמור בהסכם וכן הוצאות משפטיות ושכ"ט עו"ד.
חתימת עושה השטר`;

  return (
    <PortalLayout
      currentStep={1.5}
      totalSteps={4}
      onNext={handleNext}
      onPrevious={handlePrevious}
      nextLabel="אני מסכים להמשך"
      previousLabel="חזור להסכם"
    >
      <div className="space-y-6 animate-fade-in">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-4 rounded-full">
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">שטר חוב</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            שטר חוב להבטחת ביצוע התחייבויות הלקוח
          </p>
        </div>

        <div className="w-full -mx-4 sm:-mx-6">
          <div className="px-2 sm:px-4">
            <div className="text-xs sm:text-sm leading-6 sm:leading-7 whitespace-pre-wrap font-hebrew text-right bg-background p-3 sm:p-6 w-full">
              {promisoryText}
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};