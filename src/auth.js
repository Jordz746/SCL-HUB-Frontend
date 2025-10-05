// src/auth.js

import { firebaseConfig } from './config.js';

// Initialize Firebase only once
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// This variable will hold the current user object
let currentUser = null;

// We create a Promise that will resolve once the initial authentication check is done.
// This prevents other code from running before we know if the user is logged in or not.
const authReady = new Promise(resolve => {
  auth.onAuthStateChanged(user => {
    currentUser = user;
    
    // --- Handle Global Redirects and UI Element Visibility ---
    const protectedPages = ['/dashboard', '/create-cluster', '/upload-images', '/edit-cluster'];
    const loginPage = '/login';
    const dashboardPage = '/dashboard';
    const currentPage = window.location.pathname;

    const loggedOutElements = document.querySelectorAll('.logged-out-element');
    const loggedInElements = document.querySelectorAll('.logged-in-element');

    if (user) {
        // User is logged in
        loggedOutElements.forEach(el => el.style.display = 'none');
        loggedInElements.forEach(el => el.style.display = 'flex'); // Use 'flex' or 'block' as per your Webflow design
        
        // If they are on the login page, redirect them to their dashboard
        if (currentPage === loginPage) { 
            window.location.href = dashboardPage; 
        }
    } else {
        // User is logged out
        loggedOutElements.forEach(el => el.style.display = 'block');
        loggedInElements.forEach(el => el.style.display = 'none');
        
        // If they are on a protected page, redirect them to the login page
        if (protectedPages.includes(currentPage)) {
            window.location.href = loginPage;
        }
    }
    
    // The check is complete. Resolve the promise with the user object.
    resolve(user);
  });
});

// A simple function that any other file can import to get the current user
export const getCurrentUser = () => currentUser;

// Export the promise itself so our main script can wait for it
export const onAuthReady = authReady;

export const logout = () => {
  if (confirm("Are you sure you want to log out?")) {
    auth.signOut().then(() => {
        // The onAuthStateChanged listener will handle the redirect.
        alert("You have been successfully logged out."); // <-- ADD THIS LINE
    }).catch(error => {
        console.error('Logout Error:', error);
        alert('An error occurred during logout.');
    });
  }
};