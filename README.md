# The Markdown Fallacy Benchmark

**An empirical benchmark comparing LLM reasoning accuracy across memory substrate conditions.**

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.19059490.svg)](https://doi.org/10.5281/zenodo.19059490)

Companion code and data for the paper: *"The Markdown Fallacy: An Empirical and Theoretical Case Against Static Files as Memory Substrates for Large Language Model Agent Systems"*

## What This Tests

The AI industry is converging on markdown files (llms.txt, llms-full.txt, .md pages) as the standard way to give LLMs context. This benchmark tests whether that's actually a good idea.

We compare LLM reasoning accuracy across four conditions:
1. **Flat markdown** — everything in one file (the llms.txt approach)
2. **Vector RAG** — chunked, embedded, retrieved by semantic similarity
3. **GraphRAG** — entities and relationships in a knowledge graph
4. **Hybrid** — vector retrieval + graph verification

Tested against a realistic Google Ads MCC portfolio: 3 accounts, 15 campaigns, budget pools, audience overlaps, manager transitions, and cross-account dependencies. 50 queries at 3 complexity levels.

## Quick Start

### Stage 1 (30 minutes, ~$3-5)
```bash
cp .env.example .env           # Add your API keys
npm install
node scripts/stage1_run.mjs    # Run the benchmark
python scripts/analyze.py      # Get results tables
```

### Stage 2 (3-4 hours, ~$15-25)
```bash
node scripts/generate_corpus.mjs          # Create 50-doc corpus
docker compose up -d                       # Start Neo4j
python scripts/stage2_setup.py --all       # Index into ChromaDB + Neo4j
node scripts/stage2_run.mjs               # Run 4-condition benchmark
python scripts/analyze.py --stage2         # ANOVA + Tukey HSD
```

See [CURSOR_INSTRUCTIONS.md](CURSOR_INSTRUCTIONS.md) for detailed step-by-step.

## Key Design Decisions

- **Deterministic scoring** — Element matching, not LLM-as-judge. No circular bias.
- **Three complexity levels** — L1 (factual lookup), L2 (multi-hop relational), L3 (strategic synthesis)
- **Multi-model** — Claude Sonnet, GPT-4o, Gemini Flash. Tests generalizability.
- **Reproducible** — All code, queries, rubrics, and corpus included. Total cost < $30.
- **Human validation** — L3 queries scored by 3 human raters with inter-rater reliability.

## Repository Structure

```
scripts/
  stage1_run.mjs        # Stage 1 benchmark runner
  stage2_run.mjs        # Stage 2 benchmark runner (4 conditions)
  generate_corpus.mjs   # Creates 50 corpus documents
  stage2_setup.py       # Indexes into ChromaDB + Neo4j
  analyze.py            # Statistical analysis (ANOVA, Tukey)
  queries.mjs           # 50 queries with scoring rubrics
  contexts.mjs          # Stage 1 context blobs
  models.mjs            # API callers with retry
  scorer.mjs            # Deterministic scoring engine
  export_for_scoring.py # Export L3 for human raters
  interrater.py         # Krippendorff's alpha calculator
corpus/                 # 50 generated documents
scoring/                # Human scoring rubric + sheets
results/                # Output JSON + analysis
docs/                   # The paper
```

## Predicted Results

- **Level 1**: All conditions perform comparably (~0.9-1.0). Format doesn't matter for simple lookups.
- **Level 2**: Structured/Graph conditions pull ahead. Relationships are explicit vs. implicit.
- **Level 3**: Structured/Graph dominate. Markdown can't hold 5+ relationship chains simultaneously. This matches the data.world finding of 0% accuracy on high-complexity queries without graph grounding.

The publishable finding: **there is a crossover point** — a query complexity threshold below which markdown works fine and above which it fails categorically. Finding that threshold is the contribution.

## Citation

If you use this benchmark, please cite:

```
Williams, J. (2026). The Markdown Fallacy: An Empirical and Theoretical Case Against 
Static Files as Memory Substrates for Large Language Model Agent Systems. 
[Preprint/Conference]. DOI: [pending]
```

## Author

**John Williams**  
Senior Paid Media Specialist, Seer Interactive  
Founder, [googleadsagent.ai](https://googleadsagent.ai)  
[itallstartedwithaidea.com](https://www.itallstartedwithaidea.com)

## License

MIT
