# PQ Paddi JAMB Practice Tester Plan

## Goal

Build a small Next.js app for manually testing ALOC Station's JAMB question content before building the wider edtech product. The first version should let a user choose a JAMB subject and optional year, load questions, choose an answer, move between questions, and review the result.

This phase is intentionally a content-quality and API-integration tester. It does not include authentication, authorization, payments, student accounts, persistence, AI tutoring, or production exam delivery.

## Current Status

The first prototype is implemented and builds successfully. The local app is available at `http://localhost:3000` while the development server is running.

- The app now supports JAMB Mathematics, English, Chemistry, Biology, and Physics.
- The API key is read only by the server route in `src/app/api/questions/route.ts`.
- English and Biology have no matching 2023 records, so the subject tester uses each subject's available JAMB bank across years.
- Each subject request fetches up to 30 questions by combining two cursor-based pages of 15; all five subjects returned 30 questions in the latest smoke test.
- The UI now supports `All available years` and every year from 2019 through 2025. A selected year is sent to ALOC; the all-years option omits the year filter.
- Year availability differs by subject: for example, Mathematics has 2023 data while English has no 2023 match and uses the all-years bank.
- The next step is to exercise each subject in the UI and inspect content quality, including images and mathematical notation.

## ALOC API Notes

- Base API: `https://dev.aloc.com.ng/api/v1` for development/testing.
- Questions endpoint: `GET /questions`.
- Authentication: `X-API-Key` request header.
- Required query filter: at least one of `subject`, `examType`, or `year`.
- JAMB filter: `examType=jamb`.
- Useful query parameters: `subject`, `year`, `random`, `limit`, and cursor-based `cursor`.
- Question response fields include `id`, `text`, `options`, `correctAnswer`, `examType`, `subject`, `year`, and possibly passage fields for English/Literature questions.
- Responses use a standard envelope containing `data`, `pagination`, and `meta`.
- Free-tier rate limit documented by ALOC: 30 requests per minute.
- L1 question requests consume credits, so the app should fetch deliberately and avoid refetching on every answer change.
- ALOC also documents assessment sessions for fixed exam papers. We will evaluate that flow after the raw question tester proves the content and integration quality.

## Environment Variable Checkpoint

Before the first live endpoint test, create a local `.env.local` file with:

```env
ALOC_API_KEY=your_aloc_api_key_here
ALOC_BASE_URL=https://dev.aloc.com.ng/api/v1
```

The API key must remain server-side. It must not use a `NEXT_PUBLIC_` prefix, appear in client components, or be committed to source control. You will provide the key locally when we reach this checkpoint; no key is needed to approve this plan.

## Phase 0: Confirm Scope and API Access

- [x] Confirm this plan.
- [x] Confirm Mathematics as the initial subject.
- [x] Expand the tester to Mathematics, English, Chemistry, Biology, and Physics.
- [x] Create an ALOC developer account and generate an API key.
- [x] Verify the developer email.
- [x] Add `ALOC_API_KEY` to local `.env.local`.
- [x] Smoke-test subject availability; Mathematics, Chemistry, and Physics have 2023 data, while English and Biology require year-agnostic bank queries.

**Exit criteria:** We agree on the first-screen controls and the API key is available for local testing.

## Phase 1: Create the Next.js Foundation

- [x] Scaffold a Next.js App Router project with TypeScript.
- [x] Add the minimal styling foundation and responsive layout.
- [x] Add environment-variable handling for `ALOC_API_KEY` and `ALOC_BASE_URL`.
- [x] Add the server-side ALOC integration using `fetch` in the questions route.
- [x] Keep the API key out of browser code and browser network requests.

**Exit criteria:** The app starts locally and has a server-side integration boundary ready for the ALOC request.

## Phase 2: Test the ALOC Questions Endpoint

- [x] Add the Next.js route handler `GET /api/questions`.
- [x] Enforce a server-side allowlist for the five supported subjects.
- [x] Always send `examType=jamb` from the server rather than trusting the browser to choose another exam type.
- [x] Forward only supported filters and use ALOC's supported page size of 15.
- [x] Normalize the ALOC envelope into a small app-facing response while preserving pagination and useful diagnostic metadata.
- [x] Handle missing API key, upstream errors, empty results, and service failures with clear messages.
- [x] Combine two cursor pages and smoke-test all five subjects; each returned 30 questions.

