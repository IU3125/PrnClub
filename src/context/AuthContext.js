import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

// Create context
const AuthContext = createContext();

// Context hook
export function useAuth() {
  return useContext(AuthContext);
}

// Provider component
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // User registration
  async function register(email, password, displayName) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update user profile
      await updateProfile(userCredential.user, {
        displayName: displayName
      });
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: email,
        displayName: displayName,
        role: 'user',
        status: 'active',
        createdAt: new Date(),
        featured: []
      });
      
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  }

  // User login
  async function login(email, password) {
    try {
      // First log in the user
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check user status
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Prevent login if user is inactive
        if (userData.status === 'inactive') {
          // Sign out the user
          await signOut(auth);
          throw new Error('Account is inactive. Please contact support.');
        }
        
        return userCredential.user;
      } else {
        // Create user document if it doesn't exist (for legacy users)
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName || email.split('@')[0],
          role: 'user',
          status: 'active',
          createdAt: new Date(),
          featured: []
        });
        
        return userCredential.user;
      }
    } catch (error) {
      throw error;
    }
  }

  // Admin login
  async function adminLogin(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check admin role
      const userDoc = await getDoc(doc(db, 'admins', userCredential.user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Prevent login if admin is inactive
        if (userData.status === 'inactive') {
          await signOut(auth);
          throw new Error('Account is inactive. Please contact support.');
        }
        
        if (userData.role === 'admin' || userData.role === 'ad_admin') {
          return { user: userCredential.user, role: userData.role };
        } else {
          await signOut(auth);
          throw new Error('This user does not have admin permissions.');
        }
      } else {
        await signOut(auth);
        throw new Error('This user does not have admin permissions.');
      }
    } catch (error) {
      throw error;
    }
  }

  // Logout
  function logout() {
    return signOut(auth);
  }

  // Reset password
  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  // Update user data
  async function updateUserData() {
    if (currentUser) {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const newUserData = userDoc.data();
          setUserData(newUserData);
          return newUserData;
        }
      } catch (error) {
        console.error('Error updating user data:', error);
      }
    }
    return null;
  }

  // Monitor user state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Check if admin
          const adminDoc = await getDoc(doc(db, 'admins', user.uid));
          
          if (adminDoc.exists()) {
            const adminData = adminDoc.data();
            
            // Automatically sign out if admin is inactive
            if (adminData.status === 'inactive') {
              await signOut(auth);
              setCurrentUser(null);
              setUserData(null);
              setUserRole(null);
              setLoading(false);
              return;
            }
            
            setUserRole(adminData.role);
          } else {
            // Regular user
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              
              // Automatically sign out if user is inactive
              if (userData.status === 'inactive') {
                await signOut(auth);
                setCurrentUser(null);
                setUserData(null);
                setUserRole(null);
                setLoading(false);
                return;
              }
              
              setUserData(userData);
            }
            
            setUserRole('user');
          }
          
          setCurrentUser(user);
        } catch (error) {
          console.error('Error checking user status:', error);
          setCurrentUser(null);
          setUserData(null);
          setUserRole(null);
        }
      } else {
        setCurrentUser(null);
        setUserData(null);
        setUserRole(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    userRole,
    register,
    login,
    adminLogin,
    logout,
    resetPassword,
    updateUserData,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 