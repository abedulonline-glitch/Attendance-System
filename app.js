// app.js — প্রথম অংশ: লগইন + ডেটা মডেল
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
// waotp CDN থেকে লোড করুন (npm প্যাকেজ ব্রাউজারে সরাসরি ব্যবহারের জন্য UMD সংস্করণ প্রয়োজন, নিচের নির্দেশনা দেখুন)
import { sendOtp, verifyOtp } from 'https://cdn.jsdelivr.net/npm/waotp@1.0.3/dist/waotp.umd.js';

const firebaseConfig = {
  // আপনার Firebase কনসোল থেকে কপি করে পেস্ট করুন
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ========== অ্যাডমিন ইমেইল লগইন ==========
document.getElementById('admin-login-btn').onclick = async () => {
  const email = document.getElementById('admin-email').value;
  const password = document.getElementById('admin-password').value;
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    // users ডকুমেন্টে role: admin কিনা যাচাই করুন
    const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
    if (userDoc.exists() && userDoc.data().role === 'admin') {
      showAdminPanel(cred.user);
    } else {
      alert('আপনি অ্যাডমিন নন');
    }
  } catch (e) {
    alert('লগইন ব্যর্থ: ' + e.message);
  }
};

// ========== কর্মী WhatsApp OTP লগইন ==========
document.getElementById('send-otp-btn').onclick = async () => {
  const phone = document.getElementById('worker-phone').value.trim();
  if (!phone.startsWith('+')) {
    alert('অনুগ্রহ করে আন্তর্জাতিক ফোন নম্বর ফরম্যাট ইনপুট করুন, যেমন +8801XXXXXXXXX');
    return;
  }
  try {
    await sendOtp(phone); // waotp API Key .env বা কনফিগারেশনে সেট করতে হবে
    document.getElementById('otp-area').style.display = 'block';
    alert('OTP আপনার WhatsApp-এ পাঠানো হয়েছে');
  } catch (e) {
    alert('পাঠানো ব্যর্থ: ' + e.message);
  }
};

document.getElementById('verify-otp-btn').onclick = async () => {
  const phone = document.getElementById('worker-phone').value.trim();
  const otp = document.getElementById('otp-input').value.trim();
  try {
    const ok = await verifyOtp(phone, otp);
    if (ok) {
      // Firestore-এ ফোন নম্বর দিয়ে ব্যবহারকারী খুঁজুন
      // সরলতার জন্য এখানে সরাসরি uid হিসাবে ফোন নম্বর ব্যবহার করা হচ্ছে (উत्पादन পরিবেশে আলাদা ম্যাপিং সুপারিশ করা হয়)
      const workerId = phone.replace('+', ''); // অথবা আপনার নিজের ম্যাপিং লজিক
      const userDoc = await getDoc(doc(db, 'users', workerId));
      if (userDoc.exists()) {
        showWorkerPanel(workerId, userDoc.data());
      } else {
        alert('এই ফোন নম্বর নিবন্ধিত নয়');
      }
    } else {
      alert('OTP ভুল বা মেয়াদোত্তীর্ণ');
    }
  } catch (e) {
    alert('যাচাইকরণ ব্যর্থ: ' + e.message);
  }
};

// ========== প্যানেল সুইচ ==========
function showAdminPanel(user) {
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('main-section').style.display = 'block';
  document.getElementById('admin-panel').style.display = 'block';
  document.getElementById('user-info').textContent = 'অ্যাডমিন: ' + user.email;
  // দ্বিতীয় অংশে এখানে অনুমতি সুইচ এবং রিপোর্ট লোড হবে
}

function showWorkerPanel(workerId, data) {
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('main-section').style.display = 'block';
  document.getElementById('worker-panel').style.display = 'block';
  document.getElementById('user-info').textContent = data.name + ' | ' + data.position;
  // দ্বিতীয় অংশে এখানে ক্যালেন্ডার লোড এবং উপস্থিতি বাটন হবে
}
