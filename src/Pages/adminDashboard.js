// src/Pages/adminDashboard.js

// This is a helper function to create the Basic Auth header needed for our admin API calls.
function createAuthHeader(username, password) {
    const credentials = `${username}:${password}`;
    const encodedCredentials = btoa(credentials); // btoa() is a browser function to Base64 encode
    return `Basic ${encodedCredentials}`;
}

// This is the main initialization function for the admin dashboard page.
export function initAdminDashboard() {
    console.log("ADMIN DASHBOARD: Initializing.");

    // --- 1. Element Selectors ---
    // We get all the interactive elements from the page.
    const searchForm = document.getElementById('addy-search-form');
    const searchInput = document.getElementById('addy-search-input');
    const searchButton = document.getElementById('addy-search-button');
    
    const clusterNameDisplay = document.getElementById('cluster-name-display');
    const userEmailDisplay = document.getElementById('user-email-display');

    const publishButton = document.getElementById('admin-publish-cluster');
    const deleteButton = document.getElementById('admin-delete-cluster');

    const logoUploadInput = document.getElementById('admin-logo-image-upload-input');
    const banner169UploadInput = document.getElementById('admin-banner-16-9-upload-input');
    const banner916UploadInput = document.getElementById('admin-banner-9-16-upload-input');

    const logoPreview = document.getElementById('admin-logo-image-preview');
    const banner169Preview = document.getElementById('admin-banner-16-9-preview');
    const banner916Preview = document.getElementById('admin-banner-9-16-preview');

    const editForm = document.getElementById('admin-edit-cluster-form')?.querySelector('form');
    const saveChangesButton = document.getElementById('admin-save-changes');

    // This object will hold the state for the currently loaded cluster.
    let currentCluster = {
        id: null,
        username: '',
        password: ''
    };

    // --- 2. Authentication ---
    // Prompt for credentials as soon as the page logic loads.
    const adminUsername = prompt("Enter Admin Username:");
    const adminPassword = prompt("Enter Admin Password:");

    if (!adminUsername || !adminPassword) {
        alert("Authentication failed. Page functionality will be disabled.");
        return; // Stop execution if credentials are not provided.
    }
    
    const adminAuthHeader = createAuthHeader(adminUsername, adminPassword);

    // --- 3. Main "Search" Functionality ---
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const clusterId = searchInput.value.trim();
        if (!clusterId) {
            alert("Please enter a Cluster ID.");
            return;
        }

        searchButton.value = "Searching...";
        searchButton.disabled = true;

        try {
            const response = await fetch(`https://scl-user-acc-api.vercel.app/api/admin/cluster/${clusterId}`, {
                headers: { 'Authorization': adminAuthHeader }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch cluster data.');
            }
            
            // Store the loaded cluster ID for other functions to use.
            currentCluster.id = clusterId;
            populateDashboard(data); // Call the function to fill the page with the fetched data.

        } catch (error) {
            console.error("Admin search error:", error);
            alert(`Error: ${error.message}`);
        } finally {
            searchButton.value = "Search";
            searchButton.disabled = false;
        }
    });

    // --- 4. Data Population Function ---
    function populateDashboard(data) {
        console.log("ADMIN DASHBOARD: Populating with data:", data);

        // Populate top-level info
        clusterNameDisplay.textContent = data.webflow.fieldData['cluster-name'] || 'N/A';
        userEmailDisplay.textContent = `User: ${data.owner.email || 'N/A'}`;

        // Populate the edit form
        const { fieldData } = data.webflow;
        const setValue = (name, value) => {
            if (editForm[name]) editForm[name].value = value || '';
        };
        
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

        
        // Populate image previews
        const populatePreview = (previewEl, asset) => {
            if (asset && asset.url) {
                previewEl.src = asset.url;
                previewEl.style.display = 'block';
            } else {
                previewEl.style.display = 'none';
            }
        };

        populatePreview(logoPreview, data.assets['logo-1-1']);
        populatePreview(banner169Preview, data.assets['banner-16-9']);
        populatePreview(banner916Preview, data.assets['banner-9-16']);
        
        // Make the main content visible
        document.getElementById('admin-main-content').style.display = 'block';
    }

    // --- 5. Action Button Listeners ---

    // Publish Button
    publishButton.addEventListener('click', async () => {
        if (!currentCluster.id) return;
        
        publishButton.value = "Publishing...";
        publishButton.disabled = true;

        try {
            const response = await fetch(`https://scl-user-acc-api.vercel.app/api/admin/cluster/${currentCluster.id}/publish`, {
                method: 'POST',
                headers: { 'Authorization': adminAuthHeader }
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            alert(result.message);
        } catch (error) {
            alert(`Publish Error: ${error.message}`);
        } finally {
            publishButton.value = "Publish";
            publishButton.disabled = false;
        }
    });

    // Delete Button (Tricky Part)
    deleteButton.addEventListener('click', () => {
        if (!currentCluster.id) return;

        const clusterName = clusterNameDisplay.textContent || "this cluster";
        if (confirm(`Are you sure you want to permanently delete "${clusterName}"? This action is irreversible.`)) {
            const deleteUrl = `https://scl-user-acc-api.vercel.app/api/admin/delete-cluster/${currentCluster.id}`;
            // Open the special delete URL in a new tab. This will trigger the browser's native auth prompt.
            window.open(deleteUrl, '_blank');
        }
    });

    // Save Changes (Form Submit) Button
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentCluster.id) return;

        saveChangesButton.value = "Saving...";
        saveChangesButton.disabled = true;

        // Construct the data object from the form
        const updatedData = {
            'cluster-name': editForm['cluster-name'].value,
            'cluster-short-description---max-100-characters': editForm['cluster-short-description---max-100-characters'].value,
            // ... (gather all other fields from the form)
        };

        try {
            const response = await fetch(`https://scl-user-acc-api.vercel.app/api/admin/cluster/${currentCluster.id}`, {
                method: 'PATCH',
                headers: { 
                    'Authorization': adminAuthHeader,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedData)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            alert("Cluster details saved successfully!");
        } catch (error) {
            alert(`Save Error: ${error.message}`);
        } finally {
            saveChangesButton.value = "Save Changes";
            saveChangesButton.disabled = false;
        }
    });

    // --- 6. Image Upload Listeners ---
    const handleAdminImageUpload = async (event, imageType) => {
        if (!currentCluster.id) return;
        
        const fileInput = event.target;
        const imageFile = fileInput.files[0];
        const label = fileInput.previousElementSibling;

        if (!imageFile) return;

        // You can add file type/size validation here if you wish

        const formData = new FormData();
        formData.append('image', imageFile);

        if (label) label.textContent = 'Uploading...';
        fileInput.disabled = true;

        try {
            const response = await fetch(`https://scl-user-acc-api.vercel.app/api/admin/cluster/${currentCluster.id}/image?type=${imageType}`, {
                method: 'POST',
                headers: { 'Authorization': adminAuthHeader },
                body: formData
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);

            if (label) label.textContent = 'Upload Complete!';
            
            // Update the correct preview image
            const previewEl = document.getElementById(`admin-${imageType}-preview`);
            if (previewEl) {
                previewEl.src = result.imageUrl + `?t=${new Date().getTime()}`; // Cache-busting
            }

        } catch (error) {
            alert(`Upload Error: ${error.message}`);
            if (label) label.textContent = 'Upload Failed';
        } finally {
            fileInput.disabled = false;
        }
    };

    logoUploadInput.addEventListener('change', (e) => handleAdminImageUpload(e, 'logo-1-1'));
    banner169UploadInput.addEventListener('change', (e) => handleAdminImageUpload(e, 'banner-16-9'));
    banner916UploadInput.addEventListener('change', (e) => handleAdminImageUpload(e, 'banner-9-16'));
}