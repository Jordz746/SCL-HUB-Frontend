// src/api.js

import { API_BASE_URL } from './config.js';
import { getCurrentUser } from './auth.js';

// This is a powerful helper function that handles authentication for our API calls.
async function fetchWithAuth(endpoint, options = {}) {
  const user = getCurrentUser();
  if (!user) {
    // This should ideally not happen if we check for the user before calling an API function,
    // but it's a good safeguard.
    throw new Error('User is not authenticated.');
  }

  const idToken = await user.getIdToken(true); // Get the latest auth token

  // Set up the required headers
  const headers = {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json',
    ...options.headers, // Allow custom headers to be added if needed
  };

  // Make the actual request to the backend
  const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

  // Parse the JSON response
  const result = await response.json();

  // If the response was not successful (e.g., status 400, 403, 500), throw an error
  if (!response.ok) {
    throw new Error(result.message || `API request to ${endpoint} failed.`);
  }

  // If everything was successful, return the data
  return result;
}

// --- API Functions ---
// Now we define a simple function for each backend endpoint.

export const getClusters = () => fetchWithAuth('/api/clusters');

export const getClusterById = (clusterId) => fetchWithAuth(`/api/clusters/${clusterId}`);

export const createCluster = (data) => fetchWithAuth('/api/clusters', {
  method: 'POST',
  body: JSON.stringify(data),
});

export const updateCluster = (clusterId, data) => fetchWithAuth(`/api/clusters/${clusterId}`, {
  method: 'PATCH',
  body: JSON.stringify(data),
});

export const deleteCluster = (clusterId) => fetchWithAuth(`/api/clusters/${clusterId}`, {
  method: 'DELETE',
});

export const publishCluster = (clusterId) => fetchWithAuth(`/api/clusters/${clusterId}/publish`, {
  method: 'POST',
});

// The image upload is a special case because it uses FormData, not JSON.
export const uploadImage = async (clusterId, imageType, formData) => {
  const user = getCurrentUser();
  if (!user) throw new Error('User is not authenticated.');

  const idToken = await user.getIdToken(true);

  const response = await fetch(`${API_BASE_URL}/api/clusters/${clusterId}/image?type=${imageType}`, {
    method: 'POST',
    headers: { 
      // NOTE: We do NOT set 'Content-Type' here. The browser does it automatically for FormData.
      'Authorization': `Bearer ${idToken}` 
    },
    body: formData,
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Image upload failed.');
  }
  return result;
};