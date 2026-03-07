// Fetch existing files and populate dropdown
function fetchExistingFiles() {
  fetch('/files')
    .then(response => response.json())
    .then(data => {
      const select = document.getElementById('pdf-file');
      select.innerHTML = '<option value="">-- Select a file --</option>';
      
      data.files.forEach(file => {
        const option = document.createElement('option');
        option.value = file.url;
        option.textContent = file.name;
        select.appendChild(option);
      });
      
      // Select the first PDF file if available
      if (data.files.length > 0) {
        select.value = data.files[0].url;
        // Trigger change event to load the PDF
        select.dispatchEvent(new Event('change'));
      }
    })
    .catch(error => {
      alert('Error fetching files');
    });
}

// Upload file function
function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  fetch('/upload', {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert('File uploaded successfully');
      // Refresh file list
      fetchExistingFiles();
      // Clear file input
      document.getElementById('file-upload').value = '';
    } else {
      alert('Error uploading file: ' + (data.message || 'Unknown error'));
    }
  })
  .catch(error => {
    alert('Error uploading file');
    console.error(error);
  });
}

// PDF rendering variables
let pdfDoc = null;
let currentPage = 1;
let totalPages = 0;
let bboxCoordinates = {
  topLeft: null,
  topRight: null,
  bottomLeft: null,
  bottomRight: null
};

// Box drawing variables
let isDrawing = false;
let startX = 0;
let startY = 0;
let currentX = 0;
let currentY = 0;
let canvas = null;
let context = null;
let viewport = null;

// Fetch files on page load
window.addEventListener('load', fetchExistingFiles);

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

// Validate bounding box input
function validateBBoxInput(id, value) {
  const coords = value.trim().split(',').map(Number);
  if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1]) && coords[0] >= 0 && coords[1] >= 0) {
    switch(id) {
      case 'top-left':
        bboxCoordinates.topLeft = coords;
        break;
      case 'top-right':
        bboxCoordinates.topRight = coords;
        break;
      case 'bottom-left':
        bboxCoordinates.bottomLeft = coords;
        break;
      case 'bottom-right':
        bboxCoordinates.bottomRight = coords;
        break;
    }
  } else {
    switch(id) {
      case 'top-left':
        bboxCoordinates.topLeft = null;
        break;
      case 'top-right':
        bboxCoordinates.topRight = null;
        break;
      case 'bottom-left':
        bboxCoordinates.bottomLeft = null;
        break;
      case 'bottom-right':
        bboxCoordinates.bottomRight = null;
        break;
    }
  }
  
  // Trigger real-time drawing when all coordinates are valid
  const allCoordsValid = Object.values(bboxCoordinates).every(coord => coord !== null);
  if (allCoordsValid && pdfDoc) {
    renderPage(currentPage, true);
  }
}

// Validate unified coordinates input
function validateUnifiedCoordsInput(value) {
  const coords = value.trim().split(',').map(Number);
  if (coords.length === 8 && coords.every(coord => !isNaN(coord) && coord >= 0)) {
    // Update bboxCoordinates object
    bboxCoordinates.topLeft = [coords[0], coords[1]];
    bboxCoordinates.topRight = [coords[2], coords[3]];
    bboxCoordinates.bottomLeft = [coords[4], coords[5]];
    bboxCoordinates.bottomRight = [coords[6], coords[7]];
    
    // Update individual input fields
    document.getElementById('top-left').value = `${coords[0]}, ${coords[1]}`;
    document.getElementById('top-right').value = `${coords[2]}, ${coords[3]}`;
    document.getElementById('bottom-left').value = `${coords[4]}, ${coords[5]}`;
    document.getElementById('bottom-right').value = `${coords[6]}, ${coords[7]}`;
    
    // Trigger real-time drawing
    if (pdfDoc) {
      renderPage(currentPage, true);
    }
  } else {
    // If unified input is invalid, don't clear individual fields
    // Just don't update the coordinates
  }
}

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

function loadPDF(pdfUrl) {
  const container = document.getElementById('pdf-container');
  container.innerHTML = 'Loading PDF...';
  
  const loadingTask = pdfjsLib.getDocument({ url: pdfUrl });
  loadingTask.promise.then(function(pdf) {
    pdfDoc = pdf;
    totalPages = pdf.numPages;
    currentPage = 1;
    updatePagination(currentPage, totalPages);
    renderPage(currentPage);
  }).catch(function(error) {
    container.innerHTML = 'Error loading PDF';
    console.error(error);
  });
}

