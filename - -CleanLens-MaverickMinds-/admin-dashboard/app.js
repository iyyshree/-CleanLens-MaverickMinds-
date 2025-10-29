const API_BASE = (() => {
  const fromWindow = (window.CLEAN_LENS_API_BASE || '').trim();
  if (fromWindow) return fromWindow;
  try {
    const origin = window.location.origin;
    if (origin && origin !== 'null') return origin + '/api';
  } catch (_) {}
  return 'http://127.0.0.1:8000/api';
})();
let ADMIN_API_KEY = (window.CLEAN_LENS_ADMIN_KEY || localStorage.getItem('cleanlens_admin_token') || '').trim();

const qs = (sel, el=document) => el.querySelector(sel);
const qsa = (sel, el=document) => Array.from(el.querySelectorAll(sel));

const statusBadgeClass = (s) => {
  if (!s) return 'badge';
  const k = s.toLowerCase().replace(/\s+/g,'');
  return `badge ${k}`;
};

async function fetchJson(path, opts={}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers||{})
    }
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

async function signIn(email, password){
  const data = await fetchJson('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  ADMIN_API_KEY = data.token;
  localStorage.setItem('cleanlens_admin_token', ADMIN_API_KEY);
  updateAuthUI();
}

function signOut(){
  ADMIN_API_KEY = '';
  localStorage.removeItem('cleanlens_admin_token');
  updateAuthUI();
}

function updateAuthUI(){
  const signedIn = !!ADMIN_API_KEY;
  const email = document.getElementById('emailInput');
  const pass = document.getElementById('passwordInput');
  const inBtn = document.getElementById('signInBtn');
  const outBtn = document.getElementById('signOutBtn');
  if (!email || !pass || !inBtn || !outBtn) return;
  email.style.display = signedIn ? 'none' : '';
  pass.style.display = signedIn ? 'none' : '';
  inBtn.style.display = signedIn ? 'none' : '';
  outBtn.style.display = signedIn ? '' : 'none';
}

async function listReports() {
  const status = qs('#statusFilter').value;
  const q = qs('#searchInput').value.trim();
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (q) params.set('q', q);
  return fetchJson(`/reports?${params.toString()}`);
}

async function loadStats() {
  const stats = await fetchJson('/reports/stats');
  const el = qs('#stats');
  el.innerHTML = '';
  const items = [
    { label: 'Total', value: stats.total },
    { label: 'Pending', value: stats.byStatus?.['Pending'] || 0 },
    { label: 'In Progress', value: stats.byStatus?.['In Progress'] || 0 },
    { label: 'Resolved', value: stats.byStatus?.['Resolved'] || 0 },
  ];
  for (const s of items) {
    const div = document.createElement('div');
    div.className = 'stat';
    div.textContent = `${s.label}: ${s.value}`;
    el.appendChild(div);
  }
}

function renderTable(rows) {
  const tbody = qs('#reportsBody');
  tbody.innerHTML = '';
  for (const r of rows) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.id}</td>
      <td><span class="${statusBadgeClass(r.status)}">${r.status}</span></td>
      <td>${r.urgency || ''}</td>
      <td>${r.ward ?? ''}</td>
      <td>${r.address || ''}</td>
      <td>${new Date(r.createdAt).toLocaleString()}</td>
      <td class="row-actions">
        <button class="action-btn" data-action="view" data-id="${r.id}">View</button>
      </td>
    `;
    tbody.appendChild(tr);
  }
}

async function refresh() {
  const [rows] = await Promise.all([listReports(), loadStats()]);
  renderTable(rows);
}

function openModal(report) {
  const dlg = qs('#detailsModal');
  qs('#detailImage').src = report.imageUrl;
  qs('#detailDescription').textContent = report.description || '';
  const meta = qs('#detailMeta');
  meta.innerHTML = '';
  const pairs = {
    'ID': report.id,
    'Status': report.status,
    'Urgency': report.urgency || '',
    'Ward': report.ward ?? '',
    'Address': report.address || '',
    'Coordinates': `${report.latitude}, ${report.longitude}`,
    'Created': new Date(report.createdAt).toLocaleString(),
    'Updated': new Date(report.updatedAt).toLocaleString(),
    'User': report.userId || ''
  };
  Object.entries(pairs).forEach(([k,v]) => {
    const kEl = document.createElement('div'); kEl.textContent = k;
    const vEl = document.createElement('div'); vEl.textContent = v;
    meta.appendChild(kEl); meta.appendChild(vEl);
  });
  qsa('.status-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.status === report.status);
    b.onclick = async () => {
      try {
        const res = await fetch(`${API_BASE}/reports/${report.id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(ADMIN_API_KEY ? { 'X-Admin-Api-Key': ADMIN_API_KEY } : {})
          },
          body: JSON.stringify({ status: b.dataset.status })
        });
        if (!res.ok) throw new Error('Update failed');
        const updated = await res.json();
        openModal(updated); // re-render modal
        refresh();
      } catch (e) {
        alert(e.message);
      }
    };
  });
  if (typeof dlg.showModal === 'function') dlg.showModal();
}

async function attach() {
  qs('#refreshBtn').addEventListener('click', refresh);
  qs('#statusFilter').addEventListener('change', refresh);
  qs('#searchInput').addEventListener('input', () => {
    // throttle lightly
    clearTimeout(window.__searchT);
    window.__searchT = setTimeout(refresh, 250);
  });
  qs('#closeModal').addEventListener('click', () => qs('#detailsModal').close());
  qs('#reportsBody').addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    const item = await fetchJson(`/reports/${id}`);
    openModal(item);
  });
  const inBtn = document.getElementById('signInBtn');
  const outBtn = document.getElementById('signOutBtn');
  if (inBtn) inBtn.addEventListener('click', async () => {
    const email = document.getElementById('emailInput').value.trim();
    const password = document.getElementById('passwordInput').value.trim();
    try {
      await signIn(email, password);
      await refresh();
    } catch (e) {
      alert('Sign in failed');
    }
  });
  if (outBtn) outBtn.addEventListener('click', () => { signOut(); });
  updateAuthUI();
}

attach().then(refresh);


