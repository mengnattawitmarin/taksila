# Reference positions from JPL DE421 via Skyfield, used to check js/astro.js accuracy.
import json, random
from skyfield.api import load, wgs84
from skyfield.framelib import ecliptic_frame
from skyfield import almanac
ts = load.timescale(); eph = load('de421.bsp')
earth = eph['earth']
bodies = {'sun': 'sun', 'moon': 'moon', 'mercury': 'mercury', 'venus': 'venus', 'mars': 'mars', 'jupiter': 'jupiter barycenter', 'saturn': 'saturn barycenter', 'uranus': 'uranus barycenter', 'neptune': 'neptune barycenter', 'pluto': 'pluto barycenter'}
random.seed(7)
out = []
for i in range(80):
    y = random.randint(1940, 2045); mo = random.randint(1, 12); d = random.randint(1, 28); h = random.randint(0, 23); mi = random.randint(0, 59)
    t = ts.utc(y, mo, d, h, mi)
    row = {'utc': [y, mo, d, h, mi]}
    for k, b in bodies.items():
        lat, lon, dist = earth.at(t).observe(eph[b]).apparent().frame_latlon(ecliptic_frame)
        row[k] = lon.degrees
    # Ascendant for Bangkok and for Chiang Mai, from apparent sidereal time
    import math
    for name, la, lo in [('bkk', 13.7563, 100.5018), ('cnx', 18.7883, 98.9853)]:
        ramc = (t.gast * 15 + lo) % 360
        eps = 23.4392911 - 0.0130042 * ((t.tt - 2451545.0) / 36525)
        r, e, f = math.radians(ramc), math.radians(eps), math.radians(la)
        asc = math.degrees(math.atan2(math.cos(r), -(math.sin(r) * math.cos(e) + math.tan(f) * math.sin(e)))) % 360
        row['asc_' + name] = asc
    out.append(row)
# Sun ingress into Aries for a few years (equinox), and new moons, to check timing
ing = []
for y in [2025, 2026, 2027]:
    t, yv = almanac.find_discrete(ts.utc(y, 1, 1), ts.utc(y, 12, 31), almanac.seasons(eph))
    ing.append([str(x.utc_iso()) for x in t])
json.dump({'rows': out, 'seasons': ing}, open('tools/verify/astro_ref.json', 'w'), indent=0)
print('ok', len(out))
