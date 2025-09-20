# LinkedIn Job Tracker Extension Setup Guide

## Installation

1. **Download the extension files** to a local folder on your computer
2. **Open Chrome** and go to `chrome://extensions/`
3. **Enable Developer mode** by clicking the toggle in the top-right corner
4. **Click "Load unpacked"** and select the `browser-extension` folder
5. **Pin the extension** by clicking the puzzle piece icon and pinning "LinkedIn Job Tracker"

## Setup

1. **Start your Job Tracker app** at `http://localhost:5000`
2. **Click the extension icon** in your browser toolbar
3. **Configure settings**:
   - **Job Tracker URL**: Enter `http://localhost:5000` (or your server URL)
   - **Auto-track applications**: Toggle ON to enable automatic tracking
   - **Show notifications**: Toggle ON to see confirmation notifications
4. **Click "Save Settings"**
5. **Test the connection** by clicking "Test Connection" button

## How It Works

### Automatic Detection
The extension automatically detects when you:
- Click "Easy Apply" buttons on LinkedIn job postings
- Click regular "Apply" buttons that redirect to external sites
- Navigate through LinkedIn's application process

### What Gets Tracked
For each application, the extension automatically captures:
- **Job title** and **Company name**
- **Location** (if specified)
- **Job URL** for reference
- **Application date** (current timestamp)
- **Notes** with basic job description excerpt

### Visual Feedback
When an application is detected:
- A notification appears in the top-right corner
- The extension badge shows a checkmark briefly
- Data is instantly synced to your job tracker

## Troubleshooting

### "Disconnected" Status
**Cause**: Can't reach your job tracker server  
**Solution**: 
- Make sure your job tracker is running at `http://localhost:5000`
- Check that the URL in settings is correct
- Click "Test Connection" to verify

### No Applications Being Detected
**Cause**: Extension not monitoring LinkedIn properly  
**Solution**:
- Refresh LinkedIn page and try again
- Make sure "Auto-track applications" is enabled in settings
- Check that you're on `linkedin.com/jobs/` pages

### Applications Not Appearing in Tracker
**Cause**: Network or validation errors  
**Solution**:
- Check the "Failed Applications" count in extension popup
- Click "Retry Failed" to attempt resubmission
- Verify your job tracker is accepting requests

### Duplicate Applications
**Cause**: Clicking apply buttons multiple times  
**Solution**: The extension has built-in duplicate detection, but refresh the page if you see duplicates

## Privacy & Security

- **Local Processing**: All data is processed locally on your machine
- **Direct Connection**: Extension communicates directly with your local job tracker
- **No External Servers**: No data is sent to third-party services
- **Minimal Permissions**: Extension only accesses LinkedIn pages when you're on them

## Manual Override

If automatic detection misses something:
- Use the **LinkedIn Import** feature in your job tracker
- Copy/paste job details or LinkedIn URLs
- The extension and manual import work together seamlessly

## Updates

The extension will automatically detect updates to your job tracker API. If you move your server to a different URL, just update the "Job Tracker URL" in the extension settings.

## Support

If you encounter issues:
1. Check the browser console for error messages (F12 → Console)
2. Verify your job tracker is running and accessible
3. Try disabling and re-enabling the extension
4. Refresh LinkedIn and try again