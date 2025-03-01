import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

/**
 * Firebase Authentication'da yeni bir admin kullanıcısı oluşturur ve
 * Firestore'da admin bilgilerini kaydeder.
 * 
 * @param {string} email - Admin e-posta adresi
 * @param {string} password - Admin şifresi
 * @param {string} displayName - Admin görünen adı
 * @param {string} role - Admin rolü ('admin' veya 'ad_admin')
 * @returns {Promise<Object>} - Oluşturulan admin kullanıcı bilgileri
 */
export const createAdminUser = async (email, password, displayName, role = 'admin') => {
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
    
    return {
      uid: user.uid,
      email,
      displayName,
      role
    };
  } catch (error) {
    console.error('Admin kullanıcı oluşturulurken hata:', error);
    throw error;
  }
};

/**
 * Bir kullanıcının admin olup olmadığını kontrol eder.
 * 
 * @param {string} uid - Kullanıcı ID'si
 * @returns {Promise<Object|null>} - Admin bilgileri veya null
 */
export const checkAdminStatus = async (uid) => {
  try {
    const adminDoc = await getDoc(doc(db, 'admins', uid));
    
    if (adminDoc.exists()) {
      return adminDoc.data();
    }
    
    return null;
  } catch (error) {
    console.error('Admin durumu kontrol edilirken hata:', error);
    return null;
  }
};

/**
 * Admin kullanıcısı olarak giriş yapar ve admin bilgilerini döndürür.
 * 
 * @param {string} email - Admin e-posta adresi
 * @param {string} password - Admin şifresi
 * @returns {Promise<Object>} - Admin kullanıcı bilgileri ve rolü
 */
export const loginAsAdmin = async (email, password) => {
  try {
    // Firebase Authentication ile giriş yap
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Admin rolünü kontrol et
    const adminData = await checkAdminStatus(user.uid);
    
    if (!adminData) {
      throw new Error('Bu kullanıcının admin yetkisi bulunmamaktadır.');
    }
    
    return {
      user,
      role: adminData.role
    };
  } catch (error) {
    console.error('Admin girişi yapılırken hata:', error);
    throw error;
  }
}; 