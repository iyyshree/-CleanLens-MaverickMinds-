const API_BASE = (window.CLEAN_LENS_API_BASE || '').trim() || 'http://127.0.0.1:8000/api';
const qs = (s, el=document) => el.querySelector(s);

function setStatus(msg, ok=true){
  const el = qs('#statusMsg');
  el.style.color = ok ? '#9be8b8' : '#e8a4a4';
  el.textContent = msg;
}

async function getLocation(){
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

function fileToDataUrl(file){
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

async function onLocate(){
  try{
    setStatus('Fetching your location...');
    const { lat, lng } = await getLocation();
    qs('#lat').textContent = lat.toFixed(6);
    qs('#lng').textContent = lng.toFixed(6);
    setStatus('Location captured.');
  }catch(e){
    setStatus('Unable to get location. You can still submit.', false);
  }
}

async function onSubmit(e){
  e.preventDefault();
  setStatus('Submitting report...');

  const file = qs('#imageInput').files[0];
  if (!file){ setStatus('Please select a photo.', false); return; }
  const description = qs('#description').value.trim();
  const urgency = qs('#urgency').value;
  const ward = qs('#ward').value.trim();
  const address = qs('#address').value.trim();
  const userId = qs('#userId').value.trim() || 'anonymous';
  const latText = qs('#lat').textContent;
  const lngText = qs('#lng').textContent;
  const latitude = parseFloat(latText);
  const longitude = parseFloat(lngText);

  if (!(Number.isFinite(latitude) && Number.isFinite(longitude))){
    setStatus('Please click "Use my location" first.', false);
    return;
  }

  try{
    const imageUrl = await fileToDataUrl(file); // data: URL (valid URI)
    const payload = {
      userId,
      description,
      imageUrl,
      latitude,
      longitude,
      address,
      ward: ward || undefined,
      urgency
    };
    const res = await fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Failed: ${res.status}`);
    await res.json();
    setStatus('Report submitted. Thank you!');
    qs('#reportForm').reset();
    qs('#lat').textContent = '—';
    qs('#lng').textContent = '—';
  }catch(err){
    setStatus(err.message || 'Submission failed', false);
  }
}

function attach(){
  qs('#locateBtn').addEventListener('click', onLocate);
  qs('#reportForm').addEventListener('submit', onSubmit);
}

attach();


