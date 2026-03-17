#!/usr/bin/env python3
"""Stage 2 Setup: Index corpus into ChromaDB (vector) and Neo4j (graph)"""

import os, sys, glob, json, re, argparse

CORPUS_DIR = "corpus"

def setup_vector():
    """Chunk corpus documents and index into ChromaDB"""
    try:
        import chromadb
        from sentence_transformers import SentenceTransformer
    except ImportError:
        print("Install: pip install chromadb sentence-transformers")
        sys.exit(1)
    
    print("Setting up ChromaDB vector store...")
    client = chromadb.PersistentClient(path="./chromadb_data")
    
    # Delete if exists
    try: client.delete_collection("acme_corpus")
    except: pass
    
    model = SentenceTransformer('all-MiniLM-L6-v2')
    collection = client.create_collection(
        name="acme_corpus",
        metadata={"hnsw:space": "cosine"}
    )
    
    docs = sorted(glob.glob(os.path.join(CORPUS_DIR, "*.md")))
    if not docs:
        print(f"No docs in {CORPUS_DIR}/. Run: node scripts/generate_corpus.mjs")
        sys.exit(1)
    
    all_chunks = []
    all_ids = []
    all_meta = []
    
    for doc_path in docs:
        filename = os.path.basename(doc_path)
        text = open(doc_path).read()
        
        # Chunk by paragraphs, keeping chunks ~300-500 chars
        paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
        current_chunk = ""
        chunk_idx = 0
        
        for para in paragraphs:
            if len(current_chunk) + len(para) < 500:
                current_chunk += "\n\n" + para if current_chunk else para
            else:
                if current_chunk:
                    chunk_id = f"{filename}::chunk_{chunk_idx}"
                    all_chunks.append(current_chunk)
                    all_ids.append(chunk_id)
                    all_meta.append({"source": filename, "chunk_idx": chunk_idx})
                    chunk_idx += 1
                current_chunk = para
        
        if current_chunk:
            all_chunks.append(current_chunk)
            all_ids.append(f"{filename}::chunk_{chunk_idx}")
            all_meta.append({"source": filename, "chunk_idx": chunk_idx})
    
    # Embed and store
    print(f"Embedding {len(all_chunks)} chunks...")
    embeddings = model.encode(all_chunks).tolist()
    
    # ChromaDB has batch limits, add in batches of 100
    batch_size = 100
    for i in range(0, len(all_chunks), batch_size):
        collection.add(
            ids=all_ids[i:i+batch_size],
            documents=all_chunks[i:i+batch_size],
            embeddings=embeddings[i:i+batch_size],
            metadatas=all_meta[i:i+batch_size],
        )
    
    print(f"✅ Indexed {len(all_chunks)} chunks from {len(docs)} docs into ChromaDB")
    return collection


