// Background service worker for Accord extension

interface AuthConfig {
  apiUrl: string;
  token: string | null;
  workspaceId: string | null;
  userId: string | null;
}

// Default config
const DEFAULT_CONFIG: AuthConfig = {
  apiUrl: 'http://localhost:3001',
  token: null,
  workspaceId: null,
  userId: null,
};

// Get stored config
async function getConfig(): Promise<AuthConfig> {
  const result = await chrome.storage.local.get('accordConfig');
  return result.accordConfig || DEFAULT_CONFIG;
}

// Save config
async function saveConfig(config: Partial<AuthConfig>): Promise<void> {
  const current = await getConfig();
  await chrome.storage.local.set({
    accordConfig: { ...current, ...config },
  });
}

// Authenticate with backend
async function authenticate(
  apiUrl: string,
  workspaceId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspace_id: workspaceId,
        user_id: userId,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Login failed' }));
      return { success: false, error: error.error };
    }

    const data = await response.json();
    await saveConfig({
      apiUrl,
      token: data.token,
      workspaceId,
      userId,
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Network error. Is the backend running?' };
  }
}

// Create decision
async function createDecision(decisionData: {
  decision_text: string;
  rationale?: string;
  source_link?: string;
}): Promise<{ success: boolean; error?: string }> {
  const config = await getConfig();

  if (!config.token) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const response = await fetch(`${config.apiUrl}/api/decisions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.token}`,
      },
      body: JSON.stringify({
        ...decisionData,
        source_platform: 'chatgpt',
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to save' }));
      return { success: false, error: error.error };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    switch (request.type) {
      case 'GET_CONFIG':
        const config = await getConfig();
        sendResponse({ config });
        break;

      case 'AUTHENTICATE':
        const authResult = await authenticate(
          request.apiUrl,
          request.workspaceId,
          request.userId
        );
        sendResponse(authResult);
        break;

      case 'LOGOUT':
        await saveConfig({ token: null, workspaceId: null, userId: null });
        sendResponse({ success: true });
        break;

      case 'CREATE_DECISION':
        const createResult = await createDecision(request.data);
        sendResponse(createResult);
        break;

      default:
        sendResponse({ error: 'Unknown message type' });
    }
  })();

  // Return true to indicate async response
  return true;
});

export {};
