#!/usr/bin/env python3
"""Export Level 3 responses for human scoring. Creates a CSV that raters fill in."""
import json, csv, os, sys

def export(stage="stage1"):
    filepath = f"results/{stage}_results.json"
    if not os.path.exists(filepath):
        print(f"No results at {filepath}. Run the benchmark first.")
        sys.exit(1)
    
    data = json.load(open(filepath))
    raw = data["raw"]
    
    # Filter to L3, first run only (raters score one run; automated scores cover all)
    l3 = [r for r in raw if r["level"] == 3 and r["run"] == 1]
    
    if not l3:
        print("No Level 3 results found in the data.")
        sys.exit(1)
    
    outpath = f"scoring/scoresheet_{stage}.csv"
    os.makedirs("scoring", exist_ok=True)
    
    with open(outpath, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([
            "query_id", "model", "condition", "question", "required_elements",
            "response", "auto_score", "auto_matches", "auto_misses",
            "rater1_score", "rater1_notes", "rater2_score", "rater2_notes", "rater3_score", "rater3_notes"
        ])
        
        for r in l3:
            writer.writerow([
                r["query_id"], r["model"], r["condition"],
                "",  # question - fill from queries.mjs
                "",  # required_elements - fill from queries.mjs
                r.get("response_preview", "")[:500],
                r["score"],
                "; ".join(r.get("matches", [])),
                "; ".join(r.get("misses", [])),
                "", "", "", "", "", ""  # rater columns (to be filled)
            ])
    
    print(f"✅ Exported {len(l3)} L3 responses to {outpath}")
    print(f"Give this CSV + scoring/rubric.md to your 3 raters.")
    print(f"Raters fill in rater1_score, rater2_score, rater3_score (0-3).")
    print(f"Then run: python scripts/interrater.py {outpath}")

if __name__ == "__main__":
    stage = sys.argv[1] if len(sys.argv) > 1 else "stage1"
    export(stage)
