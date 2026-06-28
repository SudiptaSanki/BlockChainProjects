import os
import shutil
import random

base_dir = r"d:\My Projects\Stellar ALL Projects"

fonts = [
    "'Roboto', sans-serif", "'Playfair Display', serif", "'Space Mono', monospace",
    "'Outfit', sans-serif", "'Montserrat', sans-serif", "'Nunito', sans-serif",
    "'Poppins', sans-serif", "'Oswald', sans-serif", "'Raleway', sans-serif", "'Lato', sans-serif"
]

themes = [
    {"mode": "light", "bg": "#f8fafc", "card": "#ffffff", "text": "#1e293b", "primary": "#3b82f6"},
    {"mode": "dark", "bg": "#0f172a", "card": "#1e293b", "text": "#f8fafc", "primary": "#8b5cf6"},
    {"mode": "dark-neon", "bg": "#000000", "card": "#111111", "text": "#ffffff", "primary": "#22d3ee"},
    {"mode": "light-warm", "bg": "#fffbeb", "card": "#ffffff", "text": "#451a03", "primary": "#d97706"},
    {"mode": "dark-forest", "bg": "#064e3b", "card": "#065f46", "text": "#ecfdf5", "primary": "#10b981"},
    {"mode": "image-bg", "bg": "url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop') center/cover no-repeat", "card": "rgba(255,255,255,0.85)", "text": "#000000", "primary": "#ec4899"},
    {"mode": "image-bg-dark", "bg": "url('https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2000&auto=format&fit=crop') center/cover no-repeat", "card": "rgba(0,0,0,0.75)", "text": "#ffffff", "primary": "#facc15"}
]

button_styles = [
    {"name": "flat", "css": "border: none !important; border-radius: 4px !important; box-shadow: none !important;"},
    {"name": "rounded", "css": "border: none !important; border-radius: 9999px !important; box-shadow: 0 4px 6px rgba(0,0,0,0.1) !important;"},
    {"name": "neon", "css": "border: 1px solid var(--primary-color) !important; border-radius: 8px !important; box-shadow: 0 0 10px var(--primary-color), inset 0 0 5px var(--primary-color) !important; background: transparent !important; color: var(--primary-color) !important;"},
    {"name": "glass", "css": "background: rgba(255,255,255,0.1) !important; backdrop-filter: blur(10px) !important; border: 1px solid rgba(255,255,255,0.2) !important; border-radius: 12px !important;"},
    {"name": "neumorphism", "css": "border-radius: 12px !important; background: var(--bg-main) !important; box-shadow: 5px 5px 10px #c8c8c8, -5px -5px 10px #ffffff !important; color: var(--primary-color) !important;"}
]

def remove_dir_safely(path):
    if os.path.exists(path) and os.path.isdir(path):
        shutil.rmtree(path, ignore_errors=True)

def remove_file_safely(path):
    if os.path.exists(path) and os.path.isfile(path):
        os.remove(path)

# Find all 20 project folders
projects = [d for d in os.listdir(base_dir) if os.path.isdir(os.path.join(base_dir, d)) and d[0].isdigit()]
projects.sort()

master_readme_lines = ["# Blockchain Projects Hub\n\nThis repository contains 20 unique decentralized applications (dApps) built on Stellar and Soroban.\n\n## Projects\n\n"]

for idx, p in enumerate(projects):
    project_dir = os.path.join(base_dir, p)
    print(f"Processing {p}...")
    
    # 1. Cleanup Level 3, Production Grade, Firebase
    remove_dir_safely(os.path.join(project_dir, "level-3-orange-belt"))
    remove_dir_safely(os.path.join(project_dir, "production-grade"))
    
    for level in ["level-1-white-belt", "level-2-yellow-belt"]:
        level_dir = os.path.join(project_dir, level)
        if os.path.exists(level_dir):
            remove_dir_safely(os.path.join(level_dir, ".firebase"))
            remove_file_safely(os.path.join(level_dir, "firebase.json"))
            remove_file_safely(os.path.join(level_dir, ".firebaserc"))
            
            # Inject CSS
            css_path = os.path.join(level_dir, "src", "index.css")
            if os.path.exists(css_path):
                theme = random.choice(themes)
                font = random.choice(fonts)
                btn = random.choice(button_styles)
                
                if "image-bg" in theme["mode"]:
                    bg_css = f"background: {theme['bg']} !important; background-attachment: fixed !important;"
                    card_backdrop = "backdrop-filter: blur(10px) !important;"
                else:
                    bg_css = f"background-color: {theme['bg']} !important;"
                    card_backdrop = ""
                
                font_name = font.split(",")[0].replace("'", "").replace(" ", "+")
                
                custom_css = f'''
@import url('https://fonts.googleapis.com/css2?family={font_name}:wght@400;500;600;700&display=swap');

:root {{
  --primary-color: {theme['primary']};
  --text-main: {theme['text']};
  --bg-main: {theme['bg'] if "url" not in theme['bg'] else "transparent"};
  --bg-card: {theme['card']};
}}

body {{
  font-family: {font} !important;
  {bg_css}
  color: var(--text-main) !important;
}}

button {{
  {btn["css"]}
  font-family: {font} !important;
}}

.card, .panel, main > div > div {{
  background: var(--bg-card) !important;
  {card_backdrop}
  color: var(--text-main) !important;
  border-radius: 12px;
}}
'''
                with open(css_path, "a", encoding="utf-8") as f:
                    f.write("\n/* INJECTED UNIQUE THEME CSS */\n" + custom_css)

    # 2. Add Dummy Image
    with open(os.path.join(project_dir, "preview.png"), "wb") as f:
        f.write(b"")

    # 3. Add Project README
    human_name = p.replace("-", " ").title()
    readme_content = f'''# {human_name}

This project is part of the 20-project Stellar Soroban Hackathon suite.

## Features
- Unique UI Design Theme applied overriding Tailwind.
- Freighter Wallet Integration.
- Soroban Smart Contract interaction.

## Getting Started

1. Go into `level-1-white-belt` or `level-2-yellow-belt`.
2. Run `npm install`
3. Run `npm run dev`

![Preview Image](./preview.png)
'''
    with open(os.path.join(project_dir, "README.md"), "w", encoding="utf-8") as f:
        f.write(readme_content)

    # 4. Master README append
    master_readme_lines.append(f"### {idx+1}. [{human_name}](./{p})\nThis is project {idx+1} in the suite.\n")

# Write Master README
with open(os.path.join(base_dir, "README.md"), "w", encoding="utf-8") as f:
    f.write("\n".join(master_readme_lines))

print("Successfully fixed all 20 projects in Stellar ALL Projects.")
