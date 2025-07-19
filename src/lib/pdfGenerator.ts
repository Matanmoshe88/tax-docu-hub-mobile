import html2pdf from 'html2pdf.js';

export async function generateContractPDF(contractData: any, signatureDataURL: string) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          line-height: 1.5;
          color: #000;
          background: white;
        }
        .contract-header { 
          text-align: center; 
          margin-bottom: 30px; 
          border-bottom: 2px solid #000;
          padding-bottom: 20px;
        }
        .contract-title { 
          font-size: 24px; 
          font-weight: bold; 
          margin-bottom: 10px; 
        }
        .contract-subtitle { 
          font-size: 18px; 
          color: #333; 
        }
        .contract-details { 
          margin-bottom: 25px; 
        }
        .detail-row { 
          margin-bottom: 8px; 
          font-size: 14px;
        }
        .section { 
          margin-bottom: 20px; 
        }
        .section-title { 
          font-size: 16px; 
          font-weight: bold; 
          margin-bottom: 8px; 
          color: #000;
        }
        .section-content { 
          margin-left: 15px; 
          font-size: 12px;
        }
        .parties { 
          margin-bottom: 25px; 
        }
        .party { 
          margin-bottom: 15px; 
        }
        .party-title { 
          font-weight: bold; 
          margin-bottom: 5px; 
        }
        .signature-section { 
          margin-top: 40px; 
          page-break-inside: avoid; 
        }
        .signature-img { 
          max-width: 200px; 
          height: auto; 
          margin-top: 10px; 
        }
      </style>
    </head>
    <body>
      <div class="contract-header">
        <div class="contract-title">Tax Return Service Agreement</div>
        <div class="contract-subtitle">הסכם שירות הגשת דוחות מס</div>
      </div>
      
      <div class="contract-details">
        <div class="detail-row">
          <strong>Contract Number:</strong> ${contractData.contractNumber || 'N/A'}
        </div>
        <div class="detail-row">
          <strong>Date:</strong> ${new Date().toLocaleDateString()}
        </div>
      </div>
      
      <div class="parties">
        <div class="party">
          <div class="party-title">Between:</div>
          <div>${contractData.company?.name || 'Company Name'}</div>
          <div>ID: ${contractData.company?.id || 'N/A'}</div>
          <div>${contractData.company?.address || 'Address'}</div>
        </div>
        
        <div class="party">
          <div class="party-title">And:</div>
          <div>${contractData.client?.name || 'Client Name'}</div>
          <div>ID: ${contractData.client?.id || 'N/A'}</div>
        </div>
      </div>
      
      <div class="sections">
        ${contractData.sections?.map((section: any) => `
          <div class="section">
            <div class="section-title">${section.title || 'Section Title'}</div>
            <div class="section-content">${section.content || 'Section content'}</div>
          </div>
        `).join('') || '<div class="section"><div class="section-title">Contract Terms</div><div class="section-content">Contract terms will be displayed here.</div></div>'}
      </div>
      
      ${signatureDataURL ? `
        <div class="signature-section">
          <div><strong>Signature:</strong></div>
          <img src="${signatureDataURL}" class="signature-img" alt="Signature">
        </div>
      ` : ''}
    </body>
    </html>
  `;
  
  // Create a temporary container
  const container = document.createElement('div');
  container.innerHTML = htmlContent;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = '210mm';
  container.style.background = 'white';
  document.body.appendChild(container);
  
  // Wait for fonts and rendering
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const options = {
    margin: [10, 10, 10, 10],
    filename: `contract_${contractData.contractNumber || 'unknown'}_${Date.now()}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2, 
      useCORS: true, 
      letterRendering: true,
      backgroundColor: '#ffffff',
      logging: true
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait' 
    }
  };
  
  try {
    const pdfBlob = await html2pdf().set(options).from(container).outputPdf('blob');
    document.body.removeChild(container);
    return pdfBlob;
  } catch (error) {
    console.error('PDF generation failed:', error);
    document.body.removeChild(container);
    throw error;
  }
}

export const createAndDownloadPDF = generateContractPDF;

