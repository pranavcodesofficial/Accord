// Content script for ChatGPT integration

interface DecisionFormData {
  decision_text: string;
  rationale: string;
  source_link: string;
}

// Decision keywords to detect
const DECISION_KEYWORDS = [
  'decision',
  'decided',
  'go with',
  'agreed',
  'we will',
  "let's do",
  'chosen',
  'selected',
  'finalized',
];

// Check if text contains decision keywords
function containsDecisionKeyword(text: string): boolean {
  const lowerText = text.toLowerCase();
  return DECISION_KEYWORDS.some((keyword) => lowerText.includes(keyword));
}

// Create floating UI elements
function createFloatingUI() {
  // Container for our UI
  const container = document.createElement('div');
  container.id = 'accord-container';
  container.innerHTML = `
    <style>
      #accord-container {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      #accord-fab {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 24px rgba(59, 130, 246, 0.4);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }
      
      #accord-fab:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 32px rgba(59, 130, 246, 0.5);
      }
      
      #accord-fab svg {
        width: 24px;
        height: 24px;
      }
      
      #accord-trigger-btn {
        position: fixed;
        bottom: 90px;
        right: 24px;
        padding: 10px 16px;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.6);
        border-radius: 12px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
        cursor: pointer;
        z-index: 10000;
        display: none;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 500;
        color: #1f2937;
        transition: all 0.2s ease;
      }
      
      #accord-trigger-btn:hover {
        background: rgba(255, 255, 255, 1);
        box-shadow: 0 6px 32px rgba(0, 0, 0, 0.15);
      }
      
      #accord-trigger-btn.visible {
        display: flex;
        animation: slideIn 0.3s ease;
      }
      
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      #accord-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(4px);
        z-index: 10001;
        display: none;
        align-items: center;
        justify-content: center;
      }
      
      #accord-modal-overlay.visible {
        display: flex;
        animation: fadeIn 0.2s ease;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      #accord-modal {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(40px);
        border: 1px solid rgba(255, 255, 255, 0.6);
        border-radius: 24px;
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.2);
        width: 90%;
        max-width: 480px;
        max-height: 90vh;
        overflow-y: auto;
        animation: modalSlideUp 0.3s ease;
      }
      
      @keyframes modalSlideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      #accord-modal-header {
        padding: 24px 24px 0;
      }
      
      #accord-modal-header h2 {
        margin: 0 0 4px;
        font-size: 20px;
        font-weight: 600;
        color: #111827;
      }
      
      #accord-modal-header p {
        margin: 0;
        font-size: 14px;
        color: #6b7280;
      }
      
      #accord-modal-body {
        padding: 20px 24px;
      }
      
      .accord-field {
        margin-bottom: 16px;
      }
      
      .accord-field label {
        display: block;
        font-size: 14px;
        font-weight: 500;
        color: #374151;
        margin-bottom: 6px;
      }
      
      .accord-field label span {
        color: #ef4444;
      }
      
      .accord-field textarea,
      .accord-field input {
        width: 100%;
        padding: 12px;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        font-size: 14px;
        background: rgba(255, 255, 255, 0.5);
        resize: none;
        box-sizing: border-box;
        transition: border-color 0.2s ease;
      }
      
      .accord-field textarea:focus,
      .accord-field input:focus {
        outline: none;
        border-color: #3b82f6;
      }
      
      #accord-error {
        display: none;
        padding: 12px;
        background: rgba(239, 68, 68, 0.1);
        border-radius: 8px;
        color: #dc2626;
        font-size: 14px;
        margin-bottom: 16px;
      }
      
      #accord-error.visible {
        display: block;
      }
      
      #accord-modal-footer {
        padding: 0 24px 24px;
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }
      
      .accord-btn {
        padding: 10px 20px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .accord-btn-secondary {
        background: transparent;
        border: 1px solid #e5e7eb;
        color: #374151;
      }
      
      .accord-btn-secondary:hover {
        background: #f3f4f6;
      }
      
      .accord-btn-primary {
        background: #3b82f6;
        border: none;
        color: white;
      }
      
      .accord-btn-primary:hover {
        background: #2563eb;
      }
      
      .accord-btn-primary:disabled {
        background: #93c5fd;
        cursor: not-allowed;
      }
      
      #accord-toast {
        position: fixed;
        bottom: 90px;
        right: 24px;
        padding: 12px 20px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.6);
        border-radius: 12px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
        z-index: 10002;
        display: none;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        animation: slideIn 0.3s ease;
      }
      
      #accord-toast.visible {
        display: flex;
      }
      
      #accord-toast.success {
        border-left: 3px solid #10b981;
      }
      
      #accord-toast.error {
        border-left: 3px solid #ef4444;
      }
    </style>
    
    <!-- FAB Button -->
    <button id="accord-fab" title="Log Decision to Accord">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    </button>
    
    <!-- Contextual trigger button (shown when decision detected) -->
    <button id="accord-trigger-btn">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Log Decision
    </button>
    
    <!-- Modal overlay -->
    <div id="accord-modal-overlay">
      <div id="accord-modal">
        <div id="accord-modal-header">
          <h2>Log Decision</h2>
          <p>Capture this decision for your team.</p>
        </div>
        
        <div id="accord-modal-body">
          <div class="accord-field">
            <label>Decision Summary <span>*</span></label>
            <textarea id="accord-decision-text" rows="4" placeholder="What was decided?"></textarea>
          </div>
          
          <div class="accord-field">
            <label>Rationale</label>
            <textarea id="accord-rationale" rows="3" placeholder="Why was this decision made?"></textarea>
          </div>
          
          <div class="accord-field">
            <label>Source Link</label>
            <input type="url" id="accord-source-link" placeholder="https://..." />
          </div>
          
          <div id="accord-error"></div>
        </div>
        
        <div id="accord-modal-footer">
          <button class="accord-btn accord-btn-secondary" id="accord-cancel-btn">Cancel</button>
          <button class="accord-btn accord-btn-primary" id="accord-submit-btn">Save Decision</button>
        </div>
      </div>
    </div>
    
    <!-- Toast notification -->
    <div id="accord-toast"></div>
  `;

  document.body.appendChild(container);
  return container;
}

