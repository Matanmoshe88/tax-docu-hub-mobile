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
  documentType?: string;
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

async function uploadDocumentToSalesforce(
  token: SalesforceTokenResponse,
  leadId: string,
  signatureUrl: string,
  hubId: string,
  documentType: string = "חתימה",
  documentName: string = "חתימה"
): Promise<any> {
  console.log(`🔄 Uploading document to Salesforce for lead: ${leadId}`);
  
  const salesforceUrl = `${token.instance_url}/services/data/v60.0/sobjects/DocumentsSingles__c/`;
  
  const documentData = {
    Name: documentName,
    Lead__c: leadId,
    DocumentType__c: documentType,
    doc_url__c: signatureUrl,
    DocumentManager__c: hubId,
    Status__c: "completed"
  };

  console.log('📄 Document data:', JSON.stringify(documentData, null, 2));

  const response = await fetch(salesforceUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(documentData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Salesforce document upload failed:', response.status, errorText);
    throw new Error(`Failed to upload document: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('✅ Document uploaded successfully to Salesforce:', result);
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

    const { leadId, signatureUrl, documentType, documentName } = body;

    if (!leadId || !signatureUrl) {
      throw new Error('Missing required fields: leadId and signatureUrl');
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

    // Step 2: Get document hub ID
    const hubId = await getDocumentHubId(token, leadId);

    // Step 3: Upload document to Salesforce
    const uploadResult = await uploadDocumentToSalesforce(
      token, 
      leadId, 
      signatureUrl, 
      hubId, 
      documentType, 
      documentName
    );

    const response = {
      success: true,
      message: 'Document uploaded successfully to Salesforce',
      salesforceId: uploadResult.id,
      leadId,
      signatureUrl,
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