const API_URL = 'https://antigravity-extension.onrender.com/usage';

// Automatically open side panel when popup is clicked
document.addEventListener('DOMContentLoaded', async () => {
  const loadingEl = document.getElementById('loading');
  const contentEl = document.getElementById('content');
  const errorEl = document.getElementById('error');
  const errorMessageEl = document.getElementById('error-message');

  if (document.getElementById('refresh')) {
    document.getElementById('refresh').addEventListener('click', fetchData);
  }
  if (document.getElementById('retry')) {
    document.getElementById('retry').addEventListener('click', fetchData);
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab && chrome.sidePanel) {
      await chrome.sidePanel.open({ tabId: tab.id });

      // Give a tiny bit of time for the panel to start opening before closing the popup
      setTimeout(() => {
        window.close();
      }, 100);
    } else {
      throw new Error('Side panel API not available or no active tab.');
    }
  } catch (err) {
    console.error('Error opening side panel:', err);

    // Fallback: Show the popup content if side panel fails
    if (loadingEl) loadingEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'block';

    // Log error to console for developers
    console.log('Falling back to popup view due to:', err.message);

    // Try to fetch data in the popup itself
    fetchData();
  }
});

async function fetchData() {
  const loadingEl = document.getElementById('loading');
  const contentEl = document.getElementById('content');
  const errorEl = document.getElementById('error');

  if (loadingEl) loadingEl.style.display = 'block';
  if (contentEl) contentEl.style.display = 'none';
  if (errorEl) errorEl.style.display = 'none';

  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    if (data.ok) {
      displayData(data);
    } else {
      throw new Error(data.error || 'Unknown error');
    }
  } catch (err) {
    console.error('Fetch error:', err);
    if (loadingEl) loadingEl.style.display = 'none';
    if (errorEl) {
      errorEl.style.display = 'block';
      document.getElementById('error-message').textContent = 'Server connection failed';
      document.getElementById('error-hint').textContent = 'Make sure npm start is running';
    }
  }
}

function displayData(data) {
  const container = document.getElementById('data-container');
  if (!container) return;

  container.innerHTML = '';

  if (data.parsedJson && data.parsedJson.models) {
    const emailInfo = document.createElement('div');
    emailInfo.className = 'email-info';
    emailInfo.style.marginBottom = '5px';
    emailInfo.innerHTML = `👤 <span>${escapeHtml(data.parsedJson.email)}</span>`;
    container.appendChild(emailInfo);

    const table = document.createElement('table');
    table.className = 'quota-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th>Model</th>
          <th style="text-align:right">Usage</th>
        </tr>
      </thead>
      <tbody>
        ${data.parsedJson.models.map(model => `
          <tr>
            <td class="model-name" title="${escapeHtml(model.label)}">${escapeHtml(model.label)}</td>
            <td style="text-align:right">
              <div class="status-cell" style="justify-content: flex-end">
                <span class="status-dot ${getStatusColor(model.remainingPercentage)}"></span>
                ${(model.remainingPercentage * 100).toFixed(0)}%
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    `;
    container.appendChild(table);
  } else {
    const pre = document.createElement('pre');
    pre.className = 'data-display';
    pre.textContent = data.rawText || JSON.stringify(data.parsedJson, null, 2);
    container.appendChild(pre);
  }

  if (document.getElementById('loading')) document.getElementById('loading').style.display = 'none';
  if (document.getElementById('content')) document.getElementById('content').style.display = 'block';
}

function getStatusColor(percentage) {
  if (percentage > 0.6) return 'green';
  if (percentage > 0.2) return 'orange';
  return 'red';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