**Exit criteria:** A local route can retrieve and return real JAMB question data without exposing the API key.

## Phase 3: Build the Question Tester UI

- [x] Add subject selection for Mathematics, English, Chemistry, Biology, and Physics.
- [x] Add exam-year selection for All available years and 2019 through 2025.
- [x] Use the available subject bank across years when a selected subject has no matching year.
- [x] Add a `Load questions` action that makes one deliberate request.
- [x] Render the current question text and answer options when ALOC returns data.
- [x] Render reading-comprehension passages when ALOC returns passage fields.
- [x] Allow one answer selection per question and visibly mark the selected answer.
- [x] Add `Previous` and `Next` navigation with stable question numbering.
- [x] Prevent advancing without an answer.
- [x] Show loading, empty, API error, and missing-key states.
- [x] Keep answer evaluation client-side for the tester; do not send selected answers to ALOC.

**Exit criteria:** A user can load a filtered JAMB set, answer questions, and move through the set without a page reload.

## Phase 4: Review and Content-Quality Feedback

- [x] Add a result summary showing attempted questions, correct answers, and score.
- [ ] Add a review mode showing the selected answer, correct answer, and question context.
- [ ] Clearly distinguish API content from app-generated evaluation so a content error is not mistaken for a user error.
- [ ] Add a simple `Report question` action or review form only after the core flow works.
- [ ] If reporting is implemented, map it to ALOC's documented `POST /questions/{id}/report` endpoint and require a meaningful message.
- [ ] Record findings outside the app or in a small local notes format: missing options, incorrect answer keys, typos, duplicate questions, broken passages, and unexpected response shapes.

**Exit criteria:** We can inspect question quality systematically and identify which content issues need follow-up with ALOC.

## Phase 5: Pagination and Session Decision

- [x] Decide that the tester needs up to 30 questions per subject.
- [x] Add server-side cursor pagination using two 15-question ALOC pages.
- [x] Avoid offset/page-number pagination; ALOC documents cursor pagination.
- [ ] Measure credit usage and request volume while testing.
- [ ] Compare raw question browsing with ALOC's assessment-session endpoint for fixed, non-repeating papers.
- [ ] Choose whether the next iteration should use assessment sessions, raw filtered questions, or both.

**Exit criteria:** We have a tested decision for how future practice tests should allocate questions.

## Phase 6: Verification and Handoff

- [x] Run the production build and TypeScript checks.
- [ ] Test the main flow on desktop and mobile widths.
- [x] Verify that the API key is used by the server route rather than the client component.
- [ ] Verify successful, unauthorized, rate-limited, and upstream-error states against live ALOC responses.
- [x] Document local setup and the required `.env.local` variables.
- [x] Keep authentication and authorization explicitly out of scope for this prototype.

**Exit criteria:** The prototype is usable for manual ALOC endpoint and question-quality testing, with known limitations documented.

## Initial Acceptance Criteria

- A user can open the app and select a JAMB subject.
- A user can load up to 30 questions from the selected subject's available JAMB bank.
- A user can select All available years or a supported exam year before loading questions.
- The API key is used only by the Next.js server.
- A question displays its text and answer options correctly.
- A user can select an answer, move forward, move backward, and see progress.
- A user can finish and see a local score/review.
- The UI handles loading, no results, missing key, invalid key, rate limiting, and upstream errors.
- The app does not claim to be a complete JAMB examination simulator yet.

## Explicitly Out of Scope for This First Prototype

- User registration, login, roles, and authorization.
- Persistent student progress or a database.
- Payments, subscriptions, and credit management.
- AI explanations or adaptive recommendations.
- Timed full-length JAMB simulation.
- Admin dashboards and content editing.
- Production deployment and monitoring.

## Next Decisions

1. Exercise all five subject flows and inspect content quality.
2. Add more year choices if ALOC content review shows they are useful.
3. After review, decide whether to move to ALOC assessment sessions.
