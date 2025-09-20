// LinkedIn Job Application Auto-Detection Content Script

class LinkedInJobDetector {
  constructor() {
    this.lastDetectedJob = null;
    this.serverUrl = 'http://localhost:5000'; // Will be configurable in popup
    this.isEnabled = true;
    
    this.init();
  }

  async init() {
    // Load settings from storage
    const result = await chrome.storage.sync.get(['serverUrl', 'isEnabled']);
    this.serverUrl = result.serverUrl || 'http://localhost:5000';
    this.isEnabled = result.isEnabled !== false;

    if (this.isEnabled) {
      this.startDetection();
    }
  }

  startDetection() {
    console.log('LinkedIn Job Tracker: Starting auto-detection...');
    
    // Detect Easy Apply button clicks
    this.detectEasyApplyClicks();
    
    // Detect regular apply button clicks
    this.detectRegularApplyClicks();
    
    // Monitor page changes for SPA navigation
    this.monitorPageChanges();
  }

  detectEasyApplyClicks() {
    // Monitor for Easy Apply buttons
    const easyApplySelectors = [
      '.jobs-apply-button',
      '[data-control-name="jobdetails_topcard_inapply"]',
      'button[aria-label*="Easy Apply"]',
      '.artdeco-button--primary[aria-label*="Easy Apply"]'
    ];

    easyApplySelectors.forEach(selector => {
      document.addEventListener('click', (event) => {
        if (event.target.matches(selector) || event.target.closest(selector)) {
          this.handleJobApplication('easy_apply');
        }
      }, true);
    });
  }

  detectRegularApplyClicks() {
    // Monitor for regular Apply buttons
    const applySelectors = [
      'a[href*="apply"]',
      'button[aria-label*="Apply"]',
      '.jobs-apply-button--top-card',
      '[data-control-name="apply"]'
    ];

    applySelectors.forEach(selector => {
      document.addEventListener('click', (event) => {
        if (event.target.matches(selector) || event.target.closest(selector)) {
          this.handleJobApplication('external_apply');
        }
      }, true);
    });
  }

