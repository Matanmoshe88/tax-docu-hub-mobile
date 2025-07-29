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

interface DocumentsSingle {
  Id: string;
  DocumentType__c: string;
  Status__c: string;
  doc_url__c: string;
  CreatedDate: string;
}

interface SalesforceDataResponse {
  success: boolean;
  data?: {
    leadData: LeadData;
    documentHubId: string;
    documents: DocumentsSingle[];
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
  
  // Query specific fields including CheckYears__c
  const fields = [
    'Id', 'Name', 'FirstName', 'LastName', 'Email', 'MobilePhone', 
    'PersonMobilePhone', 'Phone', 'id__c', 'Commission__c', 'fulladress__c',
    'CheckYears__c', 'firstname__c', 'SecName__c'
  ].join(',');
  
  const leadResponse = await fetch(
    `${token.instance_url}/services/data/v60.0/sobjects/Lead/${leadId}?fields=${fields}`,
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

async function getDocumentHubId(token: SalesforceTokenResponse, leadId: string): Promise<string> {
  console.log(`🔍 Finding document hub for lead: ${leadId}`);
  
  const query = `SELECT Id FROM Documents__c WHERE Lead__c='${leadId}' ORDER BY CreatedDate DESC LIMIT 1`;
  const encodedQuery = encodeURIComponent(query);
  
  const hubResponse = await fetch(
    `${token.instance_url}/services/data/v60.0/query/?q=${encodedQuery}`,
    {
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!hubResponse.ok) {
    const errorText = await hubResponse.text();
    throw new Error(`Failed to fetch document hub: ${hubResponse.status} - ${errorText}`);
  }

  const hubData = await hubResponse.json();
  
  if (!hubData.records || hubData.records.length === 0) {
    throw new Error('No document hub found for this lead');
  }

  const hubId = hubData.records[0].Id;
  console.log(`✅ Document hub found: ${hubId}`);
  return hubId;
}

async function getDocumentStatus(token: SalesforceTokenResponse, hubId: string): Promise<DocumentsSingle[]> {
  console.log(`📄 Fetching document status for hub: ${hubId}`);
  
  const documentTypes = [
    'הסכם התקשרות',
    'צילום תז קדימה', 
    'ספח תז',
    'אישור ניהול חשבון',
    'צילום רישיון נהיגה'
  ];
  
  const typesList = documentTypes.map(type => `'${type}'`).join(',');
  const query = `SELECT Id,DocumentType__c,Status__c,doc_url__c,CreatedDate FROM DocumentsSingles__c WHERE DocumentManager__c='${hubId}' AND DocumentType__c IN (${typesList})`;
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
    throw new Error(`Failed to fetch documents: ${docsResponse.status} - ${errorText}`);
  }

  const docsData = await docsResponse.json();
  console.log(`✅ Found ${docsData.records?.length || 0} document records`);
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

    // Get document hub ID
    const documentHubId = await getDocumentHubId(token, leadId);

    // Get document status
    const documents = await getDocumentStatus(token, documentHubId);

    const response: SalesforceDataResponse = {
      success: true,
      data: {
        leadData,
        documentHubId,
        documents,
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