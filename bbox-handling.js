// Bounding box handling module

// Bounding box coordinates
export let bboxCoordinates = {
  topLeft: null,
  topRight: null,
  bottomLeft: null,
  bottomRight: null
};

/**
 * Validate bounding box input and update coordinates
 * @param {string} id - Input field ID
 * @param {string} value - Coordinate value
 */
export function validateBBoxInput(id, value) {
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
  if (allCoordsValid && window.pdfDoc && window.renderPage) {
    window.renderPage(window.currentPage, true);
  }
}

/**
 * Validate unified coordinates input and update all bounding box coordinates
 * @param {string} value - Unified coordinates value
 */
export function validateUnifiedCoordsInput(value) {
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
    if (window.pdfDoc && window.renderPage) {
      window.renderPage(window.currentPage, true);
    }
  } else {
    // If unified input is invalid, don't clear individual fields
    // Just don't update the coordinates
  }
}

/**
 * Draw bounding box on canvas
 * @param {CanvasRenderingContext2D} context - Canvas context
 */
export function drawBoundingBox(context) {
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