def setup_graph():
    """Extract entities/relationships and index into Neo4j"""
    try:
        from neo4j import GraphDatabase
    except ImportError:
        print("Install: pip install neo4j")
        sys.exit(1)
    
    uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
    user = os.getenv("NEO4J_USER", "neo4j")
    password = os.getenv("NEO4J_PASSWORD", "benchmark2026")
    
    print(f"Connecting to Neo4j at {uri}...")
    driver = GraphDatabase.driver(uri, auth=(user, password))
    
    with driver.session() as session:
        # Clear existing data
        session.run("MATCH (n) DETACH DELETE n")
        
        # ── ENTITIES ──
        entities = [
            ("MCC", {"name": "Acme Corp", "id": "100-200-3000", "monthly_budget": 75000}),
            ("Account", {"name": "Acme Widgets", "id": "111-222-3333", "monthly_budget": 25000, "opt_pref": "ROAS", "risk": "moderate"}),
            ("Account", {"name": "Acme Services", "id": "444-555-6666", "monthly_budget": 15000, "opt_pref": "CPA", "cpa_target": 85, "risk": "low"}),
            ("Account", {"name": "Acme Enterprise", "id": "777-888-9999", "monthly_budget": 35000, "opt_pref": "pipeline_value", "risk": "high"}),
            ("Person", {"name": "Sarah Chen", "role": "Account Manager", "tenure_start": "2024-03"}),
            ("Person", {"name": "Marcus Webb", "role": "Account Manager", "tenure_start": "2026-01", "context_gap": True}),
            ("Person", {"name": "David Park", "role": "Former Manager", "departed": "2024-02", "knowledge_lost": "seasonal_history"}),
            ("Campaign", {"name": "W-Brand Search", "type": "Search", "budget": 200, "roas": 6.2, "conv_rate": 4.8, "imp_share": 92}),
            ("Campaign", {"name": "W-NonBrand Search", "type": "Search", "budget": 180, "roas": 3.8, "conv_rate": 2.1}),
            ("Campaign", {"name": "W-Shopping", "type": "Shopping", "budget": 150, "roas": 4.5, "conv_rate": 3.2}),
            ("Campaign", {"name": "W-PMax", "type": "PMax", "budget": 120, "roas": 2.9, "conv_rate": 1.8}),
            ("Campaign", {"name": "W-Holiday Q4", "type": "PMax", "budget_base": 100, "budget_peak": 300, "roas_ramp": 1.4, "roas_peak": 3.2}),
            ("Campaign", {"name": "S-Brand Search", "type": "Search", "budget": 100, "cpa": 32, "conv_rate": 8.1}),
            ("Campaign", {"name": "S-NonBrand Search", "type": "Search", "budget": 150, "cpa": 95, "conv_rate": 1.2, "above_target": True}),
            ("Campaign", {"name": "S-LinkedIn", "type": "DemandGen", "budget": 80, "cpa": 110, "conv_rate": 0.8, "test_until": "2026-06"}),
            ("Campaign", {"name": "S-Retargeting", "type": "Display", "budget": 70, "cpa": 45, "conv_rate": 3.5, "window": 30}),
            ("Campaign", {"name": "S-YouTube", "type": "Video", "budget": 100, "view_rate": 28, "goal": "awareness"}),
            ("Campaign", {"name": "E-Brand Search", "type": "Search", "budget": 250, "pipeline_value": 12000, "conv_rate": 6.5}),
            ("Campaign", {"name": "E-Conquest", "type": "Search", "budget": 200, "pipeline_value": 8500, "conv_rate": 1.9, "avg_cpc": 45}),
            ("Campaign", {"name": "E-ABM Display", "type": "Display", "budget": 300, "pipeline_value": 15000, "conv_rate": 0.4}),
            ("Campaign", {"name": "E-Content Synd", "type": "PMax", "budget": 200, "pipeline_value": 6000, "conv_rate": 0.9}),
            ("Campaign", {"name": "E-Retargeting", "type": "Display", "budget": 150, "pipeline_value": 10000, "conv_rate": 2.8, "window": 60}),
            ("BudgetPool", {"name": "Pool Alpha", "ceiling": 350}),
            ("BudgetPool", {"name": "Pool Beta", "ceiling": 170}),
        ]
        
        for label, props in entities:
            props_str = ", ".join(f'{k}: ${k}' for k in props)
            session.run(f"CREATE (n:{label} {{{props_str}}})", props)
        
        # ── RELATIONSHIPS ──
        rels = [
            ("Acme Corp", "OWNS", "Acme Widgets"),
            ("Acme Corp", "OWNS", "Acme Services"),
            ("Acme Corp", "OWNS", "Acme Enterprise"),
            ("Sarah Chen", "MANAGES", "Acme Widgets"),
            ("Sarah Chen", "MANAGES", "Acme Services"),
            ("Sarah Chen", "PREVIOUSLY_MANAGED", "Acme Enterprise"),
            ("Marcus Webb", "MANAGES", "Acme Enterprise"),
            ("Marcus Webb", "LACKS_CONTEXT_FROM", "Sarah Chen"),
            ("David Park", "PREVIOUSLY_MANAGED", "Acme Widgets"),
        ]
        
        # Campaign-Account relationships
        widget_campaigns = ["W-Brand Search", "W-NonBrand Search", "W-Shopping", "W-PMax", "W-Holiday Q4"]
        service_campaigns = ["S-Brand Search", "S-NonBrand Search", "S-LinkedIn", "S-Retargeting", "S-YouTube"]
        enterprise_campaigns = ["E-Brand Search", "E-Conquest", "E-ABM Display", "E-Content Synd", "E-Retargeting"]
        
        for c in widget_campaigns: rels.append(("Acme Widgets", "CONTAINS", c))
        for c in service_campaigns: rels.append(("Acme Services", "CONTAINS", c))
        for c in enterprise_campaigns: rels.append(("Acme Enterprise", "CONTAINS", c))
        
        # Pool relationships
        rels.extend([
            ("W-Brand Search", "IN_POOL", "Pool Alpha"),
            ("W-Shopping", "IN_POOL", "Pool Alpha"),
            ("S-Brand Search", "IN_POOL", "Pool Beta"),
            ("S-Retargeting", "IN_POOL", "Pool Beta"),
        ])
        
        for src, rel, tgt in rels:
            session.run(
                f"MATCH (a {{name: $src}}), (b {{name: $tgt}}) CREATE (a)-[:{rel}]->(b)",
                {"src": src, "tgt": tgt}
            )
        
        # ── TYPED RELATIONSHIPS WITH PROPERTIES ──
        typed_rels = [
            ("W-PMax", "CANNIBALIZES", "W-Shopping", {"overlap_pct": 30}),
            ("W-Holiday Q4", "COMPETES_FOR_BUDGET_Q4", "W-Brand Search", {}),
            ("W-Holiday Q4", "COMPETES_FOR_BUDGET_Q4", "W-Shopping", {}),
            ("S-YouTube", "ASSISTS_CONVERSIONS", "S-Brand Search", {"mechanism": "upper_funnel"}),
            ("S-Retargeting", "AUDIENCE_OVERLAPS", "W-PMax", {"overlap_pct": 15}),
            ("E-Content Synd", "AUDIENCE_OVERLAPS", "E-ABM Display", {"overlap_pct": 25}),
            ("E-Retargeting", "CROSS_SELLS_TO", "S-Retargeting", {"overlap_pct": 20}),
            ("E-ABM Display", "COMPETES_FOR_ACCOUNTS", "E-Retargeting", {"mechanism": "informal"}),
        ]
        
        for src, rel, tgt, props in typed_rels:
            props_str = ", ".join(f'{k}: ${k}' for k in props) if props else ""
            create_clause = f"CREATE (a)-[r:{rel} {{{props_str}}}]->(b)" if props else f"CREATE (a)-[:{rel}]->(b)"
            session.run(
                f"MATCH (a {{name: $src}}), (b {{name: $tgt}}) {create_clause}",
                {"src": src, "tgt": tgt, **props}
            )
        
        # Verify
        result = session.run("MATCH (n) RETURN count(n) AS nodes")
        nodes = result.single()["nodes"]
        result = session.run("MATCH ()-[r]->() RETURN count(r) AS rels")
        rels_count = result.single()["rels"]
        
        print(f"✅ Created {nodes} nodes and {rels_count} relationships in Neo4j")
    
    driver.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--vector", action="store_true", help="Setup ChromaDB")
    parser.add_argument("--graph", action="store_true", help="Setup Neo4j")
    parser.add_argument("--all", action="store_true", help="Setup both")
    args = parser.parse_args()
    
    if args.all or args.vector:
        setup_vector()
    if args.all or args.graph:
        setup_graph()
    if not (args.all or args.vector or args.graph):
        print("Usage: python stage2_setup.py --vector | --graph | --all")

if __name__ == "__main__":
    main()
