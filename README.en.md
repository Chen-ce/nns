# Node Naming Standard (NNS)

[中文 README](./README.md)

Node Naming Standard (NNS) is a unified, reproducible, and extensible naming
specification for proxy/network nodes.

Goals:
- Provide stable, readable naming rules for nodes
- Reduce naming inconsistencies across providers/subscriptions
- Enable consistent results across clients and implementations

Current version: NNS v1 (spec: `spec/SPEC.v1.md`)

---

## Project Status

- v1: Spec defined (reference implementation in progress)
- v2: Planned (semantic enhancements)
- v3: Planned (validation and ecosystem)

---

## Repository Structure

```text
nns/
├─ README.md                     # Project overview (Chinese)
├─ README.en.md                  # Project overview (English)
├─ LICENSE                       # License (MIT recommended)
├─ .gitignore
├─ ROADMAP.md                    # v1–v3 roadmap
│
├─ spec/                         # Specification documents
│  ├─ SPEC.v1.md                 # v1 spec (MUST / SHOULD / MAY)
│  ├─ SPEC.v2.md                 # v2 spec (Draft)
│  └─ SPEC.v3.md                 # v3 plan (Draft / Outline)
│
├─ dict/                         # Dictionaries required by the spec
│  ├─ sources/                   # Human-maintained sources (PRs welcome)
│  │  └─ countries_patch.yaml    # Country CN names + alias patches
│  │
│  ├─ generated/                 # Generated artifacts (committed to repo)
│  │  ├─ countries.json          # CC -> country object (flag/name/aliases)
│  │  └─ country_alias_map.json  # alias -> CC (fast matching)
│  │
│  └─ README.md                  # dict docs (how to generate/update)
│
├─ scripts/                      # Build scripts (part of the spec)
│  ├─ build_countries.py         # Generate countries.json
│  └─ README.md                  # Scripts usage
│
└─ CONTRIBUTING.md               # Contribution guide
```
