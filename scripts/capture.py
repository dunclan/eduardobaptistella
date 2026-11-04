"""Captura frames reais: uso: capture.py <saida> <nome=url> ..."""
import asyncio, os, sys
from playwright.async_api import async_playwright

OUT = sys.argv[1]
TARGETS = [a.split("=", 1) for a in sys.argv[2:]]
SHAPES = {
    "desktop": dict(viewport={"width": 1440, "height": 900}, device_scale_factor=1),
    "mobile": dict(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True),
}

async def sweep(page, shape, name):
    await page.wait_for_timeout(3500)
    h = await page.evaluate("Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)")
    vh = page.viewport_size["height"]
    # percorre a pagina para acionar lazy-load e reveals por scroll
    y = 0
    while y < h:
        await page.mouse.wheel(0, vh * 0.8)
        y += vh * 0.8
        await page.wait_for_timeout(350)
    h = await page.evaluate("Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)")
    d = os.path.join(OUT, name, shape)
    os.makedirs(d, exist_ok=True)
    stops = 6 if shape == "desktop" else 4
    for i in range(stops):
        target = int(max(0, h - vh) * i / (stops - 1))
        await page.evaluate(f"window.scrollTo({{top:{target},behavior:'instant'}})")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=os.path.join(d, f"{i:02d}.jpg"), type="jpeg", quality=88)
    return h

async def one(b, name, url, sem, log):
    async with sem:
        for shape, opts in SHAPES.items():
            ctx = await b.new_context(locale="pt-BR", **opts)
            page = await ctx.new_page()
            errs = []
            page.on("pageerror", lambda e: errs.append(str(e)[:80]))
            try:
                await page.goto(url, wait_until="domcontentloaded", timeout=30000)
                h = await sweep(page, shape, name)
                log.append(f"{name} {shape} h={h} errs={len(errs)}")
            except Exception as e:
                log.append(f"{name} {shape} FALHOU {str(e)[:90]}")
            await ctx.close()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        sem, log = asyncio.Semaphore(4), []
        await asyncio.gather(*[one(b, n, u, sem, log) for n, u in TARGETS])
        await b.close()
    print("\n".join(sorted(log)))

asyncio.run(main())
