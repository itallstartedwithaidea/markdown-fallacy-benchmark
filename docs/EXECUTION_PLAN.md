# The Markdown Fallacy — Experiment Execution Plan

## STAGE 1: Expanded Pilot → Zenodo DOI
**Timeline: 3-5 days**
**Output: Original data + citable preprint**

### What You Have (built, ready to run)
- `benchmark_full.mjs` — Complete benchmark with:
  - 30 queries across 3 complexity levels (10 per level)
  - Realistic 15-campaign Google Ads MCC corpus (3 accounts, budget pools, audience overlaps, manager transitions)
  - Same facts encoded as flat markdown AND structured entity-relationship graph
  - Deterministic scoring engine (element matching, not LLM grading — removes circular bias)
  - Multi-model support (Claude, GPT-4o, Gemini)
  - 3 runs per condition for statistical reliability
  - Automatic analysis with means, standard deviations, per-level breakdowns

### Day 1: Run the Experiment
```bash
# Install nothing. Just set API keys and run.
export ANTHROPIC_API_KEY="sk-ant-..."
export OPENAI_API_KEY="sk-..."
export GOOGLE_API_KEY="..."    # Gemini API key from ai.google.dev

node benchmark_full.mjs stage1
```

This runs 540 API calls (~45 min). Cost: $3-5 total.

Output: `benchmark_stage1_results.json` with:
- Raw responses and scores for all 540 calls
- Analysis summary (mean, SD, delta per level per model)
- Element-match details showing exactly what each response got right/wrong

### Day 2: Review Results and Write the Data Section
Open `benchmark_stage1_results.json`. You need these numbers for the paper:

**Table V** (goes in Section IV-B of the IEEE paper):
| Level | Markdown (mean ± SD) | Structured (mean ± SD) | Delta | p-value |
|-------|---------------------|----------------------|-------|---------|
| L1    | [from results]      | [from results]       |       |         |
| L2    | [from results]      | [from results]       |       |         |
| L3    | [from results]      | [from results]       |       |         |
| ALL   | [from results]      | [from results]       |       |         |

For p-values: Run a paired t-test on the per-query scores (markdown vs structured).
Quick way: paste the per-query scores into any stats tool, or:
```python
from scipy.stats import ttest_rel
# md_scores = [...from json...]
# st_scores = [...from json...]
t, p = ttest_rel(md_scores, st_scores)
print(f"t={t:.3f}, p={p:.4f}")
```

### Day 3: Upload to Zenodo
1. Go to zenodo.org, create account
2. Click "New Upload"
3. Upload:
   - The IEEE paper (.docx or .pdf)
   - benchmark_full.mjs (the experiment code)
   - benchmark_stage1_results.json (the raw data)
4. Fill metadata:
   - Title: "The Markdown Fallacy: An Empirical Case Against Static Files as Memory Substrates for LLM Agent Systems"
   - Authors: John Williams
   - Description: [paste abstract]
   - License: CC-BY 4.0
   - Keywords: LLM memory, knowledge graphs, llms.txt, multi-agent systems, context engineering
5. Publish → Get DOI

You now have a citable, DOI-registered preprint with original data.

---

## STAGE 2: Full Google Ads Domain Benchmark → Conference Paper
**Timeline: 4-6 weeks**
**Output: Publishable benchmark dataset + revised paper for submission**

### What Stage 2 Adds Over Stage 1

| Dimension | Stage 1 | Stage 2 |
|-----------|---------|---------|
| Queries | 30 | 50 |
| Conditions | 2 (markdown, structured) | 4 (markdown, vector RAG, GraphRAG, hybrid) |
| Corpus | Single context blob | 50 separate documents (realistic retrieval) |
| Scoring | Element matching | Element matching + human validation on L3 |
| Models | 3 | 3+ |
| Runs | 3 | 5 |
| Stats | t-test | ANOVA with post-hoc |
| Data points | 540 | 3,000+ |

The critical difference: Stage 2 tests retrieval architecture, not just formatting. The corpus exceeds what fits in a single context window, so the markdown condition must truncate while vector/graph conditions retrieve selectively.

