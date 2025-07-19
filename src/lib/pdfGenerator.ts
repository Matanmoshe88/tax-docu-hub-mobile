// pdfGenerator.ts - Improved version without html2canvas
import jsPDF from 'jspdf';
import 'jspdf-autotable'; // For better table support if needed

// Add Hebrew font to jsPDF (you need to convert a Hebrew font to Base64)
// Use a tool like https://rawgit.com/MrRio/jsPDF/master/fontconverter/fontconverter.html
import './hebrewFont'; // This should contain the font data

export async function generateContractPDF(contractData: any, signatureDataURL: string) {
  // Initialize PDF with compression
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
    putOnlyUsedFonts: true
  });

  // Set Hebrew font
  doc.setFont('HebrewFont'); // Use the name you gave when adding the font
  
  // Enable RTL
  doc.setR2L(true);
  
  // Constants
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const lineHeight = 7;
  const contentWidth = pageWidth - (margin * 2);
  
  let yPosition = margin;
  
  // Helper function to add text with automatic page breaks
  const addText = (text: string, fontSize: number = 12, bold: boolean = false) => {
    doc.setFontSize(fontSize);
    doc.setFont(undefined, bold ? 'bold' : 'normal');
    
    const lines = doc.splitTextToSize(text, contentWidth);
    
    lines.forEach((line: string) => {
      if (yPosition + lineHeight > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, pageWidth - margin, yPosition, { align: 'right' });
      yPosition += lineHeight;
    });
  };
  
  // 1. Add Header
  doc.setFontSize(20);
  doc.text('הסכם שירות להחזרי מס', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;
  
  // Add date and contract number
  doc.setFontSize(10);
  doc.text(`מספר הסכם: ${contractData.contractNumber}`, pageWidth - margin, yPosition, { align: 'right' });
  yPosition += 5;
  doc.text(`תאריך: ${new Date().toLocaleDateString('he-IL')}`, pageWidth - margin, yPosition, { align: 'right' });
  yPosition += 15;
  
  // 2. Add Parties Section
  addText('בין:', 14, true);
  yPosition += 5;
  addText(`${contractData.company.name} ח.פ ${contractData.company.id}`, 12);
  addText(`${contractData.company.address}`, 12);
  addText('(להלן: "החברה")', 12);
  yPosition += 10;
  
  addText('לבין:', 14, true);
  yPosition += 5;
  addText(`${contractData.client.name} ת.ז ${contractData.client.id}`, 12);
  addText(`${contractData.client.address}`, 12);
  addText('(להלן: "הלקוח")', 12);
  yPosition += 15;
  
  // 3. Add Contract Sections
  contractData.sections.forEach((section: any, index: number) => {
    // Section title
    addText(`${index + 1}. ${section.title}`, 14, true);
    yPosition += 3;
    
    // Section content
    addText(section.content, 12);
    yPosition += 10;
  });
  
  // 4. Add Signature Section (if signature exists)
  if (signatureDataURL) {
    // Ensure we have space for signature
    if (yPosition + 50 > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
    
    yPosition += 10;
    addText('חתימות:', 14, true);
    yPosition += 10;
    
    // Add signature image (compressed)
    const signatureWidth = 50;
    const signatureHeight = 25;
    
    // Compress signature before adding
    const compressedSignature = await compressSignatureImage(signatureDataURL);
    
    doc.addImage(
      compressedSignature,
      'JPEG',
      margin,
      yPosition,
      signatureWidth,
      signatureHeight
    );
    
    doc.text('חתימת הלקוח', margin + signatureWidth / 2, yPosition + signatureHeight + 5, { align: 'center' });
  }
  
  // 5. Add שטר חוב on separate page
  doc.addPage();
  yPosition = margin;
  
  // Add debt note header
  doc.setFontSize(18);
  doc.text('שטר חוב', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;
  
  // Add debt note content
  addText(`אני הח"מ ${contractData.client.name} ת.ז ${contractData.client.id}`, 12);
  yPosition += 5;
  addText(`מתחייב בזה לשלם לפקודת ${contractData.company.name}`, 12);
  yPosition += 5;
  addText(`סך של ${contractData.debtAmount} ש"ח`, 14, true);
  yPosition += 10;
  addText('וזאת במקרה של ביטול ההסכם מצידי או אי עמידה בתנאי ההסכם.', 12);
  
  // Add signature area for debt note
  if (signatureDataURL) {
    yPosition += 20;
    const compressedSignature = await compressSignatureImage(signatureDataURL);
    doc.addImage(
      compressedSignature,
      'JPEG',
      margin,
      yPosition,
      50,
      25
    );
  }
  
  // Return the PDF
  return doc;
}

// Helper function to compress signature
async function compressSignatureImage(dataURL: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set smaller dimensions for signature
      const maxWidth = 200;
      const maxHeight = 100;
      
      let width = img.width;
      let height = img.height;
      
      // Calculate aspect ratio
      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (maxHeight / height) * width;
        height = maxHeight;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw with white background (for JPEG)
      ctx!.fillStyle = 'white';
      ctx!.fillRect(0, 0, width, height);
      ctx!.drawImage(img, 0, 0, width, height);
      
      // Return compressed JPEG
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
    img.src = dataURL;
  });
}

// Usage in your component
export async function createAndDownloadPDF(contractData: any, signatureDataURL: string) {
  try {
    const pdf = await generateContractPDF(contractData, signatureDataURL);
    
    // Check file size
    const pdfOutput = pdf.output('blob');
    console.log('PDF size:', (pdfOutput.size / 1024).toFixed(2), 'KB');
    
    if (pdfOutput.size > 500000) {
      console.warn('PDF exceeds 500KB, consider further optimization');
    }
    
    // Save the PDF
    pdf.save(`contract_${contractData.client.id}_${Date.now()}.pdf`);
    
    return pdfOutput;
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
}