# Within π

A private, browser-only exploration of meaningful numbers in pi. Lightweight HTML, CSS and JavaScript; no build, runtime dependencies, dataset, backend, analytics or external fonts.

## Run locally

Requires Python 3 for the example server and Node.js 20+ for tests:

```sh
python3 -m http.server 8000
# Open http://localhost:8000
npm test
npm run check
```

Serve over HTTP or HTTPS; module workers do not work reliably from `file://`.

## Deploy to GitHub Pages

Publish this repository's `main` branch, `/ (root)`, in Settings → Pages → Deploy from a branch. `.nojekyll` keeps it a plain static site. All asset, module and worker paths are relative, including under `/pi-finder/`. No server is needed after deployment. Expected project address: https://chetan-speck.github.io/pi-finder/ (check Pages deployment status before relying on it).

## How it works

`engine.js` implements an unbounded exact BigInt linear-fractional spigot for pi. Each `step()` performs one safe-digit extraction or one refinement transformation. The initial integer digit 3 is discarded. There are no floating-point approximations in digit generation, fixed digit limits or downloaded/hardcoded pi tables.

A KMP prefix table incrementally matches the string, preserving partial matches across slices and correctly handling overlapping prefixes. Generation stops at the first full match. Position 1 is the first digit after the decimal point: `14159` begins at 1. Counters are BigInts and messages serialize them as decimal strings. The highlighted result shows preceding context and the match at the generation frontier; no trailing digits are calculated after the first match.

Only the pattern, its prefix table, generator state, counters and the latest `max(96, pattern.length + 32)` digits are retained. The entire expansion is never retained. BigInt arithmetic state still grows; time and memory costs increase without bound. There is no predefined maximum digit count, but real devices are finite. Very long inputs also consume memory proportional to input length.

`worker.js` runs roughly 12 ms calculation slices with event-loop yields. Individual BigInt operations cannot be interrupted cooperatively, so slice duration is a target, not a hard guarantee. `controller.js` independently watches the deadline on the main thread. It requests a cooperative timeout and terminates an unresponsive worker after a two-second grace period. A pause uses the same grace period. Forced termination loses generator/matcher state and exposes only the last confirmed count and calculation time. It cannot be resumed. Stop terminates immediately and discards state.

## Time and controls

Default: 60 seconds. Presets: 30, 60, 300 and 600 seconds. The editable range is 1–86,400 positive whole seconds per allowance, avoiding oversized timer intervals while permitting repeated continuation without a digit cap.

- Pause keeps generator and matching state in the worker's memory.
- Resume and Keep exploring reuse that state, with a fresh allowance equal to the selected timeout.
- Apply timeout, or clicking a preset while running, resets the allowance from that moment without resetting digits. Typing alone does not apply it.
- A cooperative timeout says **Not found within the digits searched.** It is not evidence of absence elsewhere in pi.
- Active calculation time is the sum of worker slice durations; allowance time is elapsed wall time, including scheduling delays. Paused time is excluded from calculation time.
- Closing, reloading, Stop or New search discards the session. Background tabs, browser throttling and suspended devices can delay computation and both timers; this is not a real-time service.

## Inputs and privacy

All inputs remain strings. Any number accepts ASCII digits. Birthdays use exact DD-MM-YYYY syntax and validate Gregorian calendar dates, including leap centuries, in years 0001–9999. They search DDMMYYYY. Phone mode removes spaces, parentheses, hyphens and an optional leading plus, retaining all zeros and entered country-code digits. It validates a digit sequence, not whether a phone number is assigned.

Entered numbers are used only in memory and worker messages. No numbers are sent to servers, logs, analytics, URL parameters, storage or third parties. The host necessarily receives normal page and static-asset requests. Source-link navigation is an ordinary external link.

## Accessibility and compatibility

System fonts, semantic labels, keyboard tabs with arrow/Home/End navigation, visible focus, inline errors, reduced-motion support and polite status announcements. Rapid digit updates are outside live regions. Current browsers must support BigInt, dynamic imports and module Web Workers. Capability, module-load, worker-load and runtime failures receive visible messages. JavaScript-disabled visitors receive a noscript explanation.

## Verification

`npm test` exercises 17 meaningful cases: 1,000 pi decimal digits against an independent fixed-point Machin arctangent formula (30 guard digits), first positions, leading zeros, overlap/fallback, cross-batch matching, bounded recent history, birthday/leap-year validation, phone normalization, timeouts, pause/resume, continuation, timeout updates, stale messages, forced cutoff, worker errors, unsupported browser detection and asset references. Worker lifecycle tests run the actual worker source with a deterministic scheduler, and controller tests use a fake worker/clock. `npm run check` checks syntax of all application JavaScript.

Pi has infinitely many nonrepeating digits. It has **not** been proved that every finite digit sequence occurs in pi. No computer can complete an infinite search.
