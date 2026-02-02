// Popup script for extension settings

interface Config {
  apiUrl: string;
  token: string | null;
  workspaceId: string | null;
  userId: string | null;
}

// DOM Elements
const loginView = document.getElementById('login-view') as HTMLDivElement;
const loggedInView = document.getElementById('logged-in-view') as HTMLDivElement;
const apiUrlInput = document.getElementById('api-url') as HTMLInputElement;
const workspaceIdInput = document.getElementById('workspace-id') as HTMLInputElement;
const userIdInput = document.getElementById('user-id') as HTMLInputElement;
const errorDiv = document.getElementById('error') as HTMLDivElement;
const loginBtn = document.getElementById('login-btn') as HTMLButtonElement;
const logoutBtn = document.getElementById('logout-btn') as HTMLButtonElement;
const displayWorkspace = document.getElementById('display-workspace') as HTMLSpanElement;
const displayUser = document.getElementById('display-user') as HTMLSpanElement;

// Show error message
function showError(message: string) {
  errorDiv.textContent = message;
  errorDiv.classList.add('visible');
}

// Hide error message
function hideError() {
  errorDiv.classList.remove('visible');
}

// Switch between views
function showLoggedInView(config: Config) {
  loginView.classList.add('hidden');
  loggedInView.classList.add('visible');
  displayWorkspace.textContent = config.workspaceId || '-';
  displayUser.textContent = config.userId || '-';
}

function showLoginView() {
  loginView.classList.remove('hidden');
  loggedInView.classList.remove('visible');
}

// Load current config
async function loadConfig() {
  const response = await chrome.runtime.sendMessage({ type: 'GET_CONFIG' });
  const config = response.config as Config;

  if (config.token) {
    showLoggedInView(config);
  } else {
    showLoginView();
    if (config.apiUrl) {
      apiUrlInput.value = config.apiUrl;
    }
    if (config.workspaceId) {
      workspaceIdInput.value = config.workspaceId;
    }
    if (config.userId) {
      userIdInput.value = config.userId;
    }
  }
}

// Handle login
async function handleLogin() {
  hideError();

  const apiUrl = apiUrlInput.value.trim();
  const workspaceId = workspaceIdInput.value.trim();
  const userId = userIdInput.value.trim();

  if (!apiUrl || !workspaceId || !userId) {
    showError('All fields are required');
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = 'Connecting...';

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'AUTHENTICATE',
      apiUrl,
      workspaceId,
      userId,
    });

    if (response.success) {
      showLoggedInView({
        apiUrl,
        token: 'set',
        workspaceId,
        userId,
      });
    } else {
      showError(response.error || 'Connection failed');
    }
  } catch (error) {
    showError('Failed to connect. Please try again.');
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Connect';
  }
}

// Handle logout
async function handleLogout() {
  await chrome.runtime.sendMessage({ type: 'LOGOUT' });
  showLoginView();
  workspaceIdInput.value = '';
  userIdInput.value = '';
}

// Event listeners
loginBtn.addEventListener('click', handleLogin);
logoutBtn.addEventListener('click', handleLogout);

// Handle Enter key
[apiUrlInput, workspaceIdInput, userIdInput].forEach((input) => {
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  });
});

// Initialize
loadConfig();
