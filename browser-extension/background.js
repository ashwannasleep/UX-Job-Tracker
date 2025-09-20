// Background service worker for LinkedIn Job Tracker Extension

class BackgroundService {
  constructor() {
    this.init();
  }

  init() {
    // Handle installation
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        this.onInstall();
      } else if (details.reason === 'update') {
        this.onUpdate();
      }
    });

    // Handle messages from content script and popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep the message channel open for async responses
    });

    // Handle tab updates to inject content script on LinkedIn pages
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url && tab.url.includes('linkedin.com')) {
        this.injectContentScript(tabId);
      }
    });
  }

  async onInstall() {
    // Set default settings
    await chrome.storage.sync.set({
      isEnabled: true,
      serverUrl: 'http://localhost:5000',
      showNotifications: true,
      autoTrackEasyApply: true,
      autoTrackRegularApply: true
    });

    // Extension installed successfully
    console.log('LinkedIn Job Tracker Extension installed successfully');

    console.log('LinkedIn Job Tracker Extension installed');
  }

  async onUpdate() {
    console.log('LinkedIn Job Tracker Extension updated');
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case 'GET_SETTINGS':
          const settings = await chrome.storage.sync.get([
            'isEnabled', 'serverUrl', 'showNotifications', 
            'autoTrackEasyApply', 'autoTrackRegularApply'
          ]);
          sendResponse({ success: true, data: settings });
          break;

        case 'UPDATE_SETTINGS':
          await chrome.storage.sync.set(message.data);
          sendResponse({ success: true });
          break;

        case 'APPLICATION_TRACKED':
          // Handle successful application tracking
          await this.updateStats(message.data);
          this.showBadgeUpdate();
          sendResponse({ success: true });
          break;

        case 'TEST_CONNECTION':
          const isConnected = await this.testServerConnection(message.serverUrl);
          sendResponse({ success: true, connected: isConnected });
          break;

        case 'RETRY_FAILED_APPLICATIONS':
          const retryResults = await this.retryFailedApplications();
          sendResponse({ success: true, results: retryResults });
          break;

        case 'GET_STATS':
          const stats = await this.getExtensionStats();
          sendResponse({ success: true, data: stats });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Background script error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async injectContentScript(tabId) {
    try {
      // Check if content script is already injected
      const results = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => window.linkedInJobDetector !== undefined
      });

      if (!results[0].result) {
        // Inject content script
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content.js']
        });
      }
    } catch (error) {
      console.error('Failed to inject content script:', error);
    }
  }

  async testServerConnection(serverUrl) {
    try {
      const response = await fetch(`${serverUrl}/api/stats`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      return response.ok;
    } catch (error) {
      console.error('Server connection test failed:', error);
      return false;
    }
  }

  async updateStats(applicationData) {
    const stats = await chrome.storage.local.get(['extensionStats']);
    const currentStats = stats.extensionStats || {
      totalTracked: 0,
      lastTracked: null,
      trackedToday: 0,
      lastResetDate: new Date().toDateString()
    };

    // Reset daily counter if it's a new day
    const today = new Date().toDateString();
    if (currentStats.lastResetDate !== today) {
      currentStats.trackedToday = 0;
      currentStats.lastResetDate = today;
    }

    currentStats.totalTracked += 1;
    currentStats.trackedToday += 1;
    currentStats.lastTracked = {
      company: applicationData.company,
      position: applicationData.position,
      timestamp: new Date().toISOString()
    };

    await chrome.storage.local.set({ extensionStats: currentStats });
  }

  showBadgeUpdate() {
    // Show a temporary badge to indicate successful tracking
    chrome.action.setBadgeText({ text: '✓' });
    chrome.action.setBadgeBackgroundColor({ color: '#10B981' });

    // Clear badge after 3 seconds
    setTimeout(() => {
      chrome.action.setBadgeText({ text: '' });
    }, 3000);
  }

  async retryFailedApplications() {
    const result = await chrome.storage.local.get(['failedApplications']);
    const failedApplications = result.failedApplications || [];
    
    if (failedApplications.length === 0) {
      return { retried: 0, successful: 0 };
    }

    const settings = await chrome.storage.sync.get(['serverUrl']);
    const serverUrl = settings.serverUrl || 'http://localhost:5000';

    let successful = 0;
    const stillFailed = [];

    for (const failed of failedApplications) {
      try {
        const response = await fetch(`${serverUrl}/api/applications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(failed.jobData)
        });

        if (response.ok) {
          successful++;
        } else {
          stillFailed.push(failed);
        }
      } catch (error) {
        stillFailed.push(failed);
      }
    }

    // Update storage with remaining failed applications
    await chrome.storage.local.set({ failedApplications: stillFailed });

    return {
      retried: failedApplications.length,
      successful: successful,
      stillFailed: stillFailed.length
    };
  }

  async getExtensionStats() {
    const result = await chrome.storage.local.get(['extensionStats', 'failedApplications']);
    const stats = result.extensionStats || {
      totalTracked: 0,
      lastTracked: null,
      trackedToday: 0,
      lastResetDate: new Date().toDateString()
    };
    
    const failedCount = (result.failedApplications || []).length;
    
    return {
      ...stats,
      failedApplications: failedCount
    };
  }
}

// Initialize the background service
new BackgroundService();