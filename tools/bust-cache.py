#!/usr/bin/env python3
"""HTML이 불러오는 로컬 JS/CSS 주소 뒤에 파일 내용 기준 버전(?v=해시)을 붙여
브라우저가 예전 파일을 재사용하지 않게 한다. JS를 고친 뒤 커밋 전에 실행:
    python3 tools/bust-cache.py
"""
import hashlib, pathlib, re
root = pathlib.Path(__file__).resolve().parent.parent
ver = {}
for f in list(root.glob('js/*.js')) + list(root.glob('css/*.css')):
    ver[f.relative_to(root).as_posix()] = hashlib.sha1(f.read_bytes()).hexdigest()[:8]
pat = re.compile(r'((?:src|href)=")((?:\.\./)?)((?:js|css)/[\w.-]+\.(?:js|css))(?:\?v=[0-9a-f]+)?(")')
changed = 0
for html in list(root.glob('*.html')) + list(root.glob('admin/*.html')):
    s = html.read_text(encoding='utf-8')
    t = pat.sub(lambda m: f'{m.group(1)}{m.group(2)}{m.group(3)}?v={ver[m.group(3)]}{m.group(4)}' if m.group(3) in ver else m.group(0), s)
    if t != s:
        html.write_text(t, encoding='utf-8'); changed += 1
print(f'versioned {len(ver)} files in {changed} html pages:', ver)
