// Drawing utilities module

// Box drawing variables
export let isDrawing = false;
export let startX = 0;
export let startY = 0;
export let currentX = 0;
export let currentY = 0;

/**
 * Handle mouse down event to start drawing
 * @param {MouseEvent} e - Mouse event
 */
export function startDrawing(e) {
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

/**
 * Handle mouse move event to draw the box
 * @param {MouseEvent} e - Mouse event
 */
export function draw(e) {
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
  
  // Clear the entire canvas
  context.clearRect(0, 0, canvas.width, canvas.height);
  
  // Redraw the PDF content
  if (window.pdfDoc && window.currentPage && window.viewport) {
    window.pdfDoc.getPage(window.currentPage).then(function(page) {
      const renderContext = {
        canvasContext: context,
        viewport: window.viewport
      };
      page.render(renderContext).promise.then(function() {
        // Draw the current box
        context.beginPath();
        context.rect(startX, startY, newX - startX, newY - startY);
        context.strokeStyle = 'red';
        context.lineWidth = 2;
        context.stroke();
      });
    });
  } else {
    // Fallback: just draw the box without redrawing PDF
    context.beginPath();
    context.rect(startX, startY, newX - startX, newY - startY);
    context.strokeStyle = 'red';
    context.lineWidth = 2;
    context.stroke();
  }
  
  // Update current coordinates
  currentX = newX;
  currentY = newY;
}

/**
 * Handle mouse up event to stop drawing and finalize the box
 */
export function stopDrawing() {
  if (!isDrawing) return;
  isDrawing = false;
  
  // Set coordinates: mouse down is top left, mouse up is bottom right
  const x1 = startX;
  const y1 = startY;
  const x2 = currentX;
  const y2 = currentY;
  
  // Update bounding box coordinates
  window.bboxCoordinates.topLeft = [x1, y1];
  window.bboxCoordinates.topRight = [x2, y1];
  window.bboxCoordinates.bottomLeft = [x1, y2];
  window.bboxCoordinates.bottomRight = [x2, y2];
  
  // Update input fields
  document.getElementById('top-left').value = `${x1.toFixed(0)}, ${y1.toFixed(0)}`;
  document.getElementById('top-right').value = `${x2.toFixed(0)}, ${y1.toFixed(0)}`;
  document.getElementById('bottom-left').value = `${x1.toFixed(0)}, ${y2.toFixed(0)}`;
  document.getElementById('bottom-right').value = `${x2.toFixed(0)}, ${y2.toFixed(0)}`;
  
  // Update unified coordinates
  const unifiedCoords = `${x1.toFixed(0)}, ${y1.toFixed(0)}, ${x2.toFixed(0)}, ${y1.toFixed(0)}, ${x1.toFixed(0)}, ${y2.toFixed(0)}, ${x2.toFixed(0)}, ${y2.toFixed(0)}`;
  document.getElementById('unified-coords').value = unifiedCoords;
  
  // Redraw with the final bounding box
  window.renderPage(window.currentPage, true);
}
