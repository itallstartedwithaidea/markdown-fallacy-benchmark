// scripts/stage2_run.mjs — Stage 2: 4-condition retrieval benchmark
// Conditions: markdown (full dump), vector (ChromaDB), graph (Neo4j), hybrid
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { getAvailableModels, callModel, SYSTEM_PROMPT, DELAY_MS, getModelName } from './models.mjs';
import { scoreResponse } from './scorer.mjs';
import { QUERIES } from './queries.mjs';

const RUNS = 3;
const CORPUS_DIR = "corpus";
const TOP_K = 10; // chunks to retrieve for vector/hybrid

// ── CONDITION A: Full Markdown (concatenate all docs, truncate to ~100K chars) ──
function getMarkdownContext(query) {
  const docs = fs.readdirSync(CORPUS_DIR).filter(f => f.endsWith('.md')).sort();
  let full = docs.map(f => fs.readFileSync(path.join(CORPUS_DIR, f), 'utf-8')).join('\n\n---\n\n');
  // Truncate to ~100K chars (~25K tokens) to simulate context window limits
  if (full.length > 100000) full = full.substring(0, 100000) + "\n\n[TRUNCATED — document exceeds context limit]";
  return full;
}

// ── CONDITION B: Vector RAG (retrieve top-K chunks from ChromaDB) ──
function getVectorContext(query) {
  try {
    const result = execSync(
      `python3 -c "
import chromadb, json, sys
client = chromadb.PersistentClient(path='./chromadb_data')
col = client.get_collection('acme_corpus')
results = col.query(query_texts=['${query.q.replace(/'/g, "\\'")}'], n_results=${TOP_K})
chunks = results['documents'][0] if results['documents'] else []
sources = [m['source'] for m in results['metadatas'][0]] if results['metadatas'] else []
print(json.dumps({'chunks': chunks, 'sources': sources}))
"`,
      { encoding: 'utf-8', timeout: 15000 }
    );
    const data = JSON.parse(result.trim());
    return `RETRIEVED CONTEXT (${data.chunks.length} chunks from vector search):\n\n` +
      data.chunks.map((c, i) => `[Source: ${data.sources[i]}]\n${c}`).join('\n\n---\n\n');
  } catch (e) {
    console.log(`  ⚠ Vector retrieval failed: ${e.message}`);
    return "ERROR: Vector retrieval failed. Ensure ChromaDB is set up (python scripts/stage2_setup.py --vector)";
  }
}

// ── CONDITION C: GraphRAG (traverse Neo4j for relevant subgraph) ──
function getGraphContext(query) {
  try {
    const result = execSync(
      `python3 -c "
import json, os, re
from neo4j import GraphDatabase

uri = os.getenv('NEO4J_URI', 'bolt://localhost:7687')
driver = GraphDatabase.driver(uri, auth=(os.getenv('NEO4J_USER','neo4j'), os.getenv('NEO4J_PASSWORD','benchmark2026')))

query_text = '''${query.q.replace(/'/g, "\\'")}'''

# Extract potential entity names from the query
keywords = [w for w in re.findall(r'[A-Z][a-z]+(?:\\s[A-Z][a-z]+)*|[A-Z]{2,}|\\w+', query_text) if len(w) > 2]

with driver.session() as session:
    # Get all entities and their relationships (subgraph approach)
    result = session.run('''
        MATCH (n)-[r]->(m)
        RETURN n.name AS src, type(r) AS rel, m.name AS tgt,
               labels(n)[0] AS src_type, labels(m)[0] AS tgt_type,
               properties(n) AS src_props, properties(m) AS tgt_props,
               properties(r) AS rel_props
        LIMIT 200
    ''')
    
    triples = []
    entities = {}
    for record in result:
        src = record['src']
        tgt = record['tgt']
        rel = record['rel']
        
        # Store entity properties
        if src not in entities:
            entities[src] = {k:v for k,v in record['src_props'].items() if k != 'name'}
        if tgt not in entities:
            entities[tgt] = {k:v for k,v in record['tgt_props'].items() if k != 'name'}
        
        rel_info = record['rel']
        if record['rel_props']:
            props_str = ', '.join(f'{k}={v}' for k,v in record['rel_props'].items())
            rel_info += f' ({props_str})'
        triples.append(f'{src} --[{rel_info}]--> {tgt}')
    
    output = 'KNOWLEDGE GRAPH CONTEXT:\\n\\n'
    output += '=== ENTITIES ===\\n'
    for name, props in sorted(entities.items()):
        props_str = ', '.join(f'{k}={v}' for k,v in props.items())
        output += f'[{name}] {props_str}\\n'
    output += '\\n=== RELATIONSHIPS ===\\n'
    for t in sorted(set(triples)):
        output += t + '\\n'
    
    print(json.dumps({'context': output, 'entities': len(entities), 'triples': len(set(triples))}))

driver.close()
"`,
      { encoding: 'utf-8', timeout: 15000 }
    );
    const data = JSON.parse(result.trim());
    return data.context;
  } catch (e) {
    console.log(`  ⚠ Graph retrieval failed: ${e.message}`);
    return "ERROR: Graph retrieval failed. Ensure Neo4j is running (docker compose up -d) and indexed (python scripts/stage2_setup.py --graph)";
  }
}

