declare namespace google.accounts.oauth2 {
  interface TokenClient {
    requestAccessToken(): void;
  }

  interface TokenResponse {
    access_token: string;
    error?: string;
    error_description?: string;
  }

  function initTokenClient(config: {
    client_id: string;
    scope: string;
    callback: (response: TokenResponse) => void;
  }): TokenClient;

  function revoke(token: string): void;
}

interface Window {
  google?: {
    accounts?: {
      oauth2?: typeof google.accounts.oauth2;
    };
  };
}
