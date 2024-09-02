import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getDatabase, ref, set, push, onChildAdded, onValue, get, update } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

// Your Firebase configuration
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
const database = getDatabase(app);

let selectedUserId = null;
let currentUserId = null;
let userActivityTimeout = null;
let autoLogoutTimeout = null;
let allUsers = {}; // Store all users

// User authentication status listener
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log(`Logged in as: ${user.email}`);
    currentUserId = formatEmailForKey(user.email);
    loadUserList(currentUserId);

    // Set user as online and monitor activity
    updateUserStatus('online');
    monitorUserActivity();

    // Listen for visibility change (tab focus)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        updateUserStatus('online');
      } else {
        updateUserStatus('offline');
      }
    });

    // Listen for user leaving the page
    window.addEventListener('beforeunload', () => {
      updateUserStatus('offline');
    });

    // Add event listener for search input
    document.getElementById('search-input').addEventListener('input', filterUsers);

    // Add event listener for message input
    document.getElementById('message-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
      }
    });

    // Add event listener for send button
    document.getElementById('send-button').addEventListener('click', () => {
      sendMessage();
    });

    // Start auto logout timer
    startAutoLogoutTimer();

  } else {
    console.log('User not logged in');
    window.location.href = 'index.html';
  }
});

// Update user status in the database
function updateUserStatus(status) {
  if (currentUserId) {
    set(ref(database, `users/${currentUserId}/status`), status);
  }
}

// Monitor user activity and set status to 'away' if inactive
function monitorUserActivity() {
  resetUserActivityTimeout();
  window.addEventListener('mousemove', resetUserActivityTimeout);
  window.addEventListener('keypress', resetUserActivityTimeout);
}

// Reset user activity timeout
function resetUserActivityTimeout() {
  clearTimeout(userActivityTimeout);
  updateUserStatus('online');
  userActivityTimeout = setTimeout(() => {
    updateUserStatus('away');
  }, 300000); // Set user to 'away' after 5 minutes of inactivity
}

// Load the user list
function loadUserList(currentUserId) {
  try {
    const userListRef = ref(database, 'users');
    get(userListRef).then((snapshot) => {
      if (snapshot.exists()) {
        allUsers = snapshot.val(); // Store all users
        displayUserList(allUsers, currentUserId);
      } else {
        console.log('No users available');
      }
    }).catch((error) => {
      console.error('Error fetching user list:', error);
    });
  } catch (error) {
    console.error('Error loading user list:', error);
  }
}

// Display user list
function displayUserList(users, currentUserId) {
  const userListDiv = document.getElementById('user-list');
  userListDiv.innerHTML = '';

  Object.entries(users).forEach(([uid, user]) => {
    if (uid !== currentUserId) {
      const userItem = document.createElement('div');
      userItem.className = 'user-item';
      userItem.dataset.uid = uid; // Store user ID in a data attribute
      userItem.dataset.username = user.username ? user.username.toLowerCase() : ''; // Store username in a data attribute
      userItem.style.display = 'none'; // Initially hide all users
      userItem.innerHTML = `
        <img src="https://api.dicebear.com/5.x/adventurer/svg?seed=${user.username || user.name}" alt="${user.name}" class="avatar">
        <div class="user-info">
          <div class="username">${user.name || user.username}</div>
          <div class="status ${user.status === 'online' ? 'online' : 'offline'}"></div>
        </div>
        <span class="new-messages-count"></span>
      `;
      userItem.onclick = () => startChat(uid, user.name || user.username);
      userListDiv.appendChild(userItem);

      // Show the number of new messages
      showNewMessagesCount(uid, userItem.querySelector('.new-messages-count'));
    }
  });
}

// Show the number of new messages for each user
function showNewMessagesCount(uid, messageCountSpan) {
  const chatPath = `chats/${currentUserId}_${uid}`;
  const reverseChatPath = `chats/${uid}_${currentUserId}`;

  const updateMessageCount = (path) => {
    const chatRef = ref(database, path);
    onValue(chatRef, (snapshot) => {
      const messages = snapshot.val();
      let newMessagesCount = 0;

      for (const key in messages) {
        if (messages[key].sender !== currentUserId && !messages[key].read) {
          newMessagesCount++;
        }
      }

      if (newMessagesCount > 0) {
        messageCountSpan.textContent = `(${newMessagesCount} new)`;
        moveUserToTop(uid);
      } else {
        messageCountSpan.textContent = '';
      }
    });
  };

  updateMessageCount(chatPath);
  updateMessageCount(reverseChatPath);
}

