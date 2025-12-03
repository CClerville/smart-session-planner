// =============================================================================
// SECURE STORAGE
// =============================================================================
// Provides secure storage for React Native mobile apps (iOS/Android).
// Uses SecureStore for encrypted device storage.
// =============================================================================

import * as SecureStore from "expo-secure-store";

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const TOKEN_KEY = "auth_token";

// -----------------------------------------------------------------------------
// Storage Functions
// -----------------------------------------------------------------------------

/**
 * Get an item from secure storage.
 *
 * @param key - Storage key
 * @returns The stored value, or null if not found
 */
export async function getItem(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

/**
 * Store an item securely.
 *
 * @param key - Storage key
 * @param value - Value to store
 */
export async function setItem(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

/**
 * Delete an item from secure storage.
 *
 * @param key - Storage key
 */
export async function deleteItem(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}

// -----------------------------------------------------------------------------
// Auth Token Functions
// -----------------------------------------------------------------------------

/**
 * Get stored auth token.
 * Used by tRPC client for Authorization header.
 *
 * @returns The stored token, or null if not found
 */
export async function getToken(): Promise<string | null> {
  return getItem(TOKEN_KEY);
}

