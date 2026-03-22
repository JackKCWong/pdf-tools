// File management functions

/**
 * Fetch existing PDF files and populate the dropdown
 */
export function fetchExistingFiles() {
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

/**
 * Upload a PDF file to the server
 * @param {File} file - The PDF file to upload
 */
export function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  fetch('/upload', {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Refresh file list
      fetchExistingFiles();
      // Select the newly uploaded file (last in the list) and render
      const select = document.getElementById('pdf-file');
      // The uploaded file is the last one in the list
      if (select.options.length > 1) {
        select.selectedIndex = select.options.length - 1;
        select.dispatchEvent(new Event('change'));
      }
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
