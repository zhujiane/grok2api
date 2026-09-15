import base64, hashlib, json, math, re, struct, sys

BEZIER_TOLERANCE = 1e-7

def js_round(x): return math.floor(x + 0.5)
def js_num_to_hex(v):
    if not v:
        return "-0" if math.copysign(1.0, v) < 0 else "0"
    neg = v < 0; v = abs(v)
    ip = int(v); frac = v - ip
    s = format(ip, "x")
    if frac > 0:
        u = struct.unpack(">Q", struct.pack(">d", frac))[0]
        mant = (u & 0x000FFFFFFFFFFFFF) | 0x0010000000000000
        exp = ((u >> 52) & 0x7FF) - 1023
        num = mant; denom = 1 << (52 - exp); digits = []; rem = num
        while rem > 0:
            rem *= 16; d = rem // denom; digits.append(format(d, "x")); rem %= denom
        s += "." + "".join(digits)
    return ("-" if neg else "") + s

def js_to_fixed(v, prec=2):
    p = int(10**prec); return float(js_round(v * p)) / float(p)

def _sample_cubic(t, a1, a2): return ((1 - 3*a2 + 3*a1)*t + (3*a2 - 6*a1))*t*t + 3*a1*t
def _sample_cubic_derivative(t, a1, a2): return (3*(1 - 3*a2 + 3*a1)*t + 2*(3*a2 - 6*a1))*t + 3*a1

def cubic_bezier_y(x1, y1, x2, y2, x):
    if x <= 0: return 0.0
    if x >= 1: return 1.0
    t = x
    for _ in range(8):
        x_at_t = _sample_cubic(t, x1, x2) - x
        if abs(x_at_t) < BEZIER_TOLERANCE: return _sample_cubic(t, y1, y2)
        d = _sample_cubic_derivative(t, x1, x2)
        if abs(d) < BEZIER_TOLERANCE: break
        t -= x_at_t / d
    lo, hi = 0.0, 1.0; t = x
    while lo < hi:
        x_at_t = _sample_cubic(t, x1, x2)
        if abs(x_at_t - x) < BEZIER_TOLERANCE: return _sample_cubic(t, y1, y2)
        if x > x_at_t: lo = t
        else: hi = t
        t = (hi + lo) / 2
    return _sample_cubic(t, y1, y2)

def _extract_numbers(seg): return [float(m.group(0)) for m in re.finditer(r"-?\d+\.?\d*", seg)]

def _select_curve_segment(svg_path_d, seed):
    segments = []
    for part in svg_path_d[9:].split("C"):
        nums = _extract_numbers(part)
        if nums: segments.append(nums)
    seg_idx = seed[5] % len(segments)
    return segments[seg_idx]

def _bezier_control_points(seg):
    def scale(n, low, high): return js_to_fixed(n * ((high - low) / 255) + low, 2)
    return (scale(seg[7],0,1), scale(seg[8],-1,1), scale(seg[9],0,1), scale(seg[10],-1,1))

def _fingerprint_values(seg, progress):
    def channel(a,b):
        value = js_round(a + (b - a) * progress)
        return max(0, min(255, int(value)))
    red = channel(seg[0], seg[3]); green = channel(seg[1], seg[4]); blue = channel(seg[2], seg[5])
    end_angle = math.floor(seg[6] * ((360 - 60) / 255) + 60)
    angle = end_angle * progress * math.pi / 180
    cos_a, sin_a = math.cos(angle), math.sin(angle)
    values = [float(red), float(green), float(blue)]
    values.extend([cos_a, sin_a, -sin_a, cos_a, 0.0, 0.0])
    return values

def compute_animation_hex(svg_path_d, seed):
    seg = _select_curve_segment(svg_path_d, seed)
    x1,y1,x2,y2 = _bezier_control_points(seg)
    seek = js_round(((seed[24] % 16) * (seed[22] % 16) * (seed[23] % 16)) / 10) * 10
    progress = cubic_bezier_y(x1,y1,x2,y2, seek/4096.0)
    values = _fingerprint_values(seg, progress)
    buf = "".join(js_num_to_hex(js_to_fixed(v, 2)) for v in values)
    return re.sub(r"[.\-]", "", buf)

def curves_to_path(curve_segs):
    pieces = [f" {e['color'][0]},{e['color'][1]} {e['color'][2]},{e['color'][3]} {e['color'][4]},{e['color'][5]} h {e['deg']} s {e['bezier'][0]},{e['bezier'][1]} {e['bezier'][2]},{e['bezier'][3]}" for e in curve_segs]
    return "M 10,30 C" + " C".join(pieces)

if __name__ == "__main__":
    seed_b64 = sys.argv[1]
    curves = json.load(open(sys.argv[2]))
    seed = base64.b64decode(seed_b64 + "==")
    idx = seed[5] % len(curves)
    path = curves_to_path(curves[idx])
    print(compute_animation_hex(path, seed))