export async function generateContractPDFBlob(contractData: any, signatureDataURL: string): Promise<Blob> {
  console.log('Generating PDF with data:', contractData);
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 30px;
          line-height: 1.6;
          color: #000;
          background: white;
        }
        .contract-header { 
          text-align: center; 
          margin-bottom: 30px; 
          border-bottom: 2px solid #000;
          padding-bottom: 20px;
        }
        .contract-title { 
          font-size: 24px; 
          font-weight: bold; 
          margin-bottom: 10px; 
        }
        .contract-subtitle { 
          font-size: 18px; 
          color: #333; 
        }
        .contract-details { 
          margin-bottom: 25px; 
        }
        .detail-row { 
          margin-bottom: 8px; 
          font-size: 14px;
        }
        .section { 
          margin-bottom: 20px; 
        }
        .section-title { 
          font-size: 16px; 
          font-weight: bold; 
          margin-bottom: 8px; 
          color: #000;
        }
        .section-content { 
          margin-left: 15px; 
          font-size: 14px;
        }
        .parties { 
          margin-bottom: 25px; 
        }
        .party { 
          margin-bottom: 15px; 
        }
        .party-title { 
          font-weight: bold; 
          margin-bottom: 5px; 
        }
        .signature-section { 
          margin-top: 40px; 
          page-break-inside: avoid; 
        }
        .signature-img { 
          max-width: 200px; 
          height: auto; 
          margin-top: 10px; 
        }
      </style>
    </head>
    <body>
      <div class="contract-header">
        <div class="contract-title">Tax Return Service Agreement</div>
        <div class="contract-subtitle">Contract Agreement</div>
      </div>
      
      <div class="contract-details">
        <div class="detail-row">
          <strong>Contract Number:</strong> ${contractData?.contractNumber || 'N/A'}
        </div>
        <div class="detail-row">
          <strong>Date:</strong> ${new Date().toLocaleDateString()}
        </div>
      </div>
      
      <div class="parties">
        <div class="party">
          <div class="party-title">Between:</div>
          <div>${contractData?.company?.name || 'Company Name'}</div>
          <div>ID: ${contractData?.company?.id || 'N/A'}</div>
          <div>${contractData?.company?.address || 'Address'}</div>
        </div>
        
        <div class="party">
          <div class="party-title">And:</div>
          <div>${contractData?.client?.name || 'Client Name'}</div>
          <div>ID: ${contractData?.client?.id || 'N/A'}</div>
        </div>
      </div>
      
      <div class="sections">
        ${contractData?.sections?.map((section: any) => `
          <div class="section">
            <div class="section-title">${section?.title || 'Section Title'}</div>
            <div class="section-content">${section?.content || 'Section content'}</div>
          </div>
        `).join('') || `
          <div class="section">
            <div class="section-title">Terms and Conditions</div>
            <div class="section-content">
              1. Service Description: Tax return preparation and filing services<br>
              2. Payment Terms: Payment due upon completion of services<br>
              3. Responsibilities: Client agrees to provide accurate financial information<br>
              4. Confidentiality: All client information will be kept confidential<br>
              5. Liability: Service provider liability limited to service fees paid
            </div>
          </div>
        `}
      </div>
      
      ${signatureDataURL ? `
        <div class="signature-section">
          <div><strong>Client Signature:</strong></div>
          <img src="${signatureDataURL}" class="signature-img" alt="Signature">
          <div style="margin-top: 10px;">Date: ${new Date().toLocaleDateString()}</div>
        </div>
      ` : ''}
    </body>
    </html>
  `;
  
  const container = document.createElement('div');
  container.innerHTML = htmlContent;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = '210mm';
  container.style.background = 'white';
  document.body.appendChild(container);
  
  // Wait for DOM to render
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const options = {
    margin: [10, 10, 10, 10],
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2, 
      useCORS: true, 
      letterRendering: true,
      backgroundColor: '#ffffff'
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait' 
    }
  };
  
  try {
    const pdfBlob = await html2pdf().set(options).from(container).outputPdf('blob');
    document.body.removeChild(container);
    console.log('PDF generated successfully');
    return pdfBlob;
  } catch (error) {
    console.error('PDF generation failed:', error);
    document.body.removeChild(container);
    throw error;
  }
}