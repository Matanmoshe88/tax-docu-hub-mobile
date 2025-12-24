import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SalesforceTokenResponse {
  access_token: string;
  instance_url: string;
  id: string;
  token_type: string;
  issued_at: string;
  signature: string;
}

interface LeadData {
  Id: string;
  Name: string;
  id__c: string;
  MobilePhone: string;
  Commission__c: number;
  fulladress__c: string;
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
  DocType__c?: string;
  Status__c?: string;
}

interface PicklistValue {
  label: string;
  value: string;
}

interface CheckYearsMetadata {
  values: PicklistValue[];
}

interface SalesforceDataResponse {
  success: boolean;
  data?: {
    leadData: LeadData;
    portalId: string;
    bankCatalog: DocumnetBankRecord[];
    docs: DocsRecord[];
    checkYears: string[];
    accessToken: string;
    instanceUrl: string;
  };
  error?: string;
}

async function getSalesforceToken(): Promise<SalesforceTokenResponse> {
  console.log('🔄 Getting Salesforce access token...');
  
  const username = Deno.env.get('SALESFORCE_USERNAME');
  const password = Deno.env.get('SALESFORCE_PASSWORD');
  const clientId = Deno.env.get('SALESFORCE_CLIENT_ID');
  const clientSecret = Deno.env.get('SALESFORCE_CLIENT_SECRET');

  if (!username || !password || !clientId || !clientSecret) {
    throw new Error('Missing required Salesforce environment variables');
  }

  const tokenResponse = await fetch('https://login.salesforce.com/services/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: clientId,
      client_secret: clientSecret,
      username: username,
      password: password,
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`Failed to get Salesforce token: ${tokenResponse.status} - ${errorText}`);
  }

  const tokenData = await tokenResponse.json();
  console.log('✅ Salesforce token obtained successfully');
  return tokenData;
}

