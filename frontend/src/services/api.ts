export class CSVValidationError extends Error {
  missing_columns: string[];
  required_columns: string[];
  
  constructor(message: string, missing: string[], required: string[]) {
    super(message);
    this.name = 'CSVValidationError';
    this.missing_columns = missing;
    this.required_columns = required;
  }
}

export async function submitCalculation({ file, taxYear, analysisType }) {
  const base = window.location.origin + '/prod';
  const form = new FormData();
  form.append('file', file);
  form.append('tax_year', taxYear);
  form.append('analysis_type', analysisType);
  const resp = await fetch(base + '/calculate', { method: 'POST', body: form });
  if(!resp.ok){
    let msg = 'HTTP '+resp.status;
    try { 
      const j = await resp.json(); 
      if(j.error) msg = j.error;
      
      // Handle CSV validation errors
      if (resp.status === 400 && j.missing_columns && j.required_columns) {
        throw new CSVValidationError(
          j.message || 'Invalid CSV format',
          j.missing_columns,
          j.required_columns
        );
      }
    } catch(err) {
      if (err instanceof CSVValidationError) {
        throw err;
      }
    }
    throw new Error(msg);
  }
  const raw = await resp.json();
  return { raw };
}