// ── CONDITION D: Hybrid (Vector chunks + Graph subgraph) ──
function getHybridContext(query) {
  const vectorCtx = getVectorContext(query);
  const graphCtx = getGraphContext(query);
  return `${graphCtx}\n\n=== SUPPORTING TEXT ===\n\n${vectorCtx}`;
}

const CONDITIONS = [
  { key: "markdown", getContext: getMarkdownContext },
  { key: "vector", getContext: getVectorContext },
  { key: "graph", getContext: getGraphContext },
  { key: "hybrid", getContext: getHybridContext },
];

async function main() {
  const models = getAvailableModels();
  if (!models.length) { console.error("No API keys. Set in .env"); process.exit(1); }

  // Check corpus exists
  if (!fs.existsSync(CORPUS_DIR) || fs.readdirSync(CORPUS_DIR).filter(f=>f.endsWith('.md')).length === 0) {
    console.log("Corpus not found. Generating..."); 
    execSync("node scripts/generate_corpus.mjs", { stdio: "inherit" });
  }

  const totalCalls = QUERIES.length * CONDITIONS.length * models.length * RUNS;
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║  STAGE 2: 4-CONDITION RETRIEVAL BENCHMARK               ║");
  console.log(`║  ${QUERIES.length} queries × ${CONDITIONS.length} conditions × ${models.length} models × ${RUNS} runs = ${totalCalls} calls  ║`);
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  const results = [];
  let callNum = 0;

  for (let run = 1; run <= RUNS; run++) {
    console.log(`\n━━━ Run ${run}/${RUNS} ━━━\n`);
    for (const model of models) {
      for (const cond of CONDITIONS) {
        for (const query of QUERIES) {
          callNum++;
          process.stdout.write(`  [${callNum}/${totalCalls}] ${query.id} | ${model} | ${cond.key}... `);
          
          const context = cond.getContext(query);
          const response = await callModel(model, SYSTEM_PROMPT, `CONTEXT:\n${context}\n\nQUESTION: ${query.q}`);
          const score = scoreResponse(query, response);
          
          results.push({
            run, model, condition: cond.key, query_id: query.id, level: query.level,
            score: score.score, matches: score.matches, misses: score.misses,
            context_length: context.length, response_length: response.length,
            response_preview: response.substring(0, 200),
          });

          console.log(`${score.score.toFixed(2)} (${score.matches.length}/${score.total_elements})`);
          await new Promise(r => setTimeout(r, DELAY_MS));
        }
      }
    }
  }

  // Save
  fs.mkdirSync("results", { recursive: true });
  const output = {
    metadata: {
      experiment: "Stage 2: 4-Condition Retrieval Benchmark",
      date: new Date().toISOString(),
      models: models.map(m => getModelName(m)),
      queries: QUERIES.length, conditions: CONDITIONS.map(c => c.key),
      runs: RUNS, total_data_points: results.length,
    },
    raw: results,
  };
  fs.writeFileSync("results/stage2_results.json", JSON.stringify(output, null, 2));
  console.log("\n✅ Results saved to results/stage2_results.json");
  console.log("Run: python scripts/analyze.py --stage2 for analysis");
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });
