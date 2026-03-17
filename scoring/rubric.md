# Human Scoring Rubric — Level 3 Queries

## Instructions for Raters

You are scoring LLM responses to complex Google Ads strategy questions. Each response should be scored on a 0–3 scale based on the criteria below. You do NOT need Google Ads expertise — the rubric tells you what a correct answer must contain.

### Scoring Scale

| Score | Definition |
|-------|-----------|
| **0** | Wrong, irrelevant, or missing key information. The response does not address the core question or provides incorrect information. |
| **1** | Partially correct. Addresses the question but misses major required elements. May identify the surface issue without recognizing underlying constraints or relationships. |
| **2** | Mostly correct. Addresses most required elements but misses 1-2 important points. Demonstrates understanding of relationships but may miss secondary effects or constraints. |
| **3** | Fully correct. All required elements present. Demonstrates understanding of entity relationships, constraints, and cascading effects. May include additional valid insights beyond the rubric. |

### Scoring Process

1. Read the **Question** 
2. Read the **Required Elements** — these are the things a correct answer MUST mention
3. Read the **Response** being scored
4. Check off which required elements are present in the response
5. Assign a score based on element coverage AND reasoning quality:
   - All or nearly all elements + good reasoning = **3**
   - Most elements + some reasoning gaps = **2**
   - Some elements + major reasoning gaps = **1**
   - Few or no elements = **0**

### Important Notes

- **Don't penalize** for extra information that is correct and relevant
- **Do penalize** for confident statements that are factually wrong about the account
- **Give credit** if the response identifies a relationship even if it uses different terminology
- Score based on what's IN the response, not what format it's in
- If unsure between two scores, choose the lower one

### Example

**Question:** "What is the highest-risk scenario in this MCC?"  
**Required Elements:** Marcus, 47%, ABM, historical, context, Sarah, document, transition

**Response A (Score 3):** "The highest risk is Marcus Webb controlling 47% of the MCC budget without access to the Q3 2025 ABM data that justified the $300/day allocation. Sarah Chen's institutional knowledge about the ABM pipeline results needs to be documented and transferred before Marcus makes budget decisions based on incomplete information."  
→ Contains: Marcus ✓, 47% ✓, ABM ✓, historical (implied by Q3 2025) ✓, context (implied by institutional knowledge) ✓, Sarah ✓, document ✓, transition (implied by transferred) ✓

**Response B (Score 1):** "The biggest risk is the PMax campaign cannibalizing Shopping. This should be addressed by adjusting budgets."  
→ Contains: Marcus ✗, 47% ✗, ABM ✗. Identifies A risk but not THE highest risk per the rubric.

---

## Per-Query Rubrics

See the `required_elements` field in each L3 query in `scripts/queries.mjs` for the specific elements each response must contain. The export script (`python scripts/export_for_scoring.py`) will generate a CSV with all responses and rubrics pre-filled.
