# HandheldAtlas content workflow

HandheldAtlas is a performance-intelligence database. A large catalog is useful
only when every public claim has a traceable source and an honest evidence tier.

## Evidence tiers

| Tier | Meaning | Minimum evidence |
| --- | --- | --- |
| `Atlas Verified` | Measured directly by the HandheldAtlas team | CapFrameX capture, exact device, route, settings, power target and test date |
| `Community Verified` | Reproducible community result | Performance export plus settings proof and exact device information |
| `External Source` | Result reported by a named third party | Direct source URL, source name, exact device and source-check date |
| `Estimated` | Editorial starting point, not a measurement | Clearly labelled inference with its basis documented |
| `Legacy Unclassified` | Older record awaiting provenance review | Must be classified before it is reused or promoted |

`Atlas Verified` is never inferred from reputation, a video overlay or a similar
APU. Only a direct HandheldAtlas capture earns that label.

## Source hierarchy

1. HandheldAtlas CapFrameX captures and retained exports.
2. Official game, hardware, driver and patch documentation.
3. Reproducible community exports with screenshots of settings.
4. Specialist handheld publications, including ROG Ally Life and Legion Go Life.
5. Established technical reviews with a disclosed test method.
6. Multiple independent Reddit or forum reports that agree on the same issue.
7. A single social post or comment, used only as a lead for further research.

Reddit is a discovery and corroboration source. A lone comment is not sufficient
for a numeric benchmark or an unqualified compatibility claim.

## Game workflow

1. Check for an existing record by slug and Steam App ID.
2. Record title, exact release date, developer, publisher, genre, platforms and
   Steam App ID.
3. Record both platform-specific Metacritic scores and the direct source URL.
4. Add a clean portrait cover and record its original source page.
5. Write an original game description without handheld performance claims.
6. Create at least one complete preset for an exact handheld model.
7. Link a benchmark when measured data is available.
8. Run launch readiness and publish only when all mandatory fields pass.

Drafts may be incomplete. Public games may not be empty profiles.

## Preset workflow

Every preset records:

- exact game and handheld model;
- purpose: Performance, Balanced, Battery, Docked or Custom;
- resolution, power target, FPS target, upscaler and frame generation state;
- complete in-game settings grouped as shown in the game;
- a short explanation of the trade-off and important caveats;
- evidence tier, source name, direct URL and source-check date;
- game, driver and operating-system versions when available.

Settings from one device may not be copied to another merely because the APUs
look similar. They can be used only as a labelled estimate until that exact
device has matching evidence.

### Controlled evidence exceptions

A missing 1% low, exact scalar average FPS, game build or driver version does
not automatically make a useful sourced preset unpublishable. An Atlas Editor
or admin may approve a controlled exception only when all of these conditions
are met:

1. The exact handheld, resolution, power target and complete settings are
   documented.
2. The source name, direct URL and source-check date are present.
3. A separate proof link shows a frametime capture, visible performance
   screenshot or performance video for the same target.
4. The public exception reason states exactly what is missing and what the
   linked proof supports.
5. Missing numeric values remain empty. A reported range or visual overlay is
   described in prose and is never converted into an invented average or low.

Every approved exception is displayed publicly with its proof type, link,
review date and editorial reason. It remains `External Source`, `Community
Verified` or `Estimated`; it can never be labelled `Atlas Verified`.

## Atlas benchmark protocol

1. Use CapFrameX on the exact target handheld.
2. Stabilise power mode, fan profile, VRAM allocation, OS and driver version.
3. Use a repeatable route that represents real gameplay rather than a menu or
   an unusually light scene.
4. Capture 60–90 seconds after shader compilation and traversal have settled.
5. Run the same route three times.
6. Store average FPS, 1% low and 0.1% low, plus capture duration and run count.
7. Record resolution, TDP, preset, frame generation, FPS cap and test date.
8. Explain large variance, stutter, crashes or thermal throttling in test notes.

External benchmark numbers retain their publisher's methodology and evidence
tier. Missing metrics stay empty; they are never reverse-engineered from average
FPS.

## Device coverage order

Coverage grows by useful hardware families, not by mechanically cloning every
row across all devices:

1. ROG Xbox Ally X — direct HandheldAtlas testing priority.
2. ROG Ally / Ally X — ROG Ally Life plus corroborated community evidence.
3. Steam Deck OLED — current Deck-specific technical sources.
4. Legion Go family — Legion Go Life plus exact-model corroboration.
5. MSI Claw family — model-specific Intel or AMD evidence.
6. AYANEO and GPD — exact configuration and power target required.
7. Nintendo Switch 2 — closed-platform performance profiles, not PC presets.

Each published handheld should first receive one strong baseline game, then
broader coverage. This avoids twenty-one devices with twenty-one shallow copies.

## News and guides

Publish only content that changes a player's decision or solves a recurring
problem: driver and BIOS updates, important game patches, compatibility changes,
measured performance shifts, setup procedures and durable troubleshooting.

Every news item or guide must link primary sources where available, distinguish
facts from inference and avoid reproducing another publication's text or images.
