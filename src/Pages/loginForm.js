// src/Pages/loginForm.js

export function initLoginForm() {
  const authForm = document.getElementById('auth-form')?.querySelector('form');
  if (!authForm) return; // If the form isn't on this page, do nothing.

  const auth = firebase.auth(); // Get the firebase auth instance

  authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = authForm.email.value;
    const password = authForm.password.value;
    const submitterId = e.submitter.id;

    // Disable buttons to prevent multiple clicks
    const loginButton = document.getElementById('login-button');
    const signupButton = document.getElementById('signup-button');
    if(loginButton) loginButton.disabled = true;
    if(signupButton) signupButton.disabled = true;

    const reEnableButtons = () => {
        if(loginButton) loginButton.disabled = false;
        if(signupButton) signupButton.disabled = false;
    };

    if (submitterId === 'signup-button') {
      auth.createUserWithEmailAndPassword(email, password)
        .catch(err => {
            alert(`Signup Error: ${err.message}`);
            reEnableButtons();
        });
        // onAuthStateChanged will handle the redirect on success
    } else if (submitterId === 'login-button') {
      auth.signInWithEmailAndPassword(email, password)
        .catch(err => {
            alert(`Login Error: ${err.message}`);
            reEnableButtons();
        });
        // onAuthStateChanged will handle the redirect on success
    }
  });
}