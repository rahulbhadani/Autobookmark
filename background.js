// Function to format date and time
function getFormattedDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Function to bookmark all tabs
async function autoBookmarkTabs() {
  try {
    // Check if auto-bookmarking is enabled
    const { isEnabled } = await chrome.storage.local.get(['isEnabled']);
    if (!isEnabled) {
      console.log('Auto-bookmarking is disabled');
      return;
    }
    
    // Get all tabs
    const tabs = await chrome.tabs.query({});
    
    // Filter out chrome:// and other special URLs
    const validTabs = tabs.filter(tab => 
      tab.url && 
      !tab.url.startsWith('chrome://') && 
      !tab.url.startsWith('chrome-extension://') &&
      !tab.url.startsWith('about:')
    );
    
    if (validTabs.length === 0) {
      console.log('No valid tabs to bookmark');
      return;
    }
    
    // Create folder name with date and time
    const folderName = `Auto-Save ${getFormattedDateTime()}`;
    
    // Get or create the parent folder for all auto-saves
    let parentFolderId = '1'; // Default to bookmarks bar
    const { autoSaveFolderId } = await chrome.storage.local.get(['autoSaveFolderId']);
    
    if (autoSaveFolderId) {
      // Verify the folder still exists
      try {
        await chrome.bookmarks.get(autoSaveFolderId);
        parentFolderId = autoSaveFolderId;
      } catch (e) {
        // Folder doesn't exist, create a new one
        const parentFolder = await chrome.bookmarks.create({
          parentId: '1',
          title: 'Tab Auto-Saves'
        });
        parentFolderId = parentFolder.id;
        await chrome.storage.local.set({ autoSaveFolderId: parentFolder.id });
      }
    } else {
      // Create parent folder for the first time
      const parentFolder = await chrome.bookmarks.create({
        parentId: '1',
        title: 'Tab Auto-Saves'
      });
      parentFolderId = parentFolder.id;
      await chrome.storage.local.set({ autoSaveFolderId: parentFolder.id });
    }
    
    // Create the bookmark folder for this save
    const folder = await chrome.bookmarks.create({
      parentId: parentFolderId,
      title: folderName
    });
    
    // Create bookmarks for each tab
    let bookmarkedCount = 0;
    for (const tab of validTabs) {
      try {
        await chrome.bookmarks.create({
          parentId: folder.id,
          title: tab.title || tab.url,
          url: tab.url
        });
        bookmarkedCount++;
      } catch (error) {
        console.error(`Failed to bookmark tab: ${tab.url}`, error);
      }
    }
    
    // Update last save time and count
    const { totalSaves = 0 } = await chrome.storage.local.get(['totalSaves']);
    await chrome.storage.local.set({ 
      lastSaveTime: new Date().toISOString(),
      totalSaves: totalSaves + 1,
      lastSaveTabCount: bookmarkedCount
    });
    
    console.log(`Successfully auto-bookmarked ${bookmarkedCount} tabs at ${getFormattedDateTime()}`);
    
  } catch (error) {
    console.error('Error in auto-bookmarking:', error);
  }
}

// Set up the alarm when the extension is installed or updated
chrome.runtime.onInstalled.addListener(async () => {
  // Set default enabled state
  const { isEnabled } = await chrome.storage.local.get(['isEnabled']);
  if (isEnabled === undefined) {
    await chrome.storage.local.set({ isEnabled: true });
  }
  
  // Create alarm for every 2 minutes
  chrome.alarms.create('autoBookmark', {
    periodInMinutes: 2,
    delayInMinutes: 2
  });
  
  console.log('Auto-bookmark alarm created');
});

// Listen for alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'autoBookmark') {
    autoBookmarkTabs();
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggle') {
    // Handled by popup, just acknowledge
    sendResponse({ success: true });
  } else if (request.action === 'bookmarkNow') {
    autoBookmarkTabs().then(() => {
      sendResponse({ success: true });
    });
    return true; // Keep message channel open for async response
  }
});
