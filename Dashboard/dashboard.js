import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getDatabase, ref, onValue, remove } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// Firebase configuration
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
const database = getDatabase(app);
const auth = getAuth(app);

let currentUser = null;
let inactivityTimer;

// Check for authentication and redirect if not authenticated
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'index.html'; // Redirect to login page
    } else {
        currentUser = user;
        fetchPlans(); // Fetch plans if user is authenticated
        resetInactivityTimer(); // Reset inactivity timer
    }
});

// Function to handle logout
function logout() {
    signOut(auth).then(() => {
        console.log("User signed out successfully");
        window.location.href = 'index.html'; // Redirect to login page after logout
    }).catch((error) => {
        console.error("Error signing out:", error);
    });
}

// Function to fetch plans from Firebase
// Function to fetch plans from Firebase
function fetchPlans(filters = {}) {
    const plansList = document.getElementById('plans-list');
    plansList.innerHTML = ''; // Clear previous data

    const postsRef = ref(database, 'posts');
    onValue(postsRef, (snapshot) => {
        plansList.innerHTML = ''; // Clear the list each time to avoid duplicates
        if (!snapshot.exists()) {
            plansList.innerHTML = '<p>No plans available</p>';
            return;
        }
        
        snapshot.forEach((childSnapshot) => {
            const plan = childSnapshot.val();
            const planId = childSnapshot.key;
            const currentDateTime = getCurrentDateTime();

            // Automatically delete expired plans
            if (plan.dateTime < currentDateTime) {
                remove(ref(database, `posts/${planId}`));
                return;
            }

            // Apply filters
            if (applyFilters(plan, filters)) {
                const planItem = document.createElement('div');
                planItem.className = 'plan-item';
                planItem.innerHTML = `
                    <strong>${plan.username}</strong><br>
                    University: ${plan.university}<br>
                    From: ${plan.fromState}, ${plan.fromCity}, ${plan.fromPlace}<br>
                    To: ${plan.toState}, ${plan.toCity}, ${plan.toPlace}<br>
                    Date & Time: ${plan.dateTime}<br>
                    Message: ${plan.message}<br>
                    <button class="button connect-button" data-plan-id="${planId}" data-username="${plan.username}">Connect</button>
                    ${plan.username === (currentUser ? currentUser.email.split('@')[0] : '') ? 
                        `<button class="button delete-button" data-plan-id="${planId}">Delete</button>` : ''}
                `;
                plansList.appendChild(planItem);
            }
        });

        // Add event listeners for Connect and Delete buttons
        document.querySelectorAll('.connect-button').forEach(button => {
            button.addEventListener('click', async (e) => {
                const username = e.target.getAttribute('data-username');
                
                // Copy username to clipboard
                try {
                    await navigator.clipboard.writeText(username);
                    showPopup('Username copied to clipboard!'); // Ensure showPopup is defined
                } catch (err) {
                    console.error('Failed to copy username: ', err);
                }

                // Redirect to chatbox
                window.location.href = `ChatBox/chat.html?chatWith=${username}`;
            });
        });

        document.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const planId = e.target.getAttribute('data-plan-id');
                remove(ref(database, `posts/${planId}`));
            });
        });
    });
}

// Function to apply filters
function applyFilters(plan, filters) {
    // Apply university filter
    if (filters.university && filters.university !== plan.university) {
        return false;
    }
    // Apply state filter
    if (filters.state && filters.state !== plan.fromState) {
        return false;
    }
    // Apply city filter
    if (filters.city && filters.city !== plan.fromCity) {
        return false;
    }
    // Apply place filter
    if (filters.place && filters.place !== plan.fromPlace) {
        return false;
    }
    return true;
}

// Get the current date and time
function getCurrentDateTime() {
    return new Date().toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM format
}

