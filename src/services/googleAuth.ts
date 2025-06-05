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
  }

  async initialize(): Promise<void> {
    console.log('GoogleAuthService.initialize() called');
    console.log('Client ID:', this.clientId);
    console.log('Is already initialized:', this.isInitialized);
    
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      // Check if Google Identity Services is already available
      if (window.google) {
        console.log('Google API already available');
        this.initializeGoogleSignIn();
        this.isInitialized = true;
        resolve();
        return;
      }

      console.log('Loading Google Identity Services script...');
      // Load Google Identity Services script if not present
      if (!document.querySelector('script[src*="accounts.google.com"]')) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          console.log('Google script loaded successfully');
          this.waitForGoogleAPI().then(() => {
            console.log('Google API is ready');
            this.initializeGoogleSignIn();
            this.isInitialized = true;
            resolve();
          }).catch(reject);
        };
        script.onerror = () => {
          console.error('Failed to load Google Identity Services script');
          reject(new Error('Failed to load Google Identity Services'));
        };
        document.head.appendChild(script);
      } else {
        console.log('Google script already exists, waiting for API...');
        // Script exists but Google API might not be ready yet
        this.waitForGoogleAPI().then(() => {
          console.log('Google API is ready (existing script)');
          this.initializeGoogleSignIn();
          this.isInitialized = true;
          resolve();
        }).catch(reject);
      }
    });
  }

  private waitForGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkGoogleAPI = () => {
        if (window.google) {
          resolve();
        } else {
          setTimeout(checkGoogleAPI, 100);
        }
      };
      
      // Start checking immediately
      checkGoogleAPI();
      
      // Set a timeout to prevent infinite waiting
      setTimeout(() => {
        reject(new Error('Timeout waiting for Google Identity Services to load'));
      }, 10000); // 10 second timeout
    });
  }

  private initializeGoogleSignIn(): void {
    console.log('initializeGoogleSignIn() called');
    if (!window.google) {
      console.error('Google Identity Services not loaded when trying to initialize');
      throw new Error('Google Identity Services not loaded');
    }

    console.log('Calling window.google.accounts.id.initialize with client_id:', this.clientId);
    window.google.accounts.id.initialize({
      client_id: this.clientId,
      auto_select: false,
      cancel_on_tap_outside: false,
    });
    console.log('Google Sign-In initialized successfully');
  }

  renderSignInButton(
    element: HTMLElement,
    onSignIn: (user: GoogleUser) => void,
    onError: (error: string) => void
  ): void {
    if (!this.isInitialized || !window.google) {
      throw new Error('Google Auth Service not initialized');
    }

    window.google.accounts.id.initialize({
      client_id: this.clientId,
      callback: (response: GoogleCredentialResponse) => {
        try {
          const user = this.parseJWT(response.credential);
          onSignIn(user);
        } catch (error) {
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