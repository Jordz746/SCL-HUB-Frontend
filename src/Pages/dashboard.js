// src/pages/dashboard.js

import { getClusters, deleteCluster } from '../api.js';

// This is the main function for the dashboard page
export function initDashboard() {
  // Find all the necessary elements on the page
  const clusterListWrapper = document.getElementById('cluster-list-wrapper');
  const clusterList = clusterListWrapper?.querySelector('.w-dyn-items');
  const template = clusterList?.querySelector('.w-dyn-item');
  const emptyState = document.getElementById('empty-state');

  // Safety check: if the core elements don't exist, stop to prevent errors
  if (!clusterList || !template) {
    console.error("Dashboard Error: Could not find essential list elements (cluster-list or template item).");
    return;
  }

  // Hide the template and the empty state message initially
  template.style.display = 'none';
  if (emptyState) emptyState.style.display = 'none';

  // --- Main Logic: Fetch and Display Clusters ---
  getClusters()
    .then(({ items }) => {
      // Clear any items that might be there from a previous render
      const existingItems = clusterList.querySelectorAll('.w-dyn-item:not(.is-template)');
      existingItems.forEach(item => item.remove());

      if (items && items.length > 0) {
        // We have clusters, so make sure the empty state is hidden
        if (emptyState) emptyState.style.display = 'none';

        items.forEach(item => {
          const clone = template.cloneNode(true);
          clone.classList.remove('is-template'); // Good practice to remove template identifiers
          clone.style.display = 'block';

          // --- Populate the clone with data ---
          const nameEl = clone.querySelector('.cluster-name-text');
          if (nameEl) nameEl.textContent = item.fieldData.name;

          const imageEl = clone.querySelector('.cluster-image');
          const imageUrl = item.fieldData['16-9-banner-image-link'];
          if (imageEl && imageUrl) { 
            imageEl.src = imageUrl; 
          }

          // --- Add Event Listeners ---
          const editBtn = clone.querySelector('.edit-button');
          if (editBtn) {
            editBtn.addEventListener('click', () => {
              // Redirect to the upload/review page
              window.location.href = `/upload-images?id=${item.id}&name=${encodeURIComponent(item.fieldData.name)}`;
            });
          }

          const deleteBtn = clone.querySelector('.delete-button');
          if (deleteBtn) {
            deleteBtn.addEventListener('click', async () => {
              if (!confirm(`Are you sure you want to delete "${item.fieldData.name}"? This cannot be undone.`)) {
                return;
              }
              try {
                await deleteCluster(item.id);
                alert('Cluster deleted successfully!');
                clone.remove(); // Remove the element from the page

                // After deleting, check if the list is now empty
                const remainingItems = clusterList.querySelectorAll('.w-dyn-item:not(.is-template)');
                if (remainingItems.length === 0 && emptyState) {
                  emptyState.style.display = 'block';
                }
              } catch (error) {
                console.error('Delete Error:', error);
                alert(`Error: ${error.message}`);
              }
            });
          }
          
          clusterList.appendChild(clone);
        });
      } else {
        // If there are no items, show the empty state message
        if (emptyState) {
          emptyState.style.display = 'block';
        }
      }
    })
    .catch(error => {
      console.error("Failed to load dashboard clusters:", error);
      alert("Could not load your clusters. Please try refreshing the page.");
      if (emptyState) emptyState.style.display = 'block'; // Show empty state on error too
    });
}