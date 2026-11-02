import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AppError } from './AppError.js';

/**
 * Safely retrieve ACCESS_TOKEN_SECRET from the environment.
 * NEVER hardcodes secrets. Throws a safe 500 error if unconfigured.
 */
export const getAccessTokenSecret = () => {
  const secret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_ACCESS_SECRET;
  if (!secret || typeof secret !== 'string' || !secret.trim()) {
    throw new AppError(
      'Server configuration error: ACCESS_TOKEN_SECRET is missing or not configured in environment.',
      500
    );
  }
  return secret.trim();
};

/**
 * Safely retrieve REFRESH_TOKEN_SECRET from the environment.
 * NEVER hardcodes secrets. Throws a safe 500 error if unconfigured.
 */
export const getRefreshTokenSecret = () => {
  const secret = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_REFRESH_SECRET;
  if (!secret || typeof secret !== 'string' || !secret.trim()) {
    throw new AppError(
      'Server configuration error: REFRESH_TOKEN_SECRET is missing or not configured in environment.',
      500
    );
  }
  return secret.trim();
};

// Configurable lifespans with safe standard defaults (15m short-lived, 7d longer-lived)
export const ACCESS_TOKEN_EXPIRES_IN =
  process.env.ACCESS_TOKEN_EXPIRES_IN || process.env.JWT_ACCESS_EXPIRES_IN || '15m';
export const REFRESH_TOKEN_EXPIRES_IN =
  process.env.REFRESH_TOKEN_EXPIRES_IN || process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Validate that required token secrets are present in environment.
 * Call during server bootstrap to detect configuration mistakes early.
 */
export const validateAuthEnvironment = () => {
  const missing = [];
  try {
    getAccessTokenSecret();
  } catch {
    missing.push('ACCESS_TOKEN_SECRET');
  }

  try {
    getRefreshTokenSecret();
  } catch {
    missing.push('REFRESH_TOKEN_SECRET');
  }

  if (missing.length > 0) {
    const errorMsg = `[SECURITY CONFIG ERROR] Missing required environment variable(s): ${missing.join(
      ', '
    )}. Please define them in your backend .env file (refer to .env.example).`;
    console.error(errorMsg);
    if (process.env.NODE_ENV === 'production') {
      throw new Error(errorMsg);
    }
  }
};

/**
 * Sign a short-lived access token using ACCESS_TOKEN_SECRET
 */
export const signAccessToken = (id) => {
  const secret = getAccessTokenSecret();
  return jwt.sign({ id }, secret, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
};

/**
 * Sign a longer-lived refresh token using REFRESH_TOKEN_SECRET
 */
export const signRefreshToken = (id) => {
  const secret = getRefreshTokenSecret();
  return jwt.sign({ id }, secret, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
};

/**
 * Verify an access token using ACCESS_TOKEN_SECRET
 */
export const verifyAccessToken = (token) => {
  const secret = getAccessTokenSecret();
  return jwt.verify(token, secret);
};

/**
 * Verify a refresh token using REFRESH_TOKEN_SECRET
 */
export const verifyRefreshToken = (token) => {
  const secret = getRefreshTokenSecret();
  return jwt.verify(token, secret);
};

/**
 * Hash a token using SHA-256 for secure database storage
 */
export const hashToken = (token) => {
  if (!token) return '';
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Cookie options helper for secure HttpOnly transmission
 */
export const getCookieOptions = (maxAgeMs) => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
    maxAge: maxAgeMs,
  };
};

/**
 * Attach secure HttpOnly cookies for both access and refresh tokens
 */
export const setAuthCookies = (res, accessToken, refreshToken) => {
  if (accessToken) {
    res.cookie('accessToken', accessToken, getCookieOptions(15 * 60 * 1000)); // 15 minutes
  }
  if (refreshToken) {
    res.cookie('refreshToken', refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000)); // 7 days
  }
};

/**
 * Clear access and refresh token cookies
 */
export const clearAuthCookies = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const clearOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  };
  res.clearCookie('accessToken', clearOptions);
  res.clearCookie('refreshToken', clearOptions);
};
