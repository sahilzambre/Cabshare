import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";

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
const auth = getAuth(app);
const db = getDatabase(app);

// Fetch user data
function fetchUsername() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const usernameInput = document.getElementById('username');
            usernameInput.value = user.displayName || user.email.split('@')[0];
        } else {
            window.location.href = 'index.html'; // Redirect to login if not authenticated
        }
    });
}

// Populate cities based on selected state
const stateCityMap = {
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



const cityPlaceMap = {
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
    "Chennai": ["Chennai International Airport", "T. Nagar", "Velachery", "Adyar", "Tambaram", "Anna Nagar"],
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


// Handle state selection change
document.getElementById('fromState').addEventListener('change', function () {
    populateCities(this.value, 'fromCity');
});

document.getElementById('toState').addEventListener('change', function () {
    populateCities(this.value, 'toCity');
});

function populateCities(state, citySelectId) {
    const cities = stateCityMap[state] || [];
    const citySelect = document.getElementById(citySelectId);
    citySelect.innerHTML = '<option value="" disabled selected>Select City</option>';
    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
    });
}

// Handle city selection change
document.getElementById('fromCity').addEventListener('change', function () {
    populatePlaces(this.value, 'fromPlace');
});

document.getElementById('toCity').addEventListener('change', function () {
    populatePlaces(this.value, 'toPlace');
});

function populatePlaces(city, placeSelectId) {
    const places = cityPlaceMap[city] || [];
    const placeSelect = document.getElementById(placeSelectId);
    placeSelect.innerHTML = '<option value="" disabled selected>Select Place</option>';
    places.forEach(place => {
        const option = document.createElement('option');
        option.value = place;
        option.textContent = place;
        placeSelect.appendChild(option);
    });
}

// Handle form submission
document.getElementById('postForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const university = document.getElementById('university').value;
    const fromState = document.getElementById('fromState').value;
    const fromCity = document.getElementById('fromCity').value;
    const fromPlace = document.getElementById('fromPlace').value;
    const toState = document.getElementById('toState').value;
    const toCity = document.getElementById('toCity').value;
    const toPlace = document.getElementById('toPlace').value;
    const dateTime = document.getElementById('dateTime').value;
    const message = document.getElementById('message').value;

    if (isValidDate(dateTime)) {
        const postId = Date.now().toString();

        set(ref(db, 'posts/' + postId), {
            username,
            university,
            fromState,
            fromCity,
            fromPlace,
            toState,
            toCity,
            toPlace,
            dateTime,
            message
        }).then(() => {
            showPopup();
        }).catch((error) => {
            console.error('Error posting plan:', error);
        });
    } else {
        alert('The date must be present or future.');
    }
});

// Function to validate date (present or future)
function isValidDate(dateTime) {
    const now = new Date();
    const inputDate = new Date(dateTime);
    return inputDate >= now;
}

// Function to show the popup after a successful post
function showPopup() {
    const popup = document.getElementById('popup');
    popup.style.display = 'block';
    setTimeout(() => {
        popup.style.display = 'none';
        window.location.reload();
    }, 2000);
}

// Fetch the username on page load
fetchUsername();