  monitorPageChanges() {
    // Use MutationObserver to detect SPA navigation
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if we're on a job page
          if (window.location.href.includes('/jobs/view/')) {
            this.setupJobPageDetection();
          }
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  setupJobPageDetection() {
    // Add a slight delay to ensure page is fully loaded
    setTimeout(() => {
      this.attachButtonListeners();
    }, 1000);
  }

  attachButtonListeners() {
    // Find and attach listeners to apply buttons on the current page
    const easyApplyButtons = document.querySelectorAll('.jobs-apply-button, [aria-label*="Easy Apply"]');
    const applyButtons = document.querySelectorAll('a[href*="apply"], [data-control-name="apply"]');

    easyApplyButtons.forEach(button => {
      if (!button.dataset.trackerAttached) {
        button.addEventListener('click', () => this.handleJobApplication('easy_apply'));
        button.dataset.trackerAttached = 'true';
      }
    });

    applyButtons.forEach(button => {
      if (!button.dataset.trackerAttached) {
        button.addEventListener('click', () => this.handleJobApplication('external_apply'));
        button.dataset.trackerAttached = 'true';
      }
    });
  }

  async handleJobApplication(applicationType) {
    console.log('LinkedIn Job Tracker: Application detected!', applicationType);

    try {
      const jobData = await this.extractJobData();
      
      if (jobData && jobData.company && jobData.position) {
        // Avoid duplicate submissions
        const jobKey = `${jobData.company}-${jobData.position}`;
        if (this.lastDetectedJob === jobKey) {
          console.log('LinkedIn Job Tracker: Duplicate application detected, skipping...');
          return;
        }
        this.lastDetectedJob = jobKey;

        // Send to job tracker
        await this.sendToJobTracker(jobData, applicationType);
        
        // Show notification
        this.showNotification(jobData);
      }
    } catch (error) {
      console.error('LinkedIn Job Tracker: Error processing application:', error);
    }
  }

  async extractJobData() {
    // Extract job information from the current page
    const jobData = {};

    try {
      // Job title
      const titleSelectors = [
        '.jobs-unified-top-card__job-title h1',
        '.job-details-jobs-unified-top-card__job-title h1',
        '.jobs-details__main-content h1',
        '[data-job-title]'
      ];
      jobData.position = this.getTextFromSelectors(titleSelectors);

      // Company name
      const companySelectors = [
        '.jobs-unified-top-card__company-name a',
        '.job-details-jobs-unified-top-card__company-name a',
        '.jobs-details__main-content .jobs-unified-top-card__company-name',
        '[data-company-name]'
      ];
      jobData.company = this.getTextFromSelectors(companySelectors);

      // Location
      const locationSelectors = [
        '.jobs-unified-top-card__bullet',
        '.job-details-jobs-unified-top-card__bullet',
        '.jobs-unified-top-card__primary-description',
        '[data-job-location]'
      ];
      jobData.location = this.getTextFromSelectors(locationSelectors);

      // Job URL
      jobData.jobUrl = window.location.href;

      // Extract job ID from URL
      const jobIdMatch = window.location.href.match(/\/jobs\/view\/(\d+)/);
      if (jobIdMatch) {
        jobData.jobId = jobIdMatch[1];
      }

      // Job description (first few lines)
      const descriptionSelectors = [
        '.jobs-description-content__text',
        '.jobs-box__html-content',
        '.jobs-description__content'
      ];
      const description = this.getTextFromSelectors(descriptionSelectors);
      if (description) {
        jobData.notes = `Auto-imported from LinkedIn. ${description.substring(0, 300)}...`;
      }

      console.log('LinkedIn Job Tracker: Extracted job data:', jobData);
      return jobData;

    } catch (error) {
      console.error('LinkedIn Job Tracker: Error extracting job data:', error);
      return null;
    }
  }

  getTextFromSelectors(selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    }
    return '';
  }

  async sendToJobTracker(jobData, applicationType) {
    try {
      const applicationData = {
        company: jobData.company,
        position: jobData.position,
        status: 'applied',
        location: jobData.location || '',
        jobUrl: jobData.jobUrl || '',
        notes: jobData.notes || `Auto-detected application via ${applicationType}`,
        applicationDate: new Date().toISOString(),
        contactEmail: '',
        contactName: '',
        salary: null,
        nextStepDate: null
      };

      const response = await fetch(`${this.serverUrl}/api/extension/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData)
      });

      if (response.ok) {
        console.log('LinkedIn Job Tracker: Successfully sent application to tracker');
        // Send message to popup to update status
        chrome.runtime.sendMessage({
          type: 'APPLICATION_TRACKED',
          data: applicationData
        });
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

    } catch (error) {
      console.error('LinkedIn Job Tracker: Failed to send to job tracker:', error);
      // Store failed attempts for retry
      chrome.storage.local.set({
        failedApplications: await this.getFailedApplications().concat([{
          jobData,
          applicationType,
          timestamp: Date.now(),
          error: error.message
        }])
      });
    }
  }

  async getFailedApplications() {
    const result = await chrome.storage.local.get(['failedApplications']);
    return result.failedApplications || [];
  }

  showNotification(jobData) {
    // Create a temporary notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #0a66c2;
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
    `;

    notification.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 4px;">
        ✅ Application Tracked!
      </div>
      <div style="opacity: 0.9;">
        ${jobData.position} at ${jobData.company}
      </div>
    `;

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Remove notification after 4 seconds
    setTimeout(() => {
      notification.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 4000);
  }
}

// Set flag to prevent duplicate injection from background script
window.linkedInJobDetector = true;

// Initialize the detector when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new LinkedInJobDetector());
} else {
  new LinkedInJobDetector();
}