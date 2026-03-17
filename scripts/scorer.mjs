// scripts/scorer.mjs — Deterministic element-matching scorer
// NO LLM-as-judge. Scores based on presence of required elements in response.

export function scoreResponse(query, response) {
  const resp = response.toLowerCase();
  let matchCount = 0;
  const matches = [];
  const misses = [];

  for (const elem of query.required_elements) {
    // Support alternatives separated by |
    const alternatives = elem.toLowerCase().split("|");
    const found = alternatives.some(alt => resp.includes(alt.trim()));
    if (found) { matchCount++; matches.push(elem); }
    else { misses.push(elem); }
  }

  if (query.scoring === "EXACT_MATCH") {
    // L1: binary — any required element present = 1, else 0
    return { score: matchCount > 0 ? 1 : 0, max: 1, matches, misses, total_elements: query.required_elements.length };
  } else {
    // L2/L3: proportional — score = matched / min_elements, capped at 1.0
    const minReq = query.min_elements || query.required_elements.length;
    const score = Math.min(matchCount / minReq, 1.0);
    return { score: parseFloat(score.toFixed(4)), max: 1, matches, misses, total_elements: query.required_elements.length, min_required: minReq };
  }
}
