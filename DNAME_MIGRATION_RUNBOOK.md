# DNA.ME — Full Migration Runbook
**Source:** Lovable (Vite + React + Supabase Postgres + Deno Edge Functions + Supabase Storage/Auth)
**Target:** AWS EC2 (Node/Fastify) + Aurora PostgreSQL + Cognito + S3 + Cloudflare (DNS/WAF/Workers/CDN)
**Audience:** DevOps AI + human operator
**Prime directive:** Preserve the frontend look-and-feel **byte-for-byte**. Backend is rebuilt; UI is transplanted.

Companion doc: `DNAME_M2M_MIGRATION_BLUEPRINT.md` (design tokens, fonts, animation curves). This runbook is the executable plan.

---

## 0. Pre-flight

### 0.1 Inventory (what exists today)

**Frontend (transplant unchanged):**
- Vite + React 18 + TypeScript + Tailwind v3
- Design tokens in `src/index.css`, `tailwind.config.ts`
- Assets in `src/assets/` (logo, badge, DNA video/imagery)
- Routing: `src/App.tsx`

**Backend (rebuild):**
- Postgres schema — 19 tables (see §3.1), 12 SQL functions, 1 trigger (`on_auth_user_created`), Supabase Vault for user API keys
- 12 Edge Functions (Deno) → 12 Fastify routes (Node)
- Storage bucket: `partner-documents` (private)
- Auth: Supabase Auth (email/password + Google OAuth)
- Realtime: not required post-migration (federation broadcast was removed)
- SMTP relay for transactional email (already external)

**Third-party:**
- Lovable AI Gateway (Gemini 2.5 Pro) → replace with direct **Google AI Studio** or **Vertex AI**
- Perplexity API (already user-owned key) → keep
- SMTP host — keep

### 0.2 Target AWS topology

```text
                  Cloudflare (DNS, WAF, cache, Workers for edge auth)
                                 │
                                 ▼
                       ALB (TLS termination)
                      /                     \
              EC2 (Node/Fastify API)    EC2 (Nginx static frontend)
                    │                             │
        Aurora PostgreSQL (Multi-AZ)         S3 (assets, if externalized)
        Cognito (User Pool + Identity Pool)
        S3 (partner-documents, KMS-encrypted)
        Secrets Manager (SMTP, Perplexity default, Gemini key)
        KMS (envelope encryption for user API keys — replaces Supabase Vault)
        CloudWatch (logs, metrics, alarms)
```

### 0.3 Accounts & prerequisites

- [ ] AWS account with admin IAM user for bootstrap
- [ ] Cloudflare account with `dna-me` zone (or your custom domain)
- [ ] Google Cloud project with **Vertex AI API** enabled + service account JSON
- [ ] SMTP credentials (already in Supabase secrets — export values)
- [ ] Domain DNS control transferred to Cloudflare
- [ ] Terraform ≥ 1.6 or AWS CDK on operator workstation
- [ ] `psql`, `aws` CLI, `node ≥ 20`, `pnpm` or `bun`

---

## 1. Phase 1 — Provision AWS infrastructure (Terraform)

Create repo `dna-me-infra/`. Skeleton:

```text
dna-me-infra/
├── main.tf              # provider + backend
├── network.tf           # VPC, subnets, SGs
├── aurora.tf            # Aurora Postgres cluster
├── cognito.tf           # user pool + Google IdP
├── s3.tf                # partner-documents bucket + KMS
├── ec2.tf               # api + web instances, ALB
├── secrets.tf           # Secrets Manager entries
├── kms.tf               # user API key encryption CMK
├── cloudwatch.tf        # log groups, alarms
└── variables.tf
```

### 1.1 Networking

- VPC `10.20.0.0/16`
- 2× public subnets (ALB), 2× private subnets (EC2, Aurora)
- NAT gateway for private egress (Gemini/Perplexity/SMTP calls)
- Security groups: `sg-alb` (443 from 0.0.0.0/0), `sg-api` (3000 from sg-alb), `sg-db` (5432 from sg-api)

