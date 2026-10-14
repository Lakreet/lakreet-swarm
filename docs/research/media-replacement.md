# Media replacement findings (S0-2)

Date: 2026-10-14
EffectCraft version: 0.8.0 (headless)

## How a media control is created

- GUI: Via Essential Graphics panel. Select the footage layer, add Media Replacement via Essential Graphics (Animation → Add Media Replacement or right-click in EG panel).
- CLI: `essential.addMedia` requires an open project/comp with the target layer visible. Parameters: `{ layer, name?, group? }`. Tested: `layer: "#1"` (or layer ID/reference) with project open works. Returns `{ control: <id> }`.

## Manifest after export (`media[]` entry)

Template: `examples/media-test.ectemplate`

```json
{
  "comp": 1,
  "compName": "Comp 1",
  "controls": [
    {
      "group": null,
      "id": 26,
      "item": 2,
      "kind": "media",
      "layer": 3,
      "name": "Logo",
      "type": "media"
    }
  ],
  "media": [
    {
      "files": ["media/2/logo.png"],
      "item": 2
    }
  ],
  "format": "effectcraft-template",
  "version": 1,
  "generator": "EffectCraft 0.8.0",
  "width": 1920,
  "height": 1080,
  "duration": 10.0,
  "frameRate": 30.0
}
```

A media control has `kind: "media"`, `type: "media"`, references `item` and `layer`. The manifest also lists `media[]` mapping template-internal item references to bundled files (stored in ZIP under `media/2/logo.png`).

## Value shape in `--values`

We tried three forms for a media control named "Logo":

| attempt | value                                   | result | error message                                                                                    |
| ------- | --------------------------------------- | ------ | ------------------------------------------------------------------------------------------------ |
| a       | `"examples/assets/other.png"`           | error  | `invalid parameters for 'prop.set': can't use "examples/assets/other.png" for a scalar property` |
| b       | `{"path": "examples/assets/other.png"}` | error  | `invalid parameters for 'prop.set': can't use {"path":"..."} for a scalar property`              |
| c       | `{"item": "other.png"}`                 | error  | `invalid parameters for 'prop.set': can't use {"item":"other.png"} for a scalar property`        |

**All forms failed** with the same error: the CLI's `render --template --values` does **not** accept a file path/object for a media control. It treats the control as expecting a scalar (property value), but media controls require a different binding.

## Behavior (from this test)

- Relative path base: Cannot determine from the failure.
- Missing file: Not tested.
- Aspect ratio mismatch: Not tested (render never succeeded with values).
- Very large image: Not tested.

## Conclusion

**Media cannot be replaced via `--values` in this setup.** The CLI's template rendering path appears to only support scalar control values (text/slider) through `--values`. To swap media per render, an alternative approach is needed (mode pipeline as described in the document: import template to a project, use `essential.set` with media specification, then render from the project).

This matches the document's decision branch: _Media only bisa lewat `essential.set` pada proyek → "mode pipeline"._
