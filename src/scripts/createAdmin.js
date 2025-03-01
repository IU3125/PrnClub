/**
 * Bu script, Firebase Authentication ve Firestore'da admin kullanıcıları oluşturmak için kullanılır.
 * 
 * Kullanım:
 * 1. Firebase yapılandırma bilgilerinin doğru olduğundan emin olun (src/firebase/config.js)
 * 2. Terminalde şu komutu çalıştırın:
 *    node src/scripts/createAdmin.js <email> <password> <displayName> [role]
 * 
 * Örnek:
 *    node src/scripts/createAdmin.js admin@example.com password123 "Admin User" admin
 */

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

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
const auth = getAuth(app);
const db = getFirestore(app);

// Komut satırı argümanlarını al
const args = process.argv.slice(2);

if (args.length < 3) {
  console.error('Kullanım: node createAdmin.js <email> <password> <displayName> [role]');
  process.exit(1);
}

const email = args[0];
const password = args[1];
const displayName = args[2];
const role = args[3] || 'admin'; // Varsayılan rol: admin

// Admin kullanıcısı oluştur
async function createAdminUser() {
  try {
    // Firebase Authentication'da kullanıcı oluştur
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Firestore'da admin bilgilerini kaydet
    await setDoc(doc(db, 'admins', user.uid), {
      uid: user.uid,
      email,
      displayName,
      role, // 'admin' veya 'ad_admin'
      createdAt: new Date()
    });
    
    console.log('Admin kullanıcısı başarıyla oluşturuldu:');
    console.log({
      uid: user.uid,
      email,
      displayName,
      role
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Admin kullanıcı oluşturulurken hata:', error);
    process.exit(1);
  }
}

createAdminUser(); 