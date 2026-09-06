/**
 * Auto-fit for fixed-layout text entries.
 *
 * Walks every `[data-adt-fit]` element and shrinks its inner
 * `<span style="font-size:..">` runs until `scrollWidth <= clientWidth`
 * and `scrollHeight <= clientHeight`. Two strategies in sequence:
 *
 * 1. Letter-spacing tightening (small, ≤ -0.02em). Handles the
 *    millimetre-scale browser-vs-mupdf glyph metric drift without
 *    visibly cramming characters.
 * 2. Font-size shrink (98% → 50% in 2% steps). The dominant strategy —
 *    a borderline 14%-too-wide title hits 86% font cleanly instead of
 *    being crammed at full size.
 *
 * `data-adt-fs` and `data-adt-fit-ls` cache originals so re-runs
 * (translation swap, content update) restart from a clean baseline.
 *
 * Briefly forces `overflow:visible` while measuring because some
 * browsers cap `scrollHeight` on `overflow:hidden` boxes, which would
 * let `fits()` falsely return true.
 *
 * Loaded by:
 *   - Renderer (packages/pipeline/src/fixed-layout-rendering.ts) into
 *     each fixed-layout page's HTML.
 *   - Studio storyboard preview (apps/studio/.../BookPreviewFrame.tsx)
 *     into the iframe shell, since DOMPurify strips per-page <script>
 *     tags before innerHTML injection.
 *
 * Exposes `window.__adtRunAutoFit()` so callers that swap content
 * (e.g. studio's `injectContent`) can trigger another pass after the
 * new DOM is in place. Idempotent re-entry is safe.
 */
