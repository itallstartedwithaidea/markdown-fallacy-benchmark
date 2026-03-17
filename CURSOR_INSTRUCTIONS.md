# CURSOR INSTRUCTIONS — The Markdown Fallacy Benchmark

## READ THIS FIRST

This is a research benchmark for an IEEE paper. The goal is to produce original quantitative data comparing LLM reasoning accuracy across four memory substrate conditions. Everything is built. You need to run it.

## PREREQUISITES

### API Keys (set in .env)
```
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...
```

### Install Dependencies
```bash
npm install
pip install chromadb sentence-transformers scipy statsmodels pandas numpy neo4j
```

### Docker (for Stage 2 only)
```bash
docker compose up -d    # starts Neo4j
```

---

## STAGE 1: Run This First (30 min)

Stage 1 compares markdown vs structured context with identical facts. Both conditions fit in one context window. This tests whether FORMAT affects reasoning.

```bash
node scripts/stage1_run.mjs
```

**What it does:**
- Sends 30 queries to each available model (Claude, GPT-4o, Gemini)
- Each query sent twice: once with flat markdown context, once with structured relational context
- Repeated 3 times for reliability
- Scores every response with deterministic element matching
- Saves results to `results/stage1_results.json`
- Prints summary table

**Expected output:**
- Level 1 (factual lookup): Both conditions score ~0.9-1.0. No difference.
- Level 2 (multi-hop relational): Structured pulls ahead ~0.1-0.3
- Level 3 (strategic synthesis): Structured dominates ~0.3-0.5 gap

**If a model's API key is missing, it's skipped automatically.**

---

## STAGE 2: Run This Second (3-4 hours)

Stage 2 tests actual RETRIEVAL ARCHITECTURE. The corpus is 50 documents that exceed a single context window. Four conditions:

1. **Markdown**: Concatenate all 50 docs, truncate to context limit
2. **Vector RAG**: Chunk, embed, retrieve top-10 by cosine similarity  
3. **GraphRAG**: Extract entities+relationships, traverse graph
4. **Hybrid**: Vector retrieval + graph verification

### Step 1: Generate the corpus
```bash
node scripts/generate_corpus.mjs
```
Creates 50 .md files in `corpus/`.

### Step 2: Index the corpus
```bash
# Index into ChromaDB (vector store)
python scripts/stage2_setup.py --vector

# Index into Neo4j (knowledge graph) — requires Docker running
python scripts/stage2_setup.py --graph

# Both at once
python scripts/stage2_setup.py --all
```

### Step 3: Run the benchmark
```bash
node scripts/stage2_run.mjs
```
Saves to `results/stage2_results.json`.

### Step 4: Analyze
```bash
python scripts/analyze.py
```
Outputs:
- `results/analysis_tables.txt` (copy into the paper)
- `results/analysis_figures.png` (bar charts for the paper)
- ANOVA F-statistics and p-values
- Tukey HSD pairwise comparisons
- Per-model breakdowns
- Element-level miss analysis

---

## STAGE 2.5: Human Scoring (Level 3 queries only)

The automated scoring catches element presence but not reasoning quality. For Level 3, you need human raters.

1. Run `python scripts/export_for_scoring.py` — generates `scoring/scoresheet.csv`
2. Give the CSV + `scoring/rubric.md` to 3 raters (you + 2 others)
3. Each rater scores each L3 response 0-3 per rubric
4. Run `python scripts/interrater.py` — calculates Krippendorff's alpha

---

## AFTER RUNNING EVERYTHING

### Update the Paper
1. Open `docs/Markdown_Fallacy_IEEE.docx`
2. Insert Table V data from `results/analysis_tables.txt`
3. Insert Figure 1 from `results/analysis_figures.png`
4. Update Section IV-B with actual numbers replacing "[from results]"
5. Update Discussion with actual delta values

### Upload to Zenodo
1. zenodo.org → New Upload
2. Upload: paper PDF, benchmark code (zip this repo), results JSON
3. Get DOI

### Submit to Conference
Target venues (in order):
1. AAAI Workshop on AI Agents
2. IEEE CAI 2026
3. NeurIPS Workshop on Memory in AI
4. arXiv preprint (immediate, no review gate)

---

## TROUBLESHOOTING

**"fetch failed" or timeout errors:**
API rate limits. The scripts have built-in delays but you may need to increase them.
Edit `DELAY_MS` in `scripts/models.mjs`.

**Neo4j connection refused:**
Make sure Docker is running: `docker compose up -d`
Check: `docker ps` should show neo4j container.

**ChromaDB import errors:**
Make sure you installed it: `pip install chromadb sentence-transformers`

**Low scores on all conditions:**
Check the model responses in the raw JSON. If responses are generic or refusing to answer, the system prompt may need adjustment for that model.

**Gemini returns empty:**
Google's free tier has strict rate limits. Consider running Gemini separately with longer delays, or drop it from the benchmark (two models is still publishable).