### 1.2 Aurora PostgreSQL

- Engine: `aurora-postgresql` 15.x
- 2× `db.r6g.large` (writer + reader), Multi-AZ
- Parameter group: enable `pgcrypto`, `uuid-ossp`
- Snapshot retention 14 days, automated backups on
- Master creds → Secrets Manager `dna-me/aurora/master`

### 1.3 Cognito

- User Pool `dna-me-users`
- Attributes: `email` (required, unique), custom `role` (string)
- Password policy: min 12, upper+lower+digit+symbol
- Google IdP: paste Google OAuth client ID/secret
- App client: `dna-me-web`, no client secret (SPA), callback `https://app.dna.me/auth/callback`
- Hosted UI OFF (we keep the custom `/auth` page)

### 1.4 S3

- Bucket `dna-me-partner-documents` (private, block all public)
- SSE-KMS with dedicated CMK `alias/dna-me-partner-docs`
- Lifecycle: transition to IA at 90d
- CORS: allow `PUT/GET` from `https://app.dna.me`

### 1.5 KMS for user API keys (Vault replacement)

- CMK `alias/dna-me-user-keys` — envelope encryption
- Only the API EC2 role can `Encrypt`/`Decrypt`

### 1.6 EC2

- API: `t3.medium` × 2 in ASG, AMI Ubuntu 24.04, user-data installs Node 20 + systemd unit
- Web: `t3.small` × 2 in ASG, Nginx serving `/var/www/dna-me`
- Both behind single ALB (host-based: `api.dna.me` → api target group, `app.dna.me` → web target group)

### 1.7 Secrets Manager entries

| Secret name | Contents |
|---|---|
| `dna-me/smtp` | host, port, user, password, from |
| `dna-me/gemini` | Google service account JSON (or API key) |
| `dna-me/perplexity-default` | fallback key (users bring their own) |
| `dna-me/aurora/app` | app-role DB URL |
| `dna-me/cognito` | user pool id, client id, region |
| `dna-me/kms-key-id` | CMK id for user key envelope |

Apply: `terraform init && terraform apply`.

---

## 2. Phase 2 — Frontend transplant (zero visual drift)

**Goal:** the pixel output at `https://dna-me.lovable.app` must match `https://app.dna.me` after cutover.

### 2.1 Clone project

```bash
git clone <lovable-export-repo> dna-me-web
cd dna-me-web
```

### 2.2 Replace Supabase client with API adapter

Create `src/integrations/api/client.ts`:

```ts
const API_BASE = import.meta.env.VITE_API_BASE ?? 'https://api.dna.me';

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('id_token');
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}
```

Create `src/integrations/api/auth.ts` wrapping **Amazon Cognito Identity JS** with the same surface as `supabase.auth`:
- `signInWithPassword({ email, password })`
- `signUp({ email, password, options })`
- `signInWithOAuth({ provider: 'google' })` → redirect to Cognito Hosted UI or use `amazon-cognito-auth-js`
- `signOut()`
- `getSession()` / `onAuthStateChange()`

Create `src/integrations/api/db.ts` — thin fetch wrappers matching each `supabase.from('table').select/insert/update/delete` call currently in the codebase. Keep the return shape `{ data, error }` so components don't change.

Create `src/integrations/api/functions.ts` — replaces `supabase.functions.invoke(name, { body })` with `POST /fn/{name}`. Same input, same output.

### 2.3 Rewire imports

```bash
# Automated import rewrite
grep -rl "@/integrations/supabase/client" src | xargs sed -i \
  -e 's|@/integrations/supabase/client|@/integrations/api/client|g'
```
Then hand-fix ~20 sites where the Supabase-specific query builder chain is used (rare — most code uses `.functions.invoke`).

### 2.4 Environment

