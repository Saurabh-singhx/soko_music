// Text extraction helpers for InnerTube structured objects
function extractTextString(val) {
      if (!val) return '';
      if (typeof val === 'string') return val;
      if (typeof val === 'number') return String(val);
      if (Array.isArray(val)) return val.map(extractTextString).join(' ');
      if (typeof val === 'object') {
        if (Array.isArray(val.runs)) {
          return val.runs.map(r => (r && r.text) ? r.text : '').join(' ');
        }
        if (val.simpleText) return String(val.simpleText);
      }
      return '';
    }

window.extractTextString = extractTextString;
