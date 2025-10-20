import AsyncStorage from '@react-native-async-storage/async-storage';
import { databaseService, Usuario } from './database';

const AUTH_KEY = 'kiosquito_auth';
const REMEMBER_KEY = 'kiosquito_remember';

export class AuthService {
  static async login(username: string, password: string, recordar: boolean = false): Promise<Usuario | null> {
    try {
      const user = await databaseService.loginUser(username, password);
      
      if (user) {
        // Guardar sesión
        await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(user));
        
        // Guardar preferencia de recordar
        if (recordar) {
          await AsyncStorage.setItem(REMEMBER_KEY, JSON.stringify({ username, recordar: true }));
        } else {
          await AsyncStorage.removeItem(REMEMBER_KEY);
        }
      }
      
      return user;
    } catch (error) {
      console.error('Error en login:', error);
      return null;
    }
  }

  static async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem(AUTH_KEY);
    } catch (error) {
      console.error('Error en logout:', error);
    }
  }

  static async getCurrentUser(): Promise<Usuario | null> {
    try {
      const userStr = await AsyncStorage.getItem(AUTH_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error obteniendo usuario actual:', error);
      return null;
    }
  }

  static async getRememberedUser(): Promise<{ username: string; recordar: boolean } | null> {
    try {
      const rememberStr = await AsyncStorage.getItem(REMEMBER_KEY);
      return rememberStr ? JSON.parse(rememberStr) : null;
    } catch (error) {
      console.error('Error obteniendo usuario recordado:', error);
      return null;
    }
  }

  static async isLoggedIn(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }
}