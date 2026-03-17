#!/usr/bin/env python3
"""Calculate inter-rater reliability (Krippendorff's alpha) from the scoresheet CSV."""
import csv, sys, os
import numpy as np

def krippendorff_alpha(data, level="ordinal"):
    """Simplified Krippendorff's alpha for ordinal data.
    data: list of lists, where data[i][j] = rating by rater i for item j (or None if missing)
    """
    # Flatten to units
    units = {}  # unit_id -> list of values
    for rater_idx, ratings in enumerate(data):
        for unit_idx, val in enumerate(ratings):
            if val is not None:
                if unit_idx not in units:
                    units[unit_idx] = []
                units[unit_idx].append(val)
    
    # Only keep units with 2+ ratings
    units = {k: v for k, v in units.items() if len(v) >= 2}
    if not units:
        return None
    
    # Calculate observed disagreement
    n_total = sum(len(v) for v in units.values())
    
    # All values
    all_vals = []
    for v in units.values():
        all_vals.extend(v)
    
    # Observed disagreement (Do)
    Do = 0
    n_pairs = 0
    for vals in units.values():
        m = len(vals)
        if m < 2: continue
        for i in range(m):
            for j in range(i + 1, m):
                Do += (vals[i] - vals[j]) ** 2
                n_pairs += 1
    
    if n_pairs == 0: return 1.0
    Do /= n_pairs
    
    # Expected disagreement (De)
    De = 0
    n_e_pairs = 0
    for i in range(len(all_vals)):
        for j in range(i + 1, len(all_vals)):
            De += (all_vals[i] - all_vals[j]) ** 2
            n_e_pairs += 1
    
    if n_e_pairs == 0: return 1.0
    De /= n_e_pairs
    
    if De == 0: return 1.0
    alpha = 1 - Do / De
    return float(alpha)


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/interrater.py scoring/scoresheet_stage1.csv")
        sys.exit(1)
    
    filepath = sys.argv[1]
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        sys.exit(1)
    
    with open(filepath) as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    # Extract rater scores
    rater1 = []
    rater2 = []
    rater3 = []
    
    for row in rows:
        r1 = row.get("rater1_score", "").strip()
        r2 = row.get("rater2_score", "").strip()
        r3 = row.get("rater3_score", "").strip()
        
        rater1.append(int(r1) if r1 else None)
        rater2.append(int(r2) if r2 else None)
        rater3.append(int(r3) if r3 else None)
    
    # Check if any ratings exist
    filled = sum(1 for r in rater1 if r is not None)
    if filled == 0:
        print("No ratings found. Fill in rater1_score, rater2_score, rater3_score columns first.")
        sys.exit(1)
    
    data = [rater1, rater2, rater3]
    # Remove raters with no data
    data = [d for d in data if any(v is not None for v in d)]
    
    alpha = krippendorff_alpha(data)
    
    print(f"Inter-Rater Reliability Analysis")
    print(f"{'='*40}")
    print(f"Items scored: {len(rows)}")
    print(f"Raters with data: {len(data)}")
    print(f"Filled ratings: {sum(sum(1 for v in d if v is not None) for d in data)}")
    print(f"")
    print(f"Krippendorff's alpha: {alpha:.3f}")
    print(f"")
    
    if alpha is not None:
        if alpha >= 0.8: print("Interpretation: GOOD reliability (α ≥ 0.80)")
        elif alpha >= 0.67: print("Interpretation: ACCEPTABLE reliability (0.67 ≤ α < 0.80)")
        else: print("Interpretation: LOW reliability (α < 0.67). Consider re-calibrating raters.")
    
    # Per-rater means
    print(f"\nPer-Rater Means:")
    for i, d in enumerate(data):
        vals = [v for v in d if v is not None]
        if vals:
            print(f"  Rater {i+1}: mean={np.mean(vals):.2f}, n={len(vals)}")
    
    # Auto vs human comparison
    auto_scores = []
    human_means = []
    for idx, row in enumerate(rows):
        auto = float(row.get("auto_score", 0))
        humans = [data[r][idx] for r in range(len(data)) if data[r][idx] is not None]
        if humans:
            auto_scores.append(auto)
            human_means.append(np.mean(humans))
    
    if auto_scores and human_means:
        corr = np.corrcoef(auto_scores, human_means)[0, 1]
        print(f"\nAuto-score vs Human mean correlation: r={corr:.3f}")
        if corr > 0.7: print("  Element matching aligns well with human judgment.")
        else: print("  Significant divergence between automated and human scores.")

if __name__ == "__main__":
    main()
