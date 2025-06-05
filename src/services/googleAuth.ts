declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: () => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

export interface GoogleUser {
  sub: string; // Google ID
  name: string;
  email: string;
  picture: string;
  email_verified: boolean;
  given_name: string;
  family_name: string;
}

export interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
}

export class GoogleAuthService {
  private clientId: string;
  private isInitialized = false;

  constructor(clientId: string) {
    this.clientId = clientId;
    
    // Add validation and logging for debugging
    if (!clientId) {
      console.error('❌ Google Client ID is missing! Check VITE_GOOGLE_CLIENT_ID environment variable.');
    } else {
      console.log('✅ Google Client ID loaded:', clientId.substring(0, 20) + '...');
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (!this.clientId) {
      throw new Error('Google Client ID is not configured. Please set VITE_GOOGLE_CLIENT_ID environment variable.');
    }

    return new Promise((resolve, reject) => {
      // Check if Google Identity Services is already available
      if (window.google) {
        try {
          this.initializeGoogleSignIn();
          this.isInitialized = true;
          console.log('✅ Google Auth initialized successfully');
          resolve();
        } catch (error) {
          console.error('❌ Failed to initialize Google Auth:', error);
          reject(error);
        }
        return;
      }

      // Load Google Identity Services script if not present
      if (!document.querySelector('script[src*="accounts.google.com"]')) {
        console.log('📡 Loading Google Identity Services script...');
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          console.log('✅ Google script loaded successfully');
          this.waitForGoogleAPI().then(() => {
            this.initializeGoogleSignIn();
            this.isInitialized = true;
            console.log('✅ Google Auth initialized after script load');
            resolve();
          }).catch((error) => {
            console.error('❌ Failed to initialize after script load:', error);
            reject(error);
          });
        };
        script.onerror = () => {
          const error = new Error('Failed to load Google Identity Services script');
          console.error('❌ Script loading failed:', error);
          reject(error);
        };
        document.head.appendChild(script);
      } else {
        console.log('📡 Google script already exists, waiting for API...');
        // Script exists but Google API might not be ready yet
        this.waitForGoogleAPI().then(() => {
          this.initializeGoogleSignIn();
          this.isInitialized = true;
          console.log('✅ Google Auth initialized from existing script');
          resolve();
        }).catch((error) => {
          console.error('❌ Failed to initialize from existing script:', error);
          reject(error);
        });
      }
    });
  }

  private waitForGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 100; // 10 seconds total
      
      const checkGoogleAPI = () => {
        attempts++;
        if (window.google) {
          console.log(`✅ Google API ready after ${attempts} attempts`);
          resolve();
        } else if (attempts >= maxAttempts) {
          const error = new Error(`Timeout waiting for Google Identity Services to load (${attempts} attempts)`);
          console.error('❌ Google API timeout:', error);
          reject(error);
        } else {
          setTimeout(checkGoogleAPI, 100);
        }
      };
      
      // Start checking immediately
      checkGoogleAPI();
    });
  }

  private initializeGoogleSignIn(): void {
    if (!window.google) {
      throw new Error('Google Identity Services not loaded');
    }

    try {
      window.google.accounts.id.initialize({
        client_id: this.clientId,
        auto_select: false,
        cancel_on_tap_outside: false,
      });
      console.log('✅ Google Identity Services initialized with client ID:', this.clientId.substring(0, 20) + '...');
    } catch (error) {
      console.error('❌ Failed to initialize Google Identity Services:', error);
      throw error;
    }
  }

  renderSignInButton(
    element: HTMLElement,
    onSignIn: (user: GoogleUser) => void,
    onError: (error: string) => void
  ): void {
    if (!this.isInitialized || !window.google) {
      const error = 'Google Auth Service not initialized';
      console.error('❌', error);
      throw new Error(error);
    }

    if (!this.clientId) {
      const error = 'Google Client ID is not configured';
      console.error('❌', error);
      onError(error);
      return;
    }

    try {
      console.log('🔘 Rendering Google Sign-In button...');
      
      window.google.accounts.id.initialize({
        client_id: this.clientId,
        callback: (response: GoogleCredentialResponse) => {
          try {
            console.log('✅ Google Sign-In response received');
            const user = this.parseJWT(response.credential);
            onSignIn(user);
          } catch (error) {
            console.error('❌ Failed to parse Google Sign-In response:', error);
            onError('Failed to parse Google Sign-In response');
          }
        },
      });

      window.google.accounts.id.renderButton(element, {
        theme: 'outline',
        size: 'large',
        width: '100%',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
      });
      
      console.log('✅ Google Sign-In button rendered successfully');
    } catch (error) {
      console.error('❌ Failed to render Google Sign-In button:', error);
      onError('Failed to render Google Sign-In button');
    }
  }

  private parseJWT(token: string): GoogleUser {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error('Invalid JWT token');
    }
  }

  signOut(): void {
    if (window.google) {
      window.google.accounts.id.disableAutoSelect();
    }
    // Reset the initialization flag so the service can be re-initialized
    this.isInitialized = false;
  }
}

// Create a singleton instance
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
export const googleAuthService = new GoogleAuthService(GOOGLE_CLIENT_ID); 