async function getLeadData(token: SalesforceTokenResponse, leadId: string): Promise<LeadData> {
  console.log(`📋 Fetching lead data for: ${leadId}`);
  
  const leadResponse = await fetch(
    `${token.instance_url}/services/data/v60.0/sobjects/Lead/${leadId}`,
    {
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!leadResponse.ok) {
    const errorText = await leadResponse.text();
    throw new Error(`Failed to fetch lead data: ${leadResponse.status} - ${errorText}`);
  }

  const leadData = await leadResponse.json();
  console.log('✅ Lead data fetched successfully');
  return leadData;
}

async function getDocumentPortalId(token: SalesforceTokenResponse, leadId: string): Promise<string> {
  console.log(`🔍 Finding DocumentPortal for lead: ${leadId}`);
  
  const query = `SELECT Id FROM DocumentPortal__c WHERE Lead__c='${leadId}' ORDER BY CreatedDate DESC LIMIT 1`;
  const encodedQuery = encodeURIComponent(query);
  
  const portalResponse = await fetch(
    `${token.instance_url}/services/data/v60.0/query/?q=${encodedQuery}`,
    {
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!portalResponse.ok) {
    const errorText = await portalResponse.text();
    throw new Error(`Failed to fetch DocumentPortal: ${portalResponse.status} - ${errorText}`);
  }

  const portalData = await portalResponse.json();
  
  if (!portalData.records || portalData.records.length === 0) {
    throw new Error('No DocumentPortal found for this lead');
  }

  const portalId = portalData.records[0].Id;
  console.log(`✅ DocumentPortal found: ${portalId}`);
  return portalId;
}

async function getCheckYearsMetadata(token: SalesforceTokenResponse): Promise<string[]> {
  console.log('📅 Fetching CheckYears metadata from Salesforce...');
  
  const metadataResponse = await fetch(
    `${token.instance_url}/services/data/v58.0/ui-api/object-info/Lead/picklist-values/012J9000000kE8yIAE/CheckYears__c`,
    {
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!metadataResponse.ok) {
    const errorText = await metadataResponse.text();
    throw new Error(`Failed to fetch CheckYears metadata: ${metadataResponse.status} - ${errorText}`);
  }

  const metadataData: CheckYearsMetadata = await metadataResponse.json();
  const years = metadataData.values.map(value => value.value);
  console.log(`✅ Found ${years.length} years in CheckYears picklist:`, years);
  return years;
}

async function getDocumnetBankCatalog(token: SalesforceTokenResponse): Promise<DocumnetBankRecord[]> {
  console.log('📚 Fetching DocumnetBank catalog...');
  
  const query = `SELECT Id,Catagory__c,Document_Type__c,Name,Is_Required__c,Display_Order__c FROM DocumnetBank__c WHERE IsActive__c = TRUE AND Service__c IN ('TaxReturn') ORDER BY Display_Order__c`;
  const encodedQuery = encodeURIComponent(query);
  
  const bankResponse = await fetch(
    `${token.instance_url}/services/data/v60.0/query/?q=${encodedQuery}`,
    {
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!bankResponse.ok) {
    const errorText = await bankResponse.text();
    throw new Error(`Failed to fetch DocumnetBank catalog: ${bankResponse.status} - ${errorText}`);
  }

  const bankData = await bankResponse.json();
  console.log(`✅ Found ${bankData.records?.length || 0} DocumnetBank records`);
  return bankData.records || [];
}

async function getExistingDocs(token: SalesforceTokenResponse, portalId: string): Promise<DocsRecord[]> {
  console.log(`📄 Fetching existing Docs for portal: ${portalId}`);
  
  const query = `SELECT Id,DocumnetsType__c,DocumnetsType__r.Name,DocumnetsType__r.Catagory__c,DocumnetsType__r.Display_Order__c,URL__c,PrimaryOrSpouse__c,Collection_Date__c,Document_Key__c,DocType__c,Status__c FROM Docs__c WHERE DocumnetPortal__c='${portalId}' AND PrimaryOrSpouse__c='Primary' ORDER BY DocumnetsType__r.Display_Order__c ASC,LastModifiedDate DESC`;
  const encodedQuery = encodeURIComponent(query);
  
  const docsResponse = await fetch(
    `${token.instance_url}/services/data/v60.0/query/?q=${encodedQuery}`,
    {
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!docsResponse.ok) {
    const errorText = await docsResponse.text();
    throw new Error(`Failed to fetch existing Docs: ${docsResponse.status} - ${errorText}`);
  }

  const docsData = await docsResponse.json();
  console.log(`✅ Found ${docsData.records?.length || 0} existing Docs records`);
  return docsData.records || [];
}

serve(async (req) => {
  console.log('🚀 Salesforce data function called');
  console.log(`📝 Request method: ${req.method}`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('🔄 Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    // Get leadId from request body
    const body = await req.json().catch(() => ({}));
    const leadId = body.leadId;
    
    if (!leadId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Lead ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    console.log(`🔄 Processing lead ID from body: ${leadId}`);

    // Get Salesforce access token
    const token = await getSalesforceToken();

    // Fetch lead data
    const leadData = await getLeadData(token, leadId);

    // Get DocumentPortal ID
    const portalId = await getDocumentPortalId(token, leadId);

    // Get DocumnetBank catalog
    const bankCatalog = await getDocumnetBankCatalog(token);

    // Get existing Docs
    const docs = await getExistingDocs(token, portalId);

    // Get CheckYears metadata
    const checkYears = await getCheckYearsMetadata(token);

    const response: SalesforceDataResponse = {
      success: true,
      data: {
        leadData,
        portalId,
        bankCatalog,
        docs,
        checkYears,
        accessToken: token.access_token,
        instanceUrl: token.instance_url,
      }
    };

    console.log('🎉 Salesforce data fetch completed successfully');

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('💥 Salesforce data fetch error:', error);
    
    const response: SalesforceDataResponse = {
      success: false,
      error: error.message,
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});