// Move the user to the top of the list
function moveUserToTop(uid) {
  const userListDiv = document.getElementById('user-list');
  const userItems = Array.from(userListDiv.getElementsByClassName('user-item'));
  const userItem = userItems.find(item => item.dataset.uid === uid);

  if (userItem) {
    userListDiv.removeChild(userItem);
    userListDiv.insertBefore(userItem, userListDiv.firstChild);
  }
}

// Helper function to format email for Firebase key (replace '.' with '_')
function formatEmailForKey(email) {
  return email.replace(/\./g, '_');
}

// Start chat with a selected user
function startChat(userId, name) {
  selectedUserId = userId;
  document.getElementById('chat-username').textContent = `Chatting with ${name}`;
  const chatMessagesDiv = document.getElementById('chat-messages');
  chatMessagesDiv.innerHTML = '';

  // Set up bidirectional chat path
  const chatPath = `chats/${currentUserId}_${userId}`;
  const reverseChatPath = `chats/${userId}_${currentUserId}`;

  // Listen for incoming messages from both paths
  listenForMessages(chatPath);
  listenForMessages(reverseChatPath);

  // Mark messages as read
  markMessagesAsRead(chatPath);
  markMessagesAsRead(reverseChatPath);
}

// Listen for messages in the chat
function listenForMessages(chatPath) {
  const chatRef = ref(database, chatPath);
  onChildAdded(chatRef, (snapshot) => {
    const message = snapshot.val();
    const messageDiv = document.createElement('div');
    messageDiv.className = message.sender === currentUserId ? 'message sent' : 'message received';
    messageDiv.innerHTML = `
      ${message.text} 
      <div class="message-info">
        <span class="timestamp">${formatTimestamp(message.timestamp)}</span>
        <span class="date">${formatDate(message.timestamp)}</span>
      </div>
    `;
    document.getElementById('chat-messages').appendChild(messageDiv);
  });
}

// Format timestamp for display
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Format date for display
function formatDate(timestamp) {
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Send a message
function sendMessage() {
  const messageInput = document.getElementById('message-input');
  const messageText = messageInput.value.trim();

  if (messageText && selectedUserId) {
    const timestamp = Date.now();
    const chatPath = `chats/${currentUserId}_${selectedUserId}`;
    const newMessageRef = push(ref(database, chatPath));

    set(newMessageRef, {
      sender: currentUserId,
      text: messageText,
      timestamp: timestamp,
      read: false
    }).then(() => {
      // Clear message input
      messageInput.value = '';
    }).catch((error) => {
      console.error('Error sending message:', error);
    });

    // Also add message to the reverse chat path
    const reverseChatPath = `chats/${selectedUserId}_${currentUserId}`;
    set(push(ref(database, reverseChatPath)), {
      sender: currentUserId,
      text: messageText,
      timestamp: timestamp,
      read: false
    }).catch((error) => {
      console.error('Error sending message to reverse path:', error);
    });
  }
}

// Mark messages as read
function markMessagesAsRead(chatPath) {
  const chatRef = ref(database, chatPath);
  onValue(chatRef, (snapshot) => {
    const messages = snapshot.val();
    if (messages) {
      Object.keys(messages).forEach(key => {
        if (messages[key].sender !== currentUserId && !messages[key].read) {
          update(ref(database, `${chatPath}/${key}`), { read: true });
        }
      });
    }
  });
}

// Filter users by search input
function filterUsers() {
  const searchInput = document.getElementById('search-input').value.toLowerCase();
  const userItems = document.querySelectorAll('.user-item');

  userItems.forEach(userItem => {
    const username = userItem.dataset.username;
    if (username.includes(searchInput)) {
      userItem.style.display = 'flex';
    } else {
      userItem.style.display = 'none';
    }
  });
}

// Start auto logout timer
function startAutoLogoutTimer() {
  clearTimeout(autoLogoutTimeout);
  autoLogoutTimeout = setTimeout(() => {
    auth.signOut().then(() => {
      alert('Session expired. Please log in again.');
      window.location.href = 'index.html';
    }).catch((error) => {
      console.error('Error signing out:', error);
    });
  }, 600000); // 10 minutes
}