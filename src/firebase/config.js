import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase yapılandırma bilgileri
const firebaseConfig = {
    apiKey: "AIzaSyDcMMaGMCOixe2Cem2LIH05LeRk7bz1I6w",
    authDomain: "prnclub-vn.firebaseapp.com",
    databaseURL: "https://prnclub-vn-default-rtdb.firebaseio.com",
    projectId: "prnclub-vn",
    storageBucket: "prnclub-vn.firebasestorage.app",
    messagingSenderId: "183716957909",
    appId: "1:183716957909:web:2c84ce11972ea7aefa9c5c",
    measurementId: "G-YKEXQH3FGC"
};

// Firebase uygulamasını başlat
const app = initializeApp(firebaseConfig);

// Firebase servislerini dışa aktar
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app; 