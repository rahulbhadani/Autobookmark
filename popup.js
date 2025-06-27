// Get UI elements
const toggleSwitch = document.getElementById('toggleSwitch');
const bookmarkNowBtn = document.getElementById('bookmarkNow');
const statusEl = document.getElementById('status');
const lastSaveEl = document.getElementById('lastSave');
const totalSavesEl = document.getElementById('totalSaves');
const lastTabCountEl = document.getElementById('lastTabCount');
const messageEl = document.getElementById('message');

// Function to show message
function showMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = type;
  messageEl.style.display = 'block';
  setTimeout(() => {
    messageEl.style.display = 'none';
  }, 3000);
}

// Function to format relative time
function formatRelativeTime(dateString) {
  if (!dateString) return 'Never';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  
  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  
  return date.toLocaleString();
}

// Function to update status display
async function updateStatus() {
  const data = await chrome.storage.local.get([
    'isEnabled', 
    'lastSaveTime', 
    'totalSaves', 
    'lastSaveTabCount'
  ]);
  
  // Update toggle
  toggleSwitch.checked = data.isEnabled !== false;
  
  // Update status text
  statusEl.textContent = data.isEnabled !== false ? 'Active' : 'Inactive';
  statusEl.style.color = data.isEnabled !== false ? '#4CAF50' : '#f44336';
  
  // Update button state
  bookmarkNowBtn.disabled = false;
  
  // Update statistics
  lastSaveEl.textContent = formatRelativeTime(data.lastSaveTime);
  totalSavesEl.textContent = data.totalSaves || '0';
  lastTabCountEl.textContent = data.lastSaveTabCount || '0';
}

// Toggle auto-save
toggleSwitch.addEventListener('change', async () => {
  const isEnabled = toggleSwitch.checked;
  await chrome.storage.local.set({ isEnabled });
  
  if (isEnabled) {
    // Re-create the alarm
    chrome.alarms.create('autoBookmark', {
      periodInMinutes: 2,
      delayInMinutes: 2
    });
    showMessage('Auto-save enabled! Bookmarks will be saved every 2 minutes.', 'success');
  } else {
    // Clear the alarm
    chrome.alarms.clear('autoBookmark');
    showMessage('Auto-save disabled.', 'success');
  }
  
  updateStatus();
});

// Bookmark now button
bookmarkNowBtn.addEventListener('click', async () => {
  bookmarkNowBtn.disabled = true;
  bookmarkNowBtn.textContent = 'Bookmarking...';
  
  try {
    const response = await chrome.runtime.sendMessage({ action: 'bookmarkNow' });
    if (response.success) {
      showMessage('Tabs bookmarked successfully!', 'success');
      // Wait a moment for storage to update
      setTimeout(updateStatus, 500);
    }
  } catch (error) {
    showMessage('Error bookmarking tabs', 'error');
  } finally {
    bookmarkNowBtn.disabled = false;
    bookmarkNowBtn.textContent = 'Bookmark Now';
  }
});

// Update status every second while popup is open
updateStatus();
setInterval(updateStatus, 1000);

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    updateStatus();
  }
});
