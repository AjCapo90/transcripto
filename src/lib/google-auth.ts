const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/youtube.readonly';

let tokenClient: google.accounts.oauth2.TokenClient | null = null;

interface AuthResult {
  accessToken: string;
}

export function initGoogleAuth(): Promise<void> {
  return new Promise((resolve) => {
    if (document.getElementById('google-gsi-script')) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

export function requestAccessToken(): Promise<AuthResult> {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services not loaded'));
      return;
    }

    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error));
          return;
        }
        resolve({ accessToken: response.access_token });
      },
    });

    tokenClient.requestAccessToken();
  });
}

export function revokeToken(accessToken: string): void {
  window.google?.accounts?.oauth2?.revoke(accessToken);
}
