// src/pages/createClusterForm.js

import { createCluster } from '../api.js';

export function initCreateClusterForm() {
  const createClusterForm = document.getElementById('create-cluster-form')?.querySelector('form');
  if (!createClusterForm) return; // If the form isn't on this page, do nothing.

  // --- Initialize Quill Editor ---
  const longDescriptionEditorDiv = document.getElementById('long-description-editor');
  const longDescriptionInput = document.getElementById('long-description-input');
  let quillEditor = null;

  if (longDescriptionEditorDiv && longDescriptionInput) {
    quillEditor = new Quill('#long-description-editor', {
      theme: 'snow',
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline'],
          [{ 'list': 'ordered' }, { 'list': 'bullet' }],
          ['link']
        ]
      }
    });

    // When the user types, update our hidden input to ensure the data is submitted
    quillEditor.on('text-change', function() {
      longDescriptionInput.value = quillEditor.root.innerHTML;
    });
  }

  // --- Handle Form Submission ---
  createClusterForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!getCurrentUser()) { // <-- ADD THIS CHECK
        alert('You must be logged in to create a cluster.');
        return;
    }
    
    const submitButton = e.submitter;
    submitButton.value = 'Creating...'; // Provide user feedback
    submitButton.disabled = true;

    const formData = new FormData(createClusterForm);
    
    const clusterData = {
      clusterName: formData.get('cluster-name'),
      shortDescription: formData.get('cluster-short-description---max-100-characters'),
      longDescription: quillEditor ? quillEditor.root.innerHTML : '', // Get content from Quill
      discordUsername: formData.get('discord-username'),
      discordInviteLink: formData.get('discord-invite-link'),
      websiteLink: formData.get('website-link-optional'),
      clusterLocation: formData.get('cluster-location'),
      game: formData.get('game'),
      gameVersion: formData.get('game-version'),
      gameType: formData.get('game-type'),
      gameMode: formData.get('game-mode'),
      numberOfMaps: formData.get('number-of-maps'),
      tribeSize: formData.get('tribe-size'),
      harvestRates: formData.get('harvest-rates'),
      platformsPc: document.getElementById('platforms-pc').checked,
      platformsXbox: document.getElementById('platforms-xbox').checked,
      platformsPlaystation: document.getElementById('platforms-playstation').checked,
      windows1011: document.getElementById('windows-10-11').checked
    };

    try {
      const result = await createCluster(clusterData);
      // On success, redirect to the image upload page with the new cluster's ID and name
      window.location.href = `/upload-images?id=${result.clusterId}&name=${encodeURIComponent(result.data.fieldData.name)}`;
    } catch (error) {
      console.error('Create Cluster Error:', error);
      alert('Error: ' + error.message);
      submitButton.value = 'Create Cluster'; // Reset button on error
      submitButton.disabled = false;
    }
  });
}