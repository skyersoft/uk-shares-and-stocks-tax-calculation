---
name: feature-workflow
description: Plan and coordinate a multi-layer feature (backend + frontend + tests + deploy) for the CGT calculator, replacing the old Copilot manager/planner agents. Use when starting a feature that spans API, UI, and deployment.
---

# Feature workflow (plan → build → test → deploy)

1. **Plan** (read-only): audit the relevant parsers, models, services, lambda handlers, and frontend types/components with search; write down the API schema contract, file-level change list, test list, and risks. Record unrelated bugs found in a tasks file rather than expanding scope.
2. **Build backend** with the `backend-feature` skill, then **frontend** with `frontend-feature`. The schema contract is the handoff; backend and frontend can proceed in parallel if the contract is fixed (delegate to subagents when the pieces are independent).
3. **Test:** `make test-unit`, `make quick-test`, `npm run test:unit`, `npx playwright test` (see `playwright-tests`). Any major or minor failure goes back to step 1/2 to be fixed, not worked around.
4. **Deploy** only when everything passes and the user has agreed, using the `deploy-aws` skill; verify production afterward.
5. Report: what changed, what was tested, what was not.

Principles: TDD, SOLID, interfaces before implementations, be concise, finish all tasks.