function renderPage(pageNum, drawBBox = false) {
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
    
    // Add mouse event listeners for drawing
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
    
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    
    const renderTask = page.render(renderContext);
    renderTask.promise.then(function() {
      // Draw bounding box if requested and all coordinates are valid
      if (drawBBox) {
        drawBoundingBox(context);
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

// Draw bounding box on canvas
function drawBoundingBox(context) {
  const { topLeft, topRight, bottomLeft, bottomRight } = bboxCoordinates;
  
  if (topLeft && topRight && bottomLeft && bottomRight) {
    context.beginPath();
    context.moveTo(topLeft[0], topLeft[1]);
    context.lineTo(topRight[0], topRight[1]);
    context.lineTo(bottomRight[0], bottomRight[1]);
    context.lineTo(bottomLeft[0], bottomLeft[1]);
    context.closePath();
    context.strokeStyle = 'red';
    context.lineWidth = 2;
    context.stroke();
  }
}

function updatePagination(pageNum, total) {
  document.getElementById('current-page').textContent = pageNum;
  document.getElementById('total-pages').textContent = total;
  document.getElementById('page-input').value = pageNum;
  document.getElementById('page-input').max = total;
  
  // Enable/disable navigation buttons
  document.getElementById('prev-page').disabled = pageNum <= 1;
  document.getElementById('next-page').disabled = pageNum >= total;
}

// Mouse event handlers for drawing
function startDrawing(e) {
  isDrawing = true;
  const canvas = window.canvas;
  if (!canvas) return;
  
  const rect = canvas.getBoundingClientRect();
  // Calculate scaling factor between canvas size and displayed size
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  // Adjust mouse coordinates to actual canvas size
  startX = (e.clientX - rect.left) * scaleX;
  startY = (e.clientY - rect.top) * scaleY;
  currentX = startX;
  currentY = startY;
  
  // Save the current canvas state before drawing
  const context = canvas.getContext('2d');
  if (context) {
    context.save();
  }
}

function draw(e) {
  if (!isDrawing) return;
  
  const canvas = window.canvas;
  if (!canvas) return;
  
  const context = canvas.getContext('2d');
  if (!context) return;
  
  const rect = canvas.getBoundingClientRect();
  // Calculate scaling factor between canvas size and displayed size
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  // Adjust mouse coordinates to actual canvas size
  const newX = (e.clientX - rect.left) * scaleX;
  const newY = (e.clientY - rect.top) * scaleY;
  
  // Clear the entire canvas and redraw the PDF content
  const renderContext = {
    canvasContext: context,
    viewport: window.viewport
  };
  
  pdfDoc.getPage(currentPage).then(function(page) {
    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Redraw the page
    page.render(renderContext).promise.then(function() {
      // Draw the current box
      context.beginPath();
      context.rect(startX, startY, newX - startX, newY - startY);
      context.strokeStyle = 'red';
      context.lineWidth = 2;
      context.stroke();
    });
  });
  
  // Update current coordinates
  currentX = newX;
  currentY = newY;
}

function stopDrawing() {
  if (!isDrawing) return;
  isDrawing = false;
  
  // Set coordinates: mouse down is top left, mouse up is bottom right
  const x1 = startX;
  const y1 = startY;
  const x2 = currentX;
  const y2 = currentY;
  
  // Update bounding box coordinates
  bboxCoordinates.topLeft = [x1, y1];
  bboxCoordinates.topRight = [x2, y1];
  bboxCoordinates.bottomLeft = [x1, y2];
  bboxCoordinates.bottomRight = [x2, y2];
  
  // Update input fields
  document.getElementById('top-left').value = `${x1.toFixed(0)}, ${y1.toFixed(0)}`;
  document.getElementById('top-right').value = `${x2.toFixed(0)}, ${y1.toFixed(0)}`;
  document.getElementById('bottom-left').value = `${x1.toFixed(0)}, ${y2.toFixed(0)}`;
  document.getElementById('bottom-right').value = `${x2.toFixed(0)}, ${y2.toFixed(0)}`;
  
  // Update unified coordinates
  const unifiedCoords = `${x1.toFixed(0)}, ${y1.toFixed(0)}, ${x2.toFixed(0)}, ${y1.toFixed(0)}, ${x1.toFixed(0)}, ${y2.toFixed(0)}, ${x2.toFixed(0)}, ${y2.toFixed(0)}`;
  document.getElementById('unified-coords').value = unifiedCoords;
  
  // Redraw with the final bounding box
  renderPage(currentPage, true);
}
