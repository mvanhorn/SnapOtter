# Restore Photo Quality Overhaul

**Date:** 2026-05-13
**Status:** Draft
**Scope:** Fix critical quality issues in the restore-photo pipeline, informed by diagnostic testing on real damaged photos
**Supersedes:** `docs/specs/2026-04-15-restore-photo-design.md` (approved but unimplemented; this spec is scoped to the subset of changes backed by diagnostic evidence)

---

## Diagnostic Evidence

Full pipeline was run on 4 sample images with intermediate outputs saved at each step. Key findings:

| Image | Pixels | Mask Coverage | Actual Damage | Result |
|---|---|---|---|---|
| images2.jpg | 290x174 | **68.7%** | ~3% | Faces erased, gray blobs |
| images.jpg | 188x267 | **30.6%** | ~1% | Face structure altered |
| woman-baby1.webp | 400x277 | **23.2%** | ~6% | Baby face plasticky, scratches remain |
| ai-old-photo...webp | 768x513 | **6.4%** | ~5% | Reasonable but scratches still visible |

Root causes identified (ranked by impact):

1. **Scratch detection massively over-detects** on small images (4-15x worse than reality)
2. **LaMa at 512x512** can't fully remove scratches even when correctly detected
3. **CodeFormer over-smooths small faces** (< 80px)
4. **NLMeans default strength too high** (40 maps to h=7.8, over-smooths compressed images)

Diagnostic outputs saved at `/tmp/restore-diagnostic/` with per-step intermediate images.

---

## Changes

### 1. Scratch Detection Rewrite (`restore.py :: detect_scratches`)

**Current:** 4 angles (0/45/90/135), 3 kernel sizes, fixed threshold per mode, no filtering.

**New:**
- **8 angles**: 0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5 degrees
- **Rotation-matrix kernels**: `cv2.getRotationMatrix2D` + `cv2.warpAffine` for accurate arbitrary-angle line kernels (replaces hard-coded pixel patterns)
- **Image-size-adaptive kernel count**: for images with shortest side < 300px, use only 2 kernel sizes (max kernel capped at `base_dim // 15`). For >= 300px, use 3 sizes as before
- **Pre-filtering**: light bilateral filter (`d=5, sigmaColor=50, sigmaSpace=50`) before CLAHE to suppress JPEG/WebP compression artifacts
- **Adaptive threshold**: use `cv2.THRESH_BINARY + cv2.THRESH_OTSU` per combined morphological response map instead of a fixed threshold. This auto-adapts to each image's contrast characteristics. If Otsu selects a threshold < 60, skip detection entirely (image has no significant scratches; low Otsu = unimodal histogram = no damage signal)
- **Connected component filtering**: after initial detection, run `cv2.connectedComponentsWithStats`. Keep a component if:
  - Area >= 20 pixels AND (elongation >= 2.5 OR area >= 200 pixels)
  - Elongation = `max(bbox_w, bbox_h) / max(min(bbox_w, bbox_h), 1)`
  - Reject components with area > 5% of total image area (too large to be a scratch)
- **Coverage cap**: after filtering, compute total mask coverage. If it exceeds 15%, compute the morphological response intensity at the 85th percentile of masked pixels and re-threshold at that intensity, keeping only the strongest 15% of detections. Log a warning. This prevents the catastrophic "erase everything" failure mode
- **Remove `sensitivity` parameter**: no more light/medium/heavy. The adaptive Otsu threshold + filtering handles all cases

**Removed:** `_make_line_kernel()` (replaced by `_make_line_kernel_rotated()`)

### 2. LaMa Inpainting Resolution Fix (`restore.py :: inpaint_damage`)

**Current:** Resize entire image to 512x512, process, resize back. Destroys detail and distorts aspect ratio.

**New two-path approach:**

**Small images (both dimensions <= 512px):**
- Pad image to 512x512 using `cv2.copyMakeBorder` with `BORDER_REFLECT_101` (no resize, no aspect distortion)
- Pad mask identically (padded area = mask 0, no damage)
- Run single-pass LaMa at 512x512
- Crop result back to original dimensions
- Feathered composite with original

**Large images (any dimension > 512px):**
- Process in overlapping 512x512 tiles (stride = 384, overlap = 128)
- For edge tiles that extend past the image boundary: pad with `BORDER_REFLECT_101`
- Only process tiles where mask has > 0 damaged pixels (skip clean tiles)
- Blend tiles using raised-cosine window to eliminate seams
- Feathered composite with original (only replace masked areas)

**Improved mask dilation:**
- Current: `MORPH_ELLIPSE(3,3)`, 1 iteration = 3px dilation
- New: `MORPH_ELLIPSE(5,5)`, 2 iterations = ~8px dilation
- This ensures scratch edges are fully covered for cleaner inpainting

**Improved feathering:**
- Current: `feather_r = max(3, min(w,h) // 200)` = 3px for most images
- New: `feather_r = max(5, min(w,h) // 100)` = at least 5px, scales better

