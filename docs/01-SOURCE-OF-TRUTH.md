# Source of truth — 8 uploaded SAD documents

**Baseline:** Approved Smart Library MSS v2.0, 20 November 2026. **Branding only:** product is E-Vidyakosha; referential names/behavior remain consistent with the academic documents.

| Order | Uploaded name | Stored source | Agent-readable plain text | Purpose |
|---|---|---|---|---|
| 1 | `p1.pdf` | `reference/01-SRS.pdf` | `reference/extracted/01-SRS.txt` | IEEE-style SRS; all FRs, roles, data constraints |
| 2 | `P1.1.pdf` | `reference/02-Process-Identification.pdf` | `reference/extracted/02-Process-Identification.txt` | P1–P8 processes and D1–D6 logical stores |
| 3 | `Practical 2.pdf` | `reference/03-Use-Cases.pdf` | `reference/extracted/03-Use-Cases.txt` | UC-01 through UC-12; actors, include/extend |
| 4 | `Practical 3.pdf` | `reference/04-Structural-Design.pdf` | `reference/extracted/04-Structural-Design.txt` | Class, package, deployment diagrams |
| 5 | `Practical 4.pdf` | `reference/05-Architecture-Design.pdf` | `reference/extracted/05-Architecture-Design.txt` | Components, DocumentService composite, profile |
| 6 | `practical 5.pdf` | `reference/06-Workflow-State.pdf` | `reference/extracted/06-Workflow-State.txt` | Activities and state machines |
| 7 | `Practical 6.pdf` | `reference/07-Interactions.pdf` | `reference/extracted/07-Interactions.txt` | Sequence and communication diagrams |
| 8 | `Practical 7.pdf` | `reference/08-Complex-Interactions.pdf` | `reference/extracted/08-Complex-Interactions.txt` | Interaction overview and logical timing |

## Precedence and conflicts

1. Explicit SRS statements and approved MSS v2.0 requirements outrank illustrative details in later diagrams.
2. The diagrams are implementation guidance only where consistent with SRS; they do not authorize features excluded by SRS.
3. Implementation decisions unresolved by MSS are documented in `08-OPEN-DECISIONS.md`; do not infer them as approved requirements.
4. Do not silently edit or rename these archived sources. To change scope, obtain approval and update traceability and contract first.
5. The downloadable starter kit keeps each PDF and text extraction **locally only**. `.gitignore` omits these files from Git because they contain team member names/PRNs; copy them into each agent checkout privately. Version-controlled requirements summaries remain in `docs/`.
