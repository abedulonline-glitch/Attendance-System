// ============================================================
// app.js — পার্ট ১: PIN লগইন + ডিভাইস বাইন্ডিং
// ============================================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  getAuth, signInWithEmailAndPassword, signOut
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  getFirestore, doc, getDoc, updateDoc
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ===== ১. আপনার Firebase কনফিগারেশন এখানে পেস্ট করুন =====
const firebaseConfig = {
  apiKey: "AIzaSyAihJhBfnMde0sTUkcHa65YObom1_O2KcQ",
  authDomain: "attendance-37607.firebaseapp.com",
  projectId: "attendance-37607",
  storageBucket: "attendance-37607.firebasestorage.app",
  messagingSenderId: "465014257318",
  appId: "1:465014257318:web:0111469051e51443f42667",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let currentWorkerId = null;

// ===== ডিভাইস UUID তৈরি/পড়া =====
function getDeviceId() {
  let id = localStorage.getItem('deviceId');
  if (!id) {
    id = 'dev_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('deviceId', id);
  }
  return id;
}

// ============================================================
// ২. অ্যাডমিন ইমেইল লগইন
// ============================================================
document.getElementById('admin-login-btn').onclick = async () => {
  const email = document.getElementById('admin-email').value.trim();
  const password = document.getElementById('admin-password').value;
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
    if (userDoc.exists() && userDoc.data().role === 'admin') {
      currentUser = { uid: cred.user.uid, role: 'admin', ...userDoc.data() };
      showAdminPanel();
    } else {
      alert('আপনি অ্যাডমিন নন');
      await signOut(auth);
    }
  } catch (e) {
    alert('লগইন ব্যর্থ: ' + e.message);
  }
};

// ============================================================
// ৩. কর্মী PIN লগইন + ডিভাইস বাইন্ডিং
// ============================================================
document.getElementById('worker-login-btn').onclick = async () => {
  const phone = document.getElementById('worker-phone').value.trim();
  const pin = document.getElementById('worker-pin').value.trim();

  if (!phone || !pin) {
    alert('ফোন নম্বর এবং PIN দিন');
    return;
  }

  const workerId = phone.replace('+', '');

  try {
    const userDoc = await getDoc(doc(db, 'users', workerId));
    if (!userDoc.exists()) {
      alert('এই নম্বর নিবন্ধিত নয়, অ্যাডমিনের সাথে যোগাযোগ করুন');
      return;
    }

    const data = userDoc.data();
    if (data.pin !== pin) {
      alert('PIN ভুল');
      return;
    }

    // ডিভাইস বাইন্ডিং চেক
    const deviceId = getDeviceId();
    if (data.boundDeviceId && data.boundDeviceId !== deviceId) {
      alert('এই অ্যাকাউন্ট অন্য ডিভাইসে বাঁধা। অ্যাডমিনের সাথে যোগাযোগ করুন।');
      return;
    }

    // প্রথমবার হলে ডিভাইস বাইন্ড করুন
    if (!data.boundDeviceId) {
      await updateDoc(doc(db, 'users', workerId), { boundDeviceId: deviceId });
    }

    currentWorkerId = workerId;
    currentUser = { uid: workerId, ...data };
    showWorkerPanel();
  } catch (e) {
    alert('লগইন ব্যর্থ: ' + e.message);
  }
};

// ============================================================
// ৪. প্যানেল সুইচ
// ============================================================
function showAdminPanel() {
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('main-section').style.display = 'block';
  document.getElementById('admin-panel').style.display = 'block';
  document.getElementById('worker-panel').style.display = 'none';
  document.getElementById('user-info').textContent = 'অ্যাডমিন: ' + currentUser.email;
}

function showWorkerPanel() {
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('main-section').style.display = 'block';
  document.getElementById('admin-panel').style.display = 'none';
  document.getElementById('worker-panel').style.display = 'block';
  document.getElementById('user-info').textContent =
    currentUser.name + ' | ' + (currentUser.position || 'কর্মী');
}

// ============================================================
// ৫. লগআউট
// ============================================================
document.getElementById('logout-btn').onclick = async () => {
  await signOut(auth);
  currentUser = null;
  currentWorkerId = null;
  document.getElementById('main-section').style.display = 'none';
  document.getElementById('login-section').style.display = 'block';
};
