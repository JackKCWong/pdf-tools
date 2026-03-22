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

  const loadingTask = pdfjsLib.getDocument({
    url: pdfUrl,
    isEvalSupported: false,
    useSystemFonts: true,
    enableXfa: true,
    useWorkerFetch: true,
    cMapUrl: '/node_modules/pdfjs-dist/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: '/node_modules/pdfjs-dist/standard_fonts/',
    wasmUrl: '/node_modules/pdfjs-dist/wasm/',
    iccUrl: '/node_modules/pdfjs-dist/iccs/'
  });
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
    
    // Extract and display PDF metadata
    extractMetadata(pdf);
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
    // Use higher scale for better quality rendering
    const scale = 3.0;
    const viewport = page.getViewport({ scale: scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    // Enable image smoothing for better quality
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    // Set CSS size to match display size (half of rendered size for retina-like effect)
    canvas.style.width = '100%';
    canvas.style.height = 'auto';

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

/**
 * Check if PDF has a text layer by extracting text from the first page
 * @param {Object} pdf - PDF document object
 * @returns {Promise<boolean>} - Whether the PDF has a text layer
 */
async function hasTextLayer(pdf) {
  try {
    const page = await pdf.getPage(1);
    const content = await page.getTextContent();
    return content.items.length > 0;
  } catch (error) {
    console.error('Error checking for text layer:', error);
    return false;
  }
}

/**
 * Extract and display PDF metadata
 * @param {Object} pdf - PDF document object
 */
export function extractMetadata(pdf) {
  const metadataContent = document.getElementById('metadata-content');
  
  pdf.getMetadata().then(function(data) {
    const info = data.info || {};
    let metadataHTML = '<table style="width: 100%; border-collapse: collapse;">';
    
    const metadataFields = [
      { label: 'Title', key: 'Title' },
      { label: 'Author', key: 'Author' },
      { label: 'Subject', key: 'Subject' },
      { label: 'Keywords', key: 'Keywords' },
      { label: 'Creation Date', key: 'CreationDate' },
      { label: 'Modification Date', key: 'ModDate' },
      { label: 'Producer', key: 'Producer' },
      { label: 'Creator', key: 'Creator' }
    ];
    
    metadataFields.forEach(field => {
      if (info[field.key]) {
        metadataHTML += `
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${field.label}:</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${info[field.key]}</td>
          </tr>
        `;
      }
    });
    
    // Add page count if not already present
    if (!info.PageCount) {
      metadataHTML += `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Page Count:</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${pdf.numPages}</td>
        </tr>
      `;
    }
    
    // Check for text layer and add to metadata
    hasTextLayer(pdf).then(function(hasText) {
      metadataHTML += `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Text Layer:</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${hasText ? 'Yes' : 'No'}</td>
        </tr>
      `;
      metadataHTML += '</table>';
      metadataContent.innerHTML = metadataHTML;
    });
  }).catch(function(error) {
    metadataContent.innerHTML = 'Error extracting metadata';
    console.error(error);
  });
}
