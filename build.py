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
<link rel="preload" href="/assets/fonts/cormorant-garamond-latin-600-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/site.css">
<link rel="stylesheet" href="/assets/magic.css">
<meta name="theme-color" content="#0B0A12">
{extra}</head>
<body>
<header>
<div class="wrap">
<a class="logo" href="/">{LOGO}<span class="serif">Selfpublishbot</span></a>
<nav aria-label="Hauptnavigation">
<a href="/#buecher">Das Regal</a>
<a href="/#bestenliste">Bestenliste</a>
<a href="/#autoren">Chronisten</a>
<a href="/#tools">Werkzeuge</a>
<a href="/preise.html">Preise</a>
<a href="/bibliotheksordnung.html">Ordnung</a>
<a class="btn btn-primary" href="/#bot">Buch schreiben</a>
</nav>
</div>
</header>
'''

FOOT = '''<footer>
<div class="wrap">
<span>© 2026 Selfpublishbot · Die Bibliothek der erzählten Leben · Dr. Hofeditz Real Estate GmbH, Hamburg</span>
<span style="display:flex;gap:20px;flex-wrap:wrap"><a href="/#tools">Tools</a><a href="/preise.html">Preise</a><a href="/bibliotheksordnung.html">Bibliotheksordnung</a><a href="/impressum.html">Impressum</a><a href="/datenschutz.html">Datenschutz</a></span>
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
        out.append(f'<a class="tool" href="/tools/{t["slug"]}.html"><span class="ic">{icon(t["icon"])}</span><h3>{html.escape(t["name"])}</h3><p>{html.escape(t["card"])}</p><span class="go">Werkzeug nehmen →</span></a>')
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
    doc += page + FOOT + '<script type="importmap">{"imports":{"three":"/assets/vendor/three/three.module.js","three/addons/":"/assets/vendor/three/addons/"}}</script>\n<script type="module" src="/assets/book3d.js?v=5"></script>\n<script src="/assets/covers.js"></script>\n<script src="/assets/magic.js"></script>\n<script src="/assets/app.js"></script>\n<script>\n' + (PARTS / "index.js").read_text(encoding="utf-8") + '\n</script>\n</body>\n</html>\n'
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
    doc += FOOT + '<script src="/assets/covers.js"></script>\n<script src="/assets/magic.js"></script>\n<script src="/assets/app.js"></script>\n<script src="/assets/tools.js"></script>\n</body>\n</html>\n'
    (ROOT / "tools" / f'{t["slug"]}.html').write_text(doc, encoding="utf-8")

