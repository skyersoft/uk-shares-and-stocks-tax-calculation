export async function submitCalculation({ file, taxYear, analysisType }) {
  const base = window.location.origin + '/prod';
  const form = new FormData();
  form.append('file', file);
  form.append('tax_year', taxYear);
  form.append('analysis_type', analysisType);
  const resp = await fetch(base + '/calculate', { method: 'POST', body: form });
  if(!resp.ok){
    let msg = 'HTTP '+resp.status;
    try { const j = await resp.json(); if(j.error) msg = j.error; } catch(_){}
    throw new Error(msg);
  }
  const raw = await resp.json();
  return { raw };
}