// Update city options based on selected state
function updateCities() {
    const state = document.getElementById('state').value;
    const citySelect = document.getElementById('city');
    const placesSelect = document.getElementById('place');
    
    // Clear previous options
    citySelect.innerHTML = '<option value="">Select City</option>';
    placesSelect.innerHTML = '<option value="">Select Place</option>';
    
    if (state) {
        const cities = {
            "Andaman and Nicobar Islands": ["Port Blair", "Havelock Island", "Neil Island", "North Sentinel Island", "Ritchie's Archipelago"],
            "Andhra Pradesh": ["Vijayawada", "Visakhapatnam", "Guntur", "Nellore", "Kurnool", "Tirupati", "Rajahmundry", "Chittoor", "Anantapur", "Kadapa"],
            "Arunachal Pradesh": ["Itanagar", "Tawang", "Pasighat", "Ziro", "Bomdila", "Naharlagun", "Yingkiong", "Tezu", "Rupa", "Aalo"],
            "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Tezpur", "Bongaigaon", "Nagaon", "Karimganj", "Hailakandi", "Dhemaji"],
            "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Aurangabad", "Arrah", "Buxar", "Sasaram", "Katihar"],
            "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg", "Rajnandgaon", "Jagdalpur", "Ambikapur", "Kanker", "Janjgir-Champa"],
            "Chandigarh": ["Sector 17", "Sector 22", "Sector 34", "Sector 43", "Sector 47"],
            "Dadra and Nagar Haveli and Daman and Diu": ["Silvassa", "Daman", "Diu", "Naroli", "Vapi"],
            "Delhi (National Capital Territory)": ["New Delhi", "Old Delhi", "South Delhi", "North Delhi", "East Delhi", "West Delhi"],
            "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda", "Quepem", "Sanguem", "Bicholim", "Cortalim", "Cortalim"],
            "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Gandhinagar", "Jamnagar", "Junagadh", "Anand", "Vapi"],
            "Haryana": ["Gurgaon", "Faridabad", "Panipat", "Ambala", "Karnal", "Hisar", "Yamunanagar", "Sonipat", "Panchkula", "Fatehabad"],
            "Himachal Pradesh": ["Shimla", "Manali", "Dharamshala", "Solan", "Mandi", "Kullu", "Palampur", "Bilaspur", "Una", "Chamba"],
            "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar", "Hazaribagh", "Giridih", "Chaibasa", "Dumka", "Koderma"],
            "Jammu and Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Pulwama"],
            "Karnataka": ["Bangalore", "Belgaum", "Hubli", "Mangalore", "Mysore", "Gulbarga", "Bidar", "Davangere", "Shimoga", "Hospet"],
            "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kannur", "Alappuzha", "Palakkad", "Kottayam", "Pathanamthitta", "Idukki"],
            "Ladakh": ["Leh", "Kargil", "Nubra Valley", "Zanskar Valley", "Sham Valley"],
            "Lakshadweep": ["Kavaratti", "Agatti", "Minicoy", "Kalapeni", "Kadmat"],
            "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain", "Sagar", "Rewa", "Satna", "Chhindwara", "Hoshangabad"],
            "Maharashtra": ["Aurangabad", "Mumbai", "Nagpur", "Nashik", "Pune", "Thane", "Kolhapur", "Solapur", "Akola", "Jalgaon"],
            "Manipur": ["Imphal", "Churachandpur", "Bishnupur", "Thoubal", "Ukhrul", "Senapati", "Tamenglong", "Kakching", "Jiribam", "Kangpokpi"],
            "Meghalaya": ["Shillong", "Tura", "Jowai", "Nongpoh", "Baghmara", "Williamnagar", "Mawkyrwat", "Nongstoin", "Bongkhal", "Rongram"],
            "Mizoram": ["Aizawl", "Lunglei", "Champhai", "Serchhip", "Kolasib", "Mamit", "Siaha", "Hnahthial", "Lunglei", "Lawngtlai"],
            "Nagaland": ["Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha", "Phek", "Zunheboto", "Kiphire", "Longleng", "Mon"],
            "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Puri", "Sambalpur", "Berhampur", "Koraput", "Balasore", "Baripada", "Jharsuguda"],
            "Punjab": ["Chandigarh", "Amritsar", "Ludhiana", "Jalandhar", "Patiala", "Mohali", "Bathinda", "Hoshiarpur", "Ropar", "Moga"],
            "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer", "Alwar", "Sikar", "Bhilwara", "Pali"],
            "Sikkim": ["Gangtok", "Namchi", "Gyalshing", "Mangan", "Singtam", "Rangpo", "Jorethang", "Soreng", "Yuksom", "Lachung"],
            "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem", "Tiruchirappalli", "Tirunelveli", "Erode", "Vellore", "Nagercoil", "Karur"],
            "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar", "Mahbubnagar", "Ramagundam", "Adilabad", "Jagtial", "Nalgonda"],
            "Tripura": ["Agartala", "Dharmanagar", "Udaipur", "Kailashahar", "Belonia", "Sepahijala", "Khowai", "Ambassa", "Khowai", "Jirania"],
            "Uttar Pradesh": ["Lucknow", "Kanpur", "Agra", "Varanasi", "Allahabad", "Meerut", "Ghaziabad", "Bareilly", "Moradabad", "Aligarh"],
            "Uttarakhand": ["Dehradun", "Haridwar", "Nainital", "Almora", "Rishikesh", "Roorkee", "Haldwani", "Pithoragarh", "Kashipur", "Rudrapur"],
            "West Bengal": ["Kolkata", "Asansol", "Siliguri", "Durgapur", "Howrah", "Kharagpur", "Malda", "Bardhaman", "Jalpaiguri", "Cooch Behar"]
        };
        
        if (cities[state]) {
            cities[state].forEach(city => {
                const option = document.createElement('option');
                option.value = city;
                option.textContent = city;
                citySelect.appendChild(option);
            });
        }
    }
}