// Show toast notification
function showToast(message: string, type: 'success' | 'error') {
  const toast = document.getElementById('accord-toast');
  if (!toast) return;

  toast.textContent = type === 'success' ? `✓ ${message}` : `✗ ${message}`;
  toast.className = `visible ${type}`;

  setTimeout(() => {
    toast.className = '';
  }, 3000);
}

// Show/hide modal
function toggleModal(show: boolean, initialText?: string) {
  const overlay = document.getElementById('accord-modal-overlay');
  const textArea = document.getElementById('accord-decision-text') as HTMLTextAreaElement;
  const rationale = document.getElementById('accord-rationale') as HTMLTextAreaElement;
  const sourceLink = document.getElementById('accord-source-link') as HTMLInputElement;
  const errorDiv = document.getElementById('accord-error');

  if (!overlay) return;

  if (show) {
    overlay.classList.add('visible');
    if (initialText) {
      textArea.value = initialText;
    }
    // Set source link to current URL
    sourceLink.value = window.location.href;
    textArea.focus();
  } else {
    overlay.classList.remove('visible');
    // Reset form
    textArea.value = '';
    rationale.value = '';
    sourceLink.value = '';
    if (errorDiv) errorDiv.classList.remove('visible');
  }
}

// Show/hide trigger button
function showTriggerButton(show: boolean) {
  const btn = document.getElementById('accord-trigger-btn');
  if (btn) {
    if (show) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }
}

// Submit decision
async function submitDecision() {
  const textArea = document.getElementById('accord-decision-text') as HTMLTextAreaElement;
  const rationale = document.getElementById('accord-rationale') as HTMLTextAreaElement;
  const sourceLink = document.getElementById('accord-source-link') as HTMLInputElement;
  const submitBtn = document.getElementById('accord-submit-btn') as HTMLButtonElement;
  const errorDiv = document.getElementById('accord-error');

  const decisionText = textArea.value.trim();
  if (!decisionText) {
    if (errorDiv) {
      errorDiv.textContent = 'Decision summary is required';
      errorDiv.classList.add('visible');
    }
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving...';

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'CREATE_DECISION',
      data: {
        decision_text: decisionText,
        rationale: rationale.value.trim() || undefined,
        source_link: sourceLink.value.trim() || window.location.href,
      },
    });

    if (response.success) {
      toggleModal(false);
      showToast('Decision logged successfully!', 'success');
    } else {
      if (errorDiv) {
        errorDiv.textContent = response.error || 'Failed to save decision';
        errorDiv.classList.add('visible');
      }
    }
  } catch (error) {
    if (errorDiv) {
      errorDiv.textContent = 'Failed to save decision. Please try again.';
      errorDiv.classList.add('visible');
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save Decision';
  }
}

// Initialize event listeners
function initializeEventListeners() {
  const fab = document.getElementById('accord-fab');
  const triggerBtn = document.getElementById('accord-trigger-btn');
  const cancelBtn = document.getElementById('accord-cancel-btn');
  const submitBtn = document.getElementById('accord-submit-btn');
  const overlay = document.getElementById('accord-modal-overlay');

  fab?.addEventListener('click', () => toggleModal(true));
  triggerBtn?.addEventListener('click', () => {
    toggleModal(true);
    showTriggerButton(false);
  });
  cancelBtn?.addEventListener('click', () => toggleModal(false));
  submitBtn?.addEventListener('click', submitDecision);

  // Close on overlay click
  overlay?.addEventListener('click', (e) => {
    if (e.target === overlay) {
      toggleModal(false);
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      toggleModal(false);
    }
  });
}

// Watch for new messages in ChatGPT
function observeChatMessages() {
  // Find the main chat container
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement) {
            // Check if it's a message element
            const messageText = node.textContent || '';
            if (
              messageText.length > 20 &&
              containsDecisionKeyword(messageText)
            ) {
              showTriggerButton(true);
              // Auto-hide after 10 seconds
              setTimeout(() => showTriggerButton(false), 10000);
            }
          }
        }
      }
    }
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Initialize extension
function init() {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      createFloatingUI();
      initializeEventListeners();
      observeChatMessages();
    });
  } else {
    createFloatingUI();
    initializeEventListeners();
    observeChatMessages();
  }
}

init();
