// --- WaterTube Search Engine Logic ---

let database = [];

/**
 * Loads the search index from the local JSON file.
 * Using a relative path ("full_index.json") avoids CORS errors 
 * and is the fastest way to load data on GitHub Pages.
 */
async function loadDatabase() {
    const status = document.getElementById('results');
    const url = "full_index.json"; // Look for file in the same folder

    try {
        console.log("Attempting to sync database...");
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Could not find the index file (Status: ${response.status})`);
        }

        // Convert raw file data to a JavaScript Object
        database = await response.json();
        
        // Success: Show the user how many links were loaded
        status.innerHTML = `<p style="color: #00ffcc; font-family: monospace;">
            ✅ System Ready: ${database.length.toLocaleString()} links indexed.
        </p>`;
        console.log("Database successfully loaded. Total items:", database.length);

    } catch (error) {
        console.error("Database sync failed:", error);
        status.innerHTML = `
            <div style="color: #ff4444; padding: 20px; border: 1px solid #ff4444;">
                <p>⚠️ Connection Error.</p>
                <small>Make sure 'full_index.json' is uploaded to the same folder on GitHub.</small>
            </div>`;
    }
}

/**
 * Filters the database based on the user's typing.
 */
function search() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const output = document.getElementById('results');

    // If search box is empty, clear results and stop
    if (!query) {
        output.innerHTML = '';
        return;
    }

    // Filter logic: Checks both title and URL for the search term
    const matches = database.filter(item => {
        const titleMatch = item.title && item.title.toLowerCase().includes(query);
        const urlMatch = item.url && item.url.toLowerCase().includes(query);
        return titleMatch || urlMatch;
    });

    // Limit display to 50 items for high-speed performance
    const limitedMatches = matches.slice(0, 50);

    // Clear previous results
    output.innerHTML = '';

    if (limitedMatches.length === 0) {
        output.innerHTML = '<p style="color: gray;">No matches found in the index.</p>';
        return;
    }

    // Create and append the result elements to the page
    limitedMatches.forEach(item => {
        const div = document.createElement('div');
        div.className = 'result-item';
        div.innerHTML = `
            <h3><a href="${item.url}" target="_blank">${item.title}</a></h3>
            <p>${item.url}</p>
        `;
        output.appendChild(div);
    });
}

// --- Initialization ---

// Load the database immediately when the page opens
loadDatabase();

// Listen for every keystroke in the search bar
document.getElementById('searchInput').addEventListener('input', search);