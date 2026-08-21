import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, db } from '../lib/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function register(nombre, correo, contraseña) {
    const credentials = await createUserWithEmailAndPassword(auth, correo, contraseña);
    await updateProfile(credentials.user, { displayName: nombre });
    await set(ref(db, `users/${credentials.user.uid}`), {
      nombre,
      correo,
      creado: new Date().toISOString(),
    });
    setUser({ ...credentials.user });
    return credentials.user;
  }

  function login(correo, contraseña) {
    return signInWithEmailAndPassword(auth, correo, contraseña);
  }

  function logout() {
    return signOut(auth);
  }

  const value = {
    user,
    loading,
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
