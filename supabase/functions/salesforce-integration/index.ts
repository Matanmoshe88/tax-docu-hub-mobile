import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SalesforceTokenResponse {
  access_token: string;
  instance_url: string;
  token_type: string;
}

interface DocumentUploadRequest {
  leadId: string;
  signatureUrl: string;
  documnetBankId: string;
  documentName?: string;
}

async function getSalesforceToken(): Promise<SalesforceTokenResponse> {
  console.log('🔄 Getting Salesforce access token...');
  
  const tokenUrl = 'https://login.salesforce.com/services/oauth2/token';
  const params = new URLSearchParams({
    grant_type: 'password',
    username: Deno.env.get('SALESFORCE_USERNAME') || '',
    password: Deno.env.get('SALESFORCE_PASSWORD') || '',
    client_id: Deno.env.get('SALESFORCE_CLIENT_ID') || '',
    client_secret: Deno.env.get('SALESFORCE_CLIENT_SECRET') || '',
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Salesforce token request failed:', response.status, errorText);
    throw new Error(`Failed to get Salesforce token: ${response.status} - ${errorText}`);
  }

  const tokenData = await response.json() as SalesforceTokenResponse;
  console.log('✅ Salesforce token obtained successfully');
  return tokenData;
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

async function upsertDocumentToSalesforce(
  token: SalesforceTokenResponse,
  leadId: string,
  signatureUrl: string,
  portalId: string,
  documnetBankId: string,
  documentName: string = "Document"
): Promise<any> {
  console.log(`🔄 Upserting document for lead: ${leadId}, bank: ${documnetBankId}`);
  
  // Build external key: {DocumnetBank__c Id}_{DocumentPortal__c Id}_Primary
  const documentKey = `${documnetBankId}_${portalId}_Primary`;
  console.log(`🔑 Using Document_Key__c: ${documentKey}`);
  
  const upsertUrl = `${token.instance_url}/services/data/v58.0/sobjects/Docs__c/Document_Key__c/${documentKey}`;
  
  const documentData = {
    DocumnetsType__c: documnetBankId,
    DocumnetPortal__c: portalId,
    PrimaryOrSpouse__c: "Primary",
    URL__c: signatureUrl,
    Collection_Date__c: new Date().toISOString()
  };

  console.log('📄 Document upsert data:', JSON.stringify(documentData, null, 2));

  const response = await fetch(upsertUrl, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(documentData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Salesforce document upsert failed:', response.status, errorText);
    throw new Error(`Failed to upsert document: ${response.status} - ${errorText}`);
  }

  const result = response.status === 204 ? { success: true, updated: true } : await response.json();
  console.log('✅ Document upserted successfully in Salesforce:', result);
  return result;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('🔄 Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Salesforce integration function called');
    console.log('📝 Request method:', req.method);
    console.log('📝 Request headers:', Object.fromEntries(req.headers.entries()));

    if (req.method !== 'POST') {
      throw new Error('Only POST method is allowed');
    }

    const body = await req.json() as DocumentUploadRequest;
    console.log('📝 Request body:', JSON.stringify(body, null, 2));

    const { leadId, signatureUrl, documnetBankId, documentName } = body;

    if (!leadId || !signatureUrl || !documnetBankId) {
      throw new Error('Missing required fields: leadId, signatureUrl, and documnetBankId');
    }

    // Validate environment variables
    const requiredEnvVars = ['SALESFORCE_USERNAME', 'SALESFORCE_PASSWORD', 'SALESFORCE_CLIENT_ID', 'SALESFORCE_CLIENT_SECRET'];
    for (const envVar of requiredEnvVars) {
      if (!Deno.env.get(envVar)) {
        throw new Error(`Missing environment variable: ${envVar}`);
      }
    }

    console.log('🔄 Starting Salesforce integration process...');

    // Step 1: Get Salesforce access token
    const token = await getSalesforceToken();

    // Step 2: Get DocumentPortal ID
    const portalId = await getDocumentPortalId(token, leadId);

    // Step 3: Upsert document to Salesforce
    const upsertResult = await upsertDocumentToSalesforce(
      token, 
      leadId, 
      signatureUrl, 
      portalId, 
      documnetBankId, 
      documentName
    );

    const response = {
      success: true,
      message: 'Document upserted successfully to Salesforce',
      salesforceResult: upsertResult,
      leadId,
      signatureUrl,
      documnetBankId,
    };

    console.log('🎉 Salesforce integration completed successfully:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('💥 Salesforce integration error:', error);
    
    const errorResponse = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});