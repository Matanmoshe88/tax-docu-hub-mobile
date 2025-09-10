
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
  checkYears?: string; // Multi-picklist field from Salesforce
}

interface DocumnetBankRecord {
  Id: string;
  Catagory__c: string;
  Document_Type__c: string;
  Name: string;
  Is_Required__c: boolean;
  Display_Order__c: number;
}

interface DocsRecord {
  Id: string;
  DocumnetsType__c: string;
  DocumnetsType__r?: {
    Name: string;
    Catagory__c: string;
    Display_Order__c: number;
  };
  URL__c: string;
  PrimaryOrSpouse__c: string;
  Collection_Date__c: string;
  Document_Key__c: string;
}

interface DocumentListItem {
  bankId: string;
  name: string;
  isRequired: boolean;
  displayOrder: number;
  category: string;
  uploadedUrl?: string;
  uploadedDate?: string;
  status: 'not_uploaded' | 'uploaded';
}

interface SalesforceSession {
  accessToken: string;
  instanceUrl: string;
  portalId: string;
  timestamp: number;
}

export const useSalesforceData = () => {
  const { recordId } = useParams();
  const [clientData, setClientData] = useState<ClientData>({
    firstName: "",
    lastName: "", 
    idNumber: "",
    phone: "",
    email: "",
    address: "",
    commissionRate: ""
  });
  const [identificationDocuments, setIdentificationDocuments] = useState<DocumentListItem[]>([]);
  const [registerDocuments, setRegisterDocuments] = useState<DocumentListItem[]>([]);
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
    const bankCatalog = sessionStorage.getItem('bankCatalog');
    const existingDocs = sessionStorage.getItem('existingDocs');
    const storedRecordId = sessionStorage.getItem('currentRecordId');

    // If record ID has changed, fetch fresh data
    if (storedRecordId !== recordId) {
      console.log(`🔄 Record ID changed from ${storedRecordId} to ${recordId}, fetching fresh data`);
      return true;
    }

    if (!salesforceSession || !leadData || !bankCatalog || !existingDocs) {
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
    sessionStorage.removeItem('bankCatalog');
    sessionStorage.removeItem('existingDocs');
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

      const { leadData, portalId, bankCatalog, docs, checkYears, accessToken, instanceUrl } = data.data;
      console.log('✅ Salesforce data loaded successfully');
      console.log('📊 API Response data:', { leadData, portalId, bankCatalog: bankCatalog?.length || 0, docs: docs?.length || 0, accessToken: '***', instanceUrl });
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
      console.log('🔍 Raw Salesforce leadData:', JSON.stringify(leadData, null, 2));
      console.log('📋 Name fields:', { FirstName: leadData.FirstName, LastName: leadData.LastName, Name: leadData.Name });
      console.log('🆔 ID fields:', { PersonalNumber__c: leadData.PersonalNumber__c, IdNumber__c: leadData.IdNumber__c, TZ__c: leadData.TZ__c });
      console.log('🏠 Address fields:', { Address: leadData.Address, Street: leadData.Street, PersonMailingStreet: leadData.PersonMailingStreet });
      
      const updatedClientData = {
        firstName: leadData.FirstName || leadData.firstname__c || '',
        lastName: leadData.LastName || leadData.SecName__c || '',
        idNumber: leadData.id__c || '',
        phone: leadData.MobilePhone || leadData.PersonMobilePhone || leadData.Phone || '',
        email: leadData.Email || '',
        address: leadData.fulladress__c || '',
        commissionRate: leadData.Commission__c ? `${leadData.Commission__c}%` : '22%',
        checkYears: leadData.CheckYears__c || ''
      };

      console.log('📊 Final updatedClientData being set:', updatedClientData);
      setClientData(updatedClientData);

      // Build document lists from bank catalog + existing docs
      const buildDocumentLists = (bankCatalog: DocumnetBankRecord[], docs: DocsRecord[]) => {
        const identificationDocs: DocumentListItem[] = [];
        const registerDocs: DocumentListItem[] = [];

        // Create lookup for existing docs by bank ID
        const docsLookup = new Map<string, DocsRecord>();
        docs.forEach(doc => {
          docsLookup.set(doc.DocumnetsType__c, doc);
        });

        // Process bank catalog
        bankCatalog.forEach(bankItem => {
          const existingDoc = docsLookup.get(bankItem.Id);
          const documentItem: DocumentListItem = {
            bankId: bankItem.Id,
            name: bankItem.Name,
            isRequired: bankItem.Is_Required__c,
            displayOrder: bankItem.Display_Order__c,
            category: bankItem.Catagory__c,
            uploadedUrl: existingDoc?.URL__c,
            uploadedDate: existingDoc?.Collection_Date__c,
            status: existingDoc ? 'uploaded' : 'not_uploaded'
          };

          if (bankItem.Catagory__c === 'Identification documents') {
            identificationDocs.push(documentItem);
          } else if (bankItem.Catagory__c === 'Register Documents') {
            registerDocs.push(documentItem);
          }
        });

        // Sort by display order
        identificationDocs.sort((a, b) => a.displayOrder - b.displayOrder);
        registerDocs.sort((a, b) => a.displayOrder - b.displayOrder);

        return { identificationDocs, registerDocs };
      };

      const { identificationDocs, registerDocs } = buildDocumentLists(bankCatalog || [], docs || []);
      setIdentificationDocuments(identificationDocs);
      setRegisterDocuments(registerDocs);

      // Store Salesforce session data with timestamp
      const sessionData: SalesforceSession = {
        accessToken,
        instanceUrl,
        portalId,
        timestamp: Date.now()
      };

      sessionStorage.setItem('salesforceSession', JSON.stringify(sessionData));
      sessionStorage.setItem('leadData', JSON.stringify(leadData));
      sessionStorage.setItem('bankCatalog', JSON.stringify(bankCatalog));
      sessionStorage.setItem('existingDocs', JSON.stringify(docs));
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
    const storedBankCatalog = sessionStorage.getItem('bankCatalog');
    const storedExistingDocs = sessionStorage.getItem('existingDocs');
    
    if (storedClientData && storedBankCatalog && storedExistingDocs) {
      try {
        const clientData = JSON.parse(storedClientData);
        const bankCatalog = JSON.parse(storedBankCatalog);
        const docs = JSON.parse(storedExistingDocs);
        
        setClientData(clientData);
        
        // Rebuild document lists from session data
        const buildDocumentLists = (bankCatalog: DocumnetBankRecord[], docs: DocsRecord[]) => {
          const identificationDocs: DocumentListItem[] = [];
          const registerDocs: DocumentListItem[] = [];

          const docsLookup = new Map<string, DocsRecord>();
          docs.forEach(doc => {
            docsLookup.set(doc.DocumnetsType__c, doc);
          });

          bankCatalog.forEach(bankItem => {
            const existingDoc = docsLookup.get(bankItem.Id);
            const documentItem: DocumentListItem = {
              bankId: bankItem.Id,
              name: bankItem.Name,
              isRequired: bankItem.Is_Required__c,
              displayOrder: bankItem.Display_Order__c,
              category: bankItem.Catagory__c,
              uploadedUrl: existingDoc?.URL__c,
              uploadedDate: existingDoc?.Collection_Date__c,
              status: existingDoc ? 'uploaded' : 'not_uploaded'
            };

            if (bankItem.Catagory__c === 'Identification documents') {
              identificationDocs.push(documentItem);
            } else if (bankItem.Catagory__c === 'Register Documents') {
              registerDocs.push(documentItem);
            }
          });

          identificationDocs.sort((a, b) => a.displayOrder - b.displayOrder);
          registerDocs.sort((a, b) => a.displayOrder - b.displayOrder);

          return { identificationDocs, registerDocs };
        };

        const { identificationDocs, registerDocs } = buildDocumentLists(bankCatalog, docs);
        setIdentificationDocuments(identificationDocs);
        setRegisterDocuments(registerDocs);
        
        setIsDataFresh(true);
      } catch (error) {
        console.error('Error parsing stored session data:', error);
      }
    }
  };

  useEffect(() => {
    fetchSalesforceData();
  }, [recordId]);

  return {
    clientData,
    identificationDocuments,
    registerDocuments,
    isLoading,
    isDataFresh,
    recordId,
    refetchData: fetchSalesforceData
  };
};
