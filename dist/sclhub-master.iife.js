(function() {
  "use strict";
  const firebaseConfig = {
    apiKey: "AIzaSyBCrX7_QOqAU3RWeey21zfgIxHZTGdis_E",
    authDomain: "scl-hub.firebaseapp.com",
    projectId: "scl-hub",
    storageBucket: "scl-hub.firebasestorage.app",
    messagingSenderId: "690767704108",
    appId: "1:690767704108:web:ad749488d13fe32de4a189"
  };
  const API_BASE_URL = "https://scl-user-acc-api.vercel.app";
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  let currentUser = null;
  const authReady = new Promise((resolve) => {
    auth.onAuthStateChanged((user) => {
      currentUser = user;
      const protectedPages = ["/dashboard", "/create-cluster", "/upload-images", "/edit-cluster"];
      const loginPage = "/login";
      const dashboardPage = "/dashboard";
      const currentPage = window.location.pathname;
      const loggedOutElements = document.querySelectorAll(".logged-out-element");
      const loggedInElements = document.querySelectorAll(".logged-in-element");
      if (user) {
        loggedOutElements.forEach((el) => el.style.display = "none");
        loggedInElements.forEach((el) => el.style.display = "flex");
        if (currentPage === loginPage) {
          window.location.href = dashboardPage;
        }
      } else {
        loggedOutElements.forEach((el) => el.style.display = "block");
        loggedInElements.forEach((el) => el.style.display = "none");
        if (protectedPages.includes(currentPage)) {
          window.location.href = loginPage;
        }
      }
      resolve(user);
    });
  });
  const getCurrentUser$1 = () => currentUser;
  const onAuthReady = authReady;
  const logout = () => {
    if (confirm("Are you sure you want to log out?")) {
      auth.signOut().then(() => {
        alert("You have been successfully logged out.");
      }).catch((error) => {
        console.error("Logout Error:", error);
        alert("An error occurred during logout.");
      });
    }
  };
  async function fetchWithAuth(endpoint, options = {}) {
    const user = getCurrentUser$1();
    if (!user) {
      throw new Error("User is not authenticated.");
    }
    const idToken = await user.getIdToken(true);
    const headers = {
      "Authorization": `Bearer ${idToken}`,
      "Content-Type": "application/json",
      ...options.headers
      // Allow custom headers to be added if needed
    };
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || `API request to ${endpoint} failed.`);
    }
    return result;
  }
  const getClusters = () => fetchWithAuth("/api/clusters");
  const getClusterById = (clusterId) => fetchWithAuth(`/api/clusters/${clusterId}`);
  const createCluster = (data) => fetchWithAuth("/api/clusters", {
    method: "POST",
    body: JSON.stringify(data)
  });
  const updateCluster = (clusterId, data) => fetchWithAuth(`/api/clusters/${clusterId}`, {
    method: "PATCH",
    body: JSON.stringify(data)
  });
  const deleteCluster = (clusterId) => fetchWithAuth(`/api/clusters/${clusterId}`, {
    method: "DELETE"
  });
  const publishCluster = (clusterId) => fetchWithAuth(`/api/clusters/${clusterId}/publish`, {
    method: "POST"
  });
  const uploadImage = async (clusterId, imageType, formData) => {
    const user = getCurrentUser$1();
    if (!user) throw new Error("User is not authenticated.");
    const idToken = await user.getIdToken(true);
    const response = await fetch(`${API_BASE_URL}/api/clusters/${clusterId}/image?type=${imageType}`, {
      method: "POST",
      headers: {
        // NOTE: We do NOT set 'Content-Type' here. The browser does it automatically for FormData.
        "Authorization": `Bearer ${idToken}`
      },
      body: formData
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Image upload failed.");
    }
    return result;
  };
  function initDashboard() {
    const clusterListWrapper = document.getElementById("cluster-list-wrapper");
    const clusterList = clusterListWrapper == null ? void 0 : clusterListWrapper.querySelector(".w-dyn-items");
    const template = clusterList == null ? void 0 : clusterList.querySelector(".w-dyn-item");
    const emptyState = document.getElementById("empty-state");
    if (!clusterList || !template) {
      console.error("Dashboard Error: Could not find essential list elements (cluster-list or template item).");
      return;
    }
    template.style.display = "none";
    if (emptyState) emptyState.style.display = "none";
    getClusters().then(({ items }) => {
      const existingItems = clusterList.querySelectorAll(".w-dyn-item:not(.is-template)");
      existingItems.forEach((item) => item.remove());
      if (items && items.length > 0) {
        if (emptyState) emptyState.style.display = "none";
        items.forEach((item) => {
          const clone = template.cloneNode(true);
          clone.classList.remove("is-template");
          clone.style.display = "block";
          const nameEl = clone.querySelector(".cluster-name-text");
          if (nameEl) nameEl.textContent = item.fieldData.name;
          const imageEl = clone.querySelector(".cluster-image");
          const imageUrl = item.fieldData["16-9-banner-image-link"];
          if (imageEl && imageUrl) {
            imageEl.src = imageUrl;
          }
          const editBtn = clone.querySelector(".edit-button");
          if (editBtn) {
            editBtn.addEventListener("click", () => {
              window.location.href = `/upload-images?id=${item.id}&name=${encodeURIComponent(item.fieldData.name)}`;
            });
          }
          const deleteBtn = clone.querySelector(".delete-button");
          if (deleteBtn) {
            deleteBtn.addEventListener("click", async () => {
              if (!confirm(`Are you sure you want to delete "${item.fieldData.name}"? This cannot be undone.`)) {
                return;
              }
              try {
                await deleteCluster(item.id);
                alert("Cluster deleted successfully!");
                clone.remove();
                const remainingItems = clusterList.querySelectorAll(".w-dyn-item:not(.is-template)");
                if (remainingItems.length === 0 && emptyState) {
                  emptyState.style.display = "block";
                }
              } catch (error) {
                console.error("Delete Error:", error);
                alert(`Error: ${error.message}`);
              }
            });
          }
          clusterList.appendChild(clone);
        });
      } else {
        if (emptyState) {
          emptyState.style.display = "block";
        }
      }
    }).catch((error) => {
      console.error("Failed to load dashboard clusters:", error);
      alert("Could not load your clusters. Please try refreshing the page.");
      if (emptyState) emptyState.style.display = "block";
    });
  }
  function initCreateClusterForm() {
    var _a;
    const createClusterForm = (_a = document.getElementById("create-cluster-form")) == null ? void 0 : _a.querySelector("form");
    if (!createClusterForm) return;
    const longDescriptionEditorDiv = document.getElementById("long-description-editor");
    const longDescriptionInput = document.getElementById("long-description-input");
    let quillEditor = null;
    if (longDescriptionEditorDiv && longDescriptionInput) {
      quillEditor = new Quill("#long-description-editor", {
        theme: "snow",
        modules: {
          toolbar: [
            ["bold", "italic", "underline"],
            [{ "list": "ordered" }, { "list": "bullet" }],
            ["link"]
          ]
        }
      });
      quillEditor.on("text-change", function() {
        longDescriptionInput.value = quillEditor.root.innerHTML;
      });
    }
    createClusterForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!getCurrentUser()) {
        alert("You must be logged in to create a cluster.");
        return;
      }
      const submitButton = e.submitter;
      submitButton.value = "Creating...";
      submitButton.disabled = true;
      const formData = new FormData(createClusterForm);
      const clusterData = {
        clusterName: formData.get("cluster-name"),
        shortDescription: formData.get("cluster-short-description---max-100-characters"),
        longDescription: quillEditor ? quillEditor.root.innerHTML : "",
        // Get content from Quill
        discordUsername: formData.get("discord-username"),
        discordInviteLink: formData.get("discord-invite-link"),
        websiteLink: formData.get("website-link-optional"),
        clusterLocation: formData.get("cluster-location"),
        game: formData.get("game"),
        gameVersion: formData.get("game-version"),
        gameType: formData.get("game-type"),
        gameMode: formData.get("game-mode"),
        numberOfMaps: formData.get("number-of-maps"),
        tribeSize: formData.get("tribe-size"),
        harvestRates: formData.get("harvest-rates"),
        platformsPc: document.getElementById("platforms-pc").checked,
        platformsXbox: document.getElementById("platforms-xbox").checked,
        platformsPlaystation: document.getElementById("platforms-playstation").checked,
        windows1011: document.getElementById("windows-10-11").checked
      };
      try {
        const result = await createCluster(clusterData);
        window.location.href = `/upload-images?id=${result.clusterId}&name=${encodeURIComponent(result.data.fieldData.name)}`;
      } catch (error) {
        console.error("Create Cluster Error:", error);
        alert("Error: " + error.message);
        submitButton.value = "Create Cluster";
        submitButton.disabled = false;
      }
    });
  }
  function initEditClusterForm() {
    var _a;
    const editClusterForm = (_a = document.getElementById("edit-cluster-form")) == null ? void 0 : _a.querySelector("form");
    if (!editClusterForm) return;
    const urlParams = new URLSearchParams(window.location.search);
    const clusterId = urlParams.get("id");
    if (!clusterId) {
      alert("Error: No Cluster ID found. Cannot edit this item.");
      editClusterForm.style.pointerEvents = "none";
      editClusterForm.style.opacity = "0.5";
      return;
    }
    const quillEditorEdit = new Quill("#long-description-editor-edit", {
      theme: "snow",
      modules: {
        toolbar: [
          ["bold", "italic", "underline"],
          [{ "list": "ordered" }, { "list": "bullet" }],
          ["link"]
        ]
      }
    });
    getClusterById(clusterId).then((result) => {
      const { fieldData } = result;
      const setValue = (name, value) => {
        if (editClusterForm[name]) {
          editClusterForm[name].value = value || "";
        }
      };
      setValue("cluster-name", fieldData["cluster-name"]);
      setValue("cluster-short-description---max-100-characters", fieldData["cluster-short-description---max-100-characters"]);
      setValue("discord-username", fieldData["discord-username"]);
      setValue("discord-invite-link", fieldData["discord-invite-link"]);
      setValue("website-link-optional", fieldData["website-link-optional"]);
      setValue("cluster-location", fieldData["cluster-location"]);
      setValue("game", fieldData["game"]);
      setValue("game-version", fieldData["game-version"]);
      setValue("game-type", fieldData["game-type"]);
      setValue("game-mode", fieldData["game-mode"]);
      setValue("number-of-maps", fieldData["number-of-maps"]);
      setValue("tribe-size", fieldData["tribe-size"]);
      setValue("harvest-rates", fieldData["harvest-rates"]);
      document.getElementById("platforms-pc-edit").checked = fieldData["platforms-pc"];
      document.getElementById("platforms-xbox-edit").checked = fieldData["platforms-xbox"];
      document.getElementById("platforms-playstation-edit").checked = fieldData["platforms-playstation"];
      document.getElementById("windows-10-11-edit").checked = fieldData["windows-10-11"];
      if (fieldData["cluster-description-rich"]) {
        quillEditorEdit.root.innerHTML = fieldData["cluster-description-rich"];
      }
    }).catch((error) => {
      alert("Could not load cluster data to edit. Please go back and try again.");
      console.error("Failed to fetch cluster data for editing:", error);
    });
    editClusterForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitButton = e.submitter;
      submitButton.value = "Updating...";
      submitButton.disabled = true;
      const updatedData = {
        clusterName: editClusterForm["cluster-name"].value,
        shortDescription: editClusterForm["cluster-short-description---max-100-characters"].value,
        longDescription: quillEditorEdit.root.innerHTML,
        discordUsername: editClusterForm["discord-username"].value,
        discordInviteLink: editClusterForm["discord-invite-link"].value,
        websiteLink: editClusterForm["website-link-optional"].value,
        clusterLocation: editClusterForm["cluster-location"].value,
        game: editClusterForm["game"].value,
        gameVersion: editClusterForm["game-version"].value,
        gameType: editClusterForm["game-type"].value,
        gameMode: editClusterForm["game-mode"].value,
        numberOfMaps: editClusterForm["number-of-maps"].value,
        tribeSize: editClusterForm["tribe-size"].value,
        harvestRates: editClusterForm["harvest-rates"].value,
        platformsPc: document.getElementById("platforms-pc-edit").checked,
        platformsXbox: document.getElementById("platforms-xbox-edit").checked,
        platformsPlaystation: document.getElementById("platforms-playstation-edit").checked,
        windows1011: document.getElementById("windows-10-11-edit").checked
      };
      try {
        const result = await updateCluster(clusterId, updatedData);
        alert("Cluster updated successfully! Returning to the review page.");
        window.location.href = `/upload-images?id=${clusterId}&name=${encodeURIComponent(result.data.fieldData.name)}`;
      } catch (error) {
        console.error("Update Cluster Error:", error);
        alert("Error: " + error.message);
        submitButton.value = "Save Changes";
        submitButton.disabled = false;
      }
    });
  }
  function initUploadPage() {
    var _a, _b, _c;
    const uploadPageWrapper = document.getElementById("upload-images-wrapper");
    if (!uploadPageWrapper) return;
    const urlParams = new URLSearchParams(window.location.search);
    const clusterId = urlParams.get("id");
    if (!clusterId) {
      const clusterNameDisplay = document.getElementById("cluster-name-display");
      if (clusterNameDisplay) {
        clusterNameDisplay.textContent = "Error: No Cluster ID found in URL. Please go back to your dashboard.";
      }
      const imageUploadSection = document.getElementById("image-upload-section");
      if (imageUploadSection) imageUploadSection.style.display = "none";
      return;
    }
    getClusterById(clusterId).then((result) => {
      const { fieldData } = result;
      const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value || "N/A";
      };
      setText("cluster-name-display", fieldData["cluster-name"]);
      setText("cluster-short-display", fieldData["cluster-short-description---max-100-characters"]);
      setText("discord-name-display", fieldData["discord-username"]);
      setText("discord-invite-link-display", fieldData["discord-invite-link"]);
      setText("cluster-location-display", fieldData["cluster-location"]);
      setText("game-display", fieldData["game"]);
      setText("game-version-display", fieldData["game-version"]);
      setText("game-type-display", fieldData["game-type"]);
      setText("game-mode-display", fieldData["game-mode"]);
      setText("number-of-maps-display", fieldData["number-of-maps"]);
      setText("tribe-size-display", fieldData["tribe-size"]);
      setText("harvest-rates-display", fieldData["harvest-rates"]);
      setText("cluster-slug-display", fieldData["slug"]);
      const longDescDisplay = document.getElementById("cluster-description-display");
      if (longDescDisplay) {
        longDescDisplay.innerHTML = fieldData["cluster-description-rich"] || "<p>No description provided.</p>";
      }
    }).catch((error) => {
      console.error("Failed to fetch cluster data:", error);
      const clusterNameDisplay = document.getElementById("cluster-name-display");
      if (clusterNameDisplay) clusterNameDisplay.textContent = "Could not load cluster data.";
    });
    const handleImageUpload = async (event, imageType) => {
      const fileInput = event.target;
      const imageFile = fileInput.files[0];
      const label = fileInput.previousElementSibling;
      if (!imageFile) return;
      const MAX_SIZE_MB = 3.5;
      if (imageFile.size > MAX_SIZE_MB * 1024 * 1024) {
        alert(`File is too large. Max size is ${MAX_SIZE_MB}MB.`);
        fileInput.value = "";
        return;
      }
      if (imageFile.type !== "image/webp") {
        alert("Invalid file type. Please upload a WEBP image.");
        fileInput.value = "";
        return;
      }
      const formData = new FormData();
      formData.append("image", imageFile);
      if (label) label.textContent = "Uploading...";
      fileInput.disabled = true;
      try {
        const result = await uploadImage(clusterId, imageType, formData);
        if (label) label.textContent = "Upload Complete!";
        const previewElement = document.getElementById(`${fileInput.id}-preview`);
        if (previewElement) {
          previewElement.src = result.imageUrl;
          previewElement.style.display = "block";
        }
      } catch (error) {
        console.error(`Upload error for ${imageType}:`, error);
        alert(`Error: ${error.message}`);
        if (label) label.textContent = "Upload Failed. Try Again.";
      } finally {
        fileInput.disabled = false;
      }
    };
    (_a = document.getElementById("logo-image-upload-input")) == null ? void 0 : _a.addEventListener("change", (e) => handleImageUpload(e, "logo-1-1"));
    (_b = document.getElementById("banner-16-9-upload-input")) == null ? void 0 : _b.addEventListener("change", (e) => handleImageUpload(e, "banner-16-9"));
    (_c = document.getElementById("banner-9-16-upload-input")) == null ? void 0 : _c.addEventListener("change", (e) => handleImageUpload(e, "banner-9-16"));
    const publishButton = document.getElementById("publish-cluster");
    const successBox = document.getElementById("Cluster-Success-Box");
    const errorBox = document.getElementById("Cluster-Error-Box");
    if (publishButton) {
      if (successBox) successBox.style.display = "none";
      if (errorBox) errorBox.style.display = "none";
      publishButton.addEventListener("click", async () => {
        publishButton.value = "Publishing...";
        publishButton.disabled = true;
        if (successBox) successBox.style.display = "none";
        if (errorBox) errorBox.style.display = "none";
        try {
          const result = await publishCluster(clusterId);
          if (successBox) {
            const successMessage = successBox.querySelector("p");
            if (successMessage) successMessage.textContent = result.message || "Cluster Published Successfully!";
            successBox.style.display = "block";
          } else {
            alert(result.message);
          }
          const slugDisplay = document.getElementById("cluster-slug-display");
          if (slugDisplay) {
            const linkElement = slugDisplay.querySelector("a") || document.createElement("a");
            linkElement.href = result.publishedUrl;
            linkElement.textContent = result.publishedUrl;
            linkElement.target = "_blank";
            if (!slugDisplay.querySelector("a")) {
              slugDisplay.innerHTML = "";
              slugDisplay.appendChild(linkElement);
            }
          }
        } catch (error) {
          if (errorBox) {
            const errorMessage = errorBox.querySelector("p");
            if (errorMessage) errorMessage.textContent = `Error: ${error.message}`;
            errorBox.style.display = "block";
          } else {
            alert(`Error: ${error.message}`);
          }
        } finally {
          publishButton.value = "Publish Cluster";
          publishButton.disabled = false;
        }
      });
    }
    const editButton = document.getElementById("edit-cluster-button");
    if (editButton) {
      editButton.addEventListener("click", () => {
        const clusterName = urlParams.get("name");
        window.location.href = `/edit-cluster?id=${clusterId}&name=${encodeURIComponent(clusterName)}`;
      });
    }
  }
  function initLoginForm() {
    var _a;
    const authForm = (_a = document.getElementById("auth-form")) == null ? void 0 : _a.querySelector("form");
    if (!authForm) return;
    const auth2 = firebase.auth();
    authForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = authForm.email.value;
      const password = authForm.password.value;
      const submitterId = e.submitter.id;
      const loginButton = document.getElementById("login-button");
      const signupButton = document.getElementById("signup-button");
      if (loginButton) loginButton.disabled = true;
      if (signupButton) signupButton.disabled = true;
      const reEnableButtons = () => {
        if (loginButton) loginButton.disabled = false;
        if (signupButton) signupButton.disabled = false;
      };
      if (submitterId === "signup-button") {
        auth2.createUserWithEmailAndPassword(email, password).catch((err) => {
          alert(`Signup Error: ${err.message}`);
          reEnableButtons();
        });
      } else if (submitterId === "login-button") {
        auth2.signInWithEmailAndPassword(email, password).catch((err) => {
          alert(`Login Error: ${err.message}`);
          reEnableButtons();
        });
      }
    });
  }
  function createAuthHeader(username, password) {
    const credentials = `${username}:${password}`;
    const encodedCredentials = btoa(credentials);
    return `Basic ${encodedCredentials}`;
  }
  function initAdminDashboard() {
    var _a;
    console.log("ADMIN DASHBOARD: Initializing.");
    const searchForm = document.getElementById("addy-search-form");
    const searchInput = document.getElementById("addy-search-input");
    const searchButton = document.getElementById("addy-search-button");
    const clusterNameDisplay = document.getElementById("cluster-name-display");
    const userEmailDisplay = document.getElementById("user-email-display");
    const publishButton = document.getElementById("admin-publish-cluster");
    const deleteButton = document.getElementById("admin-delete-cluster");
    const logoUploadInput = document.getElementById("admin-logo-image-upload-input");
    const banner169UploadInput = document.getElementById("admin-banner-16-9-upload-input");
    const banner916UploadInput = document.getElementById("admin-banner-9-16-upload-input");
    const logoPreview = document.getElementById("admin-logo-image-preview");
    const banner169Preview = document.getElementById("admin-banner-16-9-preview");
    const banner916Preview = document.getElementById("admin-banner-9-16-preview");
    const editForm = (_a = document.getElementById("admin-edit-cluster-form")) == null ? void 0 : _a.querySelector("form");
    const saveChangesButton = document.getElementById("admin-save-changes");
    let currentCluster = {
      id: null,
      username: "",
      password: ""
    };
    const adminUsername = prompt("Enter Admin Username:");
    const adminPassword = prompt("Enter Admin Password:");
    if (!adminUsername || !adminPassword) {
      alert("Authentication failed. Page functionality will be disabled.");
      return;
    }
    const adminAuthHeader = createAuthHeader(adminUsername, adminPassword);
    searchForm.addEventListener("submit", async (e) => {
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
          headers: { "Authorization": adminAuthHeader }
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch cluster data.");
        }
        currentCluster.id = clusterId;
        populateDashboard(data);
      } catch (error) {
        console.error("Admin search error:", error);
        alert(`Error: ${error.message}`);
      } finally {
        searchButton.value = "Search";
        searchButton.disabled = false;
      }
    });
    function populateDashboard(data) {
      console.log("ADMIN DASHBOARD: Populating with data:", data);
      clusterNameDisplay.textContent = data.webflow.fieldData["cluster-name"] || "N/A";
      userEmailDisplay.textContent = `User: ${data.owner.email || "N/A"}`;
      const { fieldData } = data.webflow;
      const setValue = (name, value) => {
        if (editForm[name]) editForm[name].value = value || "";
      };
      setValue("cluster-name", fieldData["cluster-name"]);
      setValue("cluster-short-description---max-100-characters", fieldData["cluster-short-description---max-100-characters"]);
      setValue("discord-username", fieldData["discord-username"]);
      setValue("discord-invite-link", fieldData["discord-invite-link"]);
      setValue("website-link-optional", fieldData["website-link-optional"]);
      setValue("cluster-location", fieldData["cluster-location"]);
      setValue("game", fieldData["game"]);
      setValue("game-version", fieldData["game-version"]);
      setValue("game-type", fieldData["game-type"]);
      setValue("game-mode", fieldData["game-mode"]);
      setValue("number-of-maps", fieldData["number-of-maps"]);
      setValue("tribe-size", fieldData["tribe-size"]);
      setValue("harvest-rates", fieldData["harvest-rates"]);
      document.getElementById("platforms-pc-edit").checked = fieldData["platforms-pc"];
      document.getElementById("platforms-xbox-edit").checked = fieldData["platforms-xbox"];
      document.getElementById("platforms-playstation-edit").checked = fieldData["platforms-playstation"];
      document.getElementById("windows-10-11-edit").checked = fieldData["windows-10-11"];
      const populatePreview = (previewEl, asset) => {
        if (asset && asset.url) {
          previewEl.src = asset.url;
          previewEl.style.display = "block";
        } else {
          previewEl.style.display = "none";
        }
      };
      populatePreview(logoPreview, data.assets["logo-1-1"]);
      populatePreview(banner169Preview, data.assets["banner-16-9"]);
      populatePreview(banner916Preview, data.assets["banner-9-16"]);
      document.getElementById("admin-main-content").style.display = "block";
    }
    publishButton.addEventListener("click", async () => {
      if (!currentCluster.id) return;
      publishButton.value = "Publishing...";
      publishButton.disabled = true;
      try {
        const response = await fetch(`https://scl-user-acc-api.vercel.app/api/admin/cluster/${currentCluster.id}/publish`, {
          method: "POST",
          headers: { "Authorization": adminAuthHeader }
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
    deleteButton.addEventListener("click", () => {
      if (!currentCluster.id) return;
      const clusterName = clusterNameDisplay.textContent || "this cluster";
      if (confirm(`Are you sure you want to permanently delete "${clusterName}"? This action is irreversible.`)) {
        const deleteUrl = `https://scl-user-acc-api.vercel.app/api/admin/delete-cluster/${currentCluster.id}`;
        window.open(deleteUrl, "_blank");
      }
    });
    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!currentCluster.id) return;
      saveChangesButton.value = "Saving...";
      saveChangesButton.disabled = true;
      const updatedData = {
        "cluster-name": editForm["cluster-name"].value,
        "cluster-short-description---max-100-characters": editForm["cluster-short-description---max-100-characters"].value
        // ... (gather all other fields from the form)
      };
      try {
        const response = await fetch(`https://scl-user-acc-api.vercel.app/api/admin/cluster/${currentCluster.id}`, {
          method: "PATCH",
          headers: {
            "Authorization": adminAuthHeader,
            "Content-Type": "application/json"
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
    const handleAdminImageUpload = async (event, imageType) => {
      if (!currentCluster.id) return;
      const fileInput = event.target;
      const imageFile = fileInput.files[0];
      const label = fileInput.previousElementSibling;
      if (!imageFile) return;
      const formData = new FormData();
      formData.append("image", imageFile);
      if (label) label.textContent = "Uploading...";
      fileInput.disabled = true;
      try {
        const response = await fetch(`https://scl-user-acc-api.vercel.app/api/admin/cluster/${currentCluster.id}/image?type=${imageType}`, {
          method: "POST",
          headers: { "Authorization": adminAuthHeader },
          body: formData
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        if (label) label.textContent = "Upload Complete!";
        const previewEl = document.getElementById(`admin-${imageType}-preview`);
        if (previewEl) {
          previewEl.src = result.imageUrl + `?t=${(/* @__PURE__ */ new Date()).getTime()}`;
        }
      } catch (error) {
        alert(`Upload Error: ${error.message}`);
        if (label) label.textContent = "Upload Failed";
      } finally {
        fileInput.disabled = false;
      }
    };
    logoUploadInput.addEventListener("change", (e) => handleAdminImageUpload(e, "logo-1-1"));
    banner169UploadInput.addEventListener("change", (e) => handleAdminImageUpload(e, "banner-16-9"));
    banner916UploadInput.addEventListener("change", (e) => handleAdminImageUpload(e, "banner-9-16"));
  }
  window.addEventListener("load", () => {
    onAuthReady.then((user) => {
      console.log("SCL Hub App Initialized. User:", user ? user.email : "Logged out");
      if (document.getElementById("addy-search-form")) {
        console.log("Router: Initializing ADMIN DASHBOARD page.");
        initAdminDashboard();
      } else if (document.getElementById("dashboard-wrapper")) {
        console.log("Router: Initializing Dashboard page.");
        initDashboard();
      } else if (document.getElementById("create-cluster-form")) {
        console.log("Router: Initializing Create Cluster page.");
        initCreateClusterForm();
      } else if (document.getElementById("edit-cluster-form")) {
        console.log("Router: Initializing Edit Cluster page.");
        initEditClusterForm();
      } else if (document.getElementById("upload-images-wrapper")) {
        console.log("Router: Initializing Upload Images page.");
        initUploadPage();
      } else if (document.getElementById("auth-form")) {
        console.log("Router: Initializing Login Form page.");
        initLoginForm();
      }
      const logoutButton = document.getElementById("logout-button");
      if (logoutButton) {
        logoutButton.addEventListener("click", logout);
      }
    }).catch((error) => {
      console.error("A critical error occurred while starting the application:", error);
      alert("The application could not start. Please refresh the page.");
    });
  });
})();
