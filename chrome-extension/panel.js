const API_URL = 'http://localhost:8787/usage';
let autoRefreshInterval = null;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('refresh').addEventListener('click', fetchData);
  document.getElementById('retry').addEventListener('click', fetchData);
  document.getElementById('autoRefresh').addEventListener('change', toggleAutoRefresh);
  document.getElementById('closePanel').addEventListener('click', closePanel);

  // Load saved preferences
  chrome.storage.local.get(['autoRefresh'], (result) => {
    if (result.autoRefresh) {
      document.getElementById('autoRefresh').checked = true;
      startAutoRefresh();
    }
  });

  fetchData();
});

async function fetchData() {
  showLoading();

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.ok) {
      displayData(data);
    } else {
      showError(data.error, data.fix);
    }
  } catch (err) {
    console.error('Fetch error:', err);
    showError(
      'Server error or connection failed',
      err.message.includes('HTTP') ? `The server returned an error: ${err.message}` : 'Please check if the API server is online.'
    );
  }
}

function displayData(data) {
  const container = document.getElementById('data-container');
  container.innerHTML = '';

  if (data.parsedJson && data.parsedJson.models) {
    // Render as Table
    const emailInfo = document.createElement('div');
    emailInfo.className = 'email-info';
    emailInfo.innerHTML = `👤 User: <span>${escapeHtml(data.parsedJson.email)}</span>`;
    container.appendChild(emailInfo);

    const table = document.createElement('table');
    table.className = 'quota-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th>Model</th>
          <th>Remaining</th>
          <th>Resets In</th>
        </tr>
      </thead>
      <tbody>
        ${data.parsedJson.models.map(model => `
          <tr>
            <td class="model-name">${escapeHtml(model.label)}</td>
            <td>
              <div class="status-cell">
                <span class="status-dot ${getStatusColor(model.remainingPercentage)}"></span>
                ${(model.remainingPercentage * 100).toFixed(0)}%
              </div>
            </td>
            <td class="reset-time">${formatResetTime(model.timeUntilResetMs)}</td>
          </tr>
        `).join('')}
      </tbody>
    `;
    container.appendChild(table);
  } else if (data.rawText) {
    // Fallback to raw text
    const displayEl = document.createElement('div');
    displayEl.className = 'data-display-panel';
    const pre = document.createElement('pre');
    pre.textContent = stripAnsiCodes(data.rawText);
    displayEl.appendChild(pre);
    container.appendChild(displayEl);
  }

  updateTimestamp(data.time);
  showContent();
}

function getStatusColor(percentage) {
  if (percentage > 0.6) return 'green';
  if (percentage > 0.2) return 'orange';
  return 'red';
}

function formatResetTime(ms) {
  if (!ms) return 'N/A';
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function stripAnsiCodes(str) {
  return str.replace(/\u001b\[[0-9;]*m/g, '').replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '');
}

function formatJSON(obj, depth = 0) {
  if (depth > 5) return '<pre>' + JSON.stringify(obj).substring(0, 100) + '...</pre>';

  if (Array.isArray(obj)) {
    return '<ul>' + obj.map(item =>
      '<li>' + formatJSON(item, depth + 1) + '</li>'
    ).join('') + '</ul>';
  }

  if (typeof obj === 'object' && obj !== null) {
    return '<div class="json-object">' +
      Object.entries(obj).map(([key, value]) =>
        `<div class="json-pair">
          <strong>${escapeHtml(key)}:</strong>
          <span>${formatJSON(value, depth + 1)}</span>
        </div>`
      ).join('') +
      '</div>';
  }

  const str = String(obj);
  if (str.length > 100) return `<span class="json-string">"${escapeHtml(str.substring(0, 100))}..."</span>`;
  return `<span class="json-string">${escapeHtml(str)}</span>`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function updateTimestamp(isoTime) {
  document.getElementById('lastUpdate').textContent =
    `Last updated at ${new Date(isoTime).toLocaleTimeString()}`;
}

function showLoading() {
  document.getElementById('loading').style.display = 'block';
  document.getElementById('content').style.display = 'none';
  document.getElementById('error').style.display = 'none';
}

function showContent() {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('content').style.display = 'block';
  document.getElementById('error').style.display = 'none';
}

function showError(message, hint) {
  document.getElementById('error-message').textContent = message;
  document.getElementById('error-hint').textContent = hint || '';
  document.getElementById('loading').style.display = 'none';
  document.getElementById('content').style.display = 'none';
  document.getElementById('error').style.display = 'block';
}

function closePanel() {
  window.close();
}

function toggleAutoRefresh() {
  const enabled = document.getElementById('autoRefresh').checked;
  chrome.storage.local.set({ autoRefresh: enabled });

  if (enabled) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
}

function startAutoRefresh() {
  if (autoRefreshInterval) return;

  autoRefreshInterval = setInterval(() => {
    fetchData();
  }, 30000); // Refresh every 30 seconds
}

function stopAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
  }
}
