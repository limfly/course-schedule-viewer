"""
Capture screenshots of the local site (desktop and mobile) by starting a simple HTTP server
and using pyppeteer (headless Chromium) to render pages.

Usage: python tools\capture_screenshot.py

Output:
  screenshots/mobile.png
  screenshots/desktop.png

Note: pyppeteer will download Chromium on first run which may take time.
"""
import os
import sys
import asyncio
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import threading

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
PORT = 8001
URL = f'http://127.0.0.1:{PORT}/index.html'
OUT_DIR = os.path.join(ROOT_DIR, 'screenshots')

async def take_screenshots():
    try:
        from pyppeteer import launch
    except Exception as e:
        print('pyppeteer not installed:', e)
        sys.exit(2)
    # Try to use a local Chrome/Edge if available to avoid downloading Chromium
    possible_paths = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    ]
    exe_path = None
    for p in possible_paths:
        if os.path.exists(p):
            exe_path = p
            break

    launch_kwargs = {'args': ['--no-sandbox', '--disable-setuid-sandbox']}
    if exe_path:
        print('Using local browser executable:', exe_path)
        launch_kwargs['executablePath'] = exe_path

    try:
        browser = await launch(**launch_kwargs)
    except Exception as e:
        print('Failed to launch local browser, attempting to download Chromium (may fail on restricted networks):', e)
        # try without executablePath (will download chromium)
        browser = await launch(args=['--no-sandbox', '--disable-setuid-sandbox'])
    try:
        # mobile
        page = await browser.newPage()
        await page.setViewport({'width': 390, 'height': 844, 'deviceScaleFactor': 2})
        print('Opening', URL)
        await page.goto(URL, {'waitUntil': 'networkidle2', 'timeout': 30000})
        os.makedirs(OUT_DIR, exist_ok=True)
        mobile_path = os.path.join(OUT_DIR, 'mobile.png')
        await page.screenshot({'path': mobile_path, 'fullPage': True})
        print('Saved', mobile_path)

        # desktop
        page2 = await browser.newPage()
        await page2.setViewport({'width': 1280, 'height': 900})
        await page2.goto(URL, {'waitUntil': 'networkidle2', 'timeout': 30000})
        desktop_path = os.path.join(OUT_DIR, 'desktop.png')
        await page2.screenshot({'path': desktop_path, 'fullPage': True})
        print('Saved', desktop_path)
    finally:
        await browser.close()


def start_server():
    os.chdir(ROOT_DIR)
    handler = SimpleHTTPRequestHandler
    httpd = ThreadingHTTPServer(('127.0.0.1', PORT), handler)
    print(f'Serving HTTP on 127.0.0.1 port {PORT} (root: {ROOT_DIR})')
    httpd.serve_forever()


def main():
    # start server thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    # run pyppeteer
    try:
        asyncio.get_event_loop().run_until_complete(take_screenshots())
    except KeyboardInterrupt:
        print('Interrupted')
    except Exception as e:
        print('Failed to capture screenshots:', e)
        sys.exit(3)
    print('Done')

if __name__ == '__main__':
    main()
