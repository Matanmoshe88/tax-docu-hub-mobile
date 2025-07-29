import jsPDF from 'jspdf';

/**
 * Compresses an image while maintaining quality and aspect ratio
 * @param img - The HTMLImageElement to compress
 * @param quality - JPEG quality (0-1, default 0.8)
 * @param maxWidth - Maximum width in pixels (default 1200)
 * @returns Compressed image as HTMLCanvasElement
 */
export const compressImage = (img: HTMLImageElement, quality: number = 0.8, maxWidth: number = 1200): HTMLCanvasElement => {
  // Create a virtual canvas - this is where the magic happens
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  // Get the original image size
  let { width, height } = img;
  
  // If it's too wide, scale it down but keep the proportions
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }

  // Set your canvas to the new size
  canvas.width = width;
  canvas.height = height;

  // Draw the resized image onto the canvas
  ctx.drawImage(img, 0, 0, width, height);
  
  return canvas;
};

/**
 * Converts an image file to PDF with compression
 * @param imageFile - The image file to convert
 * @returns Promise that resolves to the PDF file
 */
export const convertImageToPDF = async (imageFile: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      try {
        // First, compress your image
        const compressedCanvas = compressImage(img, 0.8, 1200);
        
        // Convert the canvas to a JPEG with 80% quality
        const compressedDataURL = compressedCanvas.toDataURL('image/jpeg', 0.8);
        
        // Create your PDF document (A4 size)
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        // A4 dimensions and margins
        const pdfWidth = 210;  // A4 width in mm
        const pdfHeight = 297; // A4 height in mm
        const margin = 10;     // 10mm margin all around
        const maxWidth = pdfWidth - (margin * 2);
        const maxHeight = pdfHeight - (margin * 2);

        // Calculate how to fit your image perfectly
        const imgRatio = compressedCanvas.width / compressedCanvas.height;
        let finalWidth = maxWidth;
        let finalHeight = maxWidth / imgRatio;

        // If it's too tall, scale by height instead
        if (finalHeight > maxHeight) {
          finalHeight = maxHeight;
          finalWidth = maxHeight * imgRatio;
        }

        // Center it on the page
        const x = (pdfWidth - finalWidth) / 2;
        const y = (pdfHeight - finalHeight) / 2;

        // Add your image to the PDF
        pdf.addImage(compressedDataURL, 'JPEG', x, y, finalWidth, finalHeight);
        
        // Convert to a file
        const pdfBlob = pdf.output('blob');
        const pdfFileName = imageFile.name.replace(/\.(jpg|jpeg|png)$/i, '.pdf');
        const pdfFile = new File([pdfBlob], pdfFileName, { 
          type: 'application/pdf' 
        });

        console.log(`Original: ${imageFile.size} bytes, Compressed PDF: ${pdfFile.size} bytes`);
        resolve(pdfFile);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    
    // Load your file into the image
    img.src = URL.createObjectURL(imageFile);
  });
};

/**
 * Processes a file - if it's an image, converts to PDF; otherwise returns as-is
 * @param file - The file to process
 * @returns Promise that resolves to the processed file
 */
export const processFileForUpload = async (file: File): Promise<File> => {
  // Check if it's an image
  if (file.type.startsWith('image/')) {
    try {
      console.log('Converting image to PDF with compression...');
      return await convertImageToPDF(file);
    } catch (error) {
      console.error('Image to PDF conversion failed:', error);
      throw new Error('Failed to convert image to PDF');
    }
  }
  
  // If it's not an image, return as-is
  return file;
};
