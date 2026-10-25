"""Bundle the app into one self-contained HTML file.

Usage:  python3 tools/build-single.py
Output: dist/taksila.html          (full document, open directly in a browser)
        dist/taksila-artifact.html (body-only version for hosts that add their own <head>)

How it works: the ES modules are concatenated in dependency order, their
import lines are removed and the `export` keywords stripped, then the result
is wrapped in one function so nothing leaks into the global scope.
"""
import pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
ORDER = ['js/astro.js', 'js/thai.js', 'js/auspice.js', 'js/data.js', 'js/starmap.js', 'js/app.js']
FONTS = ('https://fonts.googleapis.com/css2?family=Taviraj:wght@400;500;600'
         '&family=IBM+Plex+Sans+Thai:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500'
         '&family=Noto+Sans+Symbols&family=Noto+Sans+Symbols+2&display=swap')


def strip_module(src: str) -> str:
    src = re.sub(r'^import\s[\s\S]*?;\s*$', '', src, flags=re.M)
    src = re.sub(r'^export\s+', '', src, flags=re.M)
    return src


def main():
    js = '\n'.join(f'// ---- {p} ----\n' + strip_module((ROOT / p).read_text(encoding='utf-8')) for p in ORDER)
    js = '(function () {\n"use strict";\n' + js + '\n})();'
    css = (ROOT / 'css/styles.css').read_text(encoding='utf-8')
    body = (f'<div id="app" class="app"></div>\n'
            f'<noscript>กรุณาเปิด JavaScript เพื่อใช้งานตักศิลา</noscript>\n<script>\n{js}\n</script>\n')
    head = (f'<title>ตักศิลา</title>\n'
            f'<meta name="claude:viewport-fit-sides" content="cover">\n'
            f'<meta name="theme-color" content="#0D0B08">\n'
            f'<link rel="stylesheet" href="{FONTS.replace("&", "&amp;")}">\n'
            f'<style>\n{css}\n</style>\n')
    out = ROOT / 'dist'
    out.mkdir(exist_ok=True)
    (out / 'taksila-artifact.html').write_text(head + body, encoding='utf-8')
    full = ('<!doctype html>\n<html lang="th">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            + head + '</head>\n<body>\n' + body + '</body>\n</html>\n')
    (out / 'taksila.html').write_text(full, encoding='utf-8')
    print('built', out / 'taksila.html', len(full) // 1024, 'KB')


if __name__ == '__main__':
    main()
