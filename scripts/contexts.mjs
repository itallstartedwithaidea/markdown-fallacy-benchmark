// scripts/contexts.mjs — Stage 1 context blobs

export const MARKDOWN_FULL = `# Acme Corp MCC — Google Ads Account Portfolio

## Account Structure
Acme Corp operates a Manager Account (MCC ID: 100-200-3000) overseeing three sub-accounts.

### Acme Widgets (Account ID: 111-222-3333)
- Industry: E-commerce / Consumer Products
- Monthly Budget: $25,000
- Account Manager: Sarah Chen (since March 2024)
- Previous Manager: David Park (Jan 2023 - Feb 2024, departed for competitor)
- Optimization Preference: ROAS over CPA
- Client Risk Tolerance: Moderate (will accept 2-week test periods)

#### Campaign: Widgets - Brand Search
- Type: Search
- Daily Budget: $200
- ROAS: 6.2 (Last 30 days)
- Conv. Rate: 4.8%
- Impression Share: 92%
- Notes: Flagship campaign. Brand terms only. Highest ROAS but limited scale.

#### Campaign: Widgets - Non-Brand Search  
- Type: Search
- Daily Budget: $180
- ROAS: 3.8
- Conv. Rate: 2.1%
- Notes: Generic product terms. Growth driver. Recently expanded to 3 new ad groups.

#### Campaign: Widgets - Shopping Standard
- Type: Shopping
- Daily Budget: $150
- ROAS: 4.5
- Conv. Rate: 3.2%
- Notes: Product feed campaign. Competes with PMax for same products.

#### Campaign: Widgets - Performance Max
- Type: Performance Max
- Daily Budget: $120
- ROAS: 2.9
- Conv. Rate: 1.8%
- Notes: Cannibalizes Shopping Standard conversions. Asset groups need refresh. Client wants to keep for reach.

#### Campaign: Widgets - Holiday Q4
- Type: Performance Max
- Daily Budget: $100 (ramps to $300 in Oct-Dec)
- ROAS: 1.4 (ramp period), 3.2 (peak Q4)
- Notes: Seasonal. Competes with all other campaigns for budget during ramp.

### Acme Services (Account ID: 444-555-6666)
- Industry: B2B Professional Services
- Monthly Budget: $15,000
- Account Manager: Sarah Chen (since March 2024)
- Optimization Preference: CPA (target $85)
- Client Risk Tolerance: Low (requires approval for changes >10% of budget)

#### Campaign: Services - Brand Search
- Type: Search
- Daily Budget: $100
- CPA: $32
- Conv. Rate: 8.1%
- Notes: Defensive. Competitor conquesting has increased 40% YoY.

#### Campaign: Services - Non-Brand Search
- Type: Search
- Daily Budget: $150
- CPA: $95 (above target)
- Conv. Rate: 1.2%
- Notes: High-intent commercial terms. CPA above target due to increased competition in Q1 2026.

#### Campaign: Services - LinkedIn Integration
- Type: Demand Gen
- Daily Budget: $80
- CPA: $110
- Conv. Rate: 0.8%
- Notes: Experimental. Targets LinkedIn audience segments imported via Customer Match. 6-month test approved through June 2026.

#### Campaign: Services - Retargeting
- Type: Display
- Daily Budget: $70
- CPA: $45
- Conv. Rate: 3.5%
- Notes: Site visitor retargeting. 30-day window. Audience overlaps with Widgets retargeting by approximately 15%.

#### Campaign: Services - YouTube Awareness
- Type: Video
- Daily Budget: $100
- CPA: N/A (awareness goal, measured by view rate)
- View Rate: 28%
- Notes: Upper funnel. No direct conversion attribution. Assisted conversion analysis shows influence on Brand Search.

### Acme Enterprise (Account ID: 777-888-9999)
- Industry: Enterprise SaaS
- Monthly Budget: $35,000
- Account Manager: Marcus Webb (since January 2026)
- Previous Manager: Sarah Chen (managed all three until Jan 2026 transition)
- Optimization Preference: Pipeline value (not ROAS or CPA)
- Client Risk Tolerance: High (will test aggressive strategies)

#### Campaign: Enterprise - Brand Search
- Type: Search
- Daily Budget: $250
- Pipeline Value per Lead: $12,000
- Conv. Rate: 6.5%
- Notes: Enterprise brand terms. Long sales cycle (90+ days). Lead quality scoring via Salesforce integration.

#### Campaign: Enterprise - Competitor Conquest
- Type: Search
- Daily Budget: $200
- Pipeline Value per Lead: $8,500
- Conv. Rate: 1.9%
- Notes: Targets competitor brand terms. High CPC ($45 avg). Legal reviewed ad copy for compliance.

#### Campaign: Enterprise - ABM Display
- Type: Display
- Daily Budget: $300
- Pipeline Value per Lead: $15,000
- Conv. Rate: 0.4%
- Notes: Account-Based Marketing via Demandbase audience segments. Targets Fortune 500 companies. Highest value per lead in portfolio.

#### Campaign: Enterprise - Content Syndication
- Type: Performance Max
- Daily Budget: $200
- Pipeline Value per Lead: $6,000
- Conv. Rate: 0.9%
- Notes: Whitepaper and webinar promotion. Feeds top of funnel. Audience overlap with ABM Display estimated at 25%.

#### Campaign: Enterprise - Retargeting
- Type: Display
- Daily Budget: $150
- Pipeline Value per Lead: $10,000
- Conv. Rate: 2.8%
- Notes: High-intent retargeting of demo requesters and pricing page visitors. 60-day window. Shares audience with Services Retargeting for cross-sell opportunities.

## Cross-Account Relationships

### Budget Pools
- Pool Alpha: Widgets Brand Search + Widgets Shopping Standard. Shared ceiling of $350/day. If one overspends, the other is throttled.
- Pool Beta: Services Brand Search + Services Retargeting. Shared ceiling of $170/day.
- No formal pool for Enterprise, but Enterprise ABM and Enterprise Retargeting informally compete for the same accounts.

### Audience Overlaps
- Widgets PMax cannibalizes Widgets Shopping Standard (estimated 30% overlap)
- Services Retargeting overlaps with Widgets Retargeting (~15% shared visitors)
- Enterprise Content Syndication overlaps with Enterprise ABM Display (~25%)
- Enterprise Retargeting cross-sells to Services audience (~20% overlap)

### Manager Transition Notes
- Sarah Chen managed all three accounts from March 2024 to December 2025
- Marcus Webb took over Enterprise in January 2026
- Key institutional knowledge at risk: Sarah's optimization history, the informal Enterprise budget competition pattern, the cross-sell retargeting strategy between Enterprise and Services
- David Park's departure in Feb 2024 resulted in loss of Widgets historical seasonal data; Sarah had to reconstruct Q4 2024 strategy from scratch

### Performance History
- Q4 2024: Widgets Holiday campaign achieved 3.2 ROAS during peak, justified continued investment
- Q1 2025: Services Non-Brand CPA spiked to $120 due to new competitor; recovered to $95 by Q2
- Q3 2025: Enterprise ABM Display produced 3 Fortune 500 leads worth $45K pipeline each
- Q4 2025: Cross-account budget rebalancing moved $5K from underperforming Services YouTube to Enterprise Competitor Conquest
- Q1 2026: Marcus Webb questions the Enterprise budget allocation; hasn't seen the historical ABM data that justified it

### Current Strategic Issues
- Widgets: PMax vs Shopping cannibalization unresolved. ROAS difference (2.9 vs 4.5) suggests Shopping is better, but PMax provides reach metrics the client values.
- Services: Non-Brand CPA ($95) above target ($85). Options: tighten keywords, reduce budget, or renegotiate target with client.
- Enterprise: New manager Marcus Webb lacks context on why ABM Display has $300/day budget with 0.4% conv rate. Historical pipeline data justifies it but isn't in the campaign metrics.
- Cross-account: The retargeting audience overlap creates attribution confusion. A conversion attributed to Enterprise Retargeting may have been influenced by Services YouTube awareness.
`;

