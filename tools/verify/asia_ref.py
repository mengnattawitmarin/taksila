# Calibration set of East Asian faces: official photos of Taiwan's Legislative Yuan members
# (Taiwan Open Government Data License v1.0, attribution: 立法院 Legislative Yuan). Branch-only, not deployed.
import json, io, urllib.request, urllib.parse
import numpy as np
from PIL import Image
import mediapipe as mp
from mediapipe.tasks.python import vision, BaseOptions
UA = {'User-Agent': 'taksila-calibration/1.0'}
def get(u, t=60): return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=t).read()
for k, u in {'face': 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
             'hair': 'https://storage.googleapis.com/mediapipe-models/image_segmenter/hair_segmenter/float32/latest/hair_segmenter.tflite'}.items():
    open(k, 'wb').write(get(u))
face = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(base_options=BaseOptions(model_asset_path='face'), output_face_blendshapes=True, num_faces=1))
hair = vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(base_options=BaseOptions(model_asset_path='hair'), output_confidence_masks=True))
def hairline(img, lm):
    conf = hair.segment(img).confidence_masks[-1].numpy_view(); H, W = conf.shape[:2]; ys = []
    for dx in np.linspace(-0.03, 0.03, 7):
        x = int(min(W - 1, max(0, (lm[10].x + dx) * W))); idx = np.where(conf[:int(lm[10].y * H), x] > 0.5)[0]
        if len(idx): ys.append((idx.max() + 1) / H)
    return float(np.median(ys)) if len(ys) >= 4 else None
pics = set()
for term in range(5, 12):
    for u in [f'https://data.ly.gov.tw/odw/ID16Action.action?term={term:02d}&fileType=json', f'https://ly.govapi.tw/legislator?term={term}&limit=300']:
        try:
            d = json.loads(get(u))
            rows = d.get('jsonList') or d.get('legislators') or d.get('dataList') or (d if isinstance(d, list) else [])
            n0 = len(pics)
            for r in rows:
                p = r.get('picUrl') or r.get('照片位址')
                if p: pics.add(p)
            print(u, len(rows), len(pics) - n0)
            if len(pics) > n0: break
        except Exception as e: print('fail', u, e)
print('pics', len(pics))
faces = []
for p in sorted(pics):
    try:
        arr = np.array(Image.open(io.BytesIO(get(p, 30))).convert('RGB'))
        img = mp.Image(image_format=mp.ImageFormat.SRGB, data=arr)
        r = face.detect(img)
        if not r.face_landmarks: continue
        lm = r.face_landmarks[0]; bs = {c.category_name: c.score for c in r.face_blendshapes[0]}
        faces.append({'w': arr.shape[1], 'h': arr.shape[0], 'lm': [[round(q.x, 4), round(q.y, 4), round(q.z, 4)] for q in lm],
                      'smile': round(max(bs.get('mouthSmileLeft', 0), bs.get('mouthSmileRight', 0)), 3), 'jaw': round(bs.get('jawOpen', 0), 3), 'hair': hairline(img, lm)})
    except Exception as e: print('skip', p, e)
json.dump(faces, open('tools/verify/asia.json', 'w'))
print('faces', len(faces))