`.env.production`:
```
VITE_API_BASE=https://api.dna.me
VITE_COGNITO_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxx
```

### 2.5 Build & deploy

```bash
bun install
bun run build
aws s3 sync dist/ s3://dna-me-web/ --delete   # or scp to EC2 nginx doc root
```

### 2.6 Visual regression gate

Before cutover, run Playwright screenshot diff between `dna-me.lovable.app` and `app.dna.me` on:
- `/` (landing)
- `/auth`, `/index`, `/data-vault`, `/developers`, `/middleware`, `/collaborate`, `/patient-intake`

Any diff > 0.1% blocks the cutover. Fix CSS token drift, not the diff threshold.

---

## 3. Phase 3 — Database migration

### 3.1 Schema export

From Lovable via the Cloud → Advanced → **Export data** flow, retrieve:
- `schema.sql` (DDL for all 19 public tables + functions + RLS policies)
- `data/*.csv` per table

### 3.2 Rewrites required before applying to Aurora

Aurora doesn't have `auth.users`, `vault.secrets`, or `pgsodium`. Patch:

1. **`auth.users` FKs** → point to `public.users` (populated by Cognito post-confirmation Lambda, see §4.3).
2. **`vault.secrets` / `vault.decrypted_secrets`** → replace `upsert_api_key` / `get_user_api_key` / `delete_api_key` bodies with calls to a table `public.user_api_keys_encrypted (user_id, provider, ciphertext bytea, dek_ciphertext bytea)`. Encrypt in the API layer using AWS KMS envelope encryption; DB stores only ciphertext.
3. **`SECURITY DEFINER` functions** — keep as-is; owner should be a role that isn't `postgres`. Create `app_owner` role.
4. **Realtime publication drops** — no-op, Aurora has no realtime.
5. **`auth.uid()` in RLS policies** — replace with `current_setting('app.user_id', true)::uuid`. API sets this at the start of every request via `SET LOCAL app.user_id = '<uuid from JWT>'`.

Apply:

```bash
psql "$AURORA_URL" -f schema.patched.sql
for f in data/*.csv; do
  table=$(basename "$f" .csv)
  psql "$AURORA_URL" -c "\copy public.$table FROM '$f' WITH CSV HEADER"
done
```

### 3.3 Verify

```sql
SELECT relname, n_live_tup FROM pg_stat_user_tables ORDER BY 1;
```
Row counts must match the source export.

### 3.4 Re-encrypt user API keys

The Vault-stored Perplexity keys can't be decrypted outside Supabase. Options:
1. Before cutover, run a one-time script in Lovable that pulls each key via `get_user_api_key` and re-inserts into a temp table with `pgp_sym_encrypt(key, $PSK)`; export that table; on Aurora side, decrypt with the PSK and re-envelope with KMS.
2. Or invalidate all keys and force users to re-enter (simpler; users notice).

Choose 1 for zero user friction, 2 for zero migration risk. **Recommended: option 2** — the UI already handles "not configured".

---

## 4. Phase 4 — Backend port (Deno → Node/Fastify)

Create repo `dna-me-api/`.

### 4.1 Project layout

```text
dna-me-api/
├── src/
│   ├── server.ts              # Fastify bootstrap
│   ├── auth/verifyJwt.ts      # Cognito JWT verifier (jose)
│   ├── db/pool.ts             # pg Pool, sets app.user_id per request
│   ├── kms/envelope.ts        # AWS KMS encrypt/decrypt for user keys
│   ├── mail/smtp.ts           # nodemailer
│   ├── routes/
│   │   ├── research-assistant.ts
│   │   ├── nutrigenomics-forecast.ts
│   │   ├── send-nutrigenomics-report.ts
│   │   ├── send-feature-suggestion.ts
│   │   ├── partner-onboarding.ts
│   │   ├── partner-issue-key.ts
│   │   ├── auth-security.ts
│   │   ├── federated-pull.ts
│   │   ├── federated-query.ts
│   │   ├── federated-seed.ts
│   │   ├── federation-receiver.ts
│   │   └── vertex-verify.ts
│   └── lib/perplexity.ts, gemini.ts
├── package.json
└── Dockerfile
```

