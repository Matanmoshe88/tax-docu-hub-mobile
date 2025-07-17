
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

    if (!salesforceSession || !leadData || !documentsStatus) {
      return true; // Missing data, need to fetch
    }

    try {
      const sessionData: SalesforceSession = JSON.parse(salesforceSession);
      if (!sessionData.timestamp || isSessionExpired(sessionData.timestamp)) {
        return true; // Session expired, need to refresh
      }
    } catch (error) {
      console.error('Error parsing session data:', error);
      return true; // Invalid session data, need to fetch
    }

    return false; // Data exists and is fresh
  };

  const fetchSalesforceData = async () => {
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

      // Update client data with real Salesforce data
      const nameParts = leadData.Name ? leadData.Name.split(' ') : ['', ''];
      const updatedClientData = {
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        idNumber: leadData.id__c || '',
        phone: leadData.MobilePhone || '',
        email: 'client@email.com', // Email not provided in mapping
        address: leadData.fulladress__c || '',
        commissionRate: leadData.Commission__c ? `${leadData.Commission__c}%` : '25%'
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
