import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

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
const auth = getAuth();
const db = getDatabase(app);

// Set up Google authentication provider
const provider = new GoogleAuthProvider();

// Login with Email and Password
function loginWithEmailPassword(email, password) {
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            loadUserProfile(user);
        })
        .catch((error) => {
            console.error("Error logging in with email and password:", error);
        });
}

// Login with Google
function loginWithGoogle() {
    signInWithPopup(auth, provider)
        .then((result) => {
            const user = result.user;
            loadUserProfile(user);
        })
        .catch((error) => {
            console.error("Error logging in with Google:", error);
        });
}

// Check authentication state
onAuthStateChanged(auth, (user) => {
    if (user) {
        loadUserProfile(user);
    } else {
        console.log("User is not signed in");
    }
});

function loadUserProfile(user) {
    const emailKey = user.email.replace(/[.#$[\]]/g, '_');
    const userRef = ref(db, `users/${emailKey}`);

    get(userRef).then((snapshot) => {
        if (snapshot.exists()) {
            const userData = snapshot.val();
            displayUserProfile(userData);
        } else {
            console.log("No user data found!");
        }
    }).catch((error) => {
        console.error("Error fetching user data:", error);
    });
}

function displayUserProfile(userData) {
    document.getElementById("profilePicture").src = userData.profilePicture || "default-profile.png";
    document.getElementById("username").textContent = userData.username || "N/A";
    document.getElementById("name").textContent = userData.name || "N/A";
    document.getElementById("email").textContent = auth.currentUser.email || "N/A";
    document.getElementById("phone").textContent = userData.phone || "N/A";
}