### 4.2 Cognito JWT middleware

Use `jose` to verify the `Authorization: Bearer <id_token>` against Cognito JWKS. Attach `req.user = { id, email, role }`. Reject on failure.

Every route runs `SET LOCAL app.user_id = $1` at the top of its transaction so existing RLS policies still work.

### 4.3 Post-confirmation Lambda

Trigger: Cognito `Post confirmation`. It inserts into `public.users(id, email)` and `public.user_roles(user_id, 'user')`. This replaces the Supabase `handle_new_user` trigger. Practitioner/admin/developer requests still land in `role_requests`; a scheduled Lambda emails `ceo@cyberellum.technology` on new rows.

### 4.4 Port each edge function

Rules per function:
- **Signature** unchanged: same JSON in, same JSON out.
- **CORS** — Fastify `@fastify/cors` with `origin: ['https://app.dna.me']`.
- **Secrets** — read from Secrets Manager at boot, cache in memory.
- **AI calls** — replace `https://ai.gateway.lovable.dev/...` with either:
  - Vertex AI: `POST https://us-central1-aiplatform.googleapis.com/v1/projects/$PROJECT/locations/us-central1/publishers/google/models/gemini-2.5-pro:generateContent`
  - or Google AI Studio: `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=$KEY`

Priority order (build & smoke-test in this sequence):
1. `research-assistant` — highest user visibility
2. `send-feature-suggestion` — simple, validates SMTP
3. `partner-onboarding` + `partner-issue-key` — validates storage + KMS
4. `patient-intake` writes (already client-direct DB, keep)
5. `nutrigenomics-forecast` + `send-nutrigenomics-report`
6. `auth-security`, `vertex-verify`, federated-* (last — lowest traffic)

### 4.5 Storage adapter

Replace all `supabase.storage.from('partner-documents')` calls with pre-signed S3 URLs:
- Upload: `POST /fn/partner-onboarding/upload-url` → returns S3 PUT URL (5 min TTL)
- Read: `GET /fn/partner-documents/:key/url` → returns S3 GET URL

### 4.6 Deploy

Dockerize, push to ECR, systemd unit on API EC2 that runs `docker run --restart unless-stopped ...`. Or ECS Fargate if operator prefers — same image.

Health check: `GET /healthz` → `{ ok: true, db: 'up', kms: 'up' }`. ALB target group uses this.

---

## 5. Phase 5 — Cloudflare edge

### 5.1 DNS

- `app.dna.me` → CNAME → ALB DNS (proxied, orange cloud)
- `api.dna.me` → CNAME → ALB DNS (proxied)

### 5.2 WAF rules

- Rate limit `/fn/research-assistant`: 30 req / 5 min per IP
- Rate limit `/fn/send-feature-suggestion`: 5 req / min per IP
- Managed OWASP ruleset on

### 5.3 Cache

- Static assets under `/assets/*` on `app.dna.me`: cache 30d, edge + browser
- API responses: bypass cache entirely (`Cache-Control: no-store` from Fastify)

### 5.4 Optional Worker for auth pre-check

A Cloudflare Worker in front of `api.dna.me` verifies the Cognito JWT signature at the edge and rejects malformed tokens before they hit EC2. Optional but recommended for bot floor.

---

## 6. Phase 6 — Cutover

### 6.1 Dry run (T-7 days)

- Full DB migration into Aurora
- Frontend deployed to `app-staging.dna.me` pointing at `api-staging.dna.me`
- Playwright visual diff green
- Smoke test every route as `beccamchaas@mac.com` and a new admin request

### 6.2 Freeze (T-1 day)

- Announce read-only window
- Disable signups on Lovable Auth screen (edit `Auth.tsx` copy)

