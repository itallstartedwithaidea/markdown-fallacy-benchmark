#!/usr/bin/env python3
"""Statistical analysis for the Markdown Fallacy benchmark.
Produces tables and figures for the IEEE paper.

Usage:
  python scripts/analyze.py              # analyze Stage 1
  python scripts/analyze.py --stage2     # analyze Stage 2
  python scripts/analyze.py --all        # both
"""

import json, sys, os, argparse
import numpy as np

def load_results(filepath):
    with open(filepath) as f:
        return json.load(f)

def basic_stats(scores):
    arr = np.array(scores)
    return {"n": len(arr), "mean": float(np.mean(arr)), "sd": float(np.std(arr)),
            "median": float(np.median(arr)), "min": float(np.min(arr)), "max": float(np.max(arr))}

def paired_ttest(a, b):
    """Manual paired t-test (avoids scipy dependency if not installed)"""
    a, b = np.array(a), np.array(b)
    diff = a - b
    n = len(diff)
    mean_diff = np.mean(diff)
    se_diff = np.std(diff, ddof=1) / np.sqrt(n)
    if se_diff == 0: return 0.0, 1.0
    t_stat = mean_diff / se_diff
    # Approximate p-value using normal distribution for large n
    from math import erfc, sqrt
    p_value = erfc(abs(t_stat) / sqrt(2))
    return float(t_stat), float(p_value)

def analyze_stage1(data):
    raw = data["raw"]
    conditions = ["markdown", "structured"]
    levels = [1, 2, 3]
    
    output = []
    output.append("=" * 70)
    output.append("STAGE 1 ANALYSIS: MARKDOWN vs STRUCTURED CONTEXT")
    output.append("=" * 70)
    output.append(f"Total data points: {len(raw)}")
    output.append(f"Models: {data['metadata']['models']}")
    output.append(f"Runs: {data['metadata']['runs']}")
    output.append("")
    
    # ── TABLE V: By Level ──
    output.append("TABLE V: LLM Accuracy by Query Complexity and Context Condition")
    output.append("-" * 70)
    output.append(f"{'Level':<8} {'Markdown (mean±sd)':<22} {'Structured (mean±sd)':<22} {'Delta':<8} {'t':<8} {'p':<8}")
    output.append("-" * 70)
    
    for level in levels:
        md_scores = [r["score"] for r in raw if r["level"] == level and r["condition"] == "markdown"]
        st_scores = [r["score"] for r in raw if r["level"] == level and r["condition"] == "structured"]
        md = basic_stats(md_scores)
        st = basic_stats(st_scores)
        
        # Paired t-test (pair by query_id × model × run)
        md_by_query = {}
        st_by_query = {}
        for r in raw:
            if r["level"] == level:
                key = f"{r['query_id']}_{r['model']}_{r['run']}"
                if r["condition"] == "markdown": md_by_query[key] = r["score"]
                else: st_by_query[key] = r["score"]
        
        common_keys = sorted(set(md_by_query) & set(st_by_query))
        if len(common_keys) >= 3:
            paired_md = [md_by_query[k] for k in common_keys]
            paired_st = [st_by_query[k] for k in common_keys]
            t_stat, p_val = paired_ttest(paired_st, paired_md)
        else:
            t_stat, p_val = 0, 1
        
        delta = st["mean"] - md["mean"]
        sig = "*" if p_val < 0.05 else ("**" if p_val < 0.01 else "")
        output.append(f"L{level:<7} {md['mean']:.3f} ± {md['sd']:.3f}           {st['mean']:.3f} ± {st['sd']:.3f}           {delta:+.3f}   {t_stat:.2f}    {p_val:.4f} {sig}")
    
    # Overall
    md_all = [r["score"] for r in raw if r["condition"] == "markdown"]
    st_all = [r["score"] for r in raw if r["condition"] == "structured"]
    md_s = basic_stats(md_all)
    st_s = basic_stats(st_all)
    output.append("-" * 70)
    output.append(f"{'ALL':<8} {md_s['mean']:.3f} ± {md_s['sd']:.3f}           {st_s['mean']:.3f} ± {st_s['sd']:.3f}           {st_s['mean']-md_s['mean']:+.3f}")
    output.append("")
    output.append("* p < .05, ** p < .01")
    output.append("")
    
    # ── By Model ──
    output.append("TABLE VI: Results by Model")
    output.append("-" * 50)
    models = list(set(r["model"] for r in raw))
    for model in sorted(models):
        md_m = [r["score"] for r in raw if r["model"] == model and r["condition"] == "markdown"]
        st_m = [r["score"] for r in raw if r["model"] == model and r["condition"] == "structured"]
        if md_m and st_m:
            output.append(f"  {model}: md={np.mean(md_m):.3f} st={np.mean(st_m):.3f} Δ={np.mean(st_m)-np.mean(md_m):+.3f}")
    output.append("")
    
    # ── Most Missed Elements (L3, Markdown) ──
    output.append("MOST MISSED ELEMENTS (L3, Markdown condition):")
    output.append("-" * 50)
    misses = {}
    for r in raw:
        if r["level"] == 3 and r["condition"] == "markdown":
            for m in r.get("misses", []):
                misses[m] = misses.get(m, 0) + 1
    for elem, count in sorted(misses.items(), key=lambda x: -x[1])[:15]:
        output.append(f"  \"{elem}\" — missed {count} times")
    
    return "\n".join(output)