# ---------- Bibliotheksordnung ----------
def build_ordnung():
    seals = "".join(f'<div class="it"><span class="seal s{a} big"><span><small>AB</small>{a}</span></span><b>{n}</b><span>{d}</span></div>' for a, n, d in [
        (0, "Für alle", "Keine Ängste, keine Gewalt."), (6, "Ab 6", "Leichte Spannung, kindgerecht aufgelöst."),
        (12, "Ab 12", "Ernste Themen, Verlust, Streit – ohne drastische Details."),
        (16, "Ab 16", "Gewalt, Rausch, Horror, seelische Abgründe, Andeutungen unter Erwachsenen."),
        (18, "Ab 18", "Drastische Gewalt, explizite einvernehmliche Szenen unter Erwachsenen. Nur nach Altersprüfung.")])
    body = f"""<main class="law">
<p class="crumb"><a href="/">Selfpublishbot</a> › Bibliotheksordnung</p>
<p class="eyebrow">Die Bibliothek der erzählten Leben</p>
<h1 class="serif">Die Bibliotheksordnung</h1>
<p>Jede Geschichte darf erzählt werden – aber nicht jede gehört ins öffentliche Regal. Diese Ordnung regelt, wie Bücher eingeordnet werden, was wir nicht aufnehmen und wie Bewertungen funktionieren. Stand: November 2026.</p>

<h2 class="serif">1. Das Siegel: Altersempfehlung für jedes Buch</h2>
<p>Bevor ein Buch ins öffentliche Regal kommt, liest die KI der Bibliothek den Text, ordnet Genre und Inhalte ein und vergibt ein Siegel. Das Siegel ist eine eigene Empfehlung der Bibliothek – keine amtliche Freigabe und keine Kennzeichnung der FSK oder USK.</p>
<div class="seals">{seals}</div>
<p>Zusätzlich nennt die KI Inhaltshinweise (z. B. „Gewalt“, „Verlust“, „Rausch“), damit Leserinnen und Leser vorher wissen, worauf sie sich einlassen. Ist sich die KI unsicher, liest ein Mensch gegen, bevor das Buch erscheint. Bücher mit dem Siegel „ab 18“ werden erst nach einer Altersprüfung zugänglich.</p>

<h2 class="serif">2. Was nie ins Regal kommt</h2>
<div class="box no"><h3>Absolute Grenzen</h3><ul>
<li>Jede sexuelle oder sexualisierte Darstellung von Minderjährigen – auch fiktiv, auch angedeutet.</li>
<li>Pornografie sowie sexuelle Inhalte über reale, erkennbare Personen.</li>
<li>Anleitungen zum Bau von Waffen oder Sprengstoff, zur Herstellung von Drogen, zu Selbstverletzung oder Suizid.</li>
<li>Verherrlichung von Terror, Völkermord oder Gewalt gegen Menschengruppen.</li>
<li>Hetze gegen Menschen wegen Herkunft, Religion, Geschlecht, Behinderung oder sexueller Orientierung.</li>
<li>Bloßstellung, Verleumdung oder private Daten realer Privatpersonen ohne deren Einverständnis.</li>
<li>Kopien fremder, urheberrechtlich geschützter Werke.</li>
</ul></div>
<div class="box"><h3>Erlaubt, mit passendem Siegel</h3><ul>
<li>Schweres im eigenen Leben: Krankheit, Sucht, Trauer, Gewalt, die man erlebt hat – ehrlich erzählt, ohne Anleitung.</li>
<li>Krimis, Thriller und Horror mit Gewalt im Dienst der Geschichte.</li>
<li>Liebe und Sexualität unter Erwachsenen – angedeutet ab 16, explizit nur ab 18 und nach Altersprüfung.</li>
<li>Kritik an Personen des öffentlichen Lebens, Firmen und Institutionen, solange sie auf Tatsachen beruht.</li>
</ul></div>

<h2 class="serif">3. Echte Menschen in deinem Buch</h2>
<p>Lebensgeschichten handeln von echten Menschen. Für das öffentliche Regal macht die KI Namen von Privatpersonen vorher unkenntlich. Wer sich in einem Buch erkennt und verletzt fühlt, kann sich jederzeit an uns wenden – wir prüfen das Buch dann von Hand.</p>

<h2 class="serif">4. Sterne, Rezensionen und die Bestenliste</h2>
<ul>
<li>Jede Leserin und jeder Leser vergibt 1 bis 5 Sterne – eine Stimme je Gerät und Buch. Wer erneut bewertet, ändert seine eigene Stimme.</li>
<li>Rezensionen erscheinen öffentlich. Beleidigungen, Werbung, Spam und persönliche Angriffe auf Autorinnen und Autoren entfernen wir.</li>
<li>Die Bestenliste sortiert nach einer gewichteten Sternewertung: Wenige Stimmen zählen weniger, damit ein einzelnes Lob nicht für Platz 1 reicht.</li>
<li>Gekaufte oder selbst geschriebene Bewertungen sind verboten und führen zum Ausschluss des Buchs aus der Bestenliste.</li>
</ul>

<h2 class="serif">5. Melden</h2>
<p>Du hast ein Buch oder eine Rezension gefunden, die gegen diese Ordnung verstößt? Schreib uns an <a href="mailto:marcel@offmarketpool.com?subject=Meldung%20Selfpublishbot">marcel@offmarketpool.com</a> mit dem Titel des Buchs. Wir prüfen jede Meldung.</p>
</main>
"""
    doc = head("Bibliotheksordnung – Selfpublishbot", "Wie die Bibliothek Bücher einordnet: Altersempfehlung ab 0, 6, 12, 16 und 18, Inhaltshinweise, was nie ins Regal kommt und wie Sterne und Bestenliste funktionieren.", "", "/bibliotheksordnung.html")
    doc += body + FOOT + '<script src="/assets/magic.js"></script>\n</body>\n</html>\n'
    (ROOT / "bibliotheksordnung.html").write_text(doc, encoding="utf-8")

