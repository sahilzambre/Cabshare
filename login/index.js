// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDDFlC8PBFBdjPVFtz-ngiQ5bpyNzovW-c",
    authDomain: "cabshare-9d38b.firebaseapp.com",
    databaseURL: "https://cabshare-9d38b-default-rtdb.firebaseio.com",
    projectId: "cabshare-9d38b",
    storageBucket: "cabshare-9d38b.appspot.com",
    messagingSenderId: "347790189285",
    appId: "1:347790189285:web:aa8fddd4c43b8ea2c96a0c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const storage = getStorage(app);

// Utility function to normalize email
function normalizeEmail(email) {
    return email.replace(/\./g, '_');
}

// Handle Sign Up form submission
document.getElementById('signupForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const name = document.getElementById('Name').value;
    const username = document.getElementById('username').value;
    const phone = document.getElementById('phone').value;
    const profilePic = document.getElementById('profilePic') ? document.getElementById('profilePic').files[0] : null; // Profile picture file

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await sendEmailVerification(user);

        let profilePicURL = '';
        if (profilePic) {
            // Upload profile picture to Firebase Storage
            const picRef = storageRef(storage, `profile_pics/${user.uid}/${profilePic.name}`);
            await uploadBytes(picRef, profilePic);

            // Get download URL for the uploaded profile picture
            profilePicURL = await getDownloadURL(picRef);
        }

        // Store user data in Realtime Database
        const normalizedEmail = normalizeEmail(email);
        await set(ref(db, 'users/' + normalizedEmail), {
            name: name,
            username: username,
            phone: phone,
            profilePicture: profilePicURL // Store the profile picture URL
        });

        alert('Sign Up Successful! Please check your email for verification.');

        // Redirect to login or dashboard after successful sign up
        window.location.href= 'dashboard.html'; // or 'dashboard.html'
    } catch (error) {
        console.error('Error during sign up:', error);
        alert('Error: ' + error.message);
    }
});

// Handle Google Sign-Up
document.getElementById('googleSignup').addEventListener('click', async function() {
    const provider = new GoogleAuthProvider();

    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Store user data in Realtime Database if it's the first time logging in
        const normalizedEmail = normalizeEmail(user.email);
        const userRef = ref(db, 'users/' + normalizedEmail);
        const userSnapshot = await get(userRef);

        let profilePicURL = user.photoURL; // Use Google profile picture

        if (!userSnapshot.exists()) {
            await set(userRef, {
                name: user.displayName,
                username: user.email.split('@')[0], // Use part before '@' as username
                phone: user.phoneNumber || '', // Phone number may be null
                profilePicture: profilePicURL // Store profile picture URL
            });
        }

        // Redirect to dashboard after successful sign up
        window.location.href= 'dashboard.html';
    } catch (error) {
        console.error('Error during Google Sign-Up:', error);
        alert('Error: ' + error.message);
    }
});

// Handle Google Login
document.getElementById('googleLogin').addEventListener('click', async function() {
    const provider = new GoogleAuthProvider();

    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const normalizedEmail = normalizeEmail(user.email);
        const userRef = ref(db, 'users/' + normalizedEmail);
        const userSnapshot = await get(userRef);

        if (userSnapshot.exists()) {
            // User exists in the database
            if (user.emailVerified) {
                window.location.href = 'dashboard.html';
            } else {
                alert('Please verify your email before logging in.');
            }
        } else {
            // User does not exist in the database
            alert('You need to sign up with Google before you can log in with Google.');
        }
    } catch (error) {
        console.error('Error during Google Login:', error);
        alert('Error: ' + error.message);
    }
});

// Handle Login form submission
document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (user.emailVerified) {
            window.location.href= 'dashboard.html';
        } else {
            alert('Please verify your email before logging in.');
        }
    } catch (error) {
        console.error('Error during login:', error);
        alert('Error: ' + error.message);
    }
});

// Ensure username field is automatically filled in the Sign Up form based on the email address
document.getElementById('signupEmail').addEventListener('input', function() {
    const email = document.getElementById('signupEmail').value;
    const usernameField = document.getElementById('username');
    if (email) {
        const username = email.split('@')[0];
        usernameField.value = username;
    } else {
        usernameField.value = '';
    }
});

// Show sign-up form and hide login form
document.getElementById('signup-btn').addEventListener('click', function() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('signup-form').classList.remove('hidden');
});

// Show login form and hide sign-up form
document.getElementById('show-login').addEventListener('click', function() {
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('signup-form').classList.add('hidden');
});