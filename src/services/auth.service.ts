// src/services/auth.service.ts
import { auth } from '../firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';

export const AuthService = {
  // Iniciar sesión
  async login(email: string, pass: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    return userCredential.user;
  },

  // Cerrar sesión
  async logout(): Promise<void> {
    await signOut(auth);
  }
};