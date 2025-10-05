// src/pages/uploadPage.js

import { getClusterById, uploadImage, publishCluster } from '../api.js';

export function initUploadPage() {
  const uploadPageWrapper = document.getElementById('upload-images-wrapper');
  if (!uploadPageWrapper) return; // Stop if we're not on the right page

  const urlParams = new URLSearchParams(window.location.search);
  const clusterId = urlParams.get('id');

  if (!clusterId) {
    const clusterNameDisplay = document.getElementById('cluster-name-display');
    if (clusterNameDisplay) {
        clusterNameDisplay.textContent = 'Error: No Cluster ID found in URL. Please go back to your dashboard.';
    }
    // Hide sections that require a clusterId
    const imageUploadSection = document.getElementById('image-upload-section');
    if (imageUploadSection) imageUploadSection.style.display = 'none';
    return;
  }

  // --- 1. Populate Page with Cluster Data (COMPLETE VERSION) ---
  getClusterById(clusterId)
    .then(result => {
      const { fieldData } = result;
      
      // Helper function to safely set text content
      const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value || 'N/A';
      };

      // Set all text fields
      setText('cluster-name-display', fieldData['cluster-name']);
      setText('cluster-short-display', fieldData['cluster-short-description---max-100-characters']);
      setText('discord-name-display', fieldData['discord-username']);
      setText('discord-invite-link-display', fieldData['discord-invite-link']);
      setText('cluster-location-display', fieldData['cluster-location']);
      setText('game-display', fieldData['game']);
      setText('game-version-display', fieldData['game-version']);
      setText('game-type-display', fieldData['game-type']);
      setText('game-mode-display', fieldData['game-mode']);
      setText('number-of-maps-display', fieldData['number-of-maps']);
      setText('tribe-size-display', fieldData['tribe-size']);
      setText('harvest-rates-display', fieldData['harvest-rates']);
      setText('cluster-slug-display', fieldData['slug']);

      // Set the rich text description
      const longDescDisplay = document.getElementById('cluster-description-display');
      if (longDescDisplay) {
        longDescDisplay.innerHTML = fieldData['cluster-description-rich'] || '<p>No description provided.</p>';
      }

    })
    .catch(error => {
      console.error('Failed to fetch cluster data:', error);
      const clusterNameDisplay = document.getElementById('cluster-name-display');
      if(clusterNameDisplay) clusterNameDisplay.textContent = 'Could not load cluster data.';
    });

  // --- 2. Handle Image Uploads (No changes needed here) ---
  const handleImageUpload = async (event, imageType) => {
    const fileInput = event.target;
    const imageFile = fileInput.files[0];
    const label = fileInput.previousElementSibling;

    if (!imageFile) return;

    // Frontend Validation
    const MAX_SIZE_MB = 3.5;
    if (imageFile.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`File is too large. Max size is ${MAX_SIZE_MB}MB.`);
      fileInput.value = ''; // Clear the input
      return;
    }
    if (imageFile.type !== 'image/webp') {
      alert('Invalid file type. Please upload a WEBP image.');
      fileInput.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('image', imageFile);

    if (label) label.textContent = 'Uploading...';
    fileInput.disabled = true;

    try {
      const result = await uploadImage(clusterId, imageType, formData);
      if (label) label.textContent = 'Upload Complete!';
      const previewElement = document.getElementById(`${fileInput.id}-preview`);
      if (previewElement) {
        previewElement.src = result.imageUrl;
        previewElement.style.display = 'block';
      }
    } catch (error) {
      console.error(`Upload error for ${imageType}:`, error);
      alert(`Error: ${error.message}`);
      if (label) label.textContent = 'Upload Failed. Try Again.';
    } finally {
      fileInput.disabled = false;
    }
  };

  document.getElementById('logo-image-upload-input')?.addEventListener('change', (e) => handleImageUpload(e, 'logo-1-1'));
  document.getElementById('banner-16-9-upload-input')?.addEventListener('change', (e) => handleImageUpload(e, 'banner-16-9'));
  document.getElementById('banner-9-16-upload-input')?.addEventListener('change', (e) => handleImageUpload(e, 'banner-9-16'));

  // --- 3. Handle Publish Button (IMPROVED VERSION) ---
const publishButton = document.getElementById('publish-cluster');
const successBox = document.getElementById('Cluster-Success-Box');
const errorBox = document.getElementById('Cluster-Error-Box');

if (publishButton) {
  // Hide feedback boxes by default
  if (successBox) successBox.style.display = 'none';
  if (errorBox) errorBox.style.display = 'none';

  publishButton.addEventListener('click', async () => {
    publishButton.value = 'Publishing...';
    publishButton.disabled = true;
    // Hide boxes before trying again
    if (successBox) successBox.style.display = 'none';
    if (errorBox) errorBox.style.display = 'none';

    try {
      const result = await publishCluster(clusterId);
      
      // --- Handle Success ---
      if (successBox) {
        const successMessage = successBox.querySelector('p');
        if (successMessage) successMessage.textContent = result.message || 'Cluster Published Successfully!';
        successBox.style.display = 'block';
      } else {
        alert(result.message); // Fallback if the box doesn't exist
      }

      const slugDisplay = document.getElementById('cluster-slug-display');
      if (slugDisplay) {
        const linkElement = slugDisplay.querySelector('a') || document.createElement('a');
        linkElement.href = result.publishedUrl;
        linkElement.textContent = result.publishedUrl;
        linkElement.target = "_blank";
        if (!slugDisplay.querySelector('a')) {
            slugDisplay.innerHTML = '';
            slugDisplay.appendChild(linkElement);
        }
      }
    } catch (error) {
      // --- Handle Error ---
      if (errorBox) {
        const errorMessage = errorBox.querySelector('p');
        if (errorMessage) errorMessage.textContent = `Error: ${error.message}`;
        errorBox.style.display = 'block';
      } else {
        alert(`Error: ${error.message}`); // Fallback
      }
    } finally {
      publishButton.value = 'Publish Cluster';
      publishButton.disabled = false;
    }
  });
}

  // --- 4. Handle Edit Button (No changes needed here) ---
  const editButton = document.getElementById('edit-cluster-button');
  if (editButton) {
    editButton.addEventListener('click', () => {
      const clusterName = urlParams.get('name');
      window.location.href = `/edit-cluster?id=${clusterId}&name=${encodeURIComponent(clusterName)}`;
    });
  }
}