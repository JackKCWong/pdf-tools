// PDF rendering module

// PDF rendering variables
export let pdfDoc = null;
export let currentPage = 1;
export let totalPages = 0;

/**
 * Load a PDF document from the given URL
 * @param {string} pdfUrl - URL of the PDF file to load
 */
export function loadPDF(pdfUrl) {
  const container = document.getElementById('pdf-container');
  container.innerHTML = 'Loading PDF...';
  
  const loadingTask = pdfjsLib.getDocument({ url: pdfUrl });
  loadingTask.promise.then(function(pdf) {
    pdfDoc = pdf;
    totalPages = pdf.numPages;
    currentPage = 1;
    // Update window variables
    window.pdfDoc = pdfDoc;
    window.currentPage = currentPage;
    window.totalPages = totalPages;
    updatePagination(currentPage, totalPages);
    renderPage(currentPage);
  }).catch(function(error) {
    container.innerHTML = 'Error loading PDF';
    console.error(error);
  });
}

/**
 * Render a specific page of the PDF
 * @param {number} pageNum - Page number to render
 * @param {boolean} drawBBox - Whether to draw the bounding box
 */
export function renderPage(pageNum, drawBBox = false) {
  const container = document.getElementById('pdf-container');
  container.innerHTML = '';
  
  pdfDoc.getPage(pageNum).then(function(page) {
    const scale = 1.5;
    const viewport = page.getViewport({ scale: scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    container.appendChild(canvas);
    
    // Store references for drawing
    window.canvas = canvas;
    window.context = context;
    window.viewport = viewport;
    window.currentPage = pageNum;
    
    // Add mouse event listeners for drawing
    canvas.addEventListener('mousedown', window.startDrawing);
    canvas.addEventListener('mousemove', window.draw);
    canvas.addEventListener('mouseup', window.stopDrawing);
    canvas.addEventListener('mouseleave', window.stopDrawing);
    
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    
    const renderTask = page.render(renderContext);
    renderTask.promise.then(function() {
      // Draw bounding box if requested and all coordinates are valid
      if (drawBBox && window.drawBoundingBox) {
        window.drawBoundingBox(context);
      }
      
      // Update UI
      document.getElementById('current-page').textContent = pageNum;
      document.getElementById('page-input').value = pageNum;
      updatePagination(pageNum, totalPages);
    });
  }).catch(function(error) {
    container.innerHTML = 'Error rendering page';
    console.error(error);
  });
}

/**
 * Update pagination UI elements
 * @param {number} pageNum - Current page number
 * @param {number} total - Total number of pages
 */
export function updatePagination(pageNum, total) {
  document.getElementById('current-page').textContent = pageNum;
  document.getElementById('total-pages').textContent = total;
  document.getElementById('page-input').value = pageNum;
  document.getElementById('page-input').max = total;
  
  // Enable/disable navigation buttons
  document.getElementById('prev-page').disabled = pageNum <= 1;
  document.getElementById('next-page').disabled = pageNum >= total;
}
