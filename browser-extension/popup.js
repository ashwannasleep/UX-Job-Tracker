// LinkedIn Job Tracker Extension Popup Script

class PopupController {
  constructor() {
    this.settings = {};
    this.stats = {};
    this.init();
  }

  async init() {
    // Load current settings and stats
    await this.loadSettings();
    await this.loadStats();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Check connection status
    await this.checkConnectionStatus();
    
    // Update UI
    this.updateUI();
  }

  async loadSettings() {
    try {
      const response = await this.sendMessage({ type: 'GET_SETTINGS' });
      if (response.success) {
        this.settings = response.data;
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  async loadStats() {
    try {
      const response = await this.sendMessage({ type: 'GET_STATS' });
      if (response.success) {
        this.stats = response.data;
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }

  setupEventListeners() {
    // Save settings button
    document.getElementById('saveSettings').addEventListener('click', () => {
      this.saveSettings();
    });

    // Test connection button
    document.getElementById('testConnection').addEventListener('click', () => {
      this.testConnection();
    });

    // Retry failed applications button
    document.getElementById('retryFailed').addEventListener('click', () => {
      this.retryFailedApplications();
    });

    // Open tracker button
    document.getElementById('openTracker').addEventListener('click', () => {
      this.openJobTracker();
    });

    // Help link
    document.getElementById('helpLink').addEventListener('click', (e) => {
      e.preventDefault();
      this.openHelpGuide();
    });

    // Auto-save server URL on change
    document.getElementById('serverUrl').addEventListener('blur', () => {
      this.saveSettings();
    });
  }

  updateUI() {
    // Update settings form
    document.getElementById('serverUrl').value = this.settings.serverUrl || 'http://localhost:5000';
    document.getElementById('isEnabled').checked = this.settings.isEnabled !== false;
    document.getElementById('showNotifications').checked = this.settings.showNotifications !== false;

    // Update stats
    document.getElementById('trackedToday').textContent = this.stats.trackedToday || 0;
    document.getElementById('totalTracked').textContent = this.stats.totalTracked || 0;
    document.getElementById('failedCount').textContent = this.stats.failedApplications || 0;

    // Update last tracked application
    if (this.stats.lastTracked) {
      const lastTrackedCard = document.getElementById('lastTrackedCard');
      const lastTrackedJob = document.getElementById('lastTrackedJob');
      const lastTrackedTime = document.getElementById('lastTrackedTime');

      lastTrackedJob.textContent = `${this.stats.lastTracked.position} at ${this.stats.lastTracked.company}`;
      lastTrackedTime.textContent = this.formatTimestamp(this.stats.lastTracked.timestamp);
      lastTrackedCard.style.display = 'block';
    }

    // Update retry button visibility
    const retryButton = document.getElementById('retryFailed');
    const failedCount = this.stats.failedApplications || 0;
    retryButton.style.display = failedCount > 0 ? 'block' : 'none';
  }

  async checkConnectionStatus() {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const statusDescription = document.getElementById('statusDescription');

    // Set checking state
    statusDot.className = 'status-dot checking';
    statusText.textContent = 'Checking connection...';
    statusDescription.textContent = 'Verifying connection to your job tracker...';

    try {
      const serverUrl = this.settings.serverUrl || 'http://localhost:5000';
      const response = await this.sendMessage({ 
        type: 'TEST_CONNECTION', 
        serverUrl: serverUrl 
      });

      if (response.success && response.connected) {
        statusDot.className = 'status-dot connected';
        statusText.textContent = 'Connected';
        statusDescription.textContent = 'Successfully connected to your job tracker';
      } else {
        statusDot.className = 'status-dot disconnected';
        statusText.textContent = 'Disconnected';
        statusDescription.textContent = 'Cannot connect to your job tracker. Check the URL in settings.';
      }
    } catch (error) {
      statusDot.className = 'status-dot disconnected';
      statusText.textContent = 'Connection Error';
      statusDescription.textContent = 'Failed to test connection. Make sure your job tracker is running.';
    }
  }

  async saveSettings() {
    const saveButton = document.getElementById('saveSettings');
    const saveButtonText = document.getElementById('saveButtonText');
    const saveButtonLoading = document.getElementById('saveButtonLoading');
    const saveMessage = document.getElementById('saveMessage');

    // Show loading state
    saveButton.disabled = true;
    saveButtonText.style.display = 'none';
    saveButtonLoading.style.display = 'inline-block';
    saveMessage.innerHTML = '';

    try {
      const newSettings = {
        serverUrl: document.getElementById('serverUrl').value.trim() || 'http://localhost:5000',
        isEnabled: document.getElementById('isEnabled').checked,
        showNotifications: document.getElementById('showNotifications').checked
      };

      const response = await this.sendMessage({
        type: 'UPDATE_SETTINGS',
        data: newSettings
      });

      if (response.success) {
        this.settings = { ...this.settings, ...newSettings };
        saveMessage.innerHTML = '<div class="success-message">Settings saved successfully!</div>';
        
        // Recheck connection with new settings
        setTimeout(() => this.checkConnectionStatus(), 500);
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      saveMessage.innerHTML = '<div class="error-message">Failed to save settings. Please try again.</div>';
    } finally {
      // Reset button state
      saveButton.disabled = false;
      saveButtonText.style.display = 'inline';
      saveButtonLoading.style.display = 'none';

      // Clear message after 3 seconds
      setTimeout(() => {
        saveMessage.innerHTML = '';
      }, 3000);
    }
  }

  async testConnection() {
    const testButton = document.getElementById('testConnection');
    const testButtonText = document.getElementById('testButtonText');
    const testButtonLoading = document.getElementById('testButtonLoading');
    const actionMessage = document.getElementById('actionMessage');

    // Show loading state
    testButton.disabled = true;
    testButtonText.style.display = 'none';
    testButtonLoading.style.display = 'inline-block';
    actionMessage.innerHTML = '';

    try {
      const serverUrl = document.getElementById('serverUrl').value.trim() || 'http://localhost:5000';
      const response = await this.sendMessage({ 
        type: 'TEST_CONNECTION', 
        serverUrl: serverUrl 
      });

      if (response.success && response.connected) {
        actionMessage.innerHTML = '<div class="success-message">✅ Connection successful! Your job tracker is running.</div>';
        this.checkConnectionStatus(); // Update main status
      } else {
        actionMessage.innerHTML = '<div class="error-message">❌ Connection failed. Make sure your job tracker is running at the specified URL.</div>';
      }
    } catch (error) {
      actionMessage.innerHTML = '<div class="error-message">❌ Connection test failed. Check your settings and try again.</div>';
    } finally {
      // Reset button state
      testButton.disabled = false;
      testButtonText.style.display = 'inline';
      testButtonLoading.style.display = 'none';

      // Clear message after 5 seconds
      setTimeout(() => {
        actionMessage.innerHTML = '';
      }, 5000);
    }
  }

  async retryFailedApplications() {
    const retryButton = document.getElementById('retryFailed');
    const retryButtonText = document.getElementById('retryButtonText');
    const retryButtonLoading = document.getElementById('retryButtonLoading');
    const actionMessage = document.getElementById('actionMessage');

    // Show loading state
    retryButton.disabled = true;
    retryButtonText.style.display = 'none';
    retryButtonLoading.style.display = 'inline-block';
    actionMessage.innerHTML = '';

    try {
      const response = await this.sendMessage({ type: 'RETRY_FAILED_APPLICATIONS' });

      if (response.success) {
        const { retried, successful, stillFailed } = response.results;
        
        if (successful > 0) {
          actionMessage.innerHTML = `<div class="success-message">✅ Successfully retried ${successful} of ${retried} failed applications!</div>`;
        } else if (retried === 0) {
          actionMessage.innerHTML = '<div class="success-message">No failed applications to retry.</div>';
        } else {
          actionMessage.innerHTML = `<div class="error-message">❌ Retry failed. ${stillFailed} applications still couldn't be sent.</div>`;
        }

        // Refresh stats
        await this.loadStats();
        this.updateUI();
      } else {
        throw new Error('Retry operation failed');
      }
    } catch (error) {
      actionMessage.innerHTML = '<div class="error-message">❌ Failed to retry applications. Please try again.</div>';
    } finally {
      // Reset button state
      retryButton.disabled = false;
      retryButtonText.style.display = 'inline';
      retryButtonLoading.style.display = 'none';

      // Clear message after 5 seconds
      setTimeout(() => {
        actionMessage.innerHTML = '';
      }, 5000);
    }
  }

  openJobTracker() {
    const serverUrl = this.settings.serverUrl || 'http://localhost:5000';
    chrome.tabs.create({ url: serverUrl });
  }

  openHelpGuide() {
    chrome.tabs.create({ 
      url: 'https://github.com/your-repo/linkedin-job-tracker-extension#setup-guide' 
    });
  }

  formatTimestamp(timestamp) {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString();
    } catch (error) {
      return 'Unknown';
    }
  }

  async sendMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});