# Media format matrix (S0-4, in progress)

Date: 2026-10-14
EffectCraft version: 0.8.0

## Test plan

1. Create media test template with media replacement control (S0-2 done).
2. Prepare test assets: still.jpg, transparent.png, anim.gif, clip.mp4, image.webp (need to create or find).
3. For each asset, try to use it as media replacement. Since direct `--values` doesn't work for media, test via pipeline mode (import template to project, set media, render).
4. For GIF, compare frames at t=0 and t=2 using `render-frame`.

## Status

- Base template with media control exists: `examples/media-test.ectemplate` (bound to PNG).
- Need to create additional test assets. Currently have: logo.png, other.png (both PNG).
- Test execution deferred until pipeline rendering strategy is implemented, or until we can test directly via project mode.

## Matrix

| file            | accepted?         | animated/plays? | alpha preserved? | duration>comp | duration<comp (loop/freeze) | notes  |
| --------------- | ----------------- | --------------- | ---------------- | ------------- | --------------------------- | ------ |
| still.jpg       | TBD               | n/a             | n/a              | n/a           | n/a                         |        |
| transparent.png | TBD (we have PNG) | n/a             | TBD              | n/a           | n/a                         |        |
| anim.gif        | TBD               | TBD             | TBD              | TBD           | TBD                         |        |
| clip.mp4        | TBD               | TBD             | TBD              | TBD           | TBD                         | audio? |
| image.webp      | TBD               | n/a             | TBD              | n/a           | n/a                         |        |

_This file will be completed once pipeline mode is operational._
