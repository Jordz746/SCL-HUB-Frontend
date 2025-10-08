// src/pages/editClusterForm.js

import { getClusterById, updateCluster } from '../api.js';
import { getCurrentUser } from '../auth.js';

export function initEditClusterForm() {
  const editClusterForm = document.getElementById('edit-cluster-form')?.querySelector('form');
  if (!editClusterForm) return;

  const urlParams = new URLSearchParams(window.location.search);
  const clusterId = urlParams.get('id');

  if (!clusterId) {
    alert('Error: No Cluster ID found. Cannot edit this item.');
    // Optionally, disable the form
    editClusterForm.style.pointerEvents = 'none';
    editClusterForm.style.opacity = '0.5';
    return;
  }

  // --- Initialize Quill Editor ---
  const quillEditorEdit = new Quill('#long-description-editor-edit', {
    theme: 'snow',
    modules: {
        toolbar: [
          ['bold', 'italic', 'underline'],
          [{ 'list': 'ordered' }, { 'list': 'bullet' }],
          ['link']
        ]
      }
  });

  // --- 1. Pre-fill the form with existing data (COMPLETE VERSION) ---
  getClusterById(clusterId)
    .then(result => {
      const { fieldData } = result;
      
      // Helper function to safely set form values
      const setValue = (name, value) => {
        if (editClusterForm[name]) {
          editClusterForm[name].value = value || '';
        }
      };
      
      // Set all text and select values
      setValue('cluster-name', fieldData['cluster-name']);
      setValue('cluster-short-description---max-100-characters', fieldData['cluster-short-description---max-100-characters']);
      setValue('discord-username', fieldData['discord-username']);
      setValue('discord-invite-link', fieldData['discord-invite-link']);
      setValue('website-link-optional', fieldData['website-link-optional']);
      setValue('cluster-location', fieldData['cluster-location']);
      setValue('game', fieldData['game']);
      setValue('game-version', fieldData['game-version']);
      setValue('game-type', fieldData['game-type']);
      setValue('game-mode', fieldData['game-mode']);
      setValue('number-of-maps', fieldData['number-of-maps']);
      setValue('tribe-size', fieldData['tribe-size']);
      setValue('harvest-rates', fieldData['harvest-rates']);

      // Set checkbox values
      document.getElementById('platforms-pc-edit').checked = fieldData['platforms-pc'];
      document.getElementById('platforms-xbox-edit').checked = fieldData['platforms-xbox'];
      document.getElementById('platforms-playstation-edit').checked = fieldData['platforms-playstation'];
      document.getElementById('windows-10-11-edit').checked = fieldData['windows-10-11'];

      // Set Quill editor content
      if (fieldData['cluster-description-rich']) {
        quillEditorEdit.root.innerHTML = fieldData['cluster-description-rich'];
      }
    })
    .catch(error => {
      alert('Could not load cluster data to edit. Please go back and try again.');
      console.error('Failed to fetch cluster data for editing:', error);
    });

  // --- 2. Handle form submission to update the data (COMPLETE VERSION) ---
  editClusterForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitButton = e.submitter;
    submitButton.value = 'Updating...';
    submitButton.disabled = true;

    // Construct the complete updated data object from the form
    const updatedData = {
      clusterName: editClusterForm['cluster-name'].value,
      shortDescription: editClusterForm['cluster-short-description---max-100-characters'].value,
      longDescription: quillEditorEdit.root.innerHTML,
      discordUsername: editClusterForm['discord-username'].value,
      discordInviteLink: editClusterForm['discord-invite-link'].value,
      websiteLink: editClusterForm['website-link-optional'].value,
      clusterLocation: editClusterForm['cluster-location'].value,
      game: editClusterForm['game'].value,
      gameVersion: editClusterForm['game-version'].value,
      gameType: editClusterForm['game-type'].value,
      gameMode: editClusterForm['game-mode'].value,
      numberOfMaps: editClusterForm['number-of-maps'].value,
      tribeSize: editClusterForm['tribe-size'].value,
      harvestRates: editClusterForm['harvest-rates'].value,
      platformsPc: document.getElementById('platforms-pc-edit').checked,
      platformsXbox: document.getElementById('platforms-xbox-edit').checked,
      platformsPlaystation: document.getElementById('platforms-playstation-edit').checked,
      windows1011: document.getElementById('windows-10-11-edit').checked
    };

    try {
      const result = await updateCluster(clusterId, updatedData);
      alert('Cluster updated successfully! Returning to the review page.');
      window.location.href = `/upload-images?id=${clusterId}&name=${encodeURIComponent(result.data.fieldData.name)}`;
    } catch (error) {
      console.error('Update Cluster Error:', error);
      alert('Error: ' + error.message);
      submitButton.value = 'Save Changes';
      submitButton.disabled = false;
    }
  });
}