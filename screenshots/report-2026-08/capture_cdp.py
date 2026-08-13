#!/usr/bin/env python3
"""CDP로 headless Chrome을 제어해 스크롤 위치별 스크린샷을 찍는다."""
import base64, json, subprocess, time, sys, urllib.request

import websocket

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PORT = 9333

proc = subprocess.Popen(
    [CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
     f"--remote-debugging-port={PORT}", "--remote-allow-origins=*",
     "--window-size=1440,900", "about:blank"],
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def targets():
    for _ in range(30):
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json") as r:
                return json.load(r)
        except Exception:
            time.sleep(0.5)
    raise RuntimeError("chrome not up")

tabs = [t for t in targets() if t["type"] == "page"]
ws = websocket.create_connection(tabs[0]["webSocketDebuggerUrl"], timeout=30)
_id = [0]

def send(method, params=None):
    _id[0] += 1
    ws.send(json.dumps({"id": _id[0], "method": method, "params": params or {}}))
    while True:
        msg = json.loads(ws.recv())
        if msg.get("id") == _id[0]:
            return msg.get("result", {})

def evaluate(expr):
    return send("Runtime.evaluate", {"expression": expr, "returnByValue": True}).get("result", {}).get("value")

def shot(name):
    data = send("Page.captureScreenshot", {"format": "png"})["data"]
    with open(name, "wb") as f:
        f.write(base64.b64decode(data))
    print("saved", name)

send("Page.enable")
send("Runtime.enable")

jobs = json.load(open(sys.argv[1]))
for job in jobs:
    send("Page.navigate", {"url": job["url"]})
    time.sleep(6)
    # 쿠키 배너·챗봇 버튼 숨김(보고서 캡처용)
    evaluate("document.querySelectorAll('.cookie-banner,[class*=cookie],[class*=cbot]').forEach(e=>e.style.display='none')")
    for name, action in job["shots"]:
        if action:
            evaluate(action)
            time.sleep(2.5)
        shot(name)

ws.close()
proc.terminate()
