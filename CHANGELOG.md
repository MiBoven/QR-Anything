# Changelog

All notable changes to QR Anything are documented here, newest first.

### 0.1.9 — 2026-09-28 — Screen eyedropper for colors
- A 💧 button now appears next to the code, background and frame color fields on browsers that support the native EyeDropper API (Chrome/Edge on desktop) — it lets you sample any color from the whole screen, not just the page. Hidden automatically where unsupported (Firefox, Safari, all mobile browsers)

### 0.1.8 — 2026-09-28 — Consistent spacing, drag & drop, changed markers
- Fixed uneven spacing around the collapsible QR preview card (it used an oversized reserved area for its toggle button); the card now uses the same toggle-row style as the other sections
- The collapsed preview card now shows the label "QR code preview" instead of an empty bar
- More breathing room between a toggle's label/checkbox row and its expanded fields (Adjust style, Logo, Background image, Frame, Title)
- Logo and background image can now be chosen via drag & drop, not just tap-to-browse — same style as JPG75 is Enough
- Any value that differs from its default now shows a small blue dot next to its label (the same label that resets it on click)

### 0.1.7 — 2026-09-28 — Character limit, export menu, collapsible preview
- QR content: a character counter now appears once fewer than 10 characters remain — neutral at 10–6, orange/yellow at 5–0, and red with "X zu viel" once the limit is exceeded. The limit depends on the error-correction level, which is lower when a center logo is enabled (1273 vs. 1663 characters)
- Content that's too long now shows 🥵 in the preview instead of the generic warning icon
- Below the QR code, only "Download PNG" and "Download JPG" remain visible, plus a "⋮" button that opens a menu with "Download SVG", "Copy iframe code" (moved out of the main menu) and the QR-size selector; added spacing between the download row and the QR preview
- The QR preview card can now be collapsed/expanded via a small toggle in its corner

### 0.1.6 — 2026-09-28 — Lightbox, hi-res export, iframe code
- Tapping the QR code opens it centered on a darkened background (like an image viewer); tapping anywhere closes it again
- PNG/JPG can now be downloaded in higher resolution (QR size 600 px by default, up to 4000 px); frame, title and badge scale along
- New "Copy iframe code" entry in the menu: copies an `<iframe>` that displays the QR code as an inline SVG (plain code only, no frame/title/background), ready to paste into a website
- Button label changed to "Download SVG (QR code only)"

### 0.1.5 — 2026-09-28 — Single content field, frame layout
- QR content: more space between the dropdown and the input field
- QR content: only one field is shown at a time. For multi-field types (Wi-Fi, contact, e-mail, SMS) the card shows just a summary (network name, contact name, recipient or number) with a button next to it that opens the full form
- Frame: the "Same as code color" checkbox now sits to the right of the color picker; Thickness and Corner radius share a row below it, followed by Padding and Margin

### 0.1.4 — 2026-09-24 — Frame color sync, steppers, persistence, filenames
- Frame color now has a "Same as code color" checkbox; when on, the color picker is hidden and the frame follows the code color automatically
- Frame's Padding and Margin fields now sit side by side
- All Frame number fields (thickness, padding, margin, corner radius) got +/− stepper buttons, since native number-input arrows aren't always available on mobile
- The entered content (text, link, Wi-Fi, contact, etc.) is now saved locally too, so the QR code reappears correctly after the page reloads (e.g. after switching apps and back) instead of only the style settings
- Downloaded files are now named descriptively instead of always "qrcode": `qr-code--<first 20 characters of the content>`, or for links `qr-code--www--<first 15 characters after the last "#" or "/" (# takes priority)>`

### 0.1.3 — 2026-09-24 — Style toggle, layout & frame refinements
- "Style" renamed to "Adjust style" and made checkbox-toggleable, like the other optional sections — when off, a plain black-on-white square code is used
- Download buttons (PNG/JPG/SVG) moved directly under the QR code; "Run scan test" moved to the very bottom of the page
- Frame gained an adjustable outer margin (space between the frame and the image edge), alongside the existing inside padding
- Color pickers (code, background, frame) now have a paired hex text field for typing an exact HTML color code
- Every adjustable value's label can be clicked to reset that value to its default
- Empty input now shows a friendly placeholder (🐒 + a hint where the code will appear) instead of a blank gray square — an empty string can't actually be encoded as a QR code per the standard, so no fake placeholder content is generated

### 0.1.2 — [DATUM einfügen] — Live preview on mobile
- On phone-sized screens, the live preview now stays pinned at the top of the screen while the rest of the settings scroll underneath, so style changes are visible immediately

### 0.1.1 — 2026-09-22 — Icon path fixes
- Favicon/app-icon references in `index.html` and `manifest.json` corrected to match the suite's folder convention: `favicon-16x16.png`, `favicon-32x32.png` and `apple-touch-icon.png` now live under `/icons/`, while `icon-192.png` and `icon-512.png` stay at the repo root (required for the Chrome install prompt)
- No functional changes to QR generation

### 0.1.0 — 2026-09-21 — Initial release
- Content types: plain text, links, Wi-Fi, vCard, e-mail, phone, SMS
- Dot and corner shape styling, custom code/background colors
- Center logo embedding with automatic high error correction and size cap
- Background image with adjustable visibility
- Software-only scan test via jsQR (no camera)
- Simple frame (color, thickness, radius, padding)
- Title above/below/left/right of the code (fixed font)
- Automatic platform-logo detection (Instagram, YouTube, TikTok, Facebook, X, WhatsApp, LinkedIn, Spotify, GitHub, Pinterest, Snapchat, Threads), toggleable per code
- PNG/JPG export of the full composition; SVG export of the plain styled code
- Settings persisted in localStorage; installable as a PWA
