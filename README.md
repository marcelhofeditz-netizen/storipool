# selfpublishbot
Website des Selfpublishbot (vormals Storipool).

- Quellen: `src/` (Startseite, Tool-Texte in `src/tools.json`), gemeinsame Assets in `assets/`
- Bauen: `python3 build.py` erzeugt `index.html` und `tools/*.html` – danach committen
- KI-Endpunkt: `api/bot.js` (Vercel Function, Vercel AI Gateway per OIDC oder `AI_GATEWAY_API_KEY`); ohne KI greift ein Offline-Fallback im Browser
- 3D-Buch-Bot: `assets/book.glb` (Runway-Bild → 3D, gltf-transform: webp 1024 + quantize), Logik `assets/book3d.js` (Three.js lokal unter `assets/vendor/three`), Cover/Klappentext werden per Raycast auf Vorder-/Rückseite gelegt; Rückfall ohne WebGL: CSS-Buch