### Week 1: Build the Corpus

The corpus needs to be 50 separate documents, not one big blob. This simulates a real documentation environment where information is spread across pages.

**Document types to create (50 total):**
- 15 campaign profile docs (one per campaign with metrics, history, notes)
- 3 account overview docs (one per sub-account)
- 1 MCC overview doc
- 3 manager profile docs (Sarah, Marcus, David)
- 5 budget pool / constraint docs
- 5 audience overlap analysis docs
- 5 quarterly performance review docs (Q1-Q4 2025, Q1 2026)
- 5 optimization decision logs (documented decisions with rationale)
- 3 cross-account relationship docs
- 5 strategic planning docs (seasonal plans, reallocation proposals)

Each document: 500-2000 words. Total corpus: ~50,000 words / ~65,000 tokens.
This exceeds a single context window for most models at reasonable quality.

**I can build all 50 documents for you.** They need to feel like real practitioner documentation, not synthetic test data. Your 15 years of experience means you can validate whether they read authentically.

### Week 2: Set Up the Four Retrieval Conditions

**Condition A: Full Markdown (llms-full.txt)**
Concatenate all 50 docs into one massive markdown file.
This is the llms.txt approach. It will exceed context windows on many queries.
Implementation: Just string concatenation. Truncate to model's context limit.

**Condition B: Vector RAG**
Chunk the 50 docs, embed them, retrieve top-k chunks per query.
```bash
pip install chromadb sentence-transformers
```
```python
import chromadb
from sentence_transformers import SentenceTransformer

client = chromadb.Client()
collection = client.create_collection("acme_docs")
model = SentenceTransformer('all-MiniLM-L6-v2')

# Chunk each doc into ~500 token passages
# Embed and store in ChromaDB
# At query time: retrieve top 10 chunks by cosine similarity
# Feed retrieved chunks as context to the LLM
```
Implementation: ~100 lines of Python. I can build this for you.

**Condition C: GraphRAG**
Extract entities and relationships from the 50 docs, build a knowledge graph, query it.
```bash
# Option 1: Neo4j (most established)
docker run -p 7474:7474 -p 7687:7687 neo4j

# Option 2: FalkorDB (fastest, designed for this)
docker run -p 6379:6379 falkordb/falkordb
```
```python
# Use LangChain's LLMGraphTransformer to extract entities/relations
# Or manually define the schema (more controlled for a benchmark)
# At query time: translate question to Cypher query, traverse graph
# Feed traversal results as context to LLM
```
Implementation: ~200 lines. The graph schema already exists in the structured context I built.

**Condition D: Hybrid (Vector + Graph)**
First vector search for relevant chunks, then graph traversal to find connected entities.
DataStax's Graph Vector Store pattern.
Implementation: Combine B and C with a routing step.

### Week 3: Expand Query Set to 50

Add 20 more queries to the Stage 1 set of 30:
- 5 more L1 (coverage: every campaign mentioned at least once as a direct lookup)
- 5 more L2 (coverage: every relationship tested at least once)
- 10 more L3 (coverage: cross-account strategy, temporal reasoning, attribution chains, manager transitions, budget optimization under constraints)

**Critical addition: 10 queries specifically designed to test retrieval failure modes.**
These are queries where the answer requires information from 3+ separate documents that are not semantically similar. Vector RAG should fail on these (retrieves wrong chunks). GraphRAG should succeed (traverses relationships). Markdown should fail (information truncated or buried).

Examples:
- "What is the total budget exposure if Services YouTube is cut, considering its influence on Brand Search, the Pool Beta constraint, and the Enterprise cross-sell pipeline?" (requires: YouTube doc + Brand Search doc + Pool Beta doc + Enterprise Retargeting doc)
- "Compare the manager transition risk between the David Park departure in 2024 and the Sarah-to-Marcus transition in 2026. What was lost each time and what should be done differently?" (requires: David Park doc + Sarah Chen doc + Marcus Webb doc + 2 optimization decision logs)

### Week 4: Run Full Experiment + Human Scoring

