(function() {
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const resultsContainer = document.getElementById('results');
  
  let allLinks = [];
  let isLoading = true;

  function performSearch() {
    const query = searchInput.value.trim();
    const filtered = filterResults(query);
    renderResults(filtered);
  }

  async function fetchLinks() {
    try {
      const response = await fetch('links.json');
      if (!response.ok) throw new Error('Failed to load links.json');
      const data = await response.json();
      
      const chunkUrls = data.chunks || [];
      
      if (chunkUrls.length === 0) {
        allLinks = data.items || [];
        isLoading = false;
        renderResults(allLinks);
        return;
      }
      
      const chunkPromises = chunkUrls.map(async (url) => {
        try {
          const res = await fetch(url);
          if (!res.ok) return [];
          return await res.json();
        } catch (e) {
          console.error('Failed to load chunk:', url);
          return [];
        }
      });
      
      const chunks = await Promise.all(chunkPromises);
      allLinks = chunks.flat();
      
      isLoading = false;
      renderResults(allLinks);
    } catch (error) {
      resultsContainer.innerHTML = `<p class="error">Error loading data: ${error.message}</p>`;
      isLoading = false;
    }
  }

  function filterResults(query) {
    if (!query.trim()) return allLinks;
    
    const lowerQuery = query.toLowerCase();
    return allLinks.filter(item => {
      const title = (item.title || '').toLowerCase();
      const description = (item.description || '').toLowerCase();
      const tags = (item.tags || []).join(' ').toLowerCase();
      
      return title.includes(lowerQuery) || 
             description.includes(lowerQuery) || 
             tags.includes(lowerQuery);
    });
  }

  function renderResults(items) {
    if (isLoading) {
      resultsContainer.innerHTML = '<p class="loading">Loading...</p>';
      return;
    }

    if (items.length === 0) {
      const query = searchInput.value.trim();
      if (query) {
        resultsContainer.innerHTML = '<p class="loading">No results found</p>';
      } else {
        resultsContainer.innerHTML = '';
      }
      return;
    }

    resultsContainer.innerHTML = items.map(item => `
      <div class="result-item">
        <h3>${escapeHtml(item.title || 'Untitled')}</h3>
        <p>${escapeHtml(item.description || '')}</p>
        ${item.url ? `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener">View →</a>` : ''}
      </div>
    `).join('');
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  searchInput.addEventListener('input', performSearch);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
  });
  searchBtn.addEventListener('click', performSearch);

  fetchLinks();
})();