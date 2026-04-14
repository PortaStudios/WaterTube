// --- WaterTube Search Engine Logic ---

let database = [];
let currentPage = 1;
const resultsPerPage = 10;
let currentMatches = [];

/**
 * Loads the search index from the local JSON file.
 * Using a relative path ("full_index.json") avoids CORS errors 
 * and is the fastest way to load data on GitHub Pages.
 */
async function loadDatabase() {
    const status = document.getElementById('results');
    
    // Show loading state
    status.innerHTML = '<p style="color: #ffcc00;">⏳ Loading database...</p>';
    
    // 1. Try local file first (works with Live Server)
    const localUrl = "full_index.json";
    
    // 2. Your Primary (Big) Database on Hugging Face
    const primaryUrl = "https://huggingface.co/datasets/PortaStudios/database/resolve/main/full_index.json";
    
    // 3. Your Backup (Small) Database on GitHub
    const backupUrl = "links.json"; 

    // First, try loading local file
    try {
        console.log("Attempting to load local database...");
        const response = await fetch(localUrl);
        
        if (response.ok) {
            const rawData = await response.json();
            if (Array.isArray(rawData)) {
                database = rawData;
            } else if (rawData.items && Array.isArray(rawData.items)) {
                database = rawData.items;
            }
            status.innerHTML = `<p style="color: #00ffcc;">✅ System Ready (${database.length.toLocaleString()} links)</p>`;
            console.log("Local database loaded:", database.length, "items");
            console.log("First item:", database[0]);
            return;
        }
    } catch (e) {
        console.log("Local file not found, trying remote...");
    }

    // Try Hugging Face next
    try {
        console.log("Attempting to load primary database from Hugging Face...");
        const response = await fetch(primaryUrl);
        
        if (response.ok) {
            const rawData = await response.json();
            if (Array.isArray(rawData)) {
                database = rawData;
            } else if (rawData.items && Array.isArray(rawData.items)) {
                database = rawData.items;
            }
            status.innerHTML = `<p style="color: #00ffcc;">✅ Primary System Online (${database.length.toLocaleString()} links)</p>`;
            console.log("Database loaded. First item:", database[0]);
            return;
        }
    } catch (error) {
        console.warn("Primary database failed:", error);
    }

    // Last resort: try backup
    try {
        console.log("Trying backup database...");
        const backupResponse = await fetch(backupUrl);
        if (backupResponse.ok) {
            const rawBackup = await backupResponse.json();
            if (rawBackup.items && Array.isArray(rawBackup.items)) {
                database = rawBackup.items;
            } else {
                database = rawBackup;
            }
            status.innerHTML = `<p style="color: #ffcc00;">⚠️ Running on Backup Mode (${database.length.toLocaleString()} links)</p>`;
            return;
        }
    } catch (backupError) {
        console.error("All sources failed.");
    }
    
    status.innerHTML = '<p style="color: #ff4444;">❌ System Offline: No database found.</p>';
}

/**
 * Filters the database based on the user's typing.
 */
function search() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const languageFilter = document.getElementById('languageFilter').value;
    const output = document.getElementById('results');

    console.log('=== SEARCH DEBUG ===');
    console.log('Database loaded:', database.length, 'items');
    console.log('Query:', JSON.stringify(query));
    console.log('Language Filter:', JSON.stringify(languageFilter));

    // Check if database is loaded
    if (database.length === 0) {
        output.innerHTML = '<p style="color: #ffcc00;">⏳ Loading database... Please wait.</p>';
        return;
    }

    console.log('Database sample:', database.slice(0, 3));

    // If no query and no language filter, clear results and stop
    if (!query && languageFilter === 'all') {
        output.innerHTML = '';
        return;
    }

    // Reset to first page on new search
    currentPage = 1;

    // Filter logic: Checks title, URL, and language for the search term
    currentMatches = database.filter(item => {
        const titleMatch = item.title && item.title.toLowerCase().includes(query);
        const urlMatch = item.url && item.url.toLowerCase().includes(query);
        const matchesQuery = !query || titleMatch || urlMatch;
        
        // Language filter check - case-insensitive comparison
        const itemLanguage = (item.language || 'Other').toLowerCase().trim();
        const filterLanguage = languageFilter.toLowerCase().trim();
        const matchesLanguage = filterLanguage === 'all' || itemLanguage === filterLanguage;
        
        return matchesQuery && matchesLanguage;
    });

    console.log('Filtered matches:', currentMatches.length);
    if (currentMatches.length > 0) {
        console.log('First result:', currentMatches[0]);
    }

    // Display results with pagination
    displayResults();
}

/**
 * Displays the results for the current page with pagination controls.
 */
function displayResults() {
    const output = document.getElementById('results');
    output.innerHTML = '';

    if (currentMatches.length === 0) {
        output.innerHTML = '<p style="color: gray;">No matches found in the index.</p>';
        return;
    }

    // Calculate pagination values
    const totalPages = Math.ceil(currentMatches.length / resultsPerPage);
    const startIndex = (currentPage - 1) * resultsPerPage;
    const endIndex = Math.min(startIndex + resultsPerPage, currentMatches.length);
    const pageResults = currentMatches.slice(startIndex, endIndex);

    // Create and append the result elements to the page
    pageResults.forEach(item => {
        const div = document.createElement('div');
        div.className = 'result-item';
        div.innerHTML = `
            <h3><a href="${item.url}" target="_blank">${item.title}</a></h3>
            <p>${item.url}</p>
        `;
        output.appendChild(div);
    });

    // Add pagination controls
    output.appendChild(createPaginationControls(totalPages));
}

/**
 * Creates pagination controls (Previous, page numbers, Next).
 */
function createPaginationControls(totalPages) {
    const container = document.createElement('div');
    container.className = 'pagination';

    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '&#8592; Previous';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => changePage(currentPage - 1);

    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = 'Next &#8594;';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => changePage(currentPage + 1);

    // Page info text
    const pageInfo = document.createElement('span');
    pageInfo.className = 'page-info';
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

    container.appendChild(prevBtn);
    container.appendChild(pageInfo);
    container.appendChild(nextBtn);

    return container;
}

/**
 * Changes to a specific page and re-renders results.
 */
function changePage(page) {
    const totalPages = Math.ceil(currentMatches.length / resultsPerPage);
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        displayResults();
    }
}

// --- Initialization ---

// Load the database immediately when the page opens
loadDatabase();

// Listen for every keystroke in the search bar
document.getElementById('searchInput').addEventListener('input', search);

// Listen for language filter changes
document.getElementById('languageFilter').addEventListener('change', search);

// Listen for search button click
document.getElementById('searchBtn').addEventListener('click', search);