export const STRUCTURED_CONTEXT = `ENTITY-RELATIONSHIP GRAPH: ACME CORP MCC PORTFOLIO

=== ENTITIES ===

[MCC: Acme Corp] id=100-200-3000

[Account: Acme Widgets] id=111-222-3333, industry=ecommerce, monthly_budget=25000, opt_pref=ROAS, risk=moderate
[Account: Acme Services] id=444-555-6666, industry=B2B_services, monthly_budget=15000, opt_pref=CPA(target=$85), risk=low
[Account: Acme Enterprise] id=777-888-9999, industry=enterprise_SaaS, monthly_budget=35000, opt_pref=pipeline_value, risk=high

[Person: Sarah Chen] role=Account_Manager, tenure=2024-03 to present, accounts=[Widgets, Services], prev_accounts=[Enterprise until 2025-12]
[Person: Marcus Webb] role=Account_Manager, tenure=2026-01 to present, accounts=[Enterprise], context_gap=lacks_historical_ABM_data
[Person: David Park] role=Former_Manager, tenure=2023-01 to 2024-02, departed=competitor, knowledge_lost=Widgets_seasonal_history

[Campaign: W-Brand] account=Widgets, type=Search, budget=200/day, roas=6.2, conv_rate=4.8%, imp_share=92%
[Campaign: W-NonBrand] account=Widgets, type=Search, budget=180/day, roas=3.8, conv_rate=2.1%, recently_expanded=3_new_ad_groups
[Campaign: W-Shopping] account=Widgets, type=Shopping, budget=150/day, roas=4.5, conv_rate=3.2%
[Campaign: W-PMax] account=Widgets, type=PMax, budget=120/day, roas=2.9, conv_rate=1.8%, needs_asset_refresh=true
[Campaign: W-Holiday] account=Widgets, type=PMax, budget=100_to_300/day, roas=1.4_ramp|3.2_peak, seasonal=Q4

[Campaign: S-Brand] account=Services, type=Search, budget=100/day, cpa=32, conv_rate=8.1%, threat=competitor_conquesting_+40%_YoY
[Campaign: S-NonBrand] account=Services, type=Search, budget=150/day, cpa=95, conv_rate=1.2%, above_target=true
[Campaign: S-LinkedIn] account=Services, type=DemandGen, budget=80/day, cpa=110, conv_rate=0.8%, test_approved_through=2026-06
[Campaign: S-Retargeting] account=Services, type=Display, budget=70/day, cpa=45, conv_rate=3.5%, window=30_days
[Campaign: S-YouTube] account=Services, type=Video, budget=100/day, metric=view_rate_28%, goal=awareness

[Campaign: E-Brand] account=Enterprise, type=Search, budget=250/day, pipeline_value=12000/lead, conv_rate=6.5%, sales_cycle=90+_days
[Campaign: E-Conquest] account=Enterprise, type=Search, budget=200/day, pipeline_value=8500/lead, conv_rate=1.9%, avg_cpc=45
[Campaign: E-ABM] account=Enterprise, type=Display, budget=300/day, pipeline_value=15000/lead, conv_rate=0.4%, targeting=Demandbase_Fortune500
[Campaign: E-ContentSynd] account=Enterprise, type=PMax, budget=200/day, pipeline_value=6000/lead, conv_rate=0.9%
[Campaign: E-Retargeting] account=Enterprise, type=Display, budget=150/day, pipeline_value=10000/lead, conv_rate=2.8%, window=60_days

[BudgetPool: Alpha] members=[W-Brand, W-Shopping], ceiling=350/day, constraint=mutual_throttle
[BudgetPool: Beta] members=[S-Brand, S-Retargeting], ceiling=170/day, constraint=mutual_throttle

=== RELATIONSHIPS ===

Acme Corp --[owns]--> {Acme Widgets, Acme Services, Acme Enterprise}
Sarah Chen --[manages]--> {Acme Widgets, Acme Services}
Sarah Chen --[previously_managed]--> Acme Enterprise (until 2025-12)
Marcus Webb --[manages]--> Acme Enterprise
Marcus Webb --[lacks_context_from]--> Sarah Chen (re: ABM history, budget rationale)
David Park --[previously_managed]--> Acme Widgets (knowledge_lost: seasonal_history)

W-Brand --[shares_budget: Pool Alpha]--> W-Shopping
  IMPLICATION: budget change to either throttles the other
W-PMax --[cannibalizes: ~30%]--> W-Shopping
  IMPLICATION: W-PMax ROAS (2.9) understates cannibalization cost; W-Shopping effective ROAS higher if PMax removed
W-Holiday --[competes_for_budget_Q4]--> ALL Widgets campaigns
  IMPLICATION: Q4 ramp creates resource contention across Widgets

S-Brand --[shares_budget: Pool Beta]--> S-Retargeting
S-Retargeting --[audience_overlaps: ~15%]--> W-Retargeting (under W-PMax remarketing)
  IMPLICATION: cross-account attribution confusion
S-YouTube --[assists_conversions]--> S-Brand
  IMPLICATION: cutting S-YouTube may reduce S-Brand performance (upper funnel influence)
S-NonBrand --[CPA_above_target]--> $95 vs $85 target
  IMPLICATION: requires action — tighten keywords, reduce budget, or renegotiate target

E-ContentSynd --[audience_overlaps: ~25%]--> E-ABM
  IMPLICATION: same accounts targeted via two channels; attribution overlap
E-Retargeting --[cross_sells_to]--> Services audience (~20% overlap)
  IMPLICATION: Enterprise conversion may originate from Services funnel
E-ABM --[informally_competes_for_budget]--> E-Retargeting
  IMPLICATION: no formal pool but same account list creates de facto competition
E-ABM --[justified_by_historical_data]--> Q3 2025: 3 Fortune 500 leads at $45K pipeline each
  IMPLICATION: Marcus Webb doesn't have this context; may question $300/day budget

=== TEMPORAL / INSTITUTIONAL KNOWLEDGE ===

2024-02: David Park departs → Widgets seasonal data lost
2024-03: Sarah Chen takes over all 3 accounts
2024-Q4: W-Holiday achieves 3.2 ROAS at peak → justifies continued investment
2025-Q1: S-NonBrand CPA spikes to $120 (new competitor) → recovered to $95 by Q2
2025-Q3: E-ABM produces 3 Fortune 500 leads ($45K pipeline each) → justifies $300/day
2025-Q4: Cross-account rebalancing: $5K from S-YouTube → E-Conquest
2025-12: Sarah transitions Enterprise to Marcus Webb
2026-01: Marcus questions E-ABM budget allocation (lacks Q3 2025 data)
2026-Q1: S-NonBrand still at $95 CPA vs $85 target

=== COMPUTED ANALYSES ===

Widgets brand efficiency: Brand campaigns (W-Brand + W-Shopping via Pool Alpha) = $350/day = 42% of Widgets budget. ROAS weighted avg = 5.2. Efficient but limited scale.
Widgets PMax cannibalization: W-PMax removes ~30% of W-Shopping conversions. If PMax paused, W-Shopping ROAS likely increases from 4.5 to ~5.5. Net portfolio impact of PMax: negative.
Services CPA gap: S-NonBrand at $95 vs $85 target = 12% overshoot. Combined with S-LinkedIn at $110 = two campaigns above target.
Enterprise attribution risk: E-Retargeting + S-YouTube + S-Retargeting create a 3-campaign attribution chain. Conversion may touch all three.
Manager transition risk: Marcus Webb controls 47% of total MCC budget ($35K of $75K) without historical optimization context.
`;
