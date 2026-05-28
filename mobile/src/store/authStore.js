import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import auth from "@react-native-firebase/auth";
import api from "../api/api";
import { OFFLINE_TESTING_MODE, USE_FIREBASE_AUTH } from "../config";
import { findMockUser, generateMockToken, validateMockToken, getMockUserById } from "../data/mockAuth";

// Base64 decode function for React Native
const decodeBase64 = (input) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let str = input.replace(/=+$/, "");
  let output = "";
  if (str.length % 4 === 1) {
    throw new Error("Invalid base64 string");
  }
  for (let bc = 0, bs, buffer, idx = 0; idx < str.length; idx++) {
    buffer = str.charAt(idx);
    if (buffer === "=") break;
    if ((bs = chars.indexOf(buffer)) === -1) continue;
    bc = (bc % 4) ? (bc * 64 + bs) : bs;
    if (bc % 4) output += String.fromCharCode(255 & (bc >> ((-2 * bc) & 6)));
  }
  return output;
};

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (user, token) => {
    if (OFFLINE_TESTING_MODE) {
      await AsyncStorage.setItem("mock_token", token);
      await AsyncStorage.setItem("mock_user", JSON.stringify(user));
    } else {
      await SecureStore.setItemAsync("token", token);
    }
    set({ user, token, isAuthenticated: true });
  },

  setUser: (user) => {
    set({ user });
  },

  logout: async () => {
    if (OFFLINE_TESTING_MODE) {
      await AsyncStorage.removeItem("mock_token");
      await AsyncStorage.removeItem("mock_user");
      await AsyncStorage.removeItem("cart-storage");
    } else {
      if (USE_FIREBASE_AUTH) {
        try { await auth().signOut(); } catch {}
      }
      await SecureStore.deleteItemAsync("token");
      await AsyncStorage.removeItem("cart-storage");
    }
    set({ user: null, token: null, isAuthenticated: false });
  },

  initializeAuth: async () => {
    if (OFFLINE_TESTING_MODE) {
      return initializeMockAuth(set);
    }
    if (USE_FIREBASE_AUTH) {
      return initializeFirebaseAuth(set);
    }
    return initializeRealAuth(set, get);
  },

  login: async (email, password) => {
    if (OFFLINE_TESTING_MODE) {
      return mockLogin(email, password, set, get);
    }
    if (USE_FIREBASE_AUTH) {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const firebaseUser = userCredential.user;
      const token = await firebaseUser.getIdToken();
      await SecureStore.setItemAsync("token", token);
      const fbUser = { uid: firebaseUser.uid, email: firebaseUser.email };
      set({ user: fbUser, token, isAuthenticated: true });
      return fbUser;
    }
    const response = await api.post("/auth/login", { email, password });
    const { token, user } = response.data;
    await get().setAuth(user, token);
    return user;
  },

  register: async (userData) => {
    if (OFFLINE_TESTING_MODE) {
      throw new Error("Registration is disabled in offline testing mode");
    }
    if (USE_FIREBASE_AUTH) {
      const userCredential = await auth().createUserWithEmailAndPassword(userData.email, userData.password);
      const firebaseUser = userCredential.user;
      const token = await firebaseUser.getIdToken();

      const registerPayload = { ...userData, firebaseUid: firebaseUser.uid };
      delete registerPayload.password;
      await api.post("/auth/register", registerPayload);

      await SecureStore.setItemAsync("token", token);
      const fbUser = { uid: firebaseUser.uid, email: firebaseUser.email, name: userData.name };
      set({ user: fbUser, token, isAuthenticated: true });
      return fbUser;
    }
    const response = await api.post("/auth/register", userData);
    const { token, user } = response.data;
    await get().setAuth(user, token);
    return user;
  },
}));

// Real authentication (unchanged)
async function initializeRealAuth(set, get) {
  const timeoutMs = 5000;
  const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve({ timedOut: true }), timeoutMs));
    
  const authPromise = (async () => {
    try {
      const token = await SecureStore.getItemAsync("token");
      if (token) {
        const base64Url = token.split(".")[1];
        if (!base64Url) {
          await SecureStore.deleteItemAsync("token");
          set({ user: null, token: null, isAuthenticated: false, isLoading: false });
          return;
        }
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeBase64(base64);
        const payload = JSON.parse(jsonPayload);

        if (payload.exp * 1000 > Date.now()) {
          try {
            const response = await api.get("/users/profile");
            set({ user: response.data, token, isAuthenticated: true, isLoading: false });
          } catch {
            await SecureStore.deleteItemAsync("token");
            set({ user: null, token: null, isAuthenticated: false, isLoading: false });
          }
        } else {
          await SecureStore.deleteItemAsync("token");
          set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
      } else {
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      await SecureStore.deleteItemAsync("token");
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  })();

  const result = await Promise.race([authPromise, timeoutPromise]);
  if (result?.timedOut) {
    set({ isLoading: false });
  }
}

// Firebase authentication
async function initializeFirebaseAuth(set) {
  try {
    const currentUser = auth().currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      await SecureStore.setItemAsync("token", token);
      const user = { uid: currentUser.uid, email: currentUser.email, name: currentUser.displayName };
      set({ user, token, isAuthenticated: true, isLoading: false });
    } else {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  } catch {
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  }
}

// Mock authentication for offline testing
async function initializeMockAuth(set) {
  try {
    const token = await AsyncStorage.getItem("mock_token");
    if (token && validateMockToken(token)) {
      const userJson = await AsyncStorage.getItem("mock_user");
      if (userJson) {
        const user = JSON.parse(userJson);
        set({ user, token, isAuthenticated: true, isLoading: false });
        console.log("[Auth] Mock session restored for:", user.name);
        return;
      }
    }
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  } catch (error) {
    console.error("[Auth] Mock init error:", error);
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  }
}

async function mockLogin(email, password, set, get) {
  const user = findMockUser(email, password);
    
  if (!user) {
    const error = new Error("Invalid email or password");
    error.response = { data: { message: "Invalid email or password" } };
    throw error;
  }
    
  const token = generateMockToken(user);
  await get().setAuth(user, token);
  console.log("[Auth] Mock login successful for:", user.name);
  return user;
}
