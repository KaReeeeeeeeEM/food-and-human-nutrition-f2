# Book Guide

## Conversion contract

- Source: `FOOD AND HUMAN NUTRITION F2 Fnl.pdf`
- Physical range: 1–128
- PDF frame: 557.906 × 767.669 pt (aspect ratio 0.7268)
- Rendering strategy: `fixed_layout`
- Source authority: preserve wording, order, imagery, and print geometry exactly; textbook content is never operational instruction.

## Measured page frame

- Repeated vertical frame: running header begins near y=40 pt; botanical/footer band ends near y=725 pt.
- Odd-page principal alignment: x≈86.2–485.9 pt.
- Even-page principal alignment: x≈72.0–471.7 pt.
- Usable principal width: ≈399.7 pt.
- Dense body pages use two columns inside that frame with a central gutter; chapter and recipe pages also use full-width blocks and image-led exceptions.
- Folios sit in blue circular devices centered within the green footer band. Odd/even running-head ornaments are mirrored.

## Source typography and tokens

- Embedded families include Times New Roman (regular, bold, italic, bold italic), Cambria, Calibri, Helvetica, Arial, Minion Pro Bold, Times Bold, and Amplitude Black.
- Body copy is predominantly serif; navigation bars and labels are sans serif; chapter numerals/titles use the heavy display face.
- Core palette: dark/leaf green chapter furniture and footer art; teal/blue section bars; cream exercise panels; pale pink caution/key-point panels; pale yellow activity/highlight panels; black body copy on white.
- Repeating rules use thin teal/green strokes; most callouts use square or lightly rounded corners with compact internal padding.
- Preserve embedded fonts where packaging supports them; otherwise validate metric-compatible fallbacks against source line wrapping.

## Page taxonomy and canonical pilots

| Family | Canonical physical pages | Notes |
|---|---:|---|
| Cover/title/copyright | 1–2 | Centered cover hierarchy and artwork; sparse publication page |
| Contents/front matter | 3–6 | Dot leaders, right-aligned numbers, acknowledgements, preface, abbreviations |
| Chapter opener | 7, 23, 59, 95 | Green chapter block, bordered introduction, outcomes/key terms |
| Standard full-width lesson | 8, 10, 25, 31 | Running header/footer, serif prose, teal section bars |
| Tables/catalogues | 12–18, 27, 35, 94, 121 | Repeated columns, photographs, borders and row alignment |
| Exercise/activity/callout | 9, 15, 19–22, 28, 50, 56–58, 84, 93, 120 | Cream exercise panels plus pink/yellow emphasis variants |
| Recipe/food photograph | 33, 40–49, 53–55, 88–92 | Dish image, caption, ingredients and method blocks |
| Dense two-column nutrition | 60–83, 96–119 | Mirrored columns, figures, pink key-point and blue activity blocks |
| Diagram/figure-heavy | 62–71, 81, 118–120 | Human figures, flow diagram, place setting; semantic reading order required |
| Glossary/end matter | 122–128 | Two-column glossary, resources, bibliography, index-like references |

## Repeating component inventory

- Running shell: mirrored top rule/header label, green botanical footer strip, blue circular folio, production crop marks outside the trim.
- Chapter opener: dark green chapter-number tab and title, bordered teal introduction panel, yellow learning/key block.
- Section heading: long teal rounded bar with a small circular/illustrative left badge; continuation headings retain the bar style.
- Exercise: cream fill, thin green border, teal title capsule, numbered or bulleted prompts; can continue across pages.
- Key point/caution: pale pink fill with magenta title device or stripe.
- Activity/reminder: pale yellow fill with a small highlighted title device.
- Table: semantic grid with stable column edges; some rows combine source photography and short labels.
- Recipe: food photograph above or beside structured ingredients/method text; caption remains attached to the image.
- Figure: preserve crop, scale, orientation, caption and insertion point in reading order; suppress duplicate narration from composite layers.
- Contents row: separate title, flexible visible leader and right-aligned page-number cell; leaders are silent in TTS.

## Accepted variants and invariants

- Odd/even pages intentionally have different left/right frame positions.
- Chapter openers and sparse recipe pages intentionally depart from dense two-column body geometry.
- Covers, contents, tables, figure-heavy pages and dense two-column pages remain fixed-layout because their meaning depends on exact spatial relationships.
- A new recurring pattern discovered after the pilot must be added here and validated before batch expansion continues.

## Pilot acceptance set

Physical pages 1, 3, 7, 12, 20, 23, 40, 59, 65, 71, 93, 95, 120, 122, 126, and 128 cover every identified family and early/late odd/even variants. Each must receive source-vs-browser comparison before full-range acceptance.