// Update place options based on selected city
function updatePlaces() {
    const city = document.getElementById('city').value;
    const placesSelect = document.getElementById('place');
    
    // Clear previous options
    placesSelect.innerHTML = '<option value="">Select Place</option>';
    
    if (city) {
        const places = {
            "Ahmedabad": ["Navrangpura", "Maninagar", "Vastrapur", "Satellite", "Ghatlodia"],
    "Agra": ["Sadar Bazar", "Taj Ganj", "Shamsabad", "Belanganj", "Khandari"],
    "Amritsar": ["Golden Temple", "Jallianwala Bagh", "Wagah Border", "Raja Sansi", "Hall Bazaar"],
    "Aurangabad": ["CIDCO", "Chikalthana", "Garkheda", "Nirala Bazar", "Waluj"],
    "Bangalore": ["MG Road", "Whitefield", "Koramangala", "Indiranagar", "Jayanagar"],
    "Bhopal": ["New Market", "Old City", "Habibganj", "T T Nagar", "Kolar"],
    "Bhubaneswar": ["Kharavela Nagar", "Janpath", "Raj Mahal", "Unit 9", "Chandrasekharpur"],
    "Bikaner": ["Station Road", "Ganga Singh Palace", "Nai Sarak", "Lalgarh", "Padhamsar"],
    "Chandigarh": ["Sector 17", "Sector 22", "Sector 34", "Sector 43", "Sector 47"],
    "Chandrapur": ["Civil Lines", "Nehru Chowk", "Ramdaspeth", "Chandrapur", "Mul Road"],
    "Chennai": ["T. Nagar", "Velachery", "Adyar", "Tambaram", "Anna Nagar"],
    "Coimbatore": ["RS Puram", "Gandhipuram", "Peelamedu", "Singanallur", "Saibaba Colony"],
    "Delhi": ["Connaught Place", "Karol Bagh", "Chandni Chowk", "Rajouri Garden", "Lajpat Nagar"],
    "Dhanbad": ["Bengal Club", "Katras", "Jharia", "Kenduadih", "Sindri"],
    "Dehradun": ["Rajpur Road", "Paltan Bazaar", "Chukkuwala", "Dalanwala", "Vasant Vihar"],
    "Durgapur": ["City Centre", "Benachity", "Steel Township", "Durgapur Barrage", "B Zone"],
    "Gaya": ["Buddha Temple", "Panchvati", "Station Road", "Akhara", "Barachatti"],
    "Gurgaon": ["DLF Phase 1", "DLF Phase 2", "MG Road", "Sushant Lok", "Udyog Vihar"],
    "Hyderabad": ["Banjara Hills", "Hitech City", "Secunderabad", "Gachibowli", "Madhapur"],
    "Indore": ["Rajwada", "Vijay Nagar", "Palasia", "MG Road", "Mhow"],
    "Jabalpur": ["Ranjhi", "Civil Lines", "Dabri", "Madan Mahal", "Napier Town"],
    "Jaipur": ["C-Scheme", "Malviya Nagar", "Rajapark", "Vaishali Nagar", "Amer"],
    "Jammu": ["Rajinder Bazar", "Gandhi Nagar", "Shalimar", "Channi Himmat", "Kunjwani"],
    "Jamshedpur": ["Bistupur", "Sonari", "Golmuri", "Sakchi", "Jugsalai"],
    "Jodhpur": ["Ratanada", "Pali Road", "Shastri Nagar", "Mandore", "Sojati Gate"],
    "Kakinada": ["Downtown", "Mukkamala", "Suryaraopet", "Rly. Kodur", "Jaggampeta"],
    "Kolkata": ["Park Street", "Salt Lake", "Howrah", "Dumdum", "New Market"],
    "Kota": ["Vijaypura", "Gumanganj", "Dadabari", "Keshavpura", "Rathore"],
    "Kurnool": ["Kallur", "Nandikotkur", "Dhone", "Srisailam", "Adoni"],
    "Ludhiana": ["Ferozepur Road", "Model Town", "Civil Lines", "Bharat Nagar", "Ghumar Mandi"],
    "Lucknow": ["Hazratganj", "Gomti Nagar", "Alambagh", "Kursi Road", "Indira Nagar"],
    "Madhubani": ["Madhubani Town", "Jhanjharpur", "Benipatti", "Madhepur", "Kumarbagh"],
    "Mahesana": ["Mehsana Town", "Unjha", "Visnagar", "Kadi", "Patan"],
    "Malda": ["English Bazar", "Chanchal", "Bamangola", "Kaliachak", "Gajole"],
    "Mangalore": ["Hampankatta", "Kadri", "Bejai", "Derebail", "Urwa"],
    "Mumbai": ["Andheri", "Bandra", "Dadar", "Borivali", "Colaba"],
    "Muzaffarpur": ["Kazi Musahari", "Patarghat", "Saraiya", "Saraiya", "Gosainpur"],
    "Nagapattinam": ["Nagapattinam Town", "Thiruvarur", "Sirkali", "Kilvelur", "Muthupet"],
    "Nagpur": ["Sitabuldi", "Sadar", "Dharampeth", "Mahal", "Manish Nagar"],
    "Navi Mumbai": ["Vashi", "Nerul", "Kharghar", "Airoli", "Belapur"],
    "Nashik": ["Panchavati", "Deolali", "Mhasrul", "Indiranagar", "Gangapur Road"],
    "Noida": ["Sector 18", "Sector 15", "Sector 62", "Sector 63", "Sector 71"],
    "Patiala": ["Old Patiala", "Rajpura", "Sangrur", "Sanaur", "Nabha"],
    "Patna": ["Boring Road", "Kankarbagh", "Rajendra Nagar", "Bailey Road", "Patliputra"],
    "Pune": ["Hinjewadi", "Kothrud", "Hadapsar", "Viman Nagar", "Shivajinagar"],
    "Raipur": ["Dhamtari Road", "Pujari Para", "Shanker Nagar", "Telibandha", "Khamardih"],
    "Rajkot": ["Sardar Nagar", "Gondal Road", "Shashtri Maidan", "Kalavad Road", "University Road"],
    "Ranchi": ["Main Road", "Harmu", "Kanke", "Ratu Road", "Doranda"],
    "Salem": ["Gugai", "Seelanaickenpatti", "Fairlands", "Suramangalam", "Hasthampatti"],
    "Sambalpur": ["Budharaja", "Ainthapali", "Gosaninuagaon", "Khetrajpur", "Dhanupali"],
    "Shimla": ["Mall Road", "Chhota Shimla", "Lakkar Bazaar", "Rohal", "Jaswal"],
    "Siliguri": ["Bidhan Road", "Sevoke Road", "Hill Cart Road", "N.R. Complex", "Tenzing Norgay Road"],
    "Surat": ["Gopi Talav", "Varachha", "Ring Road", "Adajan", "Piplod"],
    "Tiruchirappalli": ["Srirangam", "Ponmalai", "Thillai Nagar", "Puthur", "K.K. Nagar"],
    "Tirupati": ["Tirumala", "Tiruchanoor", "Tiruchanoor", "Srinivasa Mangapuram", "Srikalahasti"],
    "Udaipur": ["City Palace", "Lake Pichola", "Sajjangarh", "Bagore Ki Haveli", "Rang Sagar"],
    "Vadodara": ["Alkapuri", "Sayajigunj", "Genda Circle", "Vasna", "Padra"],
    "Varanasi": ["Dashashwamedh", "Assi", "Rathyatra", "Kashi Vishwanath", "Sankat Mochan"],
    "Vellore": ["VIT Campus", "Athur", "Katpadi", "Pallikonda", "Vellore Fort", "Bagayam"],
    "Visakhapatnam": ["Dwaraka Nagar", "MVP Colony", "Gajuwaka", "Seethammadhara", "Madhurawada"],
    "Warangal": ["Hanamkonda", "Kazipet", "Hanamkonda", "Warangal Fort", "Narsampet"],
    "Yamunanagar": ["Jagadhri", "Yamunanagar", "Bilaspur", "Radaur", "Baba Puran"]
        };
        
        if (places[city]) {
            places[city].forEach(place => {
                const option = document.createElement('option');
                option.value = place;
                option.textContent = place;
                placesSelect.appendChild(option);
            });
        }
    }
}

// Apply filters on form submit
document.getElementById('filter-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const filters = {
        university: document.getElementById('university').value,
        state: document.getElementById('state').value,
        city: document.getElementById('city').value,
        place: document.getElementById('place').value
    };
    fetchPlans(filters);
});

// Initial fetch
fetchPlans();

// Update cities and places on state and city change
document.getElementById('state').addEventListener('change', () => {
    updateCities();
    updatePlaces();
});

document.getElementById('city').addEventListener('change', () => {
    updatePlaces();
});

// Function to show a popup notification
function showPopup(message) {
    const popup = document.createElement('div');
    popup.className = 'popup';
    popup.textContent = message;
    document.body.appendChild(popup);

    setTimeout(() => {
        popup.remove();
    }, 3000); // Remove popup after 3 seconds
}

// Style for popup
const style = document.createElement('style');
style.textContent = `
    .popup {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(0, 0, 0.7);
        color: #fff;
        padding: 10px 20px;
        border-radius: 5px;
        font-size: 14px;
    }
`;
document.head.appendChild(style);

// Reset inactivity timer
function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        signOut(auth);
        window.location.href = 'index.html'; // Redirect to login page after inactivity
    }, 15 * 60 * 1000); // 15 minutes
}
