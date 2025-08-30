# Clear Model Cache Instructions

## Automatic Method (Recommended)
1. Open your Daily Tracker app
2. Click the **Settings** icon (gear icon) in the top-right
3. Click the **"Clear All Models"** button (red button with trash icon)
4. Confirm the action when prompted
5. ✅ Done! All model caches are cleared

## Manual Browser Method
If the automatic method doesn't work, follow these steps:

### Chrome/Edge:
1. Open Developer Tools (`F12` or `Ctrl+Shift+I`)
2. Go to **Application** tab
3. In the left sidebar, expand **Storage**:
   - **Cache Storage**: Delete all entries containing "webllm", "mlc", or "huggingface"
   - **IndexedDB**: Delete all databases containing "webllm", "mlc", or "model"
   - **Local Storage**: Delete entries with keys containing "webllm", "mlc", or "model"
4. Close Developer Tools
5. Refresh the page (`Ctrl+R` or `F5`)

### Firefox:
1. Open Developer Tools (`F12`)
2. Go to **Storage** tab
3. Clear the same items as above
4. Refresh the page

### Safari:
1. Open Web Inspector (`Cmd+Option+I`)
2. Go to **Storage** tab
3. Clear Cache, IndexedDB, and Local Storage entries
4. Refresh the page

## What Gets Cleared
- ✅ All downloaded AI models (1-4GB each)
- ✅ Model metadata and configuration
- ✅ WebLLM cache files
- ✅ Your selected model preference
- ❌ Your daily tracker data (todos, moods, notes) - **these are preserved**

## After Clearing
1. The app will show "No model selected"
2. Go to Settings → Click "Refresh Models"
3. Choose and download a new model
4. Your model preference will be saved for future sessions

## Storage Location
- **Browser Storage**: Models are stored in browser's IndexedDB/Cache (secure, isolated)
- **Project Folder**: The `models/` directory is created but browsers can't directly write there for security
- **Size**: Each model is typically 1.5-4GB depending on the model size

## Troubleshooting
- If models won't download: Try the manual browser method first
- If the app is slow: Clear all models and download a smaller one (3B parameter models)
- If you see errors: Check browser console (`F12` → Console tab) for details

---
*This file was generated automatically by the Daily Tracker setup script.*
