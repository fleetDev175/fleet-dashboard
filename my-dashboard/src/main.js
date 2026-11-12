import Chart from 'chart.js/auto';

// PASTE YOUR APPS SCRIPT WEB APP URL HERE
const WEB_APP_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRCb1-EPFpNCwVE9pM3FyLHS_2tzbl_garx6dhYFf3cNCaUFc3SU1s9v8HdiW2kwA0EsQ62ZVDdpuS/pub?gid=0&single=true&output=csv';

let barChartInstance = null;
let doughnutChartInstance = null;
let allRows = [];

function loadDashboard() {
  const callbackName = 'handleSheetData_' + Date.now();

  window[callbackName] = function(rawData) {
    allRows = rawData.map(row => {
      const cleanRow = {};
      for (const key in row) {
        if (key.trim() !== '') cleanRow[key.trim()] = row[key];
      }
      return cleanRow;
    });
    renderTable(allRows);
    renderCharts(allRows);
    delete window[callbackName];
  };

  const script = document.createElement('script');
  script.src = `${WEB_APP_URL}?callback=${callbackName}`;
  script.onerror = () => alert('Network blocked access to Google Apps Script.');
  document.body.appendChild(script);
}


function renderCharts(rows) {
  const labels = rows.map(row => row.Category || 'Unknown');
  const salesData = rows.map(row => Number(row.Sales) || 0);
  const profitData = rows.map(row => Number(row.Profit) || 0);

  if (barChartInstance) barChartInstance.destroy();
  if (doughnutChartInstance) doughnutChartInstance.destroy();

  // 1. Grouped Bar Chart (Sales vs. Profit)
  const barCtx = document.getElementById('barChart').getContext('2d');
  barChartInstance = new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Sales ($)',
          data: salesData,
          backgroundColor: '#3b82f6',
          borderRadius: 4
        },
        {
          label: 'Profit ($)',
          data: profitData,
          backgroundColor: profitData.map(val => val < 0 ? '#ef4444' : '#10b981'),
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' }
      }
    }
  });

  // 2. Doughnut Chart (Sales Share by Category)
  const doughnutCtx = document.getElementById('doughnutChart').getContext('2d');
  doughnutChartInstance = new Chart(doughnutCtx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: salesData,
        backgroundColor: [
          '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
          '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#64748b'
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'right' }
      }
    }
  });
}

function renderTable(rows) {
  const thead = document.getElementById('tableHead');
  const tbody = document.getElementById('tableBody');
  thead.innerHTML = '';
  tbody.innerHTML = '';

  if (!rows || rows.length === 0) return;

  // FIXED: Use rows (the first object) to get column names
  const headers = Object.keys(rows).filter(key => key.trim() !== '');

  // Build Table Headers
  const headerRow = document.createElement('tr');
  headers.forEach(header => {
    const th = document.createElement('th');
    th.textContent = header;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  // Build Table Rows
  rows.forEach(row => {
    const tr = document.createElement('tr');
    headers.forEach(header => {
      const td = document.createElement('td');
      const val = row[header];

      if ((header === 'Sales' || header === 'Profit') && !isNaN(val)) {
        td.textContent = Number(val).toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0
        });
        if (header === 'Profit' && Number(val) < 0) {
          td.style.color = '#ef4444';
          td.style.fontWeight = 'bold';
        }
      } else {
        td.textContent = val;
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

// Search Filter
document.getElementById('searchInput').addEventListener('input', (e) => {
  const term = e.target.value.toLowerCase();
  const filtered = allRows.filter(row =>
    Object.values(row).some(val => String(val).toLowerCase().includes(term))
  );
  renderTable(filtered);
});

// Refresh Button
document.getElementById('refreshBtn').addEventListener('click', loadDashboard);

// Initial Load
loadDashboard();