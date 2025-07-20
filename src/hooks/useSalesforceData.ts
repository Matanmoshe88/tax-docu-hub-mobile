
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ClientData {
  firstName: string;
  lastName: string;
  idNumber: string;
  phone: string;
  email: string;
  address: string;
  commissionRate: string;
}

interface SalesforceSession {
  accessToken: string;
  instanceUrl: string;
  documentHubId: string;
  timestamp: number;
}

export const useSalesforceData = () => {
  const { recordId } = useParams();
  const [clientData, setClientData] = useState<ClientData>({
    firstName: "יוסי",
    lastName: "כהן", 
    idNumber: "123456789",
    phone: "050-1234567",
    email: "yossi.cohen@email.com",
    address: "רחוב הרצל 1, תל אביב",
    commissionRate: "25%"
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDataFresh, setIsDataFresh] = useState(false);

  const isSessionExpired = (timestamp: number): boolean => {
    const thirtyMinutesInMs = 30 * 60 * 1000;
    return Date.now() - timestamp > thirtyMinutesInMs;
  };

  const shouldFetchData = (): boolean => {
    // Skip if no recordId or in demo mode
    if (!recordId || recordId === 'demo') {
      return false;
    }

    // Check if session data exists and is not expired
    const salesforceSession = sessionStorage.getItem('salesforceSession');
    const leadData = sessionStorage.getItem('leadData');
    const documentsStatus = sessionStorage.getItem('documentsStatus');
    const storedRecordId = sessionStorage.getItem('currentRecordId');

    // If record ID has changed, fetch fresh data
    if (storedRecordId !== recordId) {
      console.log(`🔄 Record ID changed from ${storedRecordId} to ${recordId}, fetching fresh data`);
      return true;
    }

    if (!salesforceSession || !leadData || !documentsStatus) {
      console.log('🔄 Missing session data, fetching fresh data');
      return true; // Missing data, need to fetch
    }

    try {
      const sessionData: SalesforceSession = JSON.parse(salesforceSession);
      if (!sessionData.timestamp || isSessionExpired(sessionData.timestamp)) {
        console.log('🔄 Session expired, fetching fresh data');
        return true; // Session expired, need to refresh
      }
    } catch (error) {
      console.error('Error parsing session data:', error);
      return true; // Invalid session data, need to fetch
    }

    console.log('✅ Using cached session data');
    return false; // Data exists and is fresh
  };

  const fetchSalesforceData = async () => {
    // Force fresh data fetch for this record
    console.log('🔄 Forcing fresh data fetch - clearing session storage');
    sessionStorage.removeItem('salesforceSession');
    sessionStorage.removeItem('leadData');
    sessionStorage.removeItem('documentsStatus');
    sessionStorage.removeItem('clientData');
    sessionStorage.removeItem('currentRecordId');
    
    if (!shouldFetchData()) {
      setIsLoading(false);
      loadDataFromSession();
      return;
    }

    try {
      console.log('🔄 Fetching Salesforce data for record:', recordId);
      console.log('🔄 Expected recordId should be: 00QWn000002zxExMAI');
      
      const { data, error } = await supabase.functions.invoke('salesforce-data', {
        body: { leadId: recordId },
      });

      if (error) {
        console.error('❌ Supabase function error:', error);
        toast({
          title: "שגיאה",
          description: "לא ניתן לטעון את נתוני הלקוח",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (!data?.success) {
        console.error('❌ Salesforce data error:', data?.error);
        toast({
          title: "שגיאה",
          description: data?.error || "לא ניתן לטעון את נתוני הלקוח",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const { leadData, documentHubId, documents, accessToken, instanceUrl } = data.data;
      console.log('✅ Salesforce data loaded successfully');
      console.log('📊 API Response data:', { leadData, documentHubId, documents, accessToken: '***', instanceUrl });
      console.log('🔍 LeadData fields:', Object.keys(leadData || {}));
      console.log('📱 LeadData phone fields:', {
        MobilePhone: leadData.MobilePhone,
        PersonMobilePhone: leadData.PersonMobilePhone,
        Phone: leadData.Phone
      });
      console.log('💰 LeadData commission fields:', {
        Commission__c: leadData.Commission__c,
        commission_rate__c: leadData.commission_rate__c,
        CommissionRate: leadData.CommissionRate
      });

      // Update client data with real Salesforce data
      const updatedClientData = {
        firstName: leadData.FirstName || leadData.firstname__c || '',
        lastName: leadData.LastName || leadData.SecName__c || '',
        idNumber: leadData.PersonalNumber__c || leadData.IdNumber__c || leadData.TZ__c || '',
        phone: leadData.MobilePhone || leadData.PersonMobilePhone || leadData.Phone || '',
        email: leadData.Email || leadData.PersonEmail || '',
        address: leadData.Address || leadData.Street || leadData.PersonMailingStreet || '',
        commissionRate: leadData.Commission__c ? `${leadData.Commission__c}%` : '22%'
      };

      setClientData(updatedClientData);

      // Store Salesforce session data with timestamp
      const sessionData: SalesforceSession = {
        accessToken,
        instanceUrl,
        documentHubId,
        timestamp: Date.now()
      };

      sessionStorage.setItem('salesforceSession', JSON.stringify(sessionData));
      sessionStorage.setItem('leadData', JSON.stringify(leadData));
      sessionStorage.setItem('documentsStatus', JSON.stringify(documents));
      sessionStorage.setItem('clientData', JSON.stringify(updatedClientData));
      sessionStorage.setItem('currentRecordId', recordId || ''); // Store current record ID

      setIsDataFresh(true);

    } catch (error) {
      console.error('💥 Error fetching Salesforce data:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את נתוני הלקוח",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadDataFromSession = () => {
    const storedClientData = sessionStorage.getItem('clientData');
    if (storedClientData) {
      try {
        const data = JSON.parse(storedClientData);
        setClientData(data);
        setIsDataFresh(true);
      } catch (error) {
        console.error('Error parsing stored client data:', error);
      }
    }
  };

  useEffect(() => {
    fetchSalesforceData();
  }, [recordId]);

  return {
    clientData,
    isLoading,
    isDataFresh,
    recordId,
    refetchData: fetchSalesforceData
  };
};