### 6.3 Cutover (T-0, 30-minute window)

1. Final Postgres delta dump from Supabase → load to Aurora
2. Cognito user pool import from Supabase `auth.users` (email + `email_verified`, users must reset password on first login) — send templated reset email
3. Copy `partner-documents` bucket contents from Supabase Storage → S3 (`aws s3 sync`)
4. Flip Cloudflare DNS for `app.dna.me` and `api.dna.me` to the ALB (was previously CNAME to `dna-me.lovable.app`)
5. Verify `/healthz` on both
6. Announce live

### 6.4 Rollback

DNS-level rollback: flip Cloudflare CNAME back to `dna-me.lovable.app`. Supabase state is untouched during cutover, so it's a full revert. Post-cutover writes to Aurora are lost on rollback — accept this within a defined 24h window.

---

## 7. Phase 7 — Post-migration

- Decommission Lovable project after 30 days of stable operation
- Rotate all secrets fresh in AWS (don't reuse Supabase values long-term)
- Enable RDS Performance Insights + CloudWatch alarms:
  - Aurora CPU > 70% for 5 min
  - API 5xx rate > 1%
  - Cognito failed sign-ins > 100/min
- Weekly backup restore drill
- Update `mem://architecture/aws-migration` with actual endpoints

---

## 8. Function-by-function port checklist

| Function | Deps to replace | KMS/Secrets needed | Notes |
|---|---|---|---|
| research-assistant | Lovable AI → Vertex; Perplexity unchanged; per-user KMS decrypt | gemini, kms | Streaming SSE — Fastify `reply.raw` |
| nutrigenomics-forecast | Lovable AI → Vertex | gemini | Same JSON contract |
| send-nutrigenomics-report | Deno SMTP → nodemailer | smtp | Recipient forced to authenticated email (already hardened) |
| send-feature-suggestion | Deno SMTP → nodemailer | smtp | Autoreply preserved |
| partner-onboarding | Storage API → S3 pre-signed | s3, kms | Multi-step wizard state in DB |
| partner-issue-key | vault → KMS envelope | kms | Admin-only (has_role RPC) |
| auth-security | login-attempt logging | — | Reads Cognito events too |
| federated-* | Deno fetch → Node fetch | — | Keep JWT verify; DNS-fix `yokxmlatktvxqymxtktn` node |
| vertex-verify | Direct Google API call | gemini | Already admin-gated |
| federation-receiver | Inbound webhook | — | Add Cloudflare IP allowlist |

---

## 9. Look-and-feel preservation checklist

Reference: `DNAME_M2M_MIGRATION_BLUEPRINT.md`. Non-negotiables:

- [ ] `src/index.css` copied verbatim (all HSL tokens)
- [ ] `tailwind.config.ts` copied verbatim (theme extend, animation keyframes)
- [ ] Fonts: same Google Fonts import in `index.html`
- [ ] Images: `src/assets/axiom-compliance-badge.png`, `cyberellum-logo.png`, DNA video assets copied bit-for-bit
- [ ] shadcn/ui components untouched; only `client.ts` swapped
- [ ] Framer Motion versions pinned to current `package.json`
- [ ] Dark theme default preserved
- [ ] Navigation breakpoint at 1280px preserved

Visual diff must be < 0.1% on all seven canonical routes.

---

## 10. Operator-run commands, in order

```bash
# 1. Infra
cd dna-me-infra && terraform apply

# 2. DB
psql "$AURORA_URL" -f schema.patched.sql
./scripts/load-data.sh

# 3. API
cd ../dna-me-api && docker build -t dna-me-api . && ./scripts/deploy-ecr.sh

# 4. Web
cd ../dna-me-web && bun install && bun run build && aws s3 sync dist/ s3://dna-me-web/

# 5. Smoke
./scripts/smoke.sh https://api-staging.dna.me

# 6. Cutover
./scripts/cutover.sh
```

Each script is idempotent. Runbook complete.
