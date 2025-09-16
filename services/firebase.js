import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCJZLNcFLFQ78yUFztVTelw1k-zHV8dYKQ",
  authDomain: "farmezy-e1e90.firebaseapp.com",
  projectId: "farmezy-e1e90",
  storageBucket: "farmezy-e1e90.firebasestorage.app",
  messagingSenderId: "672597664446",
  appId: "1:672597664446:web:dc393da4ec2b98aad834ef",
  measurementId: "G-14LDH5DWQ3"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
