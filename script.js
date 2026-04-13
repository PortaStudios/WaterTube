const HF_USER = "PortaStudios";
const HF_REPO = "WaterTube-Index";

let database = [];

// Load the single file
async function loadDatabase() {
    const output = document.getElementById('results');
    output.innerHTML = 'Connecting to WaterTube...';

    const url = `https://huggingface.co/datasets/${HF_USER}/${HF_REPO}/raw/main/full_index.json`;

    try {
        const response = await fetch(url);
        if (response.ok) {
            database = await response.json();
            output.innerHTML = 'System Ready.';
            console.log(`Loaded ${database.length} links.`);
        } else {
            output.innerHTML = '⚠️ Error: full_index.json not found.';
        }
    } catch (error) {
        output.innerHTML = '⚠️ Connection Error.';
        console.error(error);
    }
}

function search() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const output = document.getElementById('results');

    if (!query) {
        output.innerHTML = '';
        return;
    }

    // Filter results
    const matches = database.filter(item => {
        return item.title.toLowerCase().includes(query) || 
               item.url.toLowerCase().includes(query);
    });

    // Display
    output.innerHTML = '';
    if (matches.length === 0) {
        output.innerHTML = "No results found.";
        return;
    }

    matches.slice(0, 50).forEach(item => {
        const div = document.createElement('div');
        div.className = 'result-item';
        div.innerHTML = `<h3><a href="${item.url}" target="_blank">${item.title}</a></h3><p>${item.url}</p>`;
        output.appendChild(div);
    });
}

// Initialize
loadDatabase();
document.getElementById('searchInput').addEventListener('input', search);