// Aggregated 400 Real Regional Chart Tracks (100 per region)
window.REGIONAL_CHARTS = {
  "Global": (window._charts_global_1 || []).concat(window._charts_global_2 || []),
  "India": (window._charts_india_1 || []).concat(window._charts_india_2 || []),
  "United States": (window._charts_us_1 || []).concat(window._charts_us_2 || []),
  "United Kingdom": (window._charts_uk_1 || []).concat(window._charts_uk_2 || [])
};
const REGIONAL_CHARTS = window.REGIONAL_CHARTS;