(function () {
  function normalizeText(value) {
    return (value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
  }

  function normalizeTocRows() {
    var rows = document.querySelectorAll("#content [data-adt-fit]")
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].dataset.adtTocRow === "1" && rows[i].querySelector(".adt-toc-leader")) continue
      var original = (rows[i].textContent || "").trim()
      var pattern = /^(.*?)(\.{3,})\s*([ivxlcdm]+|\d+(?:\s*pH)?)$/i
      var sourceSpans = Array.prototype.slice.call(rows[i].children)
      var segmentMatches = sourceSpans.map(function (span) {
        return (span.textContent || "").trim().match(pattern)
      })
      var match = original.match(pattern)
      if (sourceSpans.length > 1 && segmentMatches.every(Boolean)) {
        var stack = document.createDocumentFragment()
        for (var si = 0; si < segmentMatches.length; si++) {
          var row = document.createElement("span")
          row.style.cssText = "display:flex;align-items:baseline;width:100%"
          appendTocCells(row, segmentMatches[si], sourceSpans[si].style.cssText)
          stack.appendChild(row)
        }
        rows[i].setAttribute("aria-label", original)
        rows[i].replaceChildren(stack)
        rows[i].style.display = "block"
        rows[i].dataset.adtTocRow = "1"
        continue
      }
      if (!match) continue
      var sample = rows[i].querySelector("span")
      var inherited = sample ? sample.style.cssText : ""
      rows[i].setAttribute("aria-label", original)
      rows[i].replaceChildren()
      appendTocCells(rows[i], match, inherited)
      rows[i].style.display = "flex"
      rows[i].style.alignItems = "baseline"
      rows[i].dataset.adtTocRow = "1"
    }

    // Use one shared right boundary for every detected TOC row on the page.
    // PDF clustering can differ by a point or two between headings and body
    // rows; independent widths make the number column visibly ragged.
    var tocRows = document.querySelectorAll('#content [data-adt-toc-row="1"]')
    var targetRight = 0
    for (var ti = 0; ti < tocRows.length; ti++) {
      var left = parseFloat(tocRows[ti].style.left)
      var width = parseFloat(tocRows[ti].style.width)
      if (Number.isFinite(left) && Number.isFinite(width)) targetRight = Math.max(targetRight, left + width)
    }
    for (var tj = 0; tj < tocRows.length; tj++) {
      var rowLeft = parseFloat(tocRows[tj].style.left)
      if (Number.isFinite(rowLeft) && targetRight > rowLeft) tocRows[tj].style.width = targetRight - rowLeft + "px"
    }
  }

  function appendTocCells(container, match, inherited) {
    var label = document.createElement("span")
    var leader = document.createElement("span")
    var number = document.createElement("span")
    label.textContent = match[1].trimEnd()
    number.textContent = match[3]
    label.style.cssText = inherited
    leader.style.cssText = inherited + ";flex:1 1 auto;border-bottom:1px dotted currentColor;margin:0 .18em .23em;min-width:.5em"
    leader.className = "adt-toc-leader"
    number.style.cssText = inherited + ";flex:0 0 auto;text-align:right"
    container.append(label, leader, number)
  }

  // Segmented PDF artwork can already contain the text that mupdf also
  // exposes as a positioned paragraph. Packaging later supplies the image
  // caption as `alt`; when that caption contains the same text and the two
  // boxes overlap, keep the paragraph in the accessibility tree but make the
  // duplicate visual paint transparent.
  function suppressRasterDuplicates() {
    function readInset(value) {
      var match = String(value || "").trim().match(/^inset\(([^)]+)\)$/)
      if (!match) return null
      var values = match[1].trim().split(/\s+/).map(function (part) {
        return Number.parseFloat(part)
      })
      if (values.length < 1 || values.length > 4 || values.some(function (n) { return !Number.isFinite(n) })) return null
      if (values.length === 1) return [values[0], values[0], values[0], values[0]]
      if (values.length === 2) return [values[0], values[1], values[0], values[1]]
      if (values.length === 3) return [values[0], values[1], values[2], values[1]]
      return values
    }

    var images = document.querySelectorAll("#content img[alt]")
    var text = document.querySelectorAll("#content p[data-id]")
    for (var i = 0; i < text.length; i++) {
      var phrase = normalizeText(text[i].textContent)
      if (phrase.length < 1) continue
      var tr = text[i].getBoundingClientRect()
      for (var j = 0; j < images.length; j++) {
        if (images[j].dataset.adtRasterPartial === "1") continue
        var description = normalizeText(images[j].getAttribute("alt"))
        var ir = images[j].getBoundingClientRect()
        // getBoundingClientRect() reports the element's unclipped box. The
        // fixed-layout renderer clips composite crops to exclude semantic
        // prose; duplicate detection must compare against the pixels that
        // remain visible, otherwise it hides text outside the crop.
        var clip = images[j].style.clipPath || window.getComputedStyle(images[j]).clipPath || ""
        var inset = readInset(clip)
        if (inset) {
          var cssWidth = Number.parseFloat(images[j].style.width) || ir.width
          var scale = cssWidth > 0 ? ir.width / cssWidth : 1
          var clipTop = inset[0] * scale
          var clipBottom = inset[2] * scale
          ir = {
            left: ir.left,
            right: ir.right,
            top: ir.top + clipTop,
            bottom: ir.bottom - clipBottom,
            width: ir.width,
            height: Math.max(0, ir.height - clipTop - clipBottom)
          }
        }
        var overlaps = tr.left < ir.right && tr.right > ir.left && tr.top < ir.bottom && tr.bottom > ir.top
        var intersectionWidth = Math.max(0, Math.min(tr.right, ir.right) - Math.max(tr.left, ir.left))
        var intersectionHeight = Math.max(0, Math.min(tr.bottom, ir.bottom) - Math.max(tr.top, ir.top))
        var horizontalCoverage = intersectionWidth / Math.max(1, tr.width)
        var verticalCoverage = intersectionHeight / Math.max(1, tr.height)
        var fullyContained = verticalCoverage >= 0.75 && horizontalCoverage >= 0.5
        var rasterizedText = images[j].dataset.adtRasterText === "1"
        var evidencedByCaption = phrase.length >= 4 && description.includes(phrase)
        // A partial page crop can overlap the centre of a longer semantic
        // line while omitting its beginning or end. Hiding that paragraph
        // makes the omitted fragment disappear. Raster crops suppress text
        // only when they contain the whole text box; a matching caption is
        // still independent evidence that a complete duplicate is painted.
        if (!overlaps || (!(rasterizedText && fullyContained) && !evidencedByCaption)) continue
        text[i].style.opacity = "0"
        text[i].dataset.adtRasterDuplicate = "1"
        break
      }
    }
  }

  // Repair two recurring forms of damaged PDF block geometry before fitting:
  // long body paragraphs occasionally inherit a half-column or over-wide
  // block, while a table word can inherit a one-pixel block from a vertical
  // rule. The source books use a mirrored main text frame; normalising only
  // clearly anomalous long blocks to that frame preserves intentional narrow
  // labels, formulae, captions, and multi-column matter.
  function normalizeFixedTextGeometry() {
    var content = document.querySelector("#content")
    if (!content) return
    var contentWidth = parseFloat(content.style.width) || content.clientWidth
    var paragraphs = Array.prototype.slice.call(content.querySelectorAll("p[data-id]"))
    var rightColumnCount = paragraphs.filter(function (paragraph) {
      var paragraphLeft = Number.parseFloat(paragraph.style.left)
      return Number.isFinite(paragraphLeft) && paragraphLeft > contentWidth * 0.52 && (paragraph.textContent || "").trim().length >= 20
    }).length
    var hasRightColumn = rightColumnCount >= 2
    for (var i = 0; i < paragraphs.length; i++) {
      var el = paragraphs[i]
      var left = parseFloat(el.style.left)
      var width = parseFloat(el.style.width)
      var phrase = (el.textContent || "").trim()
      if (!Number.isFinite(left) || !Number.isFinite(width)) continue

      var mirroredWidth = contentWidth - left * 2
      var inMainTextBand = left >= contentWidth * 0.13 && left <= contentWidth * 0.19
      var anomalousBodyWidth = width < contentWidth * 0.58 || width > contentWidth * 0.78
      if (!hasRightColumn && phrase.length >= 80 && inMainTextBand && anomalousBodyWidth && mirroredWidth > 0) {
        el.style.width = Math.round(mirroredWidth) + "px"
        el.dataset.adtGeometryNormalized = "body"
        continue
      }

      if (width > 4 || phrase.length === 0) continue
      var top = parseFloat(el.style.top)
      var nextLeft = Infinity
      for (var j = 0; j < paragraphs.length; j++) {
        if (paragraphs[j] === el) continue
        var otherTop = parseFloat(paragraphs[j].style.top)
        var otherLeft = parseFloat(paragraphs[j].style.left)
        if (!Number.isFinite(otherTop) || !Number.isFinite(otherLeft)) continue
        if (Math.abs(otherTop - top) <= 2 && otherLeft > left + 4 && otherLeft < nextLeft) nextLeft = otherLeft
      }
      var repaired = Number.isFinite(nextLeft)
        ? nextLeft - left - 4
        : contentWidth - left - Math.max(24, contentWidth * 0.13)
      if (repaired >= 16) {
        el.style.width = Math.round(repaired) + "px"
        el.dataset.adtGeometryNormalized = "cell"
      }
    }
  }

  // Keep one visual paint when PDF extraction emits the same positioned text
  // leaf twice. The later leaf remains in the accessibility tree but becomes
  // transparent, matching the raster-duplicate policy above.
  function suppressSemanticDuplicates() {
    var paragraphs = document.querySelectorAll("#content p[data-id]")
    for (var i = 0; i < paragraphs.length; i++) {
      var phrase = normalizeText(paragraphs[i].textContent)
      if (phrase.length < 1 || paragraphs[i].dataset.adtSemanticDuplicate === "1") continue
      var a = paragraphs[i].getBoundingClientRect()
      for (var j = i + 1; j < paragraphs.length; j++) {
        if (normalizeText(paragraphs[j].textContent) !== phrase) continue
        var b = paragraphs[j].getBoundingClientRect()
        if (Math.abs(a.left - b.left) > 2 || Math.abs(a.top - b.top) > 2) continue
        paragraphs[j].style.opacity = "0"
        paragraphs[j].dataset.adtSemanticDuplicate = "1"
      }
    }
  }

  function targets(el) {
    var t = []
    if (el.style.fontSize) t.push(el)
    var inner = el.querySelectorAll('[style*="font-size"]')
    for (var i = 0; i < inner.length; i++) t.push(inner[i])
    return t
  }

  function fit(el) {
    var ts = targets(el)
    for (var i = 0; i < ts.length; i++) {
      var t = ts[i]
      if (!t.dataset.adtFs) t.dataset.adtFs = parseFloat(t.style.fontSize)
      t.style.fontSize = t.dataset.adtFs + "px"
    }
    var origLs
    if (el.dataset.adtFitLs !== undefined) {
      origLs = parseFloat(el.dataset.adtFitLs)
    } else {
      var ls = getComputedStyle(el).letterSpacing
      origLs = ls === "normal" ? 0 : parseFloat(ls) || 0
      el.dataset.adtFitLs = origLs
    }
    el.style.letterSpacing = origLs ? origLs + "px" : "normal"
    // Browsers report `scrollHeight` including each line's natural glyph
    // extent — for a typical serif at line-height = font-size, that's
    // ~1.2× per line (ascent + descent + lineGap). mupdf's geometric
    // block bottom is the baseline of the last line, so a tight
    // `bottom - top` undershoots the rendered extent by ~0.2× line-height
    // per line. Tolerate that overhead, scaled by the estimated line count
    // (clientHeight / line-height). One genuine extra wrapped line still
    // overshoots tolerance by ~0.75× line-height, so true overflow is caught.
    var lineHeightStr = getComputedStyle(el).lineHeight
    var lineHeight = lineHeightStr === "normal"
      ? parseFloat(getComputedStyle(el).fontSize) * 1.2
      : parseFloat(lineHeightStr)
    if (!Number.isFinite(lineHeight) || lineHeight <= 0) lineHeight = 16
    // A fixed-layout PDF leaf is a visual line, and some PDF producers give
    // multi-run lines (notably formulas with subscripts) a bogus width based
    // on only one run. Shrinking a line that is several times wider than that
    // box makes it unreadably small. Preserve its extracted font size and let
    // the positioned line extend naturally; ordinary metric drift and genuine
    // near-fit boxes continue through the fitter below.
    if (getComputedStyle(el).whiteSpace === "nowrap" && el.clientWidth > 0 && el.scrollWidth > el.clientWidth * 3) return
    function fits() {
      var nLines = Math.max(1, Math.round(el.clientHeight / lineHeight))
      var heightTolerance = nLines * lineHeight * 0.25
      return (
        el.scrollWidth <= el.clientWidth + 0.5 &&
        el.scrollHeight <= el.clientHeight + heightTolerance
      )
    }
    if (fits()) return
    var refFs = 0
    for (var ri = 0; ri < ts.length; ri++) {
      var v = parseFloat(ts[ri].dataset.adtFs)
      if (v > refFs) refFs = v
    }
    if (!refFs) refFs = parseFloat(getComputedStyle(el).fontSize)
    // Step 1: small letter-spacing tightening (-0.02em max).
    for (var k = 1; k <= 4; k++) {
      el.style.letterSpacing = origLs - refFs * 0.005 * k + "px"
      if (fits()) return
    }
    // Step 2: font-size shrink, dominant strategy (98% → 50%).
    for (var s = 98; s >= 50; s -= 2) {
      var scale = s / 100
      for (var m = 0; m < ts.length; m++) {
        ts[m].style.fontSize = parseFloat(ts[m].dataset.adtFs) * scale + "px"
      }
      el.style.letterSpacing = (origLs - refFs * 0.02) * scale + "px"
      if (fits()) return
    }
    // Reached the floor without fitting — restore originals. Content
    // that won't fit even at 50% is usually a browser font-fallback
    // issue, not a translation-length issue. A barely-overflowing line
    // at original size is more readable than a 5.75 px line that fits;
    // the renderer keeps `overflow: visible` on text entries so the
    // spill is shown, not clipped.
    for (var rs = 0; rs < ts.length; rs++) {
      ts[rs].style.fontSize = ts[rs].dataset.adtFs + "px"
    }
    el.style.letterSpacing = origLs ? origLs + "px" : "normal"
  }

  window.__adtRunAutoFit = function () {
    normalizeTocRows()
    suppressRasterDuplicates()
    suppressSemanticDuplicates()
    var els = document.querySelectorAll("[data-adt-fit]")
    for (var i = 0; i < els.length; i++) fit(els[i])
  }

  // Run schedule:
  //   1. As soon as the DOM is ready (initial pass against whatever
  //      font the browser has at parse time — typically a system
  //      fallback while declared @font-face faces are still fetching).
  //   2. After `document.fonts.ready` resolves, then double-rAF so the
  //      browser paints the swapped font BEFORE we measure. Single rAF
  //      fires *before* the next paint, which is enough to reflow
  //      layout but can still return pre-swap metrics in some browsers.
  //   3. Whenever the FontFaceSet finishes another batch of loads
  //      (`loadingdone`) — handles fonts that finish after the initial
  //      `fonts.ready` resolves (e.g. faces declared in stylesheets that
  //      parsed late, or fonts referenced by content injected after
  //      first paint). Without this listener, `fonts.ready` resolves
  //      once and never re-fires, so any later swap leaves us measuring
  //      against the pre-swap fallback.
  //
  // Each invocation is idempotent (caches originals on `data-adt-fs`
  // / `data-adt-fit-ls`, resets to those before re-evaluating), so
  // multiple runs converge to the same final result.
  function runAfterPaint() {
    requestAnimationFrame(function () {
      requestAnimationFrame(window.__adtRunAutoFit)
    })
  }
  function scheduleRuns() {
    window.__adtRunAutoFit()
    if (document.fonts) {
      if (document.fonts.ready) {
        document.fonts.ready.then(runAfterPaint)
      }
      if (document.fonts.addEventListener) {
        document.fonts.addEventListener("loadingdone", runAfterPaint)
      }
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleRuns)
  } else {
    scheduleRuns()
  }
  // Raster dimensions may still be zero during the DOM/font passes. Re-run
  // once every page image has loaded so overlap-based duplicate suppression
  // reliably removes semantic paint already present in page-crop artwork.
  window.addEventListener("load", runAfterPaint)
})()
