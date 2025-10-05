// src/Pages/adminDashboard.js

function createAuthHeader(username, password) {
    const credentials = `${username}:${password}`;
    const encodedCredentials = btoa(credentials);
    return `Basic ${encodedCredentials}`;
}

export function initAdminDashboard() {
    console.log("ADMIN DASHBOARD: Initializing.");

    // --- 1. Element Selectors ---
    const searchForm = document.getElementById('addy-search-form');
    if (!searchForm) {
        console.error("Admin Dashboard FATAL ERROR: Could not find the core element '#addy-search-form'. The script cannot run on this page.");
        return;
    }

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
    const mainContent = document.getElementById('admin-main-content');

    let currentCluster = { id: null };

    // --- 2. Authentication ---
    const adminUsername = prompt("Enter Admin Username:");
    const adminPassword = prompt("Enter Admin Password:");
    if (!adminUsername || !adminPassword) {
        alert("Authentication failed. Page functionality will be disabled.");
        if (searchForm) searchForm.style.display = 'none';
        return;
    }
    const adminAuthHeader = createAuthHeader(adminUsername, adminPassword);

    // --- 3. Attach All Event Listeners with Safety Checks ---

    if (searchForm) {
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const clusterId = searchInput.value.trim();
            if (!clusterId) {
                alert("Please enter a Cluster ID.");
                return;
            }
            if (searchButton) {
                searchButton.value = "Searching...";
                searchButton.disabled = true;
            }
            try {
                const response = await fetch(`https://scl-user-acc-api.vercel.app/api/admin/cluster/${clusterId}`, { headers: { 'Authorization': adminAuthHeader } });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Failed to fetch cluster data.');
                currentCluster.id = clusterId;
                populateDashboard(data);
            } catch (error) {
                console.error("Admin search error:", error);
                alert(`Error: ${error.message}`);
            } finally {
                if (searchButton) {
                    searchButton.value = "Search";
                    searchButton.disabled = false;
                }
            }
        });
    }

    if (publishButton) {
        publishButton.addEventListener('click', async () => {
            if (!currentCluster.id) return;
            publishButton.value = "Publishing...";
            publishButton.disabled = true;
            try {
                const response = await fetch(`https://scl-user-acc-api.vercel.app/api/admin/cluster/${currentCluster.id}/publish`, { method: 'POST', headers: { 'Authorization': adminAuthHeader } });
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
    }

    if (deleteButton) {
        deleteButton.addEventListener('click', () => {
            if (!currentCluster.id) return;
            const clusterName = clusterNameDisplay ? clusterNameDisplay.textContent : "this cluster";
            if (confirm(`Are you sure you want to permanently delete "${clusterName}"? This action is irreversible.`)) {
                const deleteUrl = `https://scl-user-acc-api.vercel.app/api/admin/delete-cluster/${currentCluster.id}`;
                window.open(deleteUrl, '_blank');
            }
        });
    }

    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentCluster.id) return;
            if (saveChangesButton) {
                saveChangesButton.value = "Saving...";
                saveChangesButton.disabled = true;
            }
            
            const quillEditor = Quill.find(document.querySelector('#long-description-editor-edit'));
            
            const updatedData = {
                'name': editForm['cluster-name'].value, // Webflow slug also uses 'name'
                'slug': editForm['cluster-name'].value.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 255),
                'cluster-name': editForm['cluster-name'].value,
                'cluster-short-description---max-100-characters': editForm['cluster-short-description---max-100-characters'].value,
                'cluster-description-rich': quillEditor ? quillEditor.root.innerHTML : '',
                'discord-username': editForm['discord-username'].value,
                'discord-invite-link': editForm['discord-invite-link'].value,
                'website-link-optional': editForm['website-link-optional'].value,
                'cluster-location': editForm['cluster-location'].value,
                'game': editForm['game'].value,
                'game-version': editForm['game-version'].value,
                'game-type': editForm['game-type'].value,
                'game-mode': editForm['game-mode'].value,
                'number-of-maps': parseInt(editForm['number-of-maps'].value, 10),
                'tribe-size': editForm['tribe-size'].value,
                'harvest-rates': editForm['harvest-rates'].value,
                'platforms-pc': document.getElementById('platforms-pc-edit').checked,
                'platforms-xbox': document.getElementById('platforms-xbox-edit').checked,
                'platforms-playstation': document.getElementById('platforms-playstation-edit').checked,
                'windows-10-11': document.getElementById('windows-10-11-edit').checked
            };

            try {
                const response = await fetch(`https://scl-user-acc-api.vercel.app/api/admin/cluster/${currentCluster.id}`, { 
                    method: 'PATCH', 
                    headers: { 'Authorization': adminAuthHeader, 'Content-Type': 'application/json' }, 
                    body: JSON.stringify(updatedData) 
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message);
                alert("Cluster details saved successfully!");
            } catch (error) {
                alert(`Save Error: ${error.message}`);
            } finally {
                if (saveChangesButton) {
                    saveChangesButton.value = "Save Changes";
                    saveChangesButton.disabled = false;
                }
            }
        });
    }

    const handleAdminImageUpload = async (event, imageType) => {
        if (!currentCluster.id) return;
        const fileInput = event.target;
        const imageFile = fileInput.files[0];
        const label = fileInput.previousElementSibling;
        if (!imageFile) return;

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
            
            let previewEl;
            if (imageType === 'logo-1-1') previewEl = logoPreview;
            if (imageType === 'banner-16-9') previewEl = banner169Preview;
            if (imageType === 'banner-9-16') previewEl = banner916Preview;

            if (previewEl) {
                previewEl.src = result.imageUrl + `?t=${new Date().getTime()}`;
                previewEl.style.display = 'block';
            }

        } catch (error) {
            alert(`Upload Error: ${error.message}`);
            if (label) label.textContent = 'Upload Failed';
        } finally {
            fileInput.disabled = false;
        }
    };

    if (logoUploadInput) logoUploadInput.addEventListener('change', (e) => handleAdminImageUpload(e, 'logo-1-1'));
    if (banner169UploadInput) banner169UploadInput.addEventListener('change', (e) => handleAdminImageUpload(e, 'banner-16-9'));
    if (banner916UploadInput) banner916UploadInput.addEventListener('change', (e) => handleAdminImageUpload(e, 'banner-9-16'));


    // --- 4. Data Population Function ---
    function populateDashboard(data) {
        console.log("ADMIN DASHBOARD: Populating with data:", data);

        if(clusterNameDisplay) clusterNameDisplay.textContent = data.webflow.fieldData['cluster-name'] || 'N/A';
        if(userEmailDisplay) userEmailDisplay.textContent = `User: ${data.owner.email || 'N/A'}`;

        const { fieldData } = data.webflow;
        const setValue = (name, value) => {
            if (editForm && editForm[name]) {
                editForm[name].value = value || '';
            }
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

        const pcCheckbox = document.getElementById('platforms-pc-edit');
        if (pcCheckbox) pcCheckbox.checked = fieldData['platforms-pc'];
        const xboxCheckbox = document.getElementById('platforms-xbox-edit');
        if (xboxCheckbox) xboxCheckbox.checked = fieldData['platforms-xbox'];
        const psCheckbox = document.getElementById('platforms-playstation-edit');
        if (psCheckbox) psCheckbox.checked = fieldData['platforms-playstation'];
        const winCheckbox = document.getElementById('windows-10-11-edit');
        if (winCheckbox) winCheckbox.checked = fieldData['windows-10-11'];
        
        const quillEditor = Quill.find(document.querySelector('#long-description-editor-edit'));
        if (quillEditor) {
            quillEditor.root.innerHTML = fieldData['cluster-description-rich'] || '';
        }
        
        const populatePreview = (previewEl, asset) => {
            if (previewEl) {
                if (asset && asset.url) {
                    previewEl.src = asset.url;
                    previewEl.style.display = 'block';
                } else {
                    previewEl.style.display = 'none';
                }
            }
        };

        populatePreview(logoPreview, data.assets['logo-1-1']);
        populatePreview(banner169Preview, data.assets['banner-16-9']);
        populatePreview(banner916Preview, data.assets['banner-9-16']);
        
        if (mainContent) mainContent.style.display = 'block';
    }
}