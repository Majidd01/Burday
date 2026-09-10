import math
import wave
import struct
import os

path = r"C:\Users\ASUS\Documents\birthday-surprise-zainab\music\song.wav"
os.makedirs(os.path.dirname(path), exist_ok=True)
sr = 22050
tempo = 108
beat = 60 / tempo

melody = [
    (523.25, 0.5), (659.25, 0.5), (783.99, 0.5), (1046.5, 0.5),
    (783.99, 0.5), (659.25, 0.5), (523.25, 1.0),
    (587.33, 0.5), (698.46, 0.5), (880.00, 0.5), (1174.7, 0.5),
    (880.00, 0.5), (698.46, 0.5), (587.33, 1.0),
    (523.25, 0.5), (659.25, 0.5), (783.99, 0.5), (987.77, 0.5),
    (1046.5, 0.75), (987.77, 0.25), (880.00, 0.5), (783.99, 0.5),
    (659.25, 0.5), (698.46, 0.5), (783.99, 1.0),
    (659.25, 0.5), (523.25, 1.5),
]
bass_pat = [(130.81, 1), (146.83, 1), (164.81, 1), (196.00, 1)] * 3


def env(i, n, a=0.02, r=0.12):
    t = i / sr
    dur = n / sr
    if t < a:
        return t / a
    if t > dur - r:
        return max(0.0, (dur - t) / r)
    return 1.0


total_beats = sum(d for _, d in melody)
total_samples = int(total_beats * beat * sr) + sr // 2
buf = [0.0] * total_samples

pos = 0
for freq, beats in melody:
    n = int(beats * beat * sr)
    for i in range(n):
        if pos + i >= total_samples:
            break
        e = env(i, n)
        t = i / sr
        wave_s = 0.55 * math.sin(2 * math.pi * freq * t)
        wave_s += 0.18 * math.sin(2 * math.pi * freq * 2 * t)
        wave_s += 0.06 * math.sin(2 * math.pi * freq * 3 * t)
        buf[pos + i] += wave_s * e * 0.28
    pos += n

pos = 0
for freq, beats in bass_pat:
    n = int(beats * beat * sr)
    for i in range(n):
        if pos + i >= total_samples:
            break
        e = env(i, n, 0.03, 0.2)
        t = i / sr
        buf[pos + i] += 0.14 * e * math.sin(2 * math.pi * freq * t)
    pos += n
    if pos >= total_samples:
        break

peak = max(abs(x) for x in buf) or 1
buf = [x / peak * 0.85 for x in buf]

with wave.open(path, "w") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(sr)
    for x in buf:
        w.writeframes(struct.pack("<h", int(max(-1, min(1, x)) * 32767)))

print("wrote", path, "seconds", round(len(buf) / sr, 2))
