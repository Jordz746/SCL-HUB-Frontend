// src/main.js

import { onAuthReady, logout } from './auth.js';
import { initDashboard } from './Pages/dashboard.js';
import { initCreateClusterForm } from './Pages/createClusterForm.js';
import { initEditClusterForm } from './Pages/editClusterForm.js';
import { initUploadPage } from './Pages/uploadPage.js';
import { initLoginForm } from './Pages/loginForm.js';
import { initAdminDashboard } from './Pages/adminDashboard.js'; // <-- STEP 1: IMPORT THE NEW MODULE

// The main function that runs after the page's HTML is loaded
document.addEventListener('DOMContentLoaded', () => {
  
  // First, wait for our auth.js module to tell us if a user is logged in.
  onAuthReady.then(user => {
    console.log("SCL Hub App Initialized. User:", user ? user.email : "Logged out");

    // --- Page Router ---
    // This simple "router" checks for a unique element on each page
    // and runs the corresponding initialization function.
    if (document.getElementById('dashboard-wrapper')) {
      console.log("Router: Initializing Dashboard page.");
      initDashboard();
    }
    if (document.getElementById('create-cluster-form')) {
      console.log("Router: Initializing Create Cluster page.");
      initCreateClusterForm();
    }
    if (document.getElementById('edit-cluster-form')) {
      console.log("Router: Initializing Edit Cluster page.");
      initEditClusterForm();
    }
    if (document.getElementById('upload-images-wrapper')) {
      console.log("Router: Initializing Upload Images page.");
      initUploadPage();
    }
    if (document.getElementById('auth-form')) { 
      console.log("Router: Initializing Login Form page.");
      initLoginForm(); 
    }
    
    // v-- STEP 2: ADD THIS BLOCK TO THE ROUTER --v
    if (document.getElementById('addy-search-form')) {
      console.log("Router: Initializing ADMIN DASHBOARD page.");
      initAdminDashboard();
    }
    // ^-- END OF NEW BLOCK --^

    // These are for elements that appear on every page, like the logout button.
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
      logoutButton.addEventListener('click', logout);
    }

  }).catch(error => {
    // This will catch any critical errors during app initialization
    console.error("A critical error occurred while starting the application:", error);
    alert("The application could not start. Please refresh the page.");
  });
});