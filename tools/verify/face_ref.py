# Builds reference data for calibrating the face/palm readers (branch-only, not deployed).
# Faces: public-domain official portraits from github.com/unitedstates/images.
# Palms: freely licensed photos found through the Wikimedia Commons search API.
import json, os, random, io, urllib.request, urllib.parse
import numpy as np
from PIL import Image
import mediapipe as mp
from mediapipe.tasks.python import vision, BaseOptions
UA = {'User-Agent': 'taksila-calibration/1.0 (github.com/mengnattawitmarin/taksila)'}
def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read()
os.makedirs('m', exist_ok=True)
M = {'face': 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
     'hand': 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
     'hair': 'https://storage.googleapis.com/mediapipe-models/image_segmenter/hair_segmenter/float32/latest/hair_segmenter.tflite'}
for k, u in M.items():
    open(f'm/{k}', 'wb').write(get(u))
face = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(base_options=BaseOptions(model_asset_path='m/face'), output_face_blendshapes=True, output_facial_transformation_matrixes=True, num_faces=1))
hair = vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(base_options=BaseOptions(model_asset_path='m/hair'), output_confidence_masks=True))
hand = vision.HandLandmarker.create_from_options(vision.HandLandmarkerOptions(base_options=BaseOptions(model_asset_path='m/hand'), num_hands=1))

def hairline(img, lm):
    conf = hair.segment(img).confidence_masks[-1].numpy_view()
    H, W = conf.shape[:2]
    x10, y10 = lm[10].x, lm[10].y
    ys = []
    for dx in np.linspace(-0.03, 0.03, 7):
        x = int(min(W - 1, max(0, (x10 + dx) * W)))
        col = conf[:int(y10 * H), x]
        idx = np.where(col > 0.5)[0]
        if len(idx): ys.append((idx.max() + 1) / H)  # lowest hair pixel above landmark 10 = hairline
    return float(np.median(ys)) if len(ys) >= 4 else None

# ---- faces ----
tree = json.loads(get('https://api.github.com/repos/unitedstates/images/git/trees/gh-pages?recursive=1'))
files = [t['path'] for t in tree['tree'] if t['path'].startswith('congress/450x550/') and t['path'].endswith('.jpg')]
random.seed(11); random.shuffle(files)
faces = []
for p in files[:700]:
    try:
        b = get('https://unitedstates.github.io/images/' + p)
        arr = np.array(Image.open(io.BytesIO(b)).convert('RGB'))
        img = mp.Image(image_format=mp.ImageFormat.SRGB, data=arr)
        r = face.detect(img)
        if not r.face_landmarks: continue
        lm = r.face_landmarks[0]
        bs = {c.category_name: round(c.score, 3) for c in r.face_blendshapes[0]}
        faces.append({'id': p.split('/')[-1][:-4], 'w': arr.shape[1], 'h': arr.shape[0], 'lm': [[round(q.x, 4), round(q.y, 4), round(q.z, 4)] for q in lm],
                      'smile': max(bs.get('mouthSmileLeft', 0), bs.get('mouthSmileRight', 0)), 'jaw': bs.get('jawOpen', 0),
                      'mat': [round(v, 4) for v in np.array(r.facial_transformation_matrixes[0]).flatten().tolist()], 'hair': hairline(img, lm)})
    except Exception as e:
        print('skip', p, e)
json.dump(faces, open('tools/verify/faces.json', 'w'))
print('faces', len(faces))

# ---- palms ----
os.makedirs('tools/verify/palms', exist_ok=True)
pal = []
for q in ['palm of hand', 'palm lines hand', 'open hand palm', 'palmistry hand', 'human hand palm']:
    api = 'https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode({'action': 'query', 'format': 'json', 'generator': 'search', 'gsrsearch': q + ' filetype:bitmap', 'gsrnamespace': 6, 'gsrlimit': 40, 'prop': 'imageinfo', 'iiprop': 'url|extmetadata', 'iiurlwidth': 1000})
    try: res = json.loads(get(api))
    except Exception as e: print('api', e); continue
    for pg in (res.get('query', {}).get('pages', {}) or {}).values():
        ii = (pg.get('imageinfo') or [{}])[0]
        u = ii.get('thumburl')
        if not u or any(x['title'] == pg['title'] for x in pal): continue
        try:
            arr = np.array(Image.open(io.BytesIO(get(u))).convert('RGB'))
            img = mp.Image(image_format=mp.ImageFormat.SRGB, data=arr)
            r = hand.detect(img)
            if not r.hand_landmarks: continue
            lm = r.hand_landmarks[0]
            v5 = (lm[5].x - lm[0].x, lm[5].y - lm[0].y); v17 = (lm[17].x - lm[0].x, lm[17].y - lm[0].y)
            area = abs(v5[0] * v17[1] - v5[1] * v17[0])
            if area < 0.01: continue
            n = len(pal)
            Image.fromarray(arr).save(f'tools/verify/palms/p{n}.jpg', quality=88)
            md = ii.get('extmetadata', {})
            pal.append({'f': f'p{n}.jpg', 'title': pg['title'], 'lic': md.get('LicenseShortName', {}).get('value'), 'artist': md.get('Artist', {}).get('value', '')[:120],
                        'hd': r.handedness[0][0].category_name, 'lm': [[round(p.x, 4), round(p.y, 4), round(p.z, 4)] for p in lm],
                        'world': [[round(p.x, 5), round(p.y, 5), round(p.z, 5)] for p in r.hand_world_landmarks[0]]})
        except Exception as e:
            print('pskip', e)
        if len(pal) >= 30: break
json.dump(pal, open('tools/verify/palms.json', 'w'), indent=0)
print('palms', len(pal))
