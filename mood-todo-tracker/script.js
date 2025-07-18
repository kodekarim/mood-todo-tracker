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

    // Settings Elements
    const apiKeyInput = document.getElementById('api-key-input');
    const saveApiKeyButton = document.getElementById('save-api-key');

    // Sidebar Elements
    const profileButton = document.getElementById('profile-button');
    const profileSidebar = document.getElementById('profile-sidebar');
    const closeSidebarButton = document.getElementById('close-sidebar');
    const overlay = document.getElementById('overlay');

    // --- State ---
    let selectedDate = new Date(); // Use Date object for easier manipulation
    let dailyData = {}; // Object to hold all data { 'YYYY-MM-DD': { todos: [], mood: '', mentalState: '', notes: '' }, ... }
    let progressChart = null; // To hold the chart instance
    let calendarDisplayDate = new Date(); // Add back state for calendar view month/year
    let chartStartDate = new Date(); // Initialize chart range state
    let chartEndDate = new Date();

    // --- LocalStorage Keys ---
    const DATA_KEY = 'dailyTracker_data'; // Single key for all data
    const API_KEY_STORAGE_KEY = 'dailyTracker_apiKey';

    // --- Functions ---

    // Function to auto-resize a textarea
    function autoResizeTextarea(textarea) {
        textarea.style.height = 'auto'; // Reset height to recalculate
        textarea.style.height = `${textarea.scrollHeight}px`;
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
        loadApiKey(); // Load API key on startup
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
        // Disable next day button if it's today or in the future
        nextDayButton.disabled = selectedDate >= new Date().setHours(0, 0, 0, 0);
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
        // Disable next day button if it's today or in the future
        nextDayButton.disabled = selectedDate >= new Date().setHours(0, 0, 0, 0);
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

    // Mock function to simulate AI analysis
    async function analyzeAndAddTask() {
        const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
        if (!apiKey) {
            alert('Please set your OpenAI API key in the settings sidebar first.');
            return;
        }

        const brainDumpText = brainDumpInput.value.trim();
        if (brainDumpText === '') {
            alert('Brain dump is empty. Write something to analyze.');
            return;
        }

        analyzeTasksButton.disabled = true;
        analyzeTasksButton.textContent = 'Analyzing...';

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: `You are a helpful assistant that analyzes a user's "brain dump" text and extracts actionable tasks, their mood, and their mental state.

                            Respond with a JSON object with three keys: "tasks", "mood", and "mentalState".
                            - "tasks" should be an array of strings, where each string is a single, concise to-do item.
                            - "mood" must be one of the following values: ${VALID_MOODS.join(', ')}.
                            - "mentalState" must be one of the following values: ${VALID_MENTAL_STATES.join(', ')}.

                            Analyze the overall sentiment and context to determine the mood and mental state. If the text provides no clear indication for mood or mental state, you can return "Neutral".`
                        },
                        {
                            role: 'user',
                            content: brainDumpText
                        }
                    ],
                    response_format: { type: "json_object" }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`OpenAI API error: ${errorData.error.message}`);
            }

            const data = await response.json();
            const result = JSON.parse(data.choices[0].message.content);

            // --- Update UI with LLM data ---
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
        // Defaults to dark mode unless 'false' is explicitly saved
        const isDark = localStorage.getItem('darkMode') !== 'false';
        applyDarkMode(isDark);
    }

    themeToggleButton.addEventListener('click', () => {
        const isDarkModeEnabled = document.body.classList.contains('dark-mode');
        applyDarkMode(!isDarkModeEnabled);
        saveDarkModePreference(!isDarkModeEnabled);
    });

    function saveApiKey() {
        const apiKey = apiKeyInput.value.trim();
        if (apiKey) {
            localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
            alert('API Key saved successfully!');
            apiKeyInput.value = ''; // Clear input for security
        } else {
            alert('Please enter a valid API key.');
        }
    }

    function loadApiKey() {
        const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
        if (apiKey) {
            // We don't display the key, but we know it's there.
            // You could optionally show a status message.
            console.log('API Key loaded from localStorage.');
        }
    }

    saveApiKeyButton.addEventListener('click', saveApiKey);

    // Sidebar event listeners
    profileButton.addEventListener('click', openSidebar);
    closeSidebarButton.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);

    initEventListeners(); // Initialize all event listeners
}); 