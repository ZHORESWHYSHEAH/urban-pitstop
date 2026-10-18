import matplotlib.pyplot as plt
import matplotlib.patches as patches
from PIL import Image

def generate_architecture_diagram():
    fig, ax = plt.subplots(figsize=(16, 10), dpi=300)
    fig.patch.set_facecolor('#0B0F19')
    ax.set_facecolor('#0B0F19')
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 10)
    ax.axis('off')

    # Color Palette
    c_navy = '#1E293B'
    c_blue = '#2563EB'
    c_cyan = '#0EA5E9'
    c_green = '#10B981'
    c_amber = '#F59E0B'
    c_purple = '#8B5CF6'
    c_text = '#F8FAFC'
    c_subtext = '#94A3B8'
    c_border = '#334155'

    # Title & Header
    ax.text(0.8, 9.4, "Urban Pitstop AI — System Architecture", fontsize=20, fontweight='bold', color=c_text, family='sans-serif')
    ax.text(0.8, 9.05, "Google Cloud AI Builder Cup 2026 | Team Code & Cognition | Hybrid Local-First & Cloud Intelligence", fontsize=11, color=c_cyan, family='sans-serif')

    def draw_card(x, y, w, h, title, subtitle="", border_color=c_border, fill_color=c_navy, badge=""):
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.08,rounding_size=0.15",
                                     linewidth=1.5, edgecolor=border_color, facecolor=fill_color)
        ax.add_patch(rect)
        if title:
            ax.text(x + 0.2, y + h - 0.35, title, fontsize=11, fontweight='bold', color=c_text, family='sans-serif')
        if subtitle:
            ax.text(x + 0.2, y + h - 0.62, subtitle, fontsize=8.5, color=c_subtext, family='sans-serif')
        if badge:
            badge_rect = patches.FancyBboxPatch((x + w - 1.6, y + h - 0.42), 1.4, 0.28,
                                                boxstyle="round,pad=0.04,rounding_size=0.08",
                                                facecolor=c_green if 'LIVE' in badge else c_blue, edgecolor='none')
            ax.add_patch(badge_rect)
            ax.text(x + w - 0.9, y + h - 0.3, badge, fontsize=7.5, fontweight='bold', color='#FFFFFF',
                    ha='center', va='center', family='sans-serif')

    # Layer 1: Client Application (Top Left)
    draw_card(0.8, 5.0, 4.4, 3.6, "1. Client Web App (PWA)", "React 19, TypeScript, Vite 6, Tailwind CSS", c_blue, '#131D31', "LIVE: VERIFIED")
    
    # Client Subcomponents
    items_client = [
        ("Interactive Map HUD", "Leaflet 1.9, CartoDB Positron, Custom SVGs", c_cyan),
        ("Turn-by-Turn Navigation", "In-app routing HUD, access notes, arrival confirm", c_green),
        ("Role Views (RBAC)", "Guest, Delivery Worker, Operator, Admin Console", c_amber),
        ("Local-First Cache & Outbox", "LocalStorage v1, offline queue, instant sync", c_text)
    ]
    for idx, (head, desc, col) in enumerate(items_client):
        cy = 7.3 - idx * 0.68
        r = patches.FancyBboxPatch((1.0, cy), 4.0, 0.55, boxstyle="round,pad=0.04,rounding_size=0.08",
                                  linewidth=1, edgecolor='#2A3850', facecolor='#1E293B')
        ax.add_patch(r)
        ax.text(1.15, cy + 0.32, head, fontsize=8.5, fontweight='bold', color=col)
        ax.text(1.15, cy + 0.12, desc, fontsize=7.2, color=c_subtext)

    # Layer 2: Cloud Edge & Hosting (Top Middle)
    draw_card(5.8, 5.0, 4.4, 3.6, "2. Hosting & Cloud Delivery", "Google Firebase Hosting & Google Cloud", c_green, '#112224', "DEPLOYED")
    items_hosting = [
        ("Firebase Hosting CDN", "gen-lang-client-0072607999.web.app (HTTP 200)", c_green),
        ("SPA Fallback Routing", "firebase.json rewrites: ** -> /index.html", c_cyan),
        ("Cloud Run Container Target", "Multi-stage Dockerfile (Node 20 + Python 3.10)", c_text),
        ("Edge Static Caching", "Pre-gzipped bundles, 30-day immutable assets", c_subtext)
    ]
    for idx, (head, desc, col) in enumerate(items_hosting):
        cy = 7.3 - idx * 0.68
        r = patches.FancyBboxPatch((6.0, cy), 4.0, 0.55, boxstyle="round,pad=0.04,rounding_size=0.08",
                                  linewidth=1, edgecolor='#23403A', facecolor='#132729')
        ax.add_patch(r)
        ax.text(6.15, cy + 0.32, head, fontsize=8.5, fontweight='bold', color=col)
        ax.text(6.15, cy + 0.12, desc, fontsize=7.2, color=c_subtext)

    # Layer 3: AI Orchestration (Top Right)
    draw_card(10.8, 5.0, 4.4, 3.6, "3. Generative AI Engine", "Google Gemini & Deterministic NLP Engine", c_purple, '#1D1933', "ORCHESTRATED")
    items_ai = [
        ("Gemini NL Parser API", "POST /api/ai/parse-request (google-genai SDK)", c_purple),
        ("Constraint Extraction", "Categories, max walk mins, access rules, multi-stop", c_cyan),
        ("Clarification Generator", "Disambiguates complex multi-need requests", c_amber),
        ("Deterministic Fallback", "Local regex/keyword engine when offline (nlpEngine.ts)", c_green)
    ]
    for idx, (head, desc, col) in enumerate(items_ai):
        cy = 7.3 - idx * 0.68
        r = patches.FancyBboxPatch((11.0, cy), 4.0, 0.55, boxstyle="round,pad=0.04,rounding_size=0.08",
                                  linewidth=1, edgecolor='#3B2D5E', facecolor='#201C38')
        ax.add_patch(r)
        ax.text(11.15, cy + 0.32, head, fontsize=8.5, fontweight='bold', color=col)
        ax.text(11.15, cy + 0.12, desc, fontsize=7.2, color=c_subtext)

    # Layer 4: Backend Application Services (Bottom Left)
    draw_card(0.8, 0.8, 6.9, 3.8, "4. FastAPI Application Server & Business Logic", "Python 3.10+, FastAPI v2.0, Uvicorn, Pydantic", c_cyan, '#112233', "BACKEND ENGINE")
    items_backend = [
        ("Spatial Discovery & Reliability Sort", "Haversine distance + Reliability-before-proximity scoring algorithm"),
        ("Trust & Freshness Decay Engine", "Category decay thresholds: Toilets (2.5h), Water (4h), Shade (8h), Break (6h)"),
        ("Contradiction Detection Engine", "Flags conflicting community & operator reports within 3.5h window"),
        ("RBAC & Security Audit Ledger", "Enforces roles (Admin/Op/Worker/Guest) & records immutable audit events")
    ]
    for idx, (head, desc) in enumerate(items_backend):
        cy = 3.6 - idx * 0.68
        r = patches.FancyBboxPatch((1.0, cy), 6.5, 0.55, boxstyle="round,pad=0.04,rounding_size=0.08",
                                  linewidth=1, edgecolor='#23384D', facecolor='#162536')
        ax.add_patch(r)
        ax.text(1.15, cy + 0.32, head, fontsize=8.5, fontweight='bold', color=c_cyan)
        ax.text(1.15, cy + 0.12, desc, fontsize=7.2, color=c_subtext)

    # Layer 5: Database & Persistence Layer (Bottom Right)
    draw_card(8.3, 0.8, 6.9, 3.8, "5. Persistence & Data Models (SQLite WAL Mode)", "server/urban_pitstop.db & SQLite relational schema", c_amber, '#272017', "ACID PERSISTENCE")
    items_db = [
        ("facilities Table (40 records)", "ID, lat/lng, accessibility JSON, operating hours, confidence score, status"),
        ("users Table (RBAC credentials)", "Admin, Operator, Field Worker, password hashes, verified badges, status"),
        ("inspections & reports Tables", "On-site hygiene audits (1-5★), community defect tickets, severity, status"),
        ("operator_registrations & audit_logs", "Partner onboarding applications, immutable chronological security logs")
    ]
    for idx, (head, desc) in enumerate(items_db):
        cy = 3.6 - idx * 0.68
        r = patches.FancyBboxPatch((8.5, cy), 6.5, 0.55, boxstyle="round,pad=0.04,rounding_size=0.08",
                                  linewidth=1, edgecolor='#473722', facecolor='#2B2319')
        ax.add_patch(r)
        ax.text(8.65, cy + 0.32, head, fontsize=8.5, fontweight='bold', color=c_amber)
        ax.text(8.65, cy + 0.12, desc, fontsize=7.2, color=c_subtext)

    # Connecting Arrows
    def draw_arrow(x1, y1, x2, y2, label=""):
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle="->", color=c_cyan, lw=1.8, mutation_scale=14))
        if label:
            mx, my = (x1 + x2) / 2, (y1 + y2) / 2
            ax.text(mx, my + 0.12, label, fontsize=7.5, color='#E2E8F0', fontweight='bold',
                    ha='center', bbox=dict(boxstyle="round,pad=0.15", facecolor='#0F172A', edgecolor=c_border, lw=0.8))

    # Flow arrows
    draw_arrow(5.2, 6.8, 5.8, 6.8, "SPA Assets")
    draw_arrow(10.2, 6.8, 10.8, 6.8, "Prompt & Query")
    draw_arrow(3.0, 5.0, 3.0, 4.6, "REST APIs /api/*")
    draw_arrow(7.7, 2.7, 8.3, 2.7, "SQL CRUD / WAL Transactions")

    # Legend at bottom
    leg_x = 0.8
    leg_y = 0.25
    ax.text(leg_x, leg_y, "LEGEND:", fontsize=8.5, fontweight='bold', color=c_text)
    
    # Implemented box
    r1 = patches.Rectangle((leg_x + 1.0, leg_y - 0.05), 0.3, 0.15, facecolor=c_green, edgecolor='none')
    ax.add_patch(r1)
    ax.text(leg_x + 1.4, leg_y, "Implemented & Verified Live", fontsize=8, color=c_text)

    # Cloud Box
    r2 = patches.Rectangle((leg_x + 4.5, leg_y - 0.05), 0.3, 0.15, facecolor=c_blue, edgecolor='none')
    ax.add_patch(r2)
    ax.text(leg_x + 4.9, leg_y, "Google Cloud & Firebase Hosted", fontsize=8, color=c_text)

    # Planned Box
    r3 = patches.Rectangle((leg_x + 8.4, leg_y - 0.05), 0.3, 0.15, facecolor=c_amber, edgecolor='none')
    ax.add_patch(r3)
    ax.text(leg_x + 8.8, leg_y, "Local-First Persistent Storage", fontsize=8, color=c_text)

    plt.tight_layout()
    output_path = r"c:\Users\gokul\OneDrive\Desktop\urban pitstop\Urban_Pitstop_AI_Architecture.png"
    plt.savefig(output_path, dpi=300, facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print("Saved architecture diagram to:", output_path)

if __name__ == "__main__":
    generate_architecture_diagram()
