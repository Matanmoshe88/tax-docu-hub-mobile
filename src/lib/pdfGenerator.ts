import { jsPDF } from 'jspdf';
import { generateContractText } from './contractUtils';

// Add Hebrew font support to jsPDF
const addHebrewFont = (doc: jsPDF) => {
  // This uses the default font which has basic Hebrew support
  // For better support, you'd need to add a custom Hebrew font
  doc.setFont('helvetica');
};

// Helper to handle RTL text - simple approach
const reverseHebrewWords = (text: string): string => {
  // Split by spaces and reverse order for RTL effect
  const words = text.split(' ');
  const hebrewPattern = /[\u0590-\u05FF]/;
  
  // Only reverse if contains Hebrew
  if (hebrewPattern.test(text)) {
    return words.reverse().join(' ');
  }
  return text;
};

export async function generateContractPDF(contractData: any, signatureDataURL: string) {
  console.log('🎯 Starting PDF generation with jsPDF for Hebrew support');
  console.log('Contract data received:', contractData);
  
  // Extract client data - handle multiple possible structures
  const clientData = {
    firstName: contractData.firstName || 
               contractData.client?.firstName || 
               contractData.clientData?.firstName || '',
    lastName: contractData.lastName || 
              contractData.client?.lastName || 
              contractData.clientData?.lastName || '',
    idNumber: contractData.idNumber || 
              contractData.client?.idNumber || 
              contractData.clientData?.idNumber || '',
    phone: contractData.phone || 
           contractData.client?.phone || 
           contractData.clientData?.phone || '',
    email: contractData.email || 
           contractData.client?.email || 
           contractData.clientData?.email || '',
    address: contractData.address || 
             contractData.client?.address || 
             contractData.clientData?.address || '',
    commissionRate: contractData.commissionRate || 
                    contractData.client?.commissionRate || 
                    contractData.clientData?.commissionRate || '25%',
    contractNumber: contractData.contractNumber || ''
  };
  
  console.log('Extracted client data:', clientData);
  
  // Create new PDF
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Add Hebrew font support
  addHebrewFont(doc);
  
  // Get contract text
  const contractText = generateContractText(clientData);
  const lines = contractText.split('\n');
  const currentDate = new Date().toLocaleDateString('he-IL');
  
  // Page settings
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const rightMargin = pageWidth - margin;
  let yPosition = margin + 10;
  
  // Helper function to add RTL text
  const addRTLText = (
    text: string, 
    fontSize: number = 12, 
    isBold: boolean = false,
    align: 'right' | 'center' | 'left' = 'right',
    yOffset: number = 0
  ) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    
    // Calculate x position based on alignment
    let xPos = rightMargin;
    if (align === 'center') {
      xPos = pageWidth / 2;
    } else if (align === 'left') {
      xPos = margin;
    }
    
    // Check if we need a new page
    if (yPosition + yOffset > pageHeight - margin) {
      doc.addPage();
      yPosition = margin + 10;
    }
    
    yPosition += yOffset;
    
    // Split long lines
    const maxWidth = pageWidth - (2 * margin);
    const splitText = doc.splitTextToSize(text, maxWidth);
    
    // Add each line
    splitText.forEach((line: string, index: number) => {
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin + 10;
      }
      
      // For Hebrew text, we need to handle RTL
      const processedLine = reverseHebrewWords(line);
      doc.text(processedLine, xPos, yPosition, { align });
      yPosition += fontSize * 0.5;
    });
    
    return yPosition;
  };
  
  // Add title
  yPosition = addRTLText('הסכם שירות להחזרי מס', 20, true, 'center', 0);
  yPosition += 10;
  
  // Add date and contract number
  doc.setFontSize(12);
  const dateText = `תאריך: ${currentDate}`;
  const contractNumText = `מספר חוזה: ${clientData.contractNumber || '___________'}`;
  
  doc.text(reverseHebrewWords(dateText), rightMargin, yPosition, { align: 'right' });
  doc.text(reverseHebrewWords(contractNumText), margin, yPosition, { align: 'left' });
  yPosition += 15;
  
  // Process contract content
  let inPromissoryNote = false;
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Skip empty lines
    if (!trimmedLine) {
      yPosition += 5;
      return;
    }
    
    // Skip title line
    if (index === 0 && trimmedLine.includes('הסכם שירות להחזרי מס')) {
      return;
    }
    
    // Handle different line types
    if (trimmedLine === 'שטר חוב') {
      // Add new page for promissory note
      doc.addPage();
      yPosition = margin + 10;
      yPosition = addRTLText('שטר חוב', 18, true, 'center', 0);
      yPosition += 10;
      inPromissoryNote = true;
    } else if (/^\d+\./.test(trimmedLine)) {
      // Numbered sections
      yPosition = addRTLText(trimmedLine, 12, true, 'right', 8);
    } else if (trimmedLine.startsWith('בין:') || trimmedLine.startsWith('לבין:')) {
      // Party sections
      yPosition = addRTLText(trimmedLine, 14, true, 'right', 8);
    } else if (trimmedLine.includes('פרטי עושה השטר:')) {
      // Promissory note details
      yPosition = addRTLText(trimmedLine, 14, true, 'right', 15);
    } else {
      // Regular text
      yPosition = addRTLText(trimmedLine, 12, false, 'right', 5);
    }
  });
  
  // Add signature section
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = margin + 10;
  }
  
  yPosition += 20;
  
  // Signature title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('חתימת הלקוח:', rightMargin, yPosition, { align: 'right' });
  doc.text('תאריך:', margin + 80, yPosition, { align: 'right' });
  
  yPosition += 10;
  
  // Add signature or line
  if (signatureDataURL) {
    try {
      // Add signature image
      doc.addImage(signatureDataURL, 'PNG', rightMargin - 60, yPosition, 60, 30);
    } catch (error) {
      console.error('Error adding signature:', error);
      // Draw line as fallback
      doc.line(rightMargin - 60, yPosition + 20, rightMargin, yPosition + 20);
    }
  } else {
    // Draw signature line
    doc.line(rightMargin - 60, yPosition + 20, rightMargin, yPosition + 20);
  }
  
  // Add date
  doc.setFont('helvetica', 'normal');
  doc.text(currentDate, margin + 80, yPosition + 20, { align: 'right' });
  
  // Save the PDF
  const fileName = `contract_${clientData.idNumber || 'client'}_${Date.now()}.pdf`;
  doc.save(fileName);
  
  // Return as blob
  return doc.output('blob');
}

