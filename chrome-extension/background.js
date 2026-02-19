// Service Worker for Antigravity Usage Monitor Extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('Antigravity Usage Monitor Extension installed');
  
  // Initialize default settings
  chrome.storage.local.get(['autoRefresh'], (result) => {
    if (result.autoRefresh === undefined) {
      chrome.storage.local.set({ autoRefresh: false });
    }
  });
});

// Listen for messages from popup or panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getStatus') {
    // Can be used to get extension status
    sendResponse({ status: 'active' });
  }
});

// Optional: Handle periodic background tasks
chrome.alarms.create('checkUsage', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkUsage') {
    // This can be used for background updates if needed
    console.log('Background check triggered');
  }
});