# ---------- Preise ----------
def vormerken(paket):
    import urllib.parse
    q = urllib.parse.quote
    return ("mailto:marcel@offmarketpool.com?subject=" + q("Selfpublishbot – " + paket + " vormerken")
            + "&body=" + q("Ich möchte das Paket „" + paket + "“ zum Start vormerken.\n\nWorum geht es in meinem Buch (ein Satz):\n"))

PAKETE = [
 ("E-Book", "29 €", "einmalig", "Dein Buch als E-Book in der Welt.", [
   "Eigene ISBN", "E-Book als EPUB und PDF", "Platz im öffentlichen Regal mit Siegel",
   "Listung bei Amazon Kindle, Apple Books und Tolino", "Verkauf im Regal – 70 % für dich"], False),
 ("Hörbuch", "79 €", "einmalig", "Dein Buch zum Hören – mit einer Stimme, die zu ihm passt.", [
   "Alles aus dem E-Book-Paket", "Komplettes Hörbuch mit KI-Stimme deiner Wahl", "Kapitelmarken und Hörprobe fürs Regal",
   "MP3-Download für dich und deine Leute", "Verteilung an Hörbuch-Plattformen, soweit sie KI-Stimmen zulassen"], True),
 ("Komplett", "199 €", "einmalig", "E-Book, Hörbuch und gedrucktes Buch – das volle Werk.", [
   "Alles aus dem Hörbuch-Paket", "Druckvorlage mit Buchrücken und Rückseite",
   "Taschenbuch und Hardcover im Buchhandel bestellbar (Print on Demand)", "Ein gedrucktes Hardcover für dein eigenes Regal",
   "Ein Mensch liest gegen, bevor es erscheint"], False),
]

PREIS_FAQ = [
 ("Was kostet das Schreiben?", "Nichts. Du erzählst dem Zauberbuch deine Geschichte, überarbeitest sie, lässt dir Cover und Klappentext machen – alles kostenlos. Bezahlt wird erst, wenn du dein Buch veröffentlichst oder drucken lässt."),
 ("Wem gehören die Rechte an meinem Buch?", "Dir. Du räumst der Bibliothek nur das Recht ein, dein Buch im Regal zu zeigen und in deinem Auftrag zu vertreiben. Du kannst es jederzeit zurückziehen und auch woanders veröffentlichen – nichts ist exklusiv."),
 ("Wie werde ich bezahlt, wenn Leser mein Buch kaufen?", "Du legst den Preis fest. Von jedem Verkauf im Regal gehen 70 % an dich, 30 % behält die Bibliothek für Betrieb, Zahlungsabwicklung und Reichweite. Abgerechnet wird monatlich."),
 ("Was passiert im Scout-Programm?", "Bücher, die in der Bestenliste oben stehen, stellen wir gemeinsam mit unserer Partneragentur Verlagen sowie Hörspiel- und Filmproduktionen vor. Für dich kostet das nichts. Nur wenn ein Vertrag zustande kommt, fällt eine Provision von 15 % auf deine Honorare an – wie bei einer Literaturagentur üblich."),
 ("Ab wann kann ich buchen?", "Der Selfpublishbot öffnet seine Türen mit dem Alpha-Start. Wer sich jetzt vormerkt, bekommt als Erstes eine Einladung."),
 ("Sind die Preise inklusive Mehrwertsteuer?", "Ja, alle Preise sind Endpreise inklusive 19 % MwSt. Beim Geschenkbuch ist der Versand innerhalb Deutschlands enthalten."),
]

