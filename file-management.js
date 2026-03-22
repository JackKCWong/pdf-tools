// File management functions

/**
 * Fetch existing PDF files and populate the dropdown
 * @param {string} fileToSelect - Optional file URL to select after populating
 */
export function fetchExistingFiles(fileToSelect = null) {
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

      // Select a specific file if provided, otherwise select the first PDF file if available
      if (fileToSelect) {
        select.value = fileToSelect;
        select.dispatchEvent(new Event('change'));
      } else if (data.files.length > 0) {
        select.value = data.files[0].url;
        select.dispatchEvent(new Event('change'));
      }
    })
    .catch(error => {
      alert('Error fetching files');
      console.error(error);
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
      // Refresh file list and select the newly uploaded file
      // Use fileUrl from server response (not data.url)
      const uploadedFileUrl = data.fileUrl;
      fetchExistingFiles(uploadedFileUrl);
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