**Automated run:**
```bash
node benchmark_full.mjs stage2
```
50 queries × 4 conditions × 3 models × 5 runs = 3,000 API calls.
~4 hours. ~$15-25.

**Human scoring for Level 3:**
The 20 L3 queries get scored by 3 human raters (you + 2 others).
Each rater scores each L3 response on a 0-3 rubric.
Report inter-rater reliability (Krippendorff's alpha or Cohen's kappa).

**Who are the 2 other raters?**
- Another Google Ads practitioner (someone from Seer? a Hero Conf contact?)
- An AI/ML person who can evaluate the reasoning quality independent of domain knowledge
This also seeds your co-author pipeline.

### Week 5: Statistical Analysis

**Primary analysis: Two-way ANOVA**
- Factor 1: Context condition (markdown, vector, graph, hybrid)
- Factor 2: Query complexity level (L1, L2, L3)
- Dependent variable: Accuracy score
- Prediction: Significant main effects of both factors + significant interaction (the gap widens at higher complexity)

**Post-hoc: Tukey HSD**
Pairwise comparisons between all conditions at each level.
Key comparison: markdown vs graph at L3 (this is the kill shot).

**Secondary analyses:**
- Per-model breakdown (does the effect replicate across Claude, GPT-4o, Gemini?)
- Element-level analysis (which specific elements do markdown responses miss?)
- Response length analysis (do structured responses tend to be longer or shorter?)
- Retrieval failure analysis for vector condition (which queries retrieved wrong chunks?)

**Tools:**
```python
from scipy.stats import f_oneway
from statsmodels.stats.multicomp import pairwise_tukeyhsd
import pandas as pd
# Load benchmark_stage2_results.json
# Run ANOVA + Tukey + generate tables
```

### Week 6: Write and Submit

**Update the IEEE paper:**
- Insert Stage 1 + Stage 2 results into Section IV
- Add Stage 2 methodology to Section III
- Update Table III (capability matrix) with empirical evidence
- Revise Discussion with actual data instead of predictions
- Add the benchmark as a named contribution ("MemBench-Ads" or similar)

**Venue targets (in order of fit):**
1. **AAAI Workshop on AI Agents** — Perfect fit, 6-page format, practitioner-friendly
2. **IEEE CAI (Conference on AI)** — Applied AI, accepts industry contributions
3. **ACM SIGIR Workshop on RAG** — If you focus the paper on retrieval
4. **NeurIPS Workshop on Memory in AI** — If you lean into the neuroscience angle
5. **arXiv preprint** — Immediate visibility, no review gate, pair with Zenodo DOI

---

## CO-AUTHOR STRATEGY

You need 1-2 co-authors. Here's why and who:

**Why:** Single-author papers from industry practitioners face implicit bias at academic venues. A co-author with academic affiliation validates the methodology. A co-author from a different domain (neuro, CS) strengthens the interdisciplinary claim.

**Who to approach:**
1. **WSU CS or CogSci faculty** — You have the alumni connection. Email the department. "I have a paper with original data comparing LLM memory architectures with a neuroscience framing. I need a co-author to validate the cognitive science claims. Here's the abstract."
2. **Seer Interactive colleagues** — Anyone with a quantitative background who can run the stats independently and validate the Google Ads domain authenticity.
3. **Hero Conf network** — You've spoken there. Other speakers who straddle the practitioner-academic line.
4. **The LangChain / LangGraph community** — They'd be interested in a benchmark that validates their architectural decisions. An engineer from LangChain as a co-author would be powerful.

---

## FILE MANIFEST

After this session you have:
- `Markdown_Fallacy_IEEE.docx` — The paper (needs results inserted)
- `The_Markdown_Fallacy_APA.docx` — Backup APA version
- `benchmark_full.mjs` — Complete Stage 1 experiment code
- `EXECUTION_PLAN.md` — This file (the map)

What I still need to build for you:
- The 50-document corpus for Stage 2
- The vector RAG pipeline (ChromaDB)
- The GraphRAG pipeline (Neo4j/FalkorDB)
- The statistical analysis script
- The human scoring rubric and sheet

Say the word and I'll build any of these next.