def build_preise():
    cards = ""
    for name, preis, art, claim, items, top in PAKETE:
        li = "".join("<li>" + html.escape(i) + "</li>" for i in items)
        badge = '<span class="pbadge">Beliebt</span>' if top else ""
        cls = "pcard top" if top else "pcard"
        btn = "btn-primary" if top else "btn-ghost"
        cards += (f'<div class="{cls}">{badge}<h3 class="serif">{name}</h3><p class="pp"><b>{preis}</b> <span>{art}</span></p>'
                  f'<p class="pc">{html.escape(claim)}</p><ul>{li}</ul>'
                  f'<a class="btn {btn}" href="{html.escape(vormerken(name))}">Zum Start vormerken</a></div>')
    faq_html = "".join(f'<details><summary>{html.escape(q)}</summary><p>{html.escape(a)}</p></details>' for q, a in PREIS_FAQ)
    ld = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in PREIS_FAQ]}
    gift = html.escape(vormerken("Geschenkbuch"))
    body = f"""<main>
<section class="wrap" style="padding-top:40px">
<p class="crumb"><a href="/">Selfpublishbot</a> › Preise</p>
<p class="eyebrow">Preise</p>
<h1 class="serif" style="font-size:46px;margin:0;max-width:820px;line-height:1.1">Schreiben ist kostenlos. Du zahlst erst, wenn dein Buch in die Welt geht.</h1>
<p class="lead">Erzähl dem Zauberbuch deine Geschichte, so oft du willst. Erst beim Veröffentlichen, Vertonen oder Drucken wählst du ein Paket – einmalig, ohne Abo.</p>
<div class="pgrid">{cards}</div>
</section>

<section id="geschenk" class="wrap block">
<div class="card gift">
<p class="eyebrow">Das Geschenkbuch</p>
<h2 class="serif">Schenk ein Jahr. Gebunden.</h2>
<p>Mach aus deinem letzten Jahr ein Buch und leg es Freunden unter den Baum. Oder schreib mit der Oma ihr Leben auf, mit den Eltern die Geschichte eurer Familie, zur Hochzeit eure Geschichte zu zweit.</p>
<ul class="glist"><li>Hardcover mit deinem Cover und Lesebändchen</li><li><b>49 €</b> pro Exemplar inkl. Versand in Deutschland</li><li>Ab 5 Exemplaren <b>39 €</b> pro Stück – für die ganze Familie</li><li>Auf Wunsch mit persönlicher Widmung auf der ersten Seite</li></ul>
<div class="row" style="justify-content:flex-start"><a class="btn btn-primary" href="{gift}">Geschenkbuch vormerken</a></div>
</div>
</section>

<section class="wrap block">
<p class="eyebrow">Mit deinem Buch verdienen</p>
<h2 class="h serif">Das Regal zahlt dich aus. Und manchmal öffnet es Türen.</h2>
<div class="two" style="margin-top:28px">
<div class="card"><h2 class="serif">70 % für dich</h2><p>Stell dein Buch ins öffentliche Regal und leg deinen Preis fest. Leseprobe und Hörprobe bleiben für alle frei – wer weiterlesen oder weiterhören will, kauft. Von jedem Verkauf gehen 70 % an dich, monatlich abgerechnet.</p></div>
<div class="card"><h2 class="serif">Das Scout-Programm</h2><p>Die Bücher, die in der Bestenliste ganz oben stehen, stellen wir gemeinsam mit unserer Partneragentur Verlagen und Produktionen für Hörspiel, Film und Serie vor. Für dich kostenlos – nur bei Vertrag 15 % Provision, wie bei einer Literaturagentur üblich. Deine Rechte bleiben deine.</p></div>
</div>
</section>

<section class="tp seo" style="padding-top:72px">
<h2 class="serif">Häufige Fragen</h2>
<div class="faq">{faq_html}</div>
</section>
</main>
"""
    doc = head("Preise – Selfpublishbot: Buch kostenlos schreiben, ab 29 € veröffentlichen",
               "Buch mit KI kostenlos schreiben und erst beim Veröffentlichen zahlen: E-Book 29 €, Hörbuch 79 €, Komplett mit Druck 199 €, Geschenkbuch als Hardcover ab 39 €. 70 % für Autor:innen.",
               '<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False) + '</script>\n', "/preise.html")
    doc += body + FOOT + '<script src="/assets/magic.js"></script>\n</body>\n</html>\n'
    (ROOT / "preise.html").write_text(doc, encoding="utf-8")

if __name__ == "__main__":
    (ROOT / "tools").mkdir(exist_ok=True)
    build_index()
    build_ordnung()
    build_preise()
    for t in TOOLS:
        build_tool(t)
    urls = ["/", "/preise.html", "/bibliotheksordnung.html"] + [f'/tools/{t["slug"]}.html' for t in TOOLS]
    (ROOT / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(f"<url><loc>{DOMAIN}{u}</loc></url>\n" for u in urls) + "</urlset>\n", encoding="utf-8")
    (ROOT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {DOMAIN}/sitemap.xml\n", encoding="utf-8")
    print("ok:", 1 + len(TOOLS), "Seiten")
