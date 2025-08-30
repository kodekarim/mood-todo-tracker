document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const currentDateDisplay = document.getElementById('current-date');
    const prevDayButton = document.getElementById('prev-day');
    const nextDayButton = document.getElementById('next-day');

    const moodOptions = document.getElementById('mood-options');
    const displayMood = document.getElementById('display-mood');
    // Remove start/end specific mood elements

    const mentalStateOptions = document.getElementById('mental-state-options');
    const displayMentalState = document.getElementById('display-mental-state');

    const notesTextarea = document.getElementById('daily-notes');

    const todoInput = document.getElementById('todo-input');
    const addTodoButton = document.getElementById('add-todo');
    const pendingList = document.getElementById('pending-list');
    const completedList = document.getElementById('completed-list');

    const brainDumpInput = document.getElementById('brain-dump-input');
    const analyzeTasksButton = document.getElementById('analyze-tasks');
    const brainDumpModelDisplay = document.getElementById('brain-dump-model-display');
    const currentActiveModel = document.getElementById('current-active-model');
    const modelSwitchSection = document.getElementById('model-switch-section');
    const modelSelector = document.getElementById('model-selector');
    const switchModelBtn = document.getElementById('switch-model-btn');

    const completedCountSpan = document.getElementById('completed-count');
    const totalCountSpan = document.getElementById('total-count');
    const selectedDateSpan = document.getElementById('selected-date-display'); // For dashboard
    const progressChartCtx = document.getElementById('progress-chart').getContext('2d');

    // Calendar Elements
    const calendarGrid = document.getElementById('calendar-grid');

    // Calendar Elements
    const calendarMonthYearDisplay = document.getElementById('calendar-month-year'); // Add back
    const prevMonthButton = document.getElementById('prev-month'); // Add back
    const nextMonthButton = document.getElementById('next-month'); // Add back

    // Import/Export Elements
    const exportButton = document.getElementById('export-data');
    const importButton = document.getElementById('import-data');
    const importFileInput = document.getElementById('import-file-input');

    // Dashboard Elements
    const chartStartDateInput = document.getElementById('chart-start-date');
    const chartEndDateInput = document.getElementById('chart-end-date');
    const chartDateRangeDisplay = document.getElementById('chart-date-range-display');

    const themeToggleButton = document.getElementById('theme-toggle');
    const todayButton = document.getElementById('today-button');

    // Settings Elements
    const apiKeyInput = document.getElementById('api-key-input');
    const saveApiKeyButton = document.getElementById('save-api-key');

    // Sidebar Elements
    const profileButton = document.getElementById('profile-button');
    const profileSidebar = document.getElementById('profile-sidebar');
    const closeSidebarButton = document.getElementById('close-sidebar');
    const overlay = document.getElementById('overlay');
    
    // Model Management Elements
    const refreshModelsButton = document.getElementById('refresh-models');
    const testConnectionButton = document.getElementById('test-connection');
    const downloadModelButton = document.getElementById('download-model');
    const deleteModelButton = document.getElementById('delete-model');
    const clearAllModelsButton = document.getElementById('clear-all-models');
    const modelBrowser = document.getElementById('model-browser');
    const modelList = document.getElementById('model-list');
    const modelStatusBadge = document.getElementById('model-status-badge');
    const downloadProgress = document.getElementById('download-progress');
    const progressFill = document.getElementById('progress-fill');
    const progressPercentage = document.getElementById('progress-percentage');
    const progressStatus = document.getElementById('progress-status');
    const modelStatus = document.getElementById('model-status');

    // --- State ---
    let selectedDate = new Date(); // Use Date object for easier manipulation
    let dailyData = {}; // Object to hold all data { 'YYYY-MM-DD': { todos: [], mood: '', mentalState: '', notes: '' }, ... }
    let progressChart = null; // To hold the chart instance
    let calendarDisplayDate = new Date(); // Add back state for calendar view month/year
    let chartStartDate = new Date(); // Initialize chart range state
    let chartEndDate = new Date();
    
    // WebLLM State
    let webLLMEngine = null;
    let isModelLoading = false;
    let isModelReady = false;

    // --- LocalStorage Keys ---
    const DATA_KEY = 'dailyTracker_data'; // Single key for all data
    const SELECTED_MODEL_KEY = 'dailyTracker_selectedModel'; // Store selected model
    const AVAILABLE_MODELS_KEY = 'dailyTracker_availableModels'; // Store available models list
    const MODEL_STATUS_KEY = 'dailyTracker_modelStatus'; // Store model status messages

    // --- Functions ---

    // Function to auto-resize a textarea
    function autoResizeTextarea(textarea) {
        textarea.style.height = 'auto'; // Reset height to recalculate
        textarea.style.height = `${textarea.scrollHeight}px`;
    }

    // Model persistence functions
    function saveSelectedModel(modelId) {
        localStorage.setItem(SELECTED_MODEL_KEY, modelId);
        updateCurrentModelDisplay(modelId);
        updateBrainDumpModelDisplay(modelId);
    }

    function loadSelectedModel() {
        return localStorage.getItem(SELECTED_MODEL_KEY);
    }

    function saveAvailableModels(models) {
        localStorage.setItem(AVAILABLE_MODELS_KEY, JSON.stringify(models));
        updateModelSwitcher(models);
    }

    function loadAvailableModels() {
        const stored = localStorage.getItem(AVAILABLE_MODELS_KEY);
        return stored ? JSON.parse(stored) : [];
    }

    function saveModelStatus(message) {
        localStorage.setItem(MODEL_STATUS_KEY, message);
    }

    function loadModelStatus() {
        return localStorage.getItem(MODEL_STATUS_KEY) || '';
    }

    function updateCurrentModelDisplay(modelId) {
        if (modelId) {
            // Extract a shorter, more readable name
            const displayName = modelId.replace(/-q4f\d+_\d+$/, '').replace(/-hf$/, '').replace(/-MLC$/, '');
            currentActiveModel.textContent = displayName;
        } else {
            currentActiveModel.textContent = 'No model selected';
        }
    }

    function updateBrainDumpModelDisplay(modelId) {
        if (modelId) {
            const displayName = modelId.replace(/-q4f\d+_\d+$/, '').replace(/-hf$/, '').replace(/-MLC$/, '');
            brainDumpModelDisplay.textContent = `Using: ${displayName}`;
        } else {
            brainDumpModelDisplay.textContent = 'No AI model selected';
        }
    }

    function updateModelSwitcher(models) {
        // Clear existing options
        modelSelector.innerHTML = '<option value="">Select a model...</option>';
        
        if (models && models.length > 0) {
            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.model_id;
                option.textContent = model.model_id.replace(/-q4f\d+_\d+$/, '').replace(/-hf$/, '').replace(/-MLC$/, '');
                modelSelector.appendChild(option);
            });
            
            // Show the switcher if we have multiple models
            if (models.length > 1) {
                modelSwitchSection.style.display = 'block';
            } else {
                modelSwitchSection.style.display = 'none';
            }
        } else {
            modelSwitchSection.style.display = 'none';
        }
    }

    // Try to load the previously selected model on startup
    async function tryLoadSavedModel() {
        const savedModelId = loadSelectedModel();
        if (savedModelId && !isModelReady && !isModelLoading) {
            try {
                updateModelStatus('Loading saved model...', 'loading');
                updateCurrentModelDisplay(savedModelId);
                
                // Import WebLLM with version fallback
                let webllm;
                try {
                    webllm = await import('https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@latest/lib/index.js');
                } catch (latestError) {
                    webllm = await import('https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.46/lib/index.js');
                }
                
                // Try to load the saved model
                webLLMEngine = await webllm.CreateMLCEngine(savedModelId, {
                    initProgressCallback: (progress) => {
                        // Silent loading, no progress bar needed
                    },
                    appConfig: {
                        useIndexedDBCache: true,
                        model_list: [],
                    }
                });
                
                isModelReady = true;
                updateModelUI('ready', `${savedModelId} loaded and ready!`);
                updateModelStatus('Model loaded successfully', 'ready');
                
            } catch (error) {
                console.warn('Failed to load saved model:', error);
                updateModelStatus('Saved model failed to load. Please select a new model.', 'error');
                updateCurrentModelDisplay(null);
                localStorage.removeItem(SELECTED_MODEL_KEY);
            }
        } else if (savedModelId) {
            updateCurrentModelDisplay(savedModelId);
        }
    }

    // Model Management Functions
    function updateModelUI(status, message = '') {
        // Update status badge
        modelStatusBadge.className = `status-badge ${status}`;
        
        switch (status) {
            case 'not-downloaded':
                modelStatusBadge.textContent = 'Not Downloaded';
                downloadModelButton.style.display = 'flex';
                deleteModelButton.style.display = 'none';
                downloadProgress.style.display = 'none';
                break;
            case 'downloading':
                modelStatusBadge.textContent = 'Downloading';
                downloadModelButton.style.display = 'none';
                deleteModelButton.style.display = 'none';
                downloadProgress.style.display = 'block';
                break;
            case 'ready':
                modelStatusBadge.textContent = 'Ready';
                downloadModelButton.style.display = 'none';
                deleteModelButton.style.display = 'flex';
                downloadProgress.style.display = 'none';
                break;
            case 'error':
                modelStatusBadge.textContent = 'Error';
                downloadModelButton.style.display = 'flex';
                deleteModelButton.style.display = 'none';
                downloadProgress.style.display = 'none';
                break;
        }
        
        // Update brain dump status if provided and save it
        if (message) {
            updateModelStatus(message, status === 'ready' ? 'ready' : status === 'error' ? 'error' : 'loading');
            saveModelStatus(message);
        }
    }

    function updateDownloadProgress(progress, status = '') {
        const percentage = Math.round(progress * 100);
        progressFill.style.width = `${percentage}%`;
        progressPercentage.textContent = `${percentage}%`;
        if (status) {
            progressStatus.textContent = status;
        }
    }

    async function refreshModels() {
        refreshModelsButton.disabled = true;
        refreshModelsButton.textContent = 'Loading...';
        
        try {
            updateModelStatus('Fetching available models...', 'loading');
            
            // Import WebLLM to get available models - try latest version first
            let webllm;
            try {
                webllm = await import('https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@latest/lib/index.js');
            } catch (latestError) {
                console.warn('Failed to load latest WebLLM, falling back to v0.2.46:', latestError);
                webllm = await import('https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.46/lib/index.js');
            }
            
            // Try different ways to get the model list
            let availableModels = [];
            
            if (webllm.prebuiltAppConfig && webllm.prebuiltAppConfig.model_list) {
                availableModels = webllm.prebuiltAppConfig.model_list;
            } else if (webllm.ModelRecord) {
                // Try to get models from ModelRecord if available
                availableModels = Object.keys(webllm.ModelRecord).map(key => ({ model_id: key }));
            } else {
                // Fallback to known working models
                availableModels = [
                    { model_id: "Llama-2-7b-chat-hf-q4f32_1" },
                    { model_id: "Llama-2-7b-chat-hf-q4f16_1" },
                    { model_id: "RedPajama-INCITE-Chat-3B-v1-q4f32_1" },
                    { model_id: "RedPajama-INCITE-Chat-3B-v1-q4f16_1" },
                    { model_id: "vicuna-v1-7b-q4f32_1" },
                    { model_id: "TinyLlama-1.1B-Chat-v0.4-q4f32_1" },
                    { model_id: "TinyLlama-1.1B-Chat-v0.4-q4f16_1" }
                ];
            }
            
            if (availableModels.length === 0) {
                throw new Error('No models found in WebLLM config');
            }
            
            // Filter and sort models by size (smaller first)
            const filteredModels = availableModels
                .filter(model => 
                    model.model_id.includes('chat') || 
                    model.model_id.includes('instruct') ||
                    model.model_id.includes('Chat') ||
                    model.model_id.includes('Instruct')
                )
                .sort((a, b) => {
                    // Sort by estimated size (smaller first)
                    const sizeA = estimateModelSize(a.model_id);
                    const sizeB = estimateModelSize(b.model_id);
                    return sizeA - sizeB;
                })
                .slice(0, 10); // Show top 10 models
            
            displayModels(filteredModels);
            saveAvailableModels(filteredModels); // Save for model switcher
            modelBrowser.style.display = 'block';
            updateModelStatus('✅ Found ' + filteredModels.length + ' available models', 'ready');
            
        } catch (error) {
            console.error('Failed to fetch models:', error);
            updateModelStatus('❌ Failed to fetch models: ' + error.message, 'error');
            modelBrowser.style.display = 'none';
        } finally {
            refreshModelsButton.disabled = false;
            refreshModelsButton.textContent = 'Refresh Models';
        }
    }

    function estimateModelSize(modelId) {
        // Estimate model size based on name patterns
        if (modelId.includes('3B') || modelId.includes('3b')) return 1.5;
        if (modelId.includes('7B') || modelId.includes('7b')) return 3.5;
        if (modelId.includes('13B') || modelId.includes('13b')) return 7;
        if (modelId.includes('30B') || modelId.includes('30b')) return 15;
        if (modelId.includes('70B') || modelId.includes('70b')) return 35;
        
        // Default estimate based on common patterns
        if (modelId.includes('small') || modelId.includes('mini')) return 1;
        if (modelId.includes('medium')) return 2.5;
        if (modelId.includes('large')) return 5;
        
        return 3; // Default estimate
    }

    function formatModelSize(sizeGB) {
        if (sizeGB < 1) return `${Math.round(sizeGB * 1000)}MB`;
        return `${sizeGB.toFixed(1)}GB`;
    }

    function displayModels(models) {
        modelList.innerHTML = '';
        
        models.forEach(model => {
            const modelItem = document.createElement('div');
            modelItem.className = 'model-item';
            
            const estimatedSize = estimateModelSize(model.model_id);
            const formattedSize = formatModelSize(estimatedSize);
            
            // Extract model type/family
            const modelFamily = extractModelFamily(model.model_id);
            
            modelItem.innerHTML = `
                <div class="model-info">
                    <div class="model-name">${model.model_id}</div>
                    <div class="model-details">
                        <span class="model-size">~${formattedSize}</span>
                        <span class="model-family">${modelFamily}</span>
                        <span class="model-type">Chat Model</span>
                    </div>
                </div>
                <button class="model-download-btn" onclick="downloadSpecificModel('${model.model_id}')">
                    Download
                </button>
            `;
            
            modelList.appendChild(modelItem);
        });
    }

    function extractModelFamily(modelId) {
        if (modelId.includes('Llama') || modelId.includes('llama')) return 'Llama';
        if (modelId.includes('RedPajama')) return 'RedPajama';
        if (modelId.includes('Vicuna') || modelId.includes('vicuna')) return 'Vicuna';
        if (modelId.includes('ChatGLM')) return 'ChatGLM';
        if (modelId.includes('Mistral') || modelId.includes('mistral')) return 'Mistral';
        if (modelId.includes('Phi') || modelId.includes('phi')) return 'Phi';
        return 'Other';
    }

    // Make downloadSpecificModel globally available
    window.downloadSpecificModel = async function(modelId) {
        if (isModelLoading || isModelReady) return;
        
        try {
            isModelLoading = true;
            updateModelUI('downloading');
            updateDownloadProgress(0, `Validating ${modelId}...`);
            
            // Import WebLLM with version fallback
            let webllm;
            try {
                webllm = await import('https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@latest/lib/index.js');
            } catch (latestError) {
                webllm = await import('https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.46/lib/index.js');
            }
            
            updateDownloadProgress(0.05, 'Checking model availability...');
            
            // Validate model exists in the available models list
            let modelExists = false;
            try {
                if (webllm.prebuiltAppConfig && webllm.prebuiltAppConfig.model_list) {
                    modelExists = webllm.prebuiltAppConfig.model_list.some(model => 
                        model.model_id === modelId || model.model === modelId
                    );
                }
            } catch (e) {
                console.warn('Could not validate model list:', e);
                // Continue anyway, let WebLLM handle the validation
                modelExists = true;
            }
            
            if (!modelExists) {
                // Try common model ID variations
                const variations = [
                    modelId,
                    modelId.replace('-MLC', ''),
                    modelId.replace('_1-MLC', '_1'),
                    modelId.replace('q4f32_1-MLC', 'q4f32_1'),
                    modelId.replace('q4f16_1-MLC', 'q4f16_1')
                ];
                
                for (const variation of variations) {
                    try {
                        updateDownloadProgress(0.1, `Trying ${variation}...`);
                        
                        webLLMEngine = await webllm.CreateMLCEngine(variation, {
                            initProgressCallback: (progress) => {
                                const scaledProgress = 0.1 + (progress.progress * 0.9);
                                updateDownloadProgress(scaledProgress, `Downloading ${variation}...`);
                            }
                        });
                        
                        // If we get here, the model loaded successfully
                        isModelReady = true;
                        isModelLoading = false;
                        updateModelUI('ready', `${variation} ready! Your data stays private.`);
                        
                        // Save the working model ID
                        saveSelectedModel(variation);
                        
                        // Hide model browser after successful download
                        modelBrowser.style.display = 'none';
                        return;
                        
                    } catch (variationError) {
                        console.warn(`Failed to load ${variation}:`, variationError.message);
                        continue;
                    }
                }
                
                // If all variations failed
                throw new Error(`Model "${modelId}" and its variations are not available. Please try a different model.`);
            } else {
                // Model exists in list, try to download it
                updateDownloadProgress(0.1, 'Starting download...');
                
                webLLMEngine = await webllm.CreateMLCEngine(modelId, {
                    initProgressCallback: (progress) => {
                        const scaledProgress = 0.1 + (progress.progress * 0.9);
                        updateDownloadProgress(scaledProgress, `Downloading ${modelId}...`);
                    }
                });
                
                isModelReady = true;
                isModelLoading = false;
                updateModelUI('ready', `${modelId} ready! Your data stays private.`);
                
                // Save the selected model and update display
                saveSelectedModel(modelId);
                
                // Hide model browser after successful download
                modelBrowser.style.display = 'none';
            }
            
        } catch (error) {
            console.error('Failed to download model:', error);
            isModelLoading = false;
            updateModelUI('error', `❌ Failed to download ${modelId}: ${error.message}`);
        }
    };

    async function testConnection() {
        testConnectionButton.disabled = true;
        testConnectionButton.textContent = 'Testing...';
        
        try {
            updateModelStatus('Testing WebLLM connection...', 'loading');
            
            // Test if we can import WebLLM with version fallback
            let webllm;
            try {
                webllm = await import('https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@latest/lib/index.js');
            } catch (latestError) {
                webllm = await import('https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.46/lib/index.js');
            }
            
            if (!webllm.CreateMLCEngine) {
                throw new Error('WebLLM CreateMLCEngine not found');
            }
            
            // Debug: Log available models to console
            console.log('=== WebLLM Debug Info ===');
            console.log('WebLLM object keys:', Object.keys(webllm));
            
            if (webllm.prebuiltAppConfig) {
                console.log('prebuiltAppConfig found');
                if (webllm.prebuiltAppConfig.model_list) {
                    console.log('Available models:', webllm.prebuiltAppConfig.model_list.length);
                    console.log('First 5 models:', webllm.prebuiltAppConfig.model_list.slice(0, 5));
                } else {
                    console.log('No model_list in prebuiltAppConfig');
                }
            } else {
                console.log('No prebuiltAppConfig found');
            }
            
            if (webllm.ModelRecord) {
                console.log('ModelRecord found with keys:', Object.keys(webllm.ModelRecord).slice(0, 10));
            }
            
            console.log('========================');
            
            // Test basic functionality
            updateModelStatus('✅ Connection successful! Check console for debug info.', 'ready');
            alert('✅ Connection test passed! Check the browser console (F12) for detailed model information.');
            
        } catch (error) {
            console.error('Connection test failed:', error);
            updateModelStatus('❌ Connection test failed. Check console for details.', 'error');
            alert('❌ Connection test failed. Please check your internet connection and try again.\n\nError: ' + error.message);
        } finally {
            testConnectionButton.disabled = false;
            testConnectionButton.textContent = 'Test Connection';
        }
    }

    async function downloadModel() {
        if (isModelLoading || isModelReady) return;
        
        try {
            isModelLoading = true;
            updateModelUI('downloading');
            updateDownloadProgress(0, 'Initializing...');
            
            // Import WebLLM dynamically with better error handling
            let webllm;
            try {
                // Try the latest stable version first
                webllm = await import('https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.46/lib/index.js');
            } catch (importError) {
                console.warn('Failed to import WebLLM v0.2.46, trying fallback version:', importError);
                try {
                    // Fallback to an older stable version
                    webllm = await import('https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.40/lib/index.js');
                } catch (fallbackError) {
                    console.error('Failed to import WebLLM fallback:', fallbackError);
                    throw new Error('Failed to load WebLLM library. Please check your internet connection and try again.');
                }
            }
            
            updateDownloadProgress(0.05, 'WebLLM library loaded...');
            
            // Check if CreateMLCEngine exists
            if (!webllm.CreateMLCEngine) {
                throw new Error('WebLLM CreateMLCEngine not found. Library may be incompatible.');
            }
            
            updateDownloadProgress(0.1, 'Connecting to model repository...');
            
            // Try different model names in order of preference (smaller models first for reliability)
            const modelOptions = [
                "RedPajama-INCITE-Chat-3B-v1-q4f32_1",  // Smaller, more reliable
                "RedPajama-INCITE-Chat-3B-v1-q4f16_1",  // Even smaller
                "Llama-2-7b-chat-hf-q4f32_1",           // Original choice
                "Llama-2-7b-chat-hf-q4f16_1",           // Alternative quantization
                "vicuna-v1-7b-q4f32_1"                   // Another option
            ];
            
            let modelLoaded = false;
            let lastError = null;
            
            for (const modelName of modelOptions) {
                try {
                    updateDownloadProgress(0.15, `Trying model: ${modelName}...`);
                    
                    webLLMEngine = await webllm.CreateMLCEngine(modelName, {
                        initProgressCallback: (progress) => {
                            // Scale progress from 15% to 95%
                            const scaledProgress = 0.15 + (progress.progress * 0.8);
                            updateDownloadProgress(scaledProgress, `Downloading ${modelName}...`);
                        }
                    });
                    
                    modelLoaded = true;
                    break;
                } catch (modelError) {
                    console.warn(`Failed to load model ${modelName}:`, modelError);
                    lastError = modelError;
                    continue;
                }
            }
            
            if (!modelLoaded) {
                throw lastError || new Error('All model options failed to load');
            }
            
            updateDownloadProgress(1, 'Model ready!');
            
            isModelReady = true;
            isModelLoading = false;
            updateModelUI('ready', '🍎 Local AI ready! Your data stays private.');
            
        } catch (error) {
            console.error('Failed to download WebLLM model:', error);
            isModelLoading = false;
            
            let errorMessage = '❌ Failed to download model. ';
            if (error.message.includes('internet') || error.message.includes('network')) {
                errorMessage += 'Check your internet connection.';
            } else if (error.message.includes('WebLLM')) {
                errorMessage += 'WebLLM library issue. Try refreshing the page.';
            } else if (error.message.includes('model')) {
                errorMessage += 'Model not available. Try again later.';
            } else {
                errorMessage += 'Unknown error occurred.';
            }
            
            updateModelUI('error', errorMessage);
        }
    }

    async function deleteModel() {
        if (confirm('Are you sure you want to delete the local AI model? This will free up ~3GB of storage but you\'ll need to download it again to use Local AI.')) {
            try {
                // Clear the engine
                webLLMEngine = null;
                isModelReady = false;
                isModelLoading = false;
                
                // Clear all WebLLM related caches
                await clearAllModelCaches();
                
                // Clear saved model selection
                localStorage.removeItem(SELECTED_MODEL_KEY);
                updateCurrentModelDisplay(null);
                
                updateModelUI('not-downloaded', 'All models deleted. Click "Refresh Models" to download a new one.');
                
            } catch (error) {
                console.error('Error deleting model:', error);
                alert('Failed to delete model completely. You may need to clear your browser cache manually.');
            }
        }
    }

    // Comprehensive cache clearing function
    async function clearAllModelCaches() {
        try {
            // Clear browser caches
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                for (const cacheName of cacheNames) {
                    if (cacheName.includes('webllm') || 
                        cacheName.includes('mlc') || 
                        cacheName.includes('huggingface') ||
                        cacheName.includes('model')) {
                        await caches.delete(cacheName);
                        console.log(`Cleared cache: ${cacheName}`);
                    }
                }
            }

            // Clear IndexedDB storage used by WebLLM
            if ('indexedDB' in window) {
                try {
                    const databases = await indexedDB.databases();
                    for (const db of databases) {
                        if (db.name && (db.name.includes('webllm') || 
                                       db.name.includes('mlc') || 
                                       db.name.includes('model'))) {
                            indexedDB.deleteDatabase(db.name);
                            console.log(`Cleared IndexedDB: ${db.name}`);
                        }
                    }
                } catch (e) {
                    console.warn('Could not clear IndexedDB:', e);
                }
            }

            // Clear localStorage entries related to models
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.includes('webllm') || 
                           key.includes('mlc') || 
                           key.includes('model'))) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
                console.log(`Cleared localStorage: ${key}`);
            });

            console.log('All model caches cleared successfully');
            
        } catch (error) {
            console.error('Error clearing caches:', error);
            throw error;
        }
    }

    // Clear all models function
    async function clearAllModels() {
        if (confirm('⚠️ This will delete ALL downloaded models and clear all caches. This action cannot be undone.\n\nAre you sure you want to continue?')) {
            try {
                updateModelStatus('Clearing all models and caches...', 'loading');
                
                // Clear the current engine
                webLLMEngine = null;
                isModelReady = false;
                isModelLoading = false;
                
                // Clear all caches
                await clearAllModelCaches();
                
                // Clear saved model selection
                localStorage.removeItem(SELECTED_MODEL_KEY);
                updateCurrentModelDisplay(null);
                
                // Reset UI
                updateModelUI('not-downloaded', 'All models cleared. Click "Refresh Models" to start fresh.');
                modelBrowser.style.display = 'none';
                
                alert('✅ All models and caches have been cleared successfully!');
                
            } catch (error) {
                console.error('Error clearing all models:', error);
                updateModelStatus('❌ Failed to clear all models. Check console for details.', 'error');
                alert('❌ Failed to clear all models. You may need to manually clear your browser data.');
            }
        }
    }

    // Switch to a different model
    async function switchModel() {
        const selectedModelId = modelSelector.value;
        if (!selectedModelId) {
            alert('Please select a model to switch to.');
            return;
        }

        if (selectedModelId === loadSelectedModel()) {
            alert('This model is already active.');
            return;
        }

        switchModelBtn.disabled = true;
        switchModelBtn.textContent = 'Switching...';

        try {
            // Clear current model
            webLLMEngine = null;
            isModelReady = false;
            isModelLoading = true;

            updateModelUI('downloading', 'Switching models...');
            updateDownloadProgress(0, `Loading ${selectedModelId}...`);

            // Import WebLLM with version fallback
            let webllm;
            try {
                webllm = await import('https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@latest/lib/index.js');
            } catch (latestError) {
                webllm = await import('https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.46/lib/index.js');
            }

            // Load the selected model
            webLLMEngine = await webllm.CreateMLCEngine(selectedModelId, {
                initProgressCallback: (progress) => {
                    updateDownloadProgress(progress.progress, `Loading ${selectedModelId}...`);
                }
            });

            isModelReady = true;
            isModelLoading = false;
            updateModelUI('ready', `${selectedModelId} ready! Model switched successfully.`);

            // Save the new model selection
            saveSelectedModel(selectedModelId);

        } catch (error) {
            console.error('Failed to switch model:', error);
            isModelLoading = false;
            updateModelUI('error', `❌ Failed to switch to ${selectedModelId}: ${error.message}`);
        } finally {
            switchModelBtn.disabled = false;
            switchModelBtn.textContent = 'Switch';
        }
    }

    function updateModelStatus(message, type = '') {
        modelStatus.textContent = message;
        modelStatus.className = `model-status ${type}`;
    }

    // WebLLM Functions
    async function initializeWebLLM() {
        if (isModelLoading || isModelReady) return;
        
        // If model is not ready, trigger download from profile
        if (!isModelReady) {
            updateModelStatus('Model not downloaded. Please download it from Settings.', 'error');
            return;
        }
    }

    async function analyzeWithLocalAI(brainDumpText) {
        if (!isModelReady) {
            throw new Error('Local AI model is not ready. Please wait for initialization or use Cloud AI.');
        }

        const prompt = `Analyze this brain dump text and extract actionable tasks, mood, and mental state. 

Respond with a JSON object with exactly these keys:
- "tasks": array of strings (each a single, concise to-do item)
- "mood": one of these values: ${VALID_MOODS.join(', ')}
- "mentalState": one of these values: ${VALID_MENTAL_STATES.join(', ')}

Brain dump text: "${brainDumpText}"

JSON response:`;

        const response = await webLLMEngine.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 500
        });

        const responseText = response.choices[0].message.content;
        
        // Try to extract JSON from the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        } else {
            throw new Error('Invalid response format from local AI');
        }
    }

    // Mappings for chart data
    const moodMap = { 'Angry': 1, 'Sad': 2, 'Neutral': 3, 'Happy': 4, 'Excited': 5 };
    const mentalStateMap = { 'Sick': 1, 'Overthinking': 2, 'Neutral': 3, 'Focused': 4 };

    // Valid options for Mood and State, to ensure LLM output is constrained
    const VALID_MOODS = Object.keys(moodMap);
    const VALID_MENTAL_STATES = Object.keys(mentalStateMap);

    // Format date object to YYYY-MM-DD string
    function formatDateKey(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Format date object for display (e.g., "Tue Jul 30 2024")
    function formatDisplayDate(date) {
        return date.toDateString(); // Simple, readable format
    }

    // Load data from LocalStorage
    function loadData() {
        dailyData = JSON.parse(localStorage.getItem(DATA_KEY) || '{}');
        renderUIForSelectedDate(); // Initial render based on today
    }

    // Save data to LocalStorage
    function saveData() {
        localStorage.setItem(DATA_KEY, JSON.stringify(dailyData));
    }

    // Get data for a specific date, returning defaults if not found
    function getDataForDate(dateKey) {
        return dailyData[dateKey] || { todos: [], mood: null, mentalState: null, notes: '' };
    }

    // Update data for the currently selected date
    function updateDataForSelectedDate(newData) {
        const dateKey = formatDateKey(selectedDate);
        dailyData[dateKey] = { ...getDataForDate(dateKey), ...newData };
        saveData();
    }

    // Change the selected date
    function changeDate(days) {
        selectedDate.setDate(selectedDate.getDate() + days);
        renderUIForSelectedDate();
        // Allow navigation to future dates - no restrictions
    }

    // Renders all UI components based on the selectedDate
    function renderUIForSelectedDate() {
        const dateKey = formatDateKey(selectedDate);
        const data = getDataForDate(dateKey);

        renderDateNavigation();
        renderMood(data.mood);
        renderState(data.mentalState);
        renderNotes(data.notes);
        renderTodos(data.todos);
        renderBrainDump(data.brainDump || ''); // Render brain dump content
        renderChart(); // Chart shows trend, doesn't depend on selected date's data directly
        renderCalendar(); // Update calendar highlight/view
        updateCounts(data.todos); // Counts depend on selected date's todos

        // Update dashboard date display
        selectedDateSpan.textContent = formatDisplayDate(selectedDate);
    }

    // Render Date Navigation Area
    function renderDateNavigation() {
        currentDateDisplay.textContent = formatDisplayDate(selectedDate); // Display full date
        // Allow navigation to future dates - no restrictions
        nextDayButton.disabled = false;
    }

    // Render Mood Display (Single Mood)
    function renderMood(currentMood) {
        displayMood.textContent = currentMood || 'N/A';
        updateButtonSelection(moodOptions, '.mood-btn', 'mood', currentMood);
    }

    // Render Mental State Display (Removed Energy)
    function renderState(currentMentalState) {
        displayMentalState.textContent = currentMentalState || 'N/A';
        updateButtonSelection(mentalStateOptions, '.state-btn', 'state', currentMentalState);
    }

    // Render Notes Display
    function renderNotes(currentNotes) {
        notesTextarea.value = currentNotes || '';
    }

    // Render Brain Dump and resize
    function renderBrainDump(content) {
        brainDumpInput.value = content;
        autoResizeTextarea(brainDumpInput);
    }

    // Helper to update selected class on buttons (generalized)
    function updateButtonSelection(optionsContainer, buttonSelector, dataAttribute, selectedValue) {
        const buttons = optionsContainer.querySelectorAll(buttonSelector);
        buttons.forEach(button => {
            if (button.dataset[dataAttribute] === selectedValue) {
                button.classList.add('selected');
            } else {
                button.classList.remove('selected');
            }
        });

        // Auto-resize on input
        brainDumpInput.addEventListener('input', () => {
            autoResizeTextarea(brainDumpInput);
        });

        // Save brain dump on blur
        brainDumpInput.addEventListener('blur', () => {
            const dateKey = formatDateKey(selectedDate);
            dailyData[dateKey] = {
                ...getDataForDate(dateKey),
                brainDump: brainDumpInput.value,
            };
            saveData();
        });


    }

    // Render Todo Lists (Pending and Completed)
    function renderTodos(todos) {
        pendingList.innerHTML = ''; // Clear pending list
        completedList.innerHTML = ''; // Clear completed list

        todos.forEach((todo, index) => {
            const li = createTodoElement(todo, index);
            if (todo.completed) {
                completedList.appendChild(li);
            } else {
                pendingList.appendChild(li);
            }
        });
        // updateCounts and renderChart are called in renderUIForSelectedDate
    }

    // Helper function to create a single todo list item element
    function createTodoElement(todo, index) {
        const li = document.createElement('li');
        li.dataset.index = index; // Store index for deletion

        const contentDiv = document.createElement('div');
        contentDiv.className = 'todo-content';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = todo.completed;
        checkbox.addEventListener('change', () => toggleTodo(index));

        const span = document.createElement('span');
        span.className = 'todo-text'; // Add class for potential styling
        span.textContent = todo.text;

        // Make text editable on click
        span.addEventListener('click', () => {
            // Ensure other editable spans are blurred first if any
            document.querySelectorAll('.todo-text[contenteditable="true"]').forEach(s => {
                if (s !== span) s.blur();
            });

            span.contentEditable = true;
            span.focus();
            // Optional: Select all text when starting edit
            // const range = document.createRange();
            // range.selectNodeContents(span);
            // const sel = window.getSelection();
            // sel.removeAllRanges();
            // sel.addRange(range);
        });

        span.addEventListener('blur', () => {
            span.contentEditable = false;
            const newText = span.textContent.trim();
            if (newText !== todo.text && newText !== '') {
                updateTodoText(index, newText);
            } else if (newText === '') {
                // Restore original text if user cleared it
                span.textContent = todo.text;
            }
            // If newText === todo.text, no action needed.
        });

        span.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Prevent newline in contentEditable
                span.blur(); // Trigger blur to save
            } else if (e.key === 'Escape') {
                span.textContent = todo.text; // Restore original text
                span.blur(); // Trigger blur (will not save as text is original)
            }
        });

        contentDiv.appendChild(checkbox);
        contentDiv.appendChild(span);

        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash-2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent potential parent clicks
            deleteTodo(index);
        });

        li.appendChild(contentDiv);
        li.appendChild(deleteButton);
        return li;
    }

    function openSidebar() {
        profileSidebar.classList.add('open');
        overlay.classList.add('active');
    }

    function closeSidebar() {
        profileSidebar.classList.remove('open');
        overlay.classList.remove('active');
    }

    // Main analysis function using local AI only
    async function analyzeAndAddTask() {
        const brainDumpText = brainDumpInput.value.trim();
        if (brainDumpText === '') {
            alert('Brain dump is empty. Write something to analyze.');
            return;
        }

        if (!isModelReady) {
            alert('No AI model is loaded. Please download a model from Settings first.');
            return;
        }

        analyzeTasksButton.disabled = true;
        analyzeTasksButton.textContent = 'Analyzing...';

        try {
            const result = await analyzeWithLocalAI(brainDumpText);

            // --- Update UI with AI analysis results ---
            if (result.tasks && Array.isArray(result.tasks)) {
                const dateKey = formatDateKey(selectedDate);
                const currentData = getDataForDate(dateKey);
                const newTodos = result.tasks.map(taskText => ({ text: taskText, completed: false }));
                currentData.todos.push(...newTodos);
                updateDataForSelectedDate({ todos: currentData.todos });
                renderTodos(currentData.todos);
                updateCounts(currentData.todos);
            }

            if (result.mood && VALID_MOODS.includes(result.mood)) {
                updateDataForSelectedDate({ mood: result.mood });
                renderMood(result.mood);
            }

            if (result.mentalState && VALID_MENTAL_STATES.includes(result.mentalState)) {
                updateDataForSelectedDate({ mentalState: result.mentalState });
                renderState(result.mentalState);
            }

        } catch (error) {
            console.error('Error during analysis:', error);
            alert(`Failed to analyze tasks. ${error.message}`);
        } finally {
            analyzeTasksButton.disabled = false;
            analyzeTasksButton.textContent = 'Analyze and Add Task';
        }
    }



     // Add a new todo (adds to pending list)
    function addTodo() {
        const text = todoInput.value.trim();
        if (text === '') return; // Don't add empty todos
        if (text) {
            const dateKey = formatDateKey(selectedDate);
            const currentData = getDataForDate(dateKey);
            // Add the new todo with completed: false
            const updatedTodos = [...currentData.todos, { text: text, completed: false }];
            updateDataForSelectedDate({ todos: updatedTodos });
            todoInput.value = '';
            renderTodos(updatedTodos); // Re-render both lists
            updateCounts(updatedTodos); // Update counts
            renderChart(); // Update chart data
        }
    }

    // Toggle a todo's completed state
    function toggleTodo(index) {
        const dateKey = formatDateKey(selectedDate);
        const data = getDataForDate(dateKey);
        const todo = data.todos[index];
        todo.completed = !todo.completed;

        // Animate the element before re-rendering
        const listElement = (todo.completed ? pendingList : completedList).querySelector(`[data-index="${index}"]`);
        if (listElement) {
            listElement.classList.add('completing');
            setTimeout(() => {
                updateDataForSelectedDate({ todos: data.todos });
                renderTodos(data.todos);
                updateCounts(data.todos);
                renderChart(); // Or just update it
            }, 300); // Match animation duration
        } else {
            // Fallback for safety
            updateDataForSelectedDate({ todos: data.todos });
            renderUIForSelectedDate();
        }
    }

    // Update the text of a todo
    function updateTodoText(index, newText) {
        const dateKey = formatDateKey(selectedDate);
        const currentData = getDataForDate(dateKey);
        const updatedTodos = [...currentData.todos];

        if (updatedTodos[index]) {
            updatedTodos[index].text = newText;
            updateDataForSelectedDate({ todos: updatedTodos });
            renderTodos(updatedTodos);
            updateCounts(updatedTodos);
            renderChart();
        }
    }

    // Delete a todo from the list
    function deleteTodo(index) {
        const dateKey = formatDateKey(selectedDate);
        const data = getDataForDate(dateKey);

        // Animate before removing
        const listElements = document.querySelectorAll(`[data-index="${index}"]`); // Can be in pending or completed
        listElements.forEach(el => el.classList.add('deleting'));

        setTimeout(() => {
            data.todos.splice(index, 1);
            updateDataForSelectedDate({ todos: data.todos });
            renderTodos(data.todos);
            updateCounts(data.todos);
            renderChart();
        }, 300); // Match animation duration
    }

    // Update completed/total counts for the selected date
    function updateCounts(todos) {
        const completedCount = todos.filter(todo => todo.completed).length;
        const totalCount = todos.length;
        completedCountSpan.textContent = completedCount;
        totalCountSpan.textContent = totalCount;
    }

    // Render/Update Progress Chart (Handles custom date range)
    function renderChart() {
        const labels = [];
        const completedData = [];
        const totalData = [];
        const moodData = [];
        const mentalStateData = [];

        // Use chartStartDate and chartEndDate for the loop
        const startDate = new Date(chartStartDate); // Clone to avoid modifying state
        const endDate = new Date(chartEndDate); // Clone

        // Ensure start date is before end date
        if (startDate > endDate) {
            // Handle invalid range, e.g., show message or default
            console.warn("Chart start date is after end date.");
            // Maybe clear the chart or show placeholder?
            // For now, just return to prevent errors
            return;
        }

        // Iterate through the selected date range
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateKey = formatDateKey(currentDate);
            const data = getDataForDate(dateKey);

            // Use a shorter label format for the chart axis
            labels.push(currentDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
            completedData.push(data.todos.filter(todo => todo.completed).length);
            totalData.push(data.todos.length);
            // Map string values to numbers for the chart, defaulting to null if not set/mapped
            moodData.push(moodMap[data.mood] || null);
            mentalStateData.push(mentalStateMap[data.mentalState] || null);

            // Move to the next day
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Update chart description
        chartDateRangeDisplay.textContent = `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;

        const chartData = {
            labels: labels,
            datasets: [
                {
                    label: 'Completed Tasks',
                    data: completedData,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1,
                    yAxisID: 'yTasks' // Assign to task axis
                },
                {
                    label: 'Total Tasks',
                    data: totalData,
                    borderColor: 'rgba(201, 203, 207, 1)', // Grey
                    backgroundColor: 'rgba(201, 203, 207, 0.2)',
                    tension: 0.1,
                    hidden: true, // Optionally hide by default
                    yAxisID: 'yTasks' // Assign to task axis
                },
                {
                    label: 'Mood (1-5)',
                    data: moodData,
                    borderColor: 'rgba(255, 159, 64, 1)', // Orange
                    backgroundColor: 'rgba(255, 159, 64, 0.2)',
                    tension: 0.1,
                    spanGaps: true, // Connect lines over null data points
                    yAxisID: 'yState' // Assign to state axis
                },
                {
                    label: 'Mental State (1-4)',
                    data: mentalStateData,
                    borderColor: 'rgba(153, 102, 255, 1)', // Purple
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    tension: 0.1,
                    spanGaps: true, // Connect lines over null data points
                    yAxisID: 'yState' // Assign to state axis
                }
            ]
        };

        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { // Allow hovering across datasets
                mode: 'index',
                intersect: false,
            },
             scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                yTasks: { // Y-axis for tasks
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1 // Ensure y-axis shows whole numbers for counts
                    },
                    title: {
                        display: true,
                        text: 'Tasks'
                    }
                },
                yState: { // Y-axis for mood/state
                    type: 'linear',
                    display: true,
                    position: 'right',
                    min: 0,
                    max: 5, // Max of mood scale
                    beginAtZero: true,
                    grid: { // Only draw grid lines for the left axis
                        drawOnChartArea: false,
                    },
                    title: {
                        display: true,
                        text: 'Mood / State'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true, // Show legend for line chart
                    position: 'top',
                },
                tooltip: {
                    enabled: true
                }
            }
        };

        if (progressChart) {
            progressChart.data = chartData; // Update data
            progressChart.options = chartOptions; // Update options if needed
            progressChart.update(); // Update the existing chart
        } else {
            // Create new chart instance
            progressChart = new Chart(progressChartCtx, {
                type: 'line', // Changed to 'line'
                data: chartData,
                options: chartOptions
            });
        }
    }

    // Render Calendar Grid (Restored Month Navigation)
    function renderCalendar() {
        const year = calendarDisplayDate.getFullYear(); // Use calendarDisplayDate
        const month = calendarDisplayDate.getMonth(); // Use calendarDisplayDate

        calendarMonthYearDisplay.textContent = calendarDisplayDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }); // Set text

        calendarGrid.innerHTML = ''; // Clear previous grid

        // Determine start and end points
        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Simplified: just add day cells
        // Add empty cells before the 1st day
        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('empty-day');
            calendarGrid.appendChild(emptyCell);
        }

        // Add day cells
        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('day-cell');
            dayCell.textContent = day;

            const cellDate = new Date(year, month, day);
            const dateKey = formatDateKey(cellDate);

            // Check if data exists for this day
            if (dailyData[dateKey]) {
                dayCell.classList.add('has-log');
            }

            // Check if this is the currently selected date
            if (formatDateKey(selectedDate) === dateKey) {
                dayCell.classList.add('selected-day');
            }

            // Add click listener to change the selected date
            dayCell.addEventListener('click', () => {
                selectedDate = new Date(cellDate); // Update main selected date
                renderUIForSelectedDate(); // Re-render everything for the new date
            });

            calendarGrid.appendChild(dayCell);
        }
    }

    // Change calendar month (Add back)
    function changeCalendarMonth(months) {
        calendarDisplayDate.setMonth(calendarDisplayDate.getMonth() + months);
        renderCalendar();
    }

    // --- Event Listeners ---
    function initEventListeners() {
        prevDayButton.addEventListener('click', () => changeDate(-1));
        nextDayButton.addEventListener('click', () => changeDate(1));
        addTodoButton.addEventListener('click', addTodo);
        analyzeTasksButton.addEventListener('click', analyzeAndAddTask);

        // Add event listener for Enter key in todo input
        todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addTodo();
            }
        });

        // Single Mood Listener
        moodOptions.addEventListener('click', (e) => {
            if (e.target.classList.contains('mood-btn')) {
                const selectedMood = e.target.dataset.mood;
                updateDataForSelectedDate({ mood: selectedMood });
                renderMood(selectedMood);
            }
        });

        // Mental State Listener
        mentalStateOptions.addEventListener('click', (e) => {
            if (e.target.classList.contains('state-btn')) {
                const selectedMentalState = e.target.dataset.state;
                updateDataForSelectedDate({ mentalState: selectedMentalState });
                renderState(selectedMentalState); // Only pass mental state
            }
        });

        // Notes Listener (save on input)
        notesTextarea.addEventListener('input', () => {
            updateDataForSelectedDate({ notes: notesTextarea.value });
            // No need to re-render anything else on note change
        });

        // Calendar Navigation Listeners (Add back)
        prevMonthButton.addEventListener('click', () => changeCalendarMonth(-1));
        nextMonthButton.addEventListener('click', () => changeCalendarMonth(1));
    }

    // --- Import/Export Handlers ---

    // Export Data
    exportButton.addEventListener('click', () => {
        const dataStr = JSON.stringify(dailyData, null, 2); // Pretty print JSON
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `daily-tracker-data-${formatDateKey(new Date())}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // Trigger hidden file input when Import button is clicked
    importButton.addEventListener('click', () => {
        importFileInput.click();
    });

    // Handle file selection for import
    importFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) {
            return; // No file selected
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);

                // Basic validation (check if it's an object)
                if (typeof importedData !== 'object' || importedData === null) {
                    throw new Error('Invalid data format: Not an object.');
                }

                // Optional: More specific validation (e.g., check for date keys)
                // const dateKeys = Object.keys(importedData);
                // if (!dateKeys.every(key => /\d{4}-\d{2}-\d{2}/.test(key))) {
                //    throw new Error('Invalid data format: Keys are not dates.');
                // }

                if (confirm('Importing this file will overwrite current data. Continue?')) {
                    dailyData = importedData; // Replace current data
                    saveData(); // Save to localStorage
                    renderUIForSelectedDate(); // Refresh UI
                    alert('Data imported successfully!');
                }
            } catch (error) {
                console.error('Error importing data:', error);
                alert(`Error importing data: ${error.message}`);
            } finally {
                // Reset file input value to allow importing the same file again if needed
                importFileInput.value = '';
            }
        };
        reader.onerror = () => {
            alert('Error reading file.');
            importFileInput.value = '';
        };

        reader.readAsText(file);
    });

    // --- Chart Date Range Handlers ---

    function updateChartRange() {
        const startVal = chartStartDateInput.value;
        const endVal = chartEndDateInput.value;

        if (startVal && endVal) {
            // Parse dates, adding time zone offset to avoid off-by-one day issues
            const tempStartDate = new Date(startVal);
            const tempEndDate = new Date(endVal);
            chartStartDate = new Date(tempStartDate.getTime() + tempStartDate.getTimezoneOffset() * 60000);
            chartEndDate = new Date(tempEndDate.getTime() + tempEndDate.getTimezoneOffset() * 60000);

            if (chartStartDate <= chartEndDate) {
                renderChart();
            } else {
                // Optional: Provide user feedback about invalid range
                console.warn("Chart start date cannot be after end date.");
                chartDateRangeDisplay.textContent = "Invalid Range";
            }
        } else {
            // Handle cases where one or both dates are missing
            chartDateRangeDisplay.textContent = "Select Range";
            // Optionally clear chart or show default message
        }
    }

    chartStartDateInput.addEventListener('change', updateChartRange);
    chartEndDateInput.addEventListener('change', updateChartRange);

    // --- Initialization ---
    loadData(); // Load all data initially
    loadDarkModePreference(); // Load and apply dark mode preference
    
    // Initialize model UI with saved data
    const savedModel = loadSelectedModel();
    const savedStatus = loadModelStatus();
    const availableModels = loadAvailableModels();
    
    if (savedModel) {
        updateCurrentModelDisplay(savedModel);
        updateBrainDumpModelDisplay(savedModel);
    }
    
    if (savedStatus) {
        updateModelStatus(savedStatus, savedStatus.includes('ready') ? 'ready' : savedStatus.includes('❌') ? 'error' : 'loading');
    } else {
        updateModelStatus('Click "Get LLMs List" to see available models', '');
    }
    
    if (availableModels.length > 0) {
        updateModelSwitcher(availableModels);
    }
    
    updateModelUI(savedModel && savedStatus.includes('ready') ? 'ready' : 'not-downloaded', '');
    
    // Try to load saved model after a short delay to let the UI initialize
    setTimeout(() => {
        tryLoadSavedModel();
    }, 1000);

    // Initialize chart date range (e.g., last 7 days from today)
    const today = new Date();
    chartEndDate = new Date(today); // Set end to today
    chartStartDate = new Date(today);
    chartStartDate.setDate(today.getDate() - 6); // Set start to 6 days ago

    // Set initial values for date inputs (YYYY-MM-DD format)
    chartStartDateInput.value = formatDateKey(chartStartDate);
    chartEndDateInput.value = formatDateKey(chartEndDate);

    // Initial chart render after setting dates
    renderChart();

    // --- Theme Toggle --- 
    function applyDarkMode(isDark) {
        document.body.classList.toggle('dark-mode', isDark);
        
        // Toggle theme icons
        const lightIcon = document.querySelector('.theme-icon-light');
        const darkIcon = document.querySelector('.theme-icon-dark');
        if (isDark) {
            lightIcon.style.display = 'none';
            darkIcon.style.display = 'inline-block';
        } else {
            lightIcon.style.display = 'inline-block';
            darkIcon.style.display = 'none';
        }
    }

    function saveDarkModePreference(isDark) {
        localStorage.setItem('darkMode', isDark);
    }

    function loadDarkModePreference() {
        // Defaults to light mode unless 'true' is explicitly saved
        const isDark = localStorage.getItem('darkMode') === 'true';
        applyDarkMode(isDark);
    }

    themeToggleButton.addEventListener('click', () => {
        const isDarkModeEnabled = document.body.classList.contains('dark-mode');
        applyDarkMode(!isDarkModeEnabled);
        saveDarkModePreference(!isDarkModeEnabled);
    });

    // Go to Today function
    function goToToday() {
        selectedDate = new Date(); // Reset to today
        renderUIForSelectedDate();
    }

    todayButton.addEventListener('click', goToToday);



    // Model management event listeners
    refreshModelsButton.addEventListener('click', refreshModels);
    testConnectionButton.addEventListener('click', testConnection);
    downloadModelButton.addEventListener('click', downloadModel);
    deleteModelButton.addEventListener('click', deleteModel);
    clearAllModelsButton.addEventListener('click', clearAllModels);
    switchModelBtn.addEventListener('click', switchModel);

    // Sidebar event listeners
    profileButton.addEventListener('click', openSidebar);
    closeSidebarButton.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);

    initEventListeners(); // Initialize all event listeners
}); 