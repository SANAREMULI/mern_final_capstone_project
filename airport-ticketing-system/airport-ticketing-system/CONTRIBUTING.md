# Team Workflow

## Branching
- `main` is always deployable. Nobody pushes to it directly; turn on branch protection in GitHub.
- Work in short-lived branches named by type:
  `feature/seat-map`, `fix/checkin-window`, `chore/ci`, `docs/readme-screenshots`.

## Pull requests
1. `git switch main && git pull` → `git switch -c feature/<name>`
2. Make small commits with clear messages in the imperative mood: `Add waitlist promotion on cancel`.
3. Run `npm test` in `server/` and `client/`, then push and open a PR into `main`.
4. At least **one teammate reviews** before merging. CI must be green.
5. Squash-merge, then delete the branch.

## Code conventions
- Backend layering: routes (wiring + validation) → controllers (HTTP) → services (business rules) → models.
- Throw `ApiError` for expected failures, never `res.status(...)` from deep inside services.
- Wrap async route handlers in `asyncHandler`.
- Frontend: all HTTP calls go through `src/api`. Keep shared state in `context/` and styling in `styles/index.css` tokens. Do not use inline colours.
- 2-space indentation, single quotes, semicolons.

## Roles (rotate as needed)
| Role | Owns |
|---|---|
| Team Lead / PM | Task board, standups, demo script |
| Backend Lead | API contract, models, services, tests |
| Frontend Lead | Pages, components, design consistency |
| QA & Deployment Lead | Regression passes, CI, Render/Vercel/Atlas |

## Contribution logs
Each member keeps `docs/contribution-logs/<your-name>.md`, based on `TEMPLATE.md`. List the PRs you authored and reviewed.