def analyze_stage2(data):
    raw = data["raw"]
    conditions = ["markdown", "vector", "graph", "hybrid"]
    levels = [1, 2, 3]
    
    output = []
    output.append("=" * 80)
    output.append("STAGE 2 ANALYSIS: 4-CONDITION RETRIEVAL BENCHMARK")
    output.append("=" * 80)
    output.append(f"Total data points: {len(raw)}")
    output.append("")
    
    # ── Main Results Table ──
    output.append("TABLE VII: Accuracy by Condition and Complexity Level")
    output.append("-" * 80)
    header = f"{'Level':<8}"
    for c in conditions:
        header += f" {c:<18}"
    output.append(header)
    output.append("-" * 80)
    
    for level in levels:
        row = f"L{level:<7}"
        for cond in conditions:
            scores = [r["score"] for r in raw if r["level"] == level and r["condition"] == cond]
            if scores:
                row += f" {np.mean(scores):.3f} ± {np.std(scores):.3f}     "
            else:
                row += f" {'N/A':<18}"
        output.append(row)
    
    # Overall row
    row = f"{'ALL':<8}"
    for cond in conditions:
        scores = [r["score"] for r in raw if r["condition"] == cond]
        if scores:
            row += f" {np.mean(scores):.3f} ± {np.std(scores):.3f}     "
        else:
            row += f" {'N/A':<18}"
    output.append(row)
    output.append("")
    
    # ── ANOVA (if scipy available) ──
    try:
        from scipy.stats import f_oneway, kruskal
        output.append("ONE-WAY ANOVA BY CONDITION:")
        output.append("-" * 50)
        for level in levels:
            groups = []
            for cond in conditions:
                scores = [r["score"] for r in raw if r["level"] == level and r["condition"] == cond]
                if scores: groups.append(scores)
            if len(groups) >= 2:
                f_stat, p_val = f_oneway(*groups)
                output.append(f"  Level {level}: F={f_stat:.3f}, p={p_val:.4f} {'***' if p_val<0.001 else '**' if p_val<0.01 else '*' if p_val<0.05 else ''}")
        output.append("")
        
        # Tukey HSD
        try:
            from statsmodels.stats.multicomp import pairwise_tukeyhsd
            import pandas as pd
            output.append("TUKEY HSD PAIRWISE COMPARISONS (L3 only):")
            output.append("-" * 60)
            l3_data = [(r["score"], r["condition"]) for r in raw if r["level"] == 3]
            if l3_data:
                scores = [d[0] for d in l3_data]
                groups = [d[1] for d in l3_data]
                tukey = pairwise_tukeyhsd(scores, groups)
                output.append(str(tukey))
        except ImportError:
            output.append("(Install statsmodels for Tukey HSD: pip install statsmodels)")
    except ImportError:
        output.append("(Install scipy for ANOVA: pip install scipy)")
    
    # ── Context Length Analysis ──
    output.append("")
    output.append("CONTEXT LENGTH BY CONDITION (chars):")
    output.append("-" * 50)
    for cond in conditions:
        lengths = [r.get("context_length", 0) for r in raw if r["condition"] == cond]
        if lengths:
            output.append(f"  {cond}: mean={np.mean(lengths):.0f}, max={np.max(lengths):.0f}")
    
    return "\n".join(output)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--stage2", action="store_true")
    parser.add_argument("--all", action="store_true")
    args = parser.parse_args()
    
    os.makedirs("results", exist_ok=True)
    output_parts = []
    
    if not args.stage2 or args.all:
        if os.path.exists("results/stage1_results.json"):
            data = load_results("results/stage1_results.json")
            result = analyze_stage1(data)
            output_parts.append(result)
            print(result)
        else:
            print("No Stage 1 results found. Run: node scripts/stage1_run.mjs")
    
    if args.stage2 or args.all:
        if os.path.exists("results/stage2_results.json"):
            data = load_results("results/stage2_results.json")
            result = analyze_stage2(data)
            output_parts.append(result)
            print(result)
        else:
            print("No Stage 2 results found. Run: node scripts/stage2_run.mjs")
    
    if output_parts:
        with open("results/analysis_tables.txt", "w") as f:
            f.write("\n\n".join(output_parts))
        print(f"\n✅ Analysis saved to results/analysis_tables.txt")
        print("Copy the tables into Section IV of the paper.")

if __name__ == "__main__":
    main()
