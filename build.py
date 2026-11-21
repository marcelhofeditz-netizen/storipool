#!/usr/bin/env python3
"""Erzeugt index.html und die SEO-Tool-Seiten unter /tools aus einer Quelle.
Aufruf: python3 build.py   (danach committen – die Seite ist rein statisch)."""
import json, html, pathlib

ROOT = pathlib.Path(__file__).parent
PARTS = ROOT / "src"

LOGO = '''<svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="#F2B544" stroke-width="2"><rect x="7" y="5" width="18" height="23" rx="2"/><path d="M11 5v23"/><circle cx="18" cy="14" r="1.6" fill="#F2B544"/><circle cx="22" cy="14" r="1.6" fill="#F2B544"/><path d="M17 19q2.5 2 5 0"/><path d="M20 5V2"/><circle cx="20" cy="1.6" r="1.2" fill="#F2B544"/></svg>'''
FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%2315171C'/%3E%3Cg fill='none' stroke='%23F2B544' stroke-width='2'%3E%3Crect x='8' y='6' width='16' height='21' rx='2'/%3E%3Cpath d='M12 6v21'/%3E%3C/g%3E%3Ccircle cx='17' cy='14' r='1.5' fill='%23F2B544'/%3E%3Ccircle cx='21' cy='14' r='1.5' fill='%23F2B544'/%3E%3C/svg%3E"

DOMAIN = "https://www.selfpublishbot.de"

def head(title, desc, extra="", path="/"):
    return f'''<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc)}">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(desc)}">
<meta property="og:type" content="website">
<link rel="canonical" href="{DOMAIN}{path}">
<meta property="og:url" content="{DOMAIN}{path}">
<link rel="icon" href="{FAVICON}">
<link rel="stylesheet" href="/assets/site.css">
{extra}</head>
<body>
<header>
<div class="wrap">
<a class="logo" href="/">{LOGO}<span class="serif">Selfpublishbot</span></a>
<nav aria-label="Hauptnavigation">
<a href="/#buecher">Bücher</a>
<a href="/#autoren">Autoren</a>
<a href="/#tools">Tools</a>
<a class="btn btn-primary" href="/#start">Buch schreiben</a>
</nav>
</div>
</header>
'''

FOOT = '''<footer>
<div class="wrap">
<span>© 2026 Selfpublishbot · Dr. Hofeditz Real Estate GmbH, Hamburg</span>
<span style="display:flex;gap:20px;flex-wrap:wrap"><a href="/#tools">Tools</a><a href="/impressum.html">Impressum</a><a href="/datenschutz.html">Datenschutz</a></span>
</div>
</footer>
'''

ICON = {
 'titel': '<path d="M5 6h14M12 6v13"/>',
 'klappen': '<path d="M5 4h10l4 4v12H5z"/><path d="M9 11h6M9 15h6"/>',
 'cover': '<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M7 18l3-3 3 2 4-4"/>',
 'glied': '<path d="M8 6h11M8 12h11M8 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
 'hoer': '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><rect x="3" y="15" width="4" height="6" rx="1.5"/><rect x="17" y="15" width="4" height="6" rx="1.5"/>',
 'chat': '<path d="M4 5h16v10H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
}
def icon(k):
    return f'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F2B544" stroke-width="1.8" aria-hidden="true">{ICON[k]}</svg>'

TOOLS = json.loads((PARTS / "tools.json").read_text(encoding="utf-8"))

def tool_cards():
    out = []
    for t in TOOLS:
        out.append(f'<a class="tool" href="/tools/{t["slug"]}.html"><span class="ic">{icon(t["icon"])}</span><h3>{html.escape(t["name"])}</h3><p>{html.escape(t["card"])}</p><span class="go">Kostenlos testen →</span></a>')
    return "\n".join(out)

