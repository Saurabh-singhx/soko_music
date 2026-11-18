// Dynamic YouTube Music Regional Charts (zero hardcoded chart data)
window.REGIONAL_CHARTS = {
  "Global": [],
  "India": [],
  "United States": [],
  "United Kingdom": []
};
var REGIONAL_CHARTS = window.REGIONAL_CHARTS;

// Official YouTube Music Chart Playlists by Country / Region
window.REGIONAL_PLAYLIST_IDS = {
  "Global": "PL4fGSI1pDJn49TUu37nJoN2QTeYuRwmNv",
  "India": "PL4fGSI1pDJn40WjZ6utkIuj2rNg-7iGsq",
  "United States": "PL4fGSI1pDJn6puJdseH2Rt9sMvt9E2M4i",
  "United Kingdom": "PL4fGSI1pDJn688ebB8czINn0_nov50e3A",
  "Canada": "PL4fGSI1pDJn4IeWA7bBJYh__qgOCRMkIh",
  "Australia": "PL4fGSI1pDJn44PMHPLYatj8rta8WYtZ8_",
  "Japan": "PL4fGSI1pDJn5FhDrWnRp2NLzJCoPliNgT",
  "Germany": "PL7eU2Xjx0QsVwyGVvaKSj6reaKGQ9F-zO",
  "France": "PL4fGSI1pDJn50iCQRUVmgUjOrCggCQ9nR",
  "Brazil": "PL4fGSI1pDJn4Gs2meaJRo9O8PNYvhjHIg",
  "South Korea": "PL4fGSI1pDJn5S09aId3dUGp40ygUqmPGc",
  "Indonesia": "PL4fGSI1pDJn5QPpj0R4vVgRWk8sSq549G",
  "Egypt": "PL4fGSI1pDJn4EhpZkSSpdyWUet73FalVU",
  "Thailand": "PL4fGSI1pDJn5J-6eohuDgVr8lTdRpcVQo",
  "Ukraine": "PL4fGSI1pDJn7524WZdmWAIRc6cQ3vUzZK"
};

// Regional GL geolocation codes for InnerTube client context
window.REGIONAL_GL_CODES = {
  "Global": "US",
  "India": "IN",
  "United States": "US",
  "United Kingdom": "GB",
  "Canada": "CA",
  "Australia": "AU",
  "Japan": "JP",
  "Germany": "DE",
  "France": "FR",
  "Brazil": "BR",
  "South Korea": "KR",
  "Indonesia": "ID",
  "Egypt": "EG",
  "Thailand": "TH",
  "Ukraine": "UA"
};

function getCanonicalChartRegion(region) {
  if (!region || typeof region !== 'string') return 'Global';
  const norm = region.trim().toLowerCase();
  if (norm === 'global' || norm === 'world' || norm === 'worldwide' || norm === 'zz') return 'Global';
  if (norm === 'india' || norm === 'in' || norm === 'bharat') return 'India';
  if (norm === 'united states' || norm === 'us' || norm === 'usa' || norm === 'america' || norm === 'united states of america') return 'United States';
  if (norm === 'united kingdom' || norm === 'uk' || norm === 'gb' || norm === 'great britain' || norm === 'england') return 'United Kingdom';
  if (norm === 'canada' || norm === 'ca') return 'Canada';
  if (norm === 'australia' || norm === 'au') return 'Australia';
  if (norm === 'japan' || norm === 'jp') return 'Japan';
  if (norm === 'germany' || norm === 'de' || norm === 'deutschland') return 'Germany';
  if (norm === 'france' || norm === 'fr') return 'France';
  if (norm === 'brazil' || norm === 'br' || norm === 'brasil') return 'Brazil';
  if (norm === 'south korea' || norm === 'kr' || norm === 'korea') return 'South Korea';
  if (norm === 'indonesia' || norm === 'id') return 'Indonesia';
  if (norm === 'egypt' || norm === 'eg') return 'Egypt';
  if (norm === 'thailand' || norm === 'th') return 'Thailand';
  if (norm === 'ukraine' || norm === 'ua') return 'Ukraine';
  if (norm === 'mexico' || norm === 'mx') return 'Mexico';
  if (norm === 'spain' || norm === 'es') return 'Spain';
  if (norm === 'italy' || norm === 'it') return 'Italy';
  return region.trim().replace(/\b\w/g, c => c.toUpperCase());
}

window.getCanonicalChartRegion = getCanonicalChartRegion;
