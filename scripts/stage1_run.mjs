// scripts/stage1_run.mjs — Stage 1: Markdown vs Structured (in-context)
// 50 queries × 2 conditions × N models × 3 runs
import fs from 'fs';
import { getAvailableModels, callModel, SYSTEM_PROMPT, DELAY_MS, getModelName } from './models.mjs';
import { scoreResponse } from './scorer.mjs';
import { QUERIES } from './queries.mjs';
import { MARKDOWN_FULL, STRUCTURED_CONTEXT } from './contexts.mjs';

const RUNS = 3;
const CONDITIONS = [
  { key: "markdown", context: MARKDOWN_FULL },
  { key: "structured", context: STRUCTURED_CONTEXT },
];

async function main() {
  const models = getAvailableModels();
  if (models.length === 0) {
    console.error("No API keys found. Set ANTHROPIC_API_KEY, OPENAI_API_KEY, or GOOGLE_API_KEY in .env");
    process.exit(1);
  }

  const totalCalls = QUERIES.length * CONDITIONS.length * models.length * RUNS;
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║  STAGE 1: MARKDOWN vs STRUCTURED CONTEXT BENCHMARK      ║");
  console.log(`║  ${QUERIES.length} queries × ${CONDITIONS.length} conditions × ${models.length} models × ${RUNS} runs = ${totalCalls} calls  ║`);
  console.log("╚══════════════════════════════════════════════════════════╝\n");
  console.log(`Models: ${models.map(m => getModelName(m)).join(", ")}`);
  console.log(`L1: ${QUERIES.filter(q=>q.level===1).length} queries | L2: ${QUERIES.filter(q=>q.level===2).length} queries | L3: ${QUERIES.filter(q=>q.level===3).length} queries\n`);

  const results = [];
  let callNum = 0;

  for (let run = 1; run <= RUNS; run++) {
    console.log(`\n━━━ Run ${run}/${RUNS} ━━━\n`);
    for (const model of models) {
      for (const cond of CONDITIONS) {
        for (const query of QUERIES) {
          callNum++;
          process.stdout.write(`  [${callNum}/${totalCalls}] ${query.id} | ${model} | ${cond.key}... `);
          
          const response = await callModel(model, SYSTEM_PROMPT, `CONTEXT:\n${cond.context}\n\nQUESTION: ${query.q}`);
          const score = scoreResponse(query, response);
          
          results.push({
            run, model, condition: cond.key, query_id: query.id, level: query.level,
            score: score.score, matches: score.matches, misses: score.misses,
            response_length: response.length, response_preview: response.substring(0, 200),
          });

          console.log(`${score.score.toFixed(2)} (${score.matches.length}/${score.total_elements} elements)`);
          await new Promise(r => setTimeout(r, DELAY_MS));
        }
      }
    }
  }

  // ── ANALYSIS ──
  const analysis = analyze(results, models);
  
  const output = {
    metadata: {
      experiment: "Stage 1: Markdown vs Structured Context",
      date: new Date().toISOString(),
      models: models.map(m => getModelName(m)),
      queries: QUERIES.length,
      conditions: CONDITIONS.map(c => c.key),
      runs: RUNS,
      total_data_points: results.length,
    },
    analysis,
    raw: results,
  };

  fs.mkdirSync("results", { recursive: true });
  fs.writeFileSync("results/stage1_results.json", JSON.stringify(output, null, 2));
  console.log("\n✅ Results saved to results/stage1_results.json");
  printAnalysis(analysis);
}

function analyze(results, models) {
  const a = { by_level: {}, by_model: {}, overall: {} };
  
  for (const level of [1, 2, 3]) {
    a.by_level[level] = {};
    for (const cond of ["markdown", "structured"]) {
      const scores = results.filter(r => r.level === level && r.condition === cond).map(r => r.score);
      const mean = scores.reduce((s, v) => s + v, 0) / scores.length;
      const sd = Math.sqrt(scores.reduce((s, v) => s + (v - mean) ** 2, 0) / scores.length);
      a.by_level[level][cond] = { n: scores.length, mean: +mean.toFixed(4), sd: +sd.toFixed(4) };
    }
    a.by_level[level].delta = +(a.by_level[level].structured.mean - a.by_level[level].markdown.mean).toFixed(4);
  }

  for (const model of models) {
    a.by_model[model] = {};
    for (const cond of ["markdown", "structured"]) {
      const scores = results.filter(r => r.model === model && r.condition === cond).map(r => r.score);
      const mean = scores.reduce((s, v) => s + v, 0) / scores.length;
      a.by_model[model][cond] = { mean: +mean.toFixed(4), n: scores.length };
    }
    a.by_model[model].delta = +(a.by_model[model].structured.mean - a.by_model[model].markdown.mean).toFixed(4);
  }

  for (const cond of ["markdown", "structured"]) {
    const scores = results.filter(r => r.condition === cond).map(r => r.score);
    const mean = scores.reduce((s, v) => s + v, 0) / scores.length;
    const sd = Math.sqrt(scores.reduce((s, v) => s + (v - mean) ** 2, 0) / scores.length);
    a.overall[cond] = { n: scores.length, mean: +mean.toFixed(4), sd: +sd.toFixed(4) };
  }
  a.overall.delta = +(a.overall.structured.mean - a.overall.markdown.mean).toFixed(4);

  // Most-missed elements across L3 markdown condition
  const l3MdMisses = {};
  results.filter(r => r.level === 3 && r.condition === "markdown").forEach(r => {
    r.misses.forEach(m => { l3MdMisses[m] = (l3MdMisses[m] || 0) + 1; });
  });
  a.l3_markdown_most_missed = Object.entries(l3MdMisses).sort((a, b) => b[1] - a[1]).slice(0, 15);

  return a;
}

function printAnalysis(a) {
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║                    RESULTS SUMMARY                       ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");
  
  console.log("BY LEVEL:");
  console.log("Level | Markdown (mean±sd)  | Structured (mean±sd) | Delta");
  console.log("------|---------------------|----------------------|-------");
  for (const lv of [1, 2, 3]) {
    const md = a.by_level[lv].markdown;
    const st = a.by_level[lv].structured;
    const d = a.by_level[lv].delta;
    console.log(`  L${lv}  | ${md.mean.toFixed(3)} ± ${md.sd.toFixed(3)}         | ${st.mean.toFixed(3)} ± ${st.sd.toFixed(3)}          | ${d >= 0 ? "+" : ""}${d.toFixed(3)}`);
  }
  const ov = a.overall;
  console.log(`  ALL | ${ov.markdown.mean.toFixed(3)} ± ${ov.markdown.sd.toFixed(3)}         | ${ov.structured.mean.toFixed(3)} ± ${ov.structured.sd.toFixed(3)}          | ${ov.delta >= 0 ? "+" : ""}${ov.delta.toFixed(3)}`);

  console.log("\nBY MODEL:");
  for (const [model, data] of Object.entries(a.by_model)) {
    console.log(`  ${model}: md=${data.markdown.mean.toFixed(3)} st=${data.structured.mean.toFixed(3)} Δ=${data.delta >= 0 ? "+" : ""}${data.delta.toFixed(3)}`);
  }

  if (a.l3_markdown_most_missed?.length) {
    console.log("\nL3 ELEMENTS MOST MISSED BY MARKDOWN:");
    for (const [elem, count] of a.l3_markdown_most_missed.slice(0, 10)) {
      console.log(`  "${elem}" — missed ${count} times`);
    }
  }
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });
