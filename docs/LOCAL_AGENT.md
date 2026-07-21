# Local Agent — PA / PM / CMO / Twin

Multi-role local agent embedded in the Trade Documents Platform. It automates briefs, tasks, builds, marketing drafts, and durable memory on top of **GCP Vertex AI** (or Gemini API / mock for local work).

## Roles

| Role | ID | Focus |
|------|----|--------|
| Personal Assistant | `pa` | Briefs, reminders, triage, follow-ups |
| Project Manager | `pm` | Tasks, milestones, build/test automation |
| Chief Marketing Officer | `cmo` | Positioning, campaigns, channel copy |
| Digital Twin | `twin` | Preference-aware decisions in your voice |
| Auto | `auto` | Routes from message hints |

## Architecture

```
API  /api/local-agent/*  →  LocalAgentService (orchestrator)
                              ├─ RoleRouter
                              ├─ VertexAiService (Vertex / Gemini / mock)
                              ├─ MemoryService (episodic / semantic / working / procedural / preference)
                              ├─ ToolRegistry (mem, tasks, builds, marketing, status)
                              └─ AgentSessionService
Worker  local-agent-queue →  LocalAgentTaskProcessor (tasks + builds)
```

Mongo collections: `agent_memories`, `agent_sessions`, `agent_tasks`  
Redis queue: `local-agent-queue`

## Configuration

See `env.example`:

```bash
LOCAL_AGENT_ENABLED=true
LOCAL_AGENT_PROVIDER=mock          # mock | vertex | gemini-api
GCP_PROJECT_ID=your-gcp-project
GCP_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/path/to/sa.json
LOCAL_AGENT_ALLOW_BUILDS=false     # enable only on trusted machines
GEMINI_API_KEY=                    # if using gemini-api provider
```

### Vertex mode

1. Create a GCP project with Vertex AI API enabled.
2. Use a service account with `roles/aiplatform.user` (or broader as needed).
3. Set `LOCAL_AGENT_PROVIDER=vertex` and `GCP_PROJECT_ID`.
4. Export ADC via `gcloud auth application-default login` or `GOOGLE_APPLICATION_CREDENTIALS`.

### Mock mode

No cloud credentials required. Deterministic local embeddings power memory recall so you can develop tools and flows offline.

## HTTP API

All routes require JWT + `x-api-key` (same as other platform modules).

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/local-agent/status` | Provider, roles, tools |
| POST | `/api/local-agent/chat` | Multi-role chat turn |
| POST | `/api/local-agent/memory` | Store memory |
| POST | `/api/local-agent/memory/recall` | Hybrid recall |
| POST | `/api/local-agent/tasks` | Create/enqueue task or build |
| GET | `/api/local-agent/tasks` | List tasks |

### Chat example

```json
POST /api/local-agent/chat
{
  "message": "Remember launches should lead with time-to-trust",
  "role": "twin",
  "accountId": "acc_123",
  "userId": "user_123"
}
```

Intent phrases also trigger tools in mock/local mode, e.g.:

- `Remember …` / `save preference …` → memory tools
- `Create task …` → task queue
- `Run build` / `pnpm build` → build job
- `Draft LinkedIn …` → marketing draft tool

## CLI

```bash
pnpm agent:status
pnpm agent -- "Brief me on open agent tasks"
pnpm agent --role cmo -- "Draft LinkedIn GTM for verifiable documents"
pnpm agent --role pm -- "Create task: finish onboarding check coverage"
pnpm agent --role twin -- "Save preference: keep replies under 8 lines"
```

Requires MongoDB + Redis (same as the API).

## Memory tools

| Tool | Kind | Notes |
|------|------|-------|
| `memory_store` | any | Persist with embedding |
| `memory_recall` / `memory_search` | — | Cosine + lexical + importance |
| `memory_upsert_preference` | preference | Twin / PA durable prefs |
| Working turns | working | Auto-stored each chat turn |

## Build automation

PM / Twin can call `run_build`:

- Default: enqueue `local-agent-build` job on the worker
- Sync execution only when `LOCAL_AGENT_ALLOW_BUILDS=true`
- Allowed scripts: `build`, `build:strict`, `lint`, `test`

## Extending

1. Add a tool in `src/local-agent/tools/tool.registry.ts`
2. Expose it on a persona in `src/local-agent/roles/role.definitions.ts`
3. Optionally add intent → tool mapping in `LocalAgentService.extractToolCalls`
