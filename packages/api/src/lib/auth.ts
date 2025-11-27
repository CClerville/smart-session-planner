// =============================================================================
// AUTHENTICATION UTILITIES
// =============================================================================
// JWT token creation and verification using the 'jose' library.
// Password hashing using bcrypt with secure defaults.
// =============================================================================

import bcrypt from "bcrypt";
import { SignJWT, jwtVerify } from "jose";

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

/** Number of salt rounds for bcrypt (10-12 is standard for production) */
const BCRYPT_SALT_ROUNDS = 12;

/** JWT expiration time (7 days) */
const JWT_EXPIRATION = "7d";

/** JWT algorithm */
const JWT_ALGORITHM = "HS256";

// -----------------------------------------------------------------------------
// JWT Functions
// -----------------------------------------------------------------------------

/**
 * Creates a JWT token for an authenticated user.
 * Token contains user ID and email, expires in 7 days.
 *
 * @param payload - User data to encode in token
 * @param secret - JWT secret key from environment
 * @returns Signed JWT token string
 */
export async function createToken(
  payload: { userId: string; email: string },
  secret: string
): Promise<string> {
  // Encode the secret as Uint8Array for jose
  const secretKey = new TextEncoder().encode(secret);

  // Create and sign the JWT
  const token = await new SignJWT({
    sub: payload.userId,
    email: payload.email,
  })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRATION)
    .sign(secretKey);

  return token;
}

/**
 * Verifies a JWT token and extracts the payload.
 * Returns null if token is invalid or expired.
 *
 * @param token - JWT token to verify
 * @param secret - JWT secret key from environment
 * @returns Decoded payload or null if invalid
 */
export async function verifyToken(
  token: string,
  secret: string
): Promise<{ userId: string; email: string } | null> {
  try {
    const secretKey = new TextEncoder().encode(secret);

    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: [JWT_ALGORITHM],
    });

    // Validate required fields exist
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") {
      return null;
    }

    return {
      userId: payload.sub,
      email: payload.email,
    };
  } catch {
    // Token is invalid, expired, or malformed
    return null;
  }
}

// -----------------------------------------------------------------------------
// Password Functions
// -----------------------------------------------------------------------------

/**
 * Hashes a plain text password using bcrypt.
 * Uses 12 salt rounds for strong security.
 *
 * @param password - Plain text password to hash
 * @returns Bcrypt hash of the password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Compares a plain text password against a bcrypt hash.
 *
 * @param password - Plain text password to check
 * @param hash - Bcrypt hash to compare against
 * @returns True if password matches, false otherwise
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

