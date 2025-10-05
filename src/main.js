// src/main.js

import { onAuthReady, logout } from './auth.js';
import { initDashboard } from './Pages/dashboard.js';
import { initCreateClusterForm } from './Pages/createClusterForm.js';
import { initEditClusterForm } from './Pages/editClusterForm.js';
import { initUploadPage } from './Pages/uploadPage.js';
import { initLoginForm } from './Pages/loginForm.js';
import { initAdminDashboard } from './Pages/adminDashboard.js';

window.addEventListener('load', () => {
  onAuthReady.then(user => {
    console.log("SCL Hub App Initialized. User:", user ? user.email : "Logged out");

    // --- Page Router with "else if" for exclusivity ---
    
    // IMPORTANT: The most specific routes should come first.
    // The Admin Dashboard is the most specific, as it contains other forms.
    if (document.getElementById('addy-search-form')) {
      console.log("Router: Initializing ADMIN DASHBOARD page.");
      initAdminDashboard();
    } 
    // Only check for the other pages if we are NOT on the admin dashboard.
    else if (document.getElementById('dashboard-wrapper')) {
      console.log("Router: Initializing Dashboard page.");
      initDashboard();
    } 
    else if (document.getElementById('create-cluster-form')) {
      console.log("Router: Initializing Create Cluster page.");
      initCreateClusterForm();
    } 
    else if (document.getElementById('edit-cluster-form')) {
      console.log("Router: Initializing Edit Cluster page.");
      initEditClusterForm();
    } 
    else if (document.getElementById('upload-images-wrapper')) {
      console.log("Router: Initializing Upload Images page.");
      initUploadPage();
    } 
    else if (document.getElementById('auth-form')) { 
      console.log("Router: Initializing Login Form page.");
      initLoginForm(); 
    }

    // --- Global Event Listeners ---
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
      logoutButton.addEventListener('click', logout);
    }

  }).catch(error => {
    console.error("A critical error occurred while starting the application:", error);
    alert("The application could not start. Please refresh the page.");
  });
});