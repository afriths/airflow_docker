/**
 * Authentication Service
 * Handles user authentication, token management, and session persistence
 */

import { airflowApiClient } from './airflowApiClient';
import type { AuthToken, User } from '../types/app';

/**
 * Token storage keys
 */
const TOKEN_STORAGE_KEY = 'airflow_auth_token';
const REFRESH_TOKEN_STORAGE_KEY = 'airflow_refresh_token';
const USER_STORAGE_KEY = 'airflow_user';

/**
 * Authentication Service Class
 * Manages authentication state and token lifecycle
 */
export class AuthService {
  private currentToken: AuthToken | null = null;
  private currentUser: User | null = null;
  private refreshTimer: number | null = null;

  constructor() {
    this.initializeFromStorage();
    this.setupTokenRefresh();
    this.setupEventListeners();
  }

  /**
   * Initialize authentication state from localStorage
   */
  private initializeFromStorage(): void {
    try {
      const tokenData = localStorage.getItem(TOKEN_STORAGE_KEY);
      const userData = localStorage.getItem(USER_STORAGE_KEY);

      if (tokenData) {
        const token: AuthToken = JSON.parse(tokenData);
        
        // Check if token is still valid
        if (token.expires_at > Date.now()) {
          this.currentToken = token;
          airflowApiClient.setAuthToken(token.access_token);
        } else {
          // Token expired, clear storage
          this.clearStoredAuth();
        }
      }

      if (userData) {
        this.currentUser = JSON.parse(userData);
      }
    } catch (error) {
      console.error('Error initializing auth from storage:', error);
      this.clearStoredAuth();
    }
  }

  /**
   * Set up automatic token refresh
   */
  private setupTokenRefresh(): void {
    if (this.currentToken) {
      this.scheduleTokenRefresh(this.currentToken);
    }
  }

  /**
   * Set up event listeners for token expiration
   */
  private setupEventListeners(): void {
    window.addEventListener('auth:token-expired', () => {
      this.handleTokenExpiration();
    });

    // Handle storage changes from other tabs
    window.addEventListener('storage', (event) => {
      if (event.key === TOKEN_STORAGE_KEY) {
        if (event.newValue) {
          const token: AuthToken = JSON.parse(event.newValue);
          this.setToken(token);
        } else {
          this.logout();
        }
      }
    });
  }

  /**
   * Schedule automatic token refresh
   */
  private scheduleTokenRefresh(token: AuthToken): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // Refresh token 5 minutes before expiration
    const refreshTime = token.expires_at - Date.now() - (5 * 60 * 1000);
    
    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshToken();
      }, refreshTime);
    }
  }

  /**
   * Handle token expiration
   */
  private handleTokenExpiration(): void {
    console.warn('Authentication token expired');
    
    // Try to refresh token if available
    if (this.currentToken?.refresh_token) {
      this.refreshToken();
    } else {
      // No refresh token available, logout user
      this.logout();
      window.dispatchEvent(new CustomEvent('auth:session-expired'));
    }
  }

  /**
   * Store authentication data in localStorage
   */
  private storeAuth(token: AuthToken, user?: User): void {
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(token));
      
      if (user) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      }
    } catch (error) {
      console.error('Error storing auth data:', error);
    }
  }

  /**
   * Clear stored authentication data
   */
  private clearStoredAuth(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  }

  /**
   * Set authentication token and update API client
   */
  private setToken(token: AuthToken): void {
    this.currentToken = token;
    airflowApiClient.setAuthToken(token.access_token);
    this.scheduleTokenRefresh(token);
  }

  /**
   * Login with username and password
   */
  public async login(username: string, password: string): Promise<{ token: AuthToken; user: User }> {
    try {
      // Note: Airflow's default auth might not have a dedicated login endpoint
      // This is a placeholder implementation that would need to be adapted
      // based on the actual Airflow authentication setup
      
      // const loginData: LoginRequest = { username, password };
      
      // For basic auth, we can create a token-like structure
      // In a real implementation, this would call the appropriate Airflow auth endpoint
      const basicAuthToken = btoa(`${username}:${password}`);
      
      // Create a mock token structure for basic auth
      const token: AuthToken = {
        access_token: basicAuthToken,
        token_type: 'Basic',
        expires_in: 24 * 60 * 60, // 24 hours
        expires_at: Date.now() + (24 * 60 * 60 * 1000),
      };

      // Create user object
      const user: User = {
        username,
        roles: ['User'], // Default role
      };

      // Set token and store auth data
      this.setToken(token);
      this.currentUser = user;
      this.storeAuth(token, user);

      // Test the connection to validate credentials
      await airflowApiClient.testConnection();

      return { token, user };
    } catch (error) {
      // Clear any partially set auth data on failure
      this.logout();
      throw error;
    }
  }

  /**
   * Refresh authentication token
   */
  public async refreshToken(): Promise<{ token: AuthToken; user: User }> {
    if (!this.currentToken?.refresh_token) {
      throw new Error('No refresh token available');
    }

    try {
      // const refreshData: RefreshTokenRequest = {
      //   refresh_token: this.currentToken.refresh_token,
      // };

      // Note: This would need to be implemented based on Airflow's auth system
      // For now, we'll extend the current token
      const newToken: AuthToken = {
        ...this.currentToken,
        expires_in: 24 * 60 * 60,
        expires_at: Date.now() + (24 * 60 * 60 * 1000),
      };

      this.setToken(newToken);
      this.storeAuth(newToken, this.currentUser || undefined);

      return {
        token: newToken,
        user: this.currentUser || { username: 'unknown', roles: ['User'] },
      };
    } catch (error) {
      // If refresh fails, logout user
      this.logout();
      throw error;
    }
  }

  /**
   * Logout user and clear all auth data
   */
  public logout(): void {
    // Clear timers
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    // Clear auth data
    this.currentToken = null;
    this.currentUser = null;
    airflowApiClient.clearAuthToken();
    this.clearStoredAuth();

    // Emit logout event
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return this.currentToken !== null && this.currentToken.expires_at > Date.now();
  }

  /**
   * Get current authentication token
   */
  public getToken(): AuthToken | null {
    return this.currentToken;
  }

  /**
   * Get current user
   */
  public getUser(): User | null {
    return this.currentUser;
  }

  /**
   * Get time until token expires (in milliseconds)
   */
  public getTokenExpirationTime(): number {
    if (!this.currentToken) {
      return 0;
    }
    return Math.max(0, this.currentToken.expires_at - Date.now());
  }

  /**
   * Check if token will expire soon (within 5 minutes)
   */
  public isTokenExpiringSoon(): boolean {
    const expirationTime = this.getTokenExpirationTime();
    return expirationTime > 0 && expirationTime < (5 * 60 * 1000);
  }

  /**
   * Manually trigger token refresh if needed
   */
  public async ensureValidToken(): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error('User not authenticated');
    }

    if (this.isTokenExpiringSoon()) {
      await this.refreshToken();
    }
  }
}

// Export singleton instance
export const authService = new AuthService();

// Export class for testing
export default AuthService;