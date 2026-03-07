// Main application module

// Import modules
import { fetchExistingFiles, uploadFile } from './file-management.js';
import { pdfDoc, currentPage, totalPages, loadPDF, renderPage, updatePagination } from './pdf-rendering.js';
import { bboxCoordinates, validateBBoxInput, validateUnifiedCoordsInput, drawBoundingBox } from './bbox-handling.js';
import { isDrawing, startX, startY, currentX, currentY, startDrawing, draw, stopDrawing } from './drawing-utils.js';

// Expose necessary variables and functions to global scope for inter-module communication
window.pdfDoc = pdfDoc;
window.currentPage = currentPage;
window.totalPages = totalPages;
window.bboxCoordinates = bboxCoordinates;
window.loadPDF = loadPDF;
window.renderPage = renderPage;
window.updatePagination = updatePagination;
window.validateBBoxInput = validateBBoxInput;
window.validateUnifiedCoordsInput = validateUnifiedCoordsInput;
window.drawBoundingBox = drawBoundingBox;
window.startDrawing = startDrawing;
window.draw = draw;
window.stopDrawing = stopDrawing;

// Initialize the application
function initApp() {
  // Fetch files on page load
  fetchExistingFiles();
  
  // Add event listener for upload button
  document.getElementById('upload-button').addEventListener('click', function() {
    const fileInput = document.getElementById('file-upload');
    const file = fileInput.files[0];
    
    if (file) {
      console.log('Uploading file:', file);
      uploadFile(file);
    } else {
      alert('Please select a PDF file to upload');
    }
  });
  
  // Add event listeners for bounding box inputs
  const bboxInputs = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
  bboxInputs.forEach(id => {
    document.getElementById(id).addEventListener('input', function() {
      validateBBoxInput(id, this.value);
    });
  });
  
  // Add event listener for unified coordinates input
  document.getElementById('unified-coords').addEventListener('input', function() {
    validateUnifiedCoordsInput(this.value);
  });
  
  // Handle file selection
  document.getElementById('pdf-file').addEventListener('change', function() {
    const pdfUrl = this.value;
    if (pdfUrl) {
      loadPDF(pdfUrl);
    } else {
      // Clear PDF container
      document.getElementById('pdf-container').innerHTML = '';
      updatePagination(0, 0);
    }
  });
  
  // Handle page navigation
  document.getElementById('prev-page').addEventListener('click', function() {
    if (currentPage > 1) {
      currentPage--;
      renderPage(currentPage);
    }
  });
  
  document.getElementById('next-page').addEventListener('click', function() {
    if (currentPage < totalPages) {
      currentPage++;
      renderPage(currentPage);
    }
  });
  
  document.getElementById('page-input').addEventListener('change', function() {
    let pageNum = parseInt(this.value) || 1;
    if (pageNum < 1) pageNum = 1;
    if (pageNum > totalPages) pageNum = totalPages;
    currentPage = pageNum;
    this.value = pageNum;
    renderPage(pageNum);
  });
}

// Start the application when the DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