# ---------- Startseite ----------
def build_index():
    page = (PARTS / "index.body.html").read_text(encoding="utf-8")
    page = page.replace("{{TOOLS}}", tool_cards())
    page = page.replace("{{TEMPLATE}}", (PARTS / "leseprobe-rueckkehr.html").read_text(encoding="utf-8"))
    page = page.replace("{{SCRIPT}}", (PARTS / "index.js").read_text(encoding="utf-8"))
    ld = {"@context": "https://schema.org", "@type": "WebApplication", "name": "Selfpublishbot",
          "applicationCategory": "WritingApplication", "inLanguage": "de",
          "description": "Veröffentliche dein eigenes Buch und Hörbuch mit KI – mit kostenlosen Tools für Titel, Klappentext, Cover und Gliederung.",
          "offers": {"@type": "Offer", "price": "0", "priceCurrency": "EUR"}}
    extra = f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>\n'
    doc = head("Selfpublishbot – Veröffentliche dein Buch mit KI",
               "Erzähl dein Buch in einem Satz – der Selfpublishbot macht Titel, Cover, Klappentext und die erste Seite daraus. Kostenlose KI-Tools für Selfpublisher.", extra)
    doc += page + FOOT + '<script src="/assets/covers.js"></script>\n<script src="/assets/app.js"></script>\n<script>\n' + (PARTS / "index.js").read_text(encoding="utf-8") + '\n</script>\n</body>\n</html>\n'
    doc = doc.replace('{{SCRIPT}}', '')
    (ROOT / "index.html").write_text(doc, encoding="utf-8")

# ---------- Tool-Seiten ----------
def build_tool(t):
    others = "".join(f'<a href="/tools/{o["slug"]}.html">{html.escape(o["name"])}</a>' for o in TOOLS if o["slug"] != t["slug"])
    faq_html = "".join(f'<details><summary>{html.escape(q)}</summary><p>{html.escape(a)}</p></details>' for q, a in t["faq"])
    steps = "".join(f'<li>{html.escape(s)}</li>' for s in t["how"])
    tips = "".join(f'<li>{html.escape(s)}</li>' for s in t["tips"])
    ld = [{"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in t["faq"]]},
          {"@context": "https://schema.org", "@type": "WebApplication", "name": t["name"] + " – Selfpublishbot",
           "applicationCategory": "WritingApplication", "inLanguage": "de",
           "offers": {"@type": "Offer", "price": "0", "priceCurrency": "EUR"}}]
    extra = "".join(f'<script type="application/ld+json">{json.dumps(x, ensure_ascii=False)}</script>\n' for x in ld)
    doc = head(t["title"], t["desc"], extra, f'/tools/{t["slug"]}.html')
    doc += f'''<main>
<section class="tp">
<p class="crumb"><a href="/">Selfpublishbot</a> › <a href="/#tools">Tools</a> › {html.escape(t["name"])}</p>
<h1 class="serif">{html.escape(t["h1"])}</h1>
<p class="lede">{html.escape(t["lede"])}</p>
<div class="tbox" id="tool" data-mode="{t["mode"]}">
{t["form"]}
<p class="status" id="st" role="status" aria-live="polite"></p>
<div class="out" id="out"></div>
</div>
</section>
<section class="tp seo">
<h2 class="serif">So funktioniert der {html.escape(t["name"])}</h2>
<ol>{steps}</ol>
<h2 class="serif" style="margin-top:34px">{html.escape(t["tipsTitle"])}</h2>
<ul>{tips}</ul>
<div class="card" style="margin-top:34px"><h2 class="serif" style="margin-top:0">Vom Tool zum fertigen Buch</h2><p>{html.escape(t["bridge"])}</p><div class="row" style="justify-content:flex-start"><a class="btn btn-primary" href="/#bot">Mein Buch in einem Satz starten</a></div></div>
<h2 class="serif" style="margin-top:34px">Häufige Fragen</h2>
<div class="faq">{faq_html}</div>
<h2 class="serif" style="margin-top:34px">Weitere kostenlose Tools</h2>
<div class="more">{others}</div>
</section>
</main>
'''
    doc += FOOT + '<script src="/assets/covers.js"></script>\n<script src="/assets/app.js"></script>\n<script src="/assets/tools.js"></script>\n</body>\n</html>\n'
    (ROOT / "tools" / f'{t["slug"]}.html').write_text(doc, encoding="utf-8")

if __name__ == "__main__":
    (ROOT / "tools").mkdir(exist_ok=True)
    build_index()
    for t in TOOLS:
        build_tool(t)
    urls = ["/"] + [f'/tools/{t["slug"]}.html' for t in TOOLS]
    (ROOT / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(f"<url><loc>{DOMAIN}{u}</loc></url>\n" for u in urls) + "</urlset>\n", encoding="utf-8")
    (ROOT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {DOMAIN}/sitemap.xml\n", encoding="utf-8")
    print("ok:", 1 + len(TOOLS), "Seiten")
