# Autobookmark
This is a chromium browser-based extension that automatically bookmarks all open tabs in a Bookmark Folder "Tab Auto-saves" inside a subfolder with a name containing timestamps every 2 minutes.

# How to Install
## Open Chrome Extension Management
1. Navigate to `chrome://extensions/` in your Chrome browser
   Or go to Menu → More Tools → Extensions

## Enable Developer Mode
1. Toggle the "Developer mode" switch in the top right corner

## Load the Extension
1. Click "Load unpacked"
2. Select the folder containing your extension files
3. The extension should appear in your extensions list

The extension automatically saves all open tabs every 2 minutes. Bookmarks are organized in a "Tab Auto-Saves" folder in your bookmarks bar. Each save creates a subfolder with the current date and timestamp. You also have the option to manually bookmark all the open tabs.

The folder structure may look like this:

Bookmarks Bar
└── Tab Auto-Saves

    ├── Auto-Save 2025-06-27 14:30:45

    ├── Auto-Save 2025-06-27 14:32:45
    
    └── Auto-Save 2025-06-27 14:34:45


(C) Rahul Bhadani