export async function createAndDownloadPDF(contractData: any, signatureDataURL: string) {
  return await generateContractPDF(contractData, signatureDataURL);
}

export async function generateContractPDFBlob(contractData: any, signatureDataURL: string): Promise<Blob> {
  console.log('🎯 Generating PDF blob');
  
  // Same implementation but without save()
  const clientData = {
    firstName: contractData.firstName || 
               contractData.client?.firstName || 
               contractData.clientData?.firstName || '',
    lastName: contractData.lastName || 
              contractData.client?.lastName || 
              contractData.clientData?.lastName || '',
    idNumber: contractData.idNumber || 
              contractData.client?.idNumber || 
              contractData.clientData?.idNumber || '',
    phone: contractData.phone || 
           contractData.client?.phone || 
           contractData.clientData?.phone || '',
    email: contractData.email || 
           contractData.client?.email || 
           contractData.clientData?.email || '',
    address: contractData.address || 
             contractData.client?.address || 
             contractData.clientData?.address || '',
    commissionRate: contractData.commissionRate || 
                    contractData.client?.commissionRate || 
                    contractData.clientData?.commissionRate || '25%',
    contractNumber: contractData.contractNumber || ''
  };
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  addHebrewFont(doc);
  
  const contractText = generateContractText(clientData);
  const lines = contractText.split('\n');
  const currentDate = new Date().toLocaleDateString('he-IL');
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const rightMargin = pageWidth - margin;
  let yPosition = margin + 10;
  
  const addRTLText = (
    text: string, 
    fontSize: number = 12, 
    isBold: boolean = false,
    align: 'right' | 'center' | 'left' = 'right',
    yOffset: number = 0
  ) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    
    let xPos = rightMargin;
    if (align === 'center') {
      xPos = pageWidth / 2;
    } else if (align === 'left') {
      xPos = margin;
    }
    
    if (yPosition + yOffset > pageHeight - margin) {
      doc.addPage();
      yPosition = margin + 10;
    }
    
    yPosition += yOffset;
    
    const maxWidth = pageWidth - (2 * margin);
    const splitText = doc.splitTextToSize(text, maxWidth);
    
    splitText.forEach((line: string, index: number) => {
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin + 10;
      }
      
      const processedLine = reverseHebrewWords(line);
      doc.text(processedLine, xPos, yPosition, { align });
      yPosition += fontSize * 0.5;
    });
    
    return yPosition;
  };
  
  yPosition = addRTLText('הסכם שירות להחזרי מס', 20, true, 'center', 0);
  yPosition += 10;
  
  doc.setFontSize(12);
  const dateText = `תאריך: ${currentDate}`;
  const contractNumText = `מספר חוזה: ${clientData.contractNumber || '___________'}`;
  
  doc.text(reverseHebrewWords(dateText), rightMargin, yPosition, { align: 'right' });
  doc.text(reverseHebrewWords(contractNumText), margin, yPosition, { align: 'left' });
  yPosition += 15;
  
  let inPromissoryNote = false;
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      yPosition += 5;
      return;
    }
    
    if (index === 0 && trimmedLine.includes('הסכם שירות להחזרי מס')) {
      return;
    }
    
    if (trimmedLine === 'שטר חוב') {
      doc.addPage();
      yPosition = margin + 10;
      yPosition = addRTLText('שטר חוב', 18, true, 'center', 0);
      yPosition += 10;
      inPromissoryNote = true;
    } else if (/^\d+\./.test(trimmedLine)) {
      yPosition = addRTLText(trimmedLine, 12, true, 'right', 8);
    } else if (trimmedLine.startsWith('בין:') || trimmedLine.startsWith('לבין:')) {
      yPosition = addRTLText(trimmedLine, 14, true, 'right', 8);
    } else if (trimmedLine.includes('פרטי עושה השטר:')) {
      yPosition = addRTLText(trimmedLine, 14, true, 'right', 15);
    } else {
      yPosition = addRTLText(trimmedLine, 12, false, 'right', 5);
    }
  });
  
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = margin + 10;
  }
  
  yPosition += 20;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('חתימת הלקוח:', rightMargin, yPosition, { align: 'right' });
  doc.text('תאריך:', margin + 80, yPosition, { align: 'right' });
  
  yPosition += 10;
  
  if (signatureDataURL) {
    try {
      doc.addImage(signatureDataURL, 'PNG', rightMargin - 60, yPosition, 60, 30);
    } catch (error) {
      console.error('Error adding signature:', error);
      doc.line(rightMargin - 60, yPosition + 20, rightMargin, yPosition + 20);
    }
  } else {
    doc.line(rightMargin - 60, yPosition + 20, rightMargin, yPosition + 20);
  }
  
  doc.setFont('helvetica', 'normal');
  doc.text(currentDate, margin + 80, yPosition + 20, { align: 'right' });
  
  return doc.output('blob');
}