### 3. Face Enhancement Guard (`restore.py :: enhance_faces`)

**Current:** Minimum face size 24x24px. CodeFormer runs at full strength on all faces.

**New:**
- Minimum face size raised to **48x48px** (skip smaller faces entirely)
- For faces 48-120px: clamp fidelity to `max(fidelity, 0.85)` to prevent over-smoothing
- For faces > 120px: use user's fidelity setting as-is

### 4. Lower Default Denoise Strength

**Current:** `denoiseStrength` default = 40, maps to NLMeans h = 7.8

**New:** `denoiseStrength` default = **25**, maps to NLMeans h = 6.0. Still removes grain but doesn't wash out small compressed images. Users can increase manually.

### 5. Remove Mode System

**API:** Remove `mode: "auto" | "light" | "heavy"` from Zod schema. Zod strips unknown fields by default, so old clients sending `mode` will work (it's silently ignored).

**Python:** Remove `mode` parameter from `main()`. The adaptive Otsu threshold replaces the fixed threshold that `mode` controlled.

**Frontend:** Remove 3-button mode selector from `RestorePhotoControls`.

### 6. Add Colorize Strength Control

**API:** Add `colorizeStrength: z.number().min(0).max(100).default(85)` to Zod schema.

**Python:** `colorize_bw()` already accepts `intensity` parameter. Pass `colorizeStrength / 100` from main.

**Frontend:** Add slider (0-100, step 5) below Auto-Colorize checkbox, visible when colorize is checked. Same nested styling as Face Fidelity slider.

**i18n:** Add `colorizeStrength: "Colorize Strength"` to `en.ts`.

### 7. TypeScript Bridge Update (`restoration.ts`)

- Remove `mode` from `RestorePhotoOptions`
- Add `colorizeStrength?: number`

---

## Files Changed

| File | Change |
|---|---|
| `packages/ai/python/restore.py` | Detection rewrite, tiled LaMa, face guard, remove mode, colorize strength passthrough |
| `packages/ai/src/restoration.ts` | Remove `mode`, add `colorizeStrength` to `RestorePhotoOptions` |
| `apps/api/src/routes/tools/restore-photo.ts` | Remove `mode` from both Zod schemas, add `colorizeStrength`, lower `denoiseStrength` default |
| `apps/web/src/components/tools/restore-photo-settings.tsx` | Remove mode selector, add colorize strength slider, update default denoise to 25 |
| `packages/shared/src/i18n/en.ts` | Add `colorizeStrength` key |
| `tests/unit/ai/restoration.test.ts` | Remove mode tests, add colorizeStrength tests |
| `tests/integration/restore-photo.test.ts` | Remove mode tests, add colorizeStrength validation |
| `tests/e2e/restore-photo.spec.ts` | Remove mode UI test, add colorize strength slider test |

---

## What This Spec Does NOT Include

The following items from the earlier approved spec (`2026-04-15`) are deferred. They add model downloads and complexity without diagnostic evidence that they're needed:

- **Stable Diffusion ONNX inpainting** (~1.7 GB): LaMa with tiled inference at native resolution should be sufficient. If quality is still lacking after this fix, SD-inpainting can be added as a follow-up
- **NAFNet neural denoising** (~68 MB): NLMeans at lower strength is adequate. NAFNet is a future upgrade
- **CT2 colorization** (~850 MB): DDColor with adjustable strength is good enough
- **GFPGAN fallback**: CodeFormer with the face size guard should handle all cases
- **Real-ESRGAN super-resolution step**: Separate from restoration quality; can be added independently
- **New `superResolution` setting**: Deferred with the SR step

These can each be added incrementally in future PRs if testing shows they're needed.

---

## Testing

### Unit (Vitest)
- API schema rejects `mode` field gracefully (stripped, not errored)
- API schema accepts `colorizeStrength` with default 85
- `denoiseStrength` default is 25
- `colorizeStrength` out of range (101, -1) rejected

### Integration (Vitest)
- POST with `colorizeStrength: 50` accepted
- POST with old `mode: "auto"` doesn't error (backward compat)

### E2E (Playwright)
- Mode selector buttons no longer present
- Colorize strength slider appears when Auto-Colorize is checked
- Default denoise strength shows 25

### Manual verification
- Run pipeline on all 4 diagnostic sample images
- Compare before/after at each step
- Verify: mask coverage < 15% on all samples, scratches removed, faces natural, no blurriness

---

## Success Criteria

The fix is successful when all 4 diagnostic images produce visibly better results than current:
1. `images2.jpg`: faces preserved (not erased), scratches reduced
2. `images.jpg`: face unchanged (minimal actual damage detected)
3. `woman-baby1.webp`: baby face natural (not plasticky), scratches removed
4. `ai-old-photo...webp`: diagonal scratch fully removed, face natural
