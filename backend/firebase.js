const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, getDoc, addDoc, setDoc, updateDoc, doc, deleteDoc, query, where, orderBy, limit, serverTimestamp, Timestamp } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyAo7UMAmkDjwMa6IHWU_7eHripZl-edqpo",
  authDomain: "super-net-1c08f.firebaseapp.com",
  projectId: "super-net-1c08f",
  storageBucket: "super-net-1c08f.firebasestorage.app",
  messagingSenderId: "1014434101982",
  appId: "1:1014434101982:web:112468be9f0d745925a04f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

module.exports = { 
  db, 
  collection, 
  getDocs, 
  getDoc,
  addDoc, 
  setDoc,
  updateDoc, 
  doc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp
};
