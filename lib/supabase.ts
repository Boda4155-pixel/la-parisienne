import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import "react-native-url-polyfill/auto";

const supabaseUrl = "https://cdiorocrwimhkowwfegd.supabase.co";
const supabaseKey = "sb_publishable_2jGDWriymMRFrRKPAoXmnQ_n2f-DFK-";

/**
 * SecureStorageAdapter — encrypts session data on device using
 * expo-secure-store (Android: Android Keystore, iOS: Keychain).
 *
 * expo-secure-store stores values as strings, so we URL-encode.
 * Large sessions are chunked across multiple keys to stay under the
 * per-entry size limit imposed by the Keychain/Keystore backends.
 *
 * NOTE: SecureStore keys may only contain [A-Za-z0-9._-]. We use
 * a "_chunk_N" suffix (not ":") to stay within that charset.
 */

const CHUNK_SIZE = 2000;
const KEY_CHAR_REGEX = /^[A-Za-z0-9._-]+$/;

function encode(value: string): string {
  return encodeURI(value);
}

function decode(value: string): string {
  return decodeURI(value);
}

/**
 * Remove leftover plaintext session entries from AsyncStorage that were
 * written by the old AsyncStorage-based storage adapter. Only Supabase
 * session/auth keys are targeted — language preference keys (e.g.
 * "user-language", "app_lang") are left untouched.
 */
async function purgeLegacySessions(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const keys = await AsyncStorage.getAllKeys();
    const legacyKeys = keys.filter(
      (k) => k.startsWith("sb-") || k.includes("auth-token")
    );
    if (legacyKeys.length > 0) {
      await AsyncStorage.multiRemove(legacyKeys);
    }
  } catch {
    // Best-effort cleanup — don't block startup if AsyncStorage fails
  }
}

// Run cleanup once on module load (native only)
if (Platform.OS !== "web") {
  purgeLegacySessions();
}

const SecureStorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    if (!KEY_CHAR_REGEX.test(key)) return null;
    const encoded = await SecureStore.getItemAsync(key);
    if (encoded === undefined || encoded === null) return null;
    // Check if chunked
    const prefix = encoded.slice(0, 2);
    if (prefix === "[C") {
      // Reconstruct from chunks: [COUNT,CHUNK_SIZE]
      const parts = JSON.parse(decodeURI(encoded));
      const count: number = parts[0];
      let result = "";
      for (let i = 0; i < count; i++) {
        const chunkKey = `${key}_chunk_${i}`;
        if (!KEY_CHAR_REGEX.test(chunkKey)) continue;
        const chunk = await SecureStore.getItemAsync(chunkKey);
        if (chunk !== undefined && chunk !== null) {
          result += decode(chunk);
        }
      }
      return result;
    }
    return decode(encoded);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (!KEY_CHAR_REGEX.test(key)) return;
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, encode(value));
      return;
    }
    // Chunk large values
    const chunkCount = Math.ceil(value.length / CHUNK_SIZE);
    await SecureStore.setItemAsync(
      key,
      encodeURI(JSON.stringify([chunkCount, CHUNK_SIZE]))
    );
    for (let i = 0; i < chunkCount; i++) {
      const chunkKey = `${key}_chunk_${i}`;
      if (!KEY_CHAR_REGEX.test(chunkKey)) continue;
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, value.length);
      await SecureStore.setItemAsync(chunkKey, encode(value.slice(start, end)));
    }
  },

  async removeItem(key: string): Promise<void> {
    if (!KEY_CHAR_REGEX.test(key)) return;
    await SecureStore.deleteItemAsync(key);
    // Remove any chunks
    let i = 0;
    while (true) {
      const chunkKey = `${key}_chunk_${i}`;
      if (!KEY_CHAR_REGEX.test(chunkKey)) break;
      const exists = await SecureStore.getItemAsync(chunkKey);
      if (exists === undefined) break;
      await SecureStore.deleteItemAsync(chunkKey);
      i++;
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: Platform.OS === "web"
      ? undefined
      : SecureStorageAdapter as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
