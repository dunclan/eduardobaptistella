"""Frames limpos: sem widget flutuante nem banner, sem reveal pela metade. uso: recapture.py <saida> <nome=url> ..."""
import asyncio, os, sys
from playwright.async_api import async_playwright

OUT = sys.argv[1]
TARGETS = [a.split("=", 1) for a in sys.argv[2:]]
SHAPES = {
    "d": dict(viewport={"width": 1440, "height": 900}, device_scale_factor=1.5),
    "m": dict(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True),
}
CLEAN = """() => {
  const vw = innerWidth, vh = innerHeight;
  for (const el of document.querySelectorAll('body *')) {
    const s = getComputedStyle(el);
    if (s.position !== 'fixed' && s.position !== 'sticky') continue;
    const r = el.getBoundingClientRect();
    const atBottom = r.bottom > vh * 0.55 && r.top > vh * 0.3;
    const fullScreen = r.width >= vw * 0.95 && r.height >= vh * 0.95;
    if (atBottom && !fullScreen) el.style.setProperty('display', 'none', 'important');
  }
  for (const el of document.querySelectorAll('[class*="cookie" i],[class*="consent" i],[id*="cookie" i],[id*="consent" i],[class*="whats" i],[class*="float" i]')) {
    const s = getComputedStyle(el);
    if (s.position === 'fixed') el.style.setProperty('display', 'none', 'important');
  }
}"""

async def run(b, name, url, sem, log):
    async with sem:
        for shape, opts in SHAPES.items():
            ctx = await b.new_context(locale="pt-BR", reduced_motion="reduce", **opts)
            page = await ctx.new_page()
            try:
                await page.goto(url, wait_until="domcontentloaded", timeout=30000)
                await page.evaluate("document.fonts.ready")
                await page.wait_for_timeout(2500)
                vh = page.viewport_size["height"]
                h = await page.evaluate("document.documentElement.scrollHeight")
                for y in range(0, h, int(vh * 0.7)):
                    await page.evaluate(f"window.scrollTo({{top:{y},behavior:'instant'}})")
                    await page.wait_for_timeout(220)
                h = await page.evaluate("document.documentElement.scrollHeight")
                d = os.path.join(OUT, name); os.makedirs(d, exist_ok=True)
                stops = 10 if shape == "d" else 6
                for i in range(stops):
                    y = int(max(0, h - vh) * i / (stops - 1))
                    await page.evaluate(f"window.scrollTo({{top:{y},behavior:'instant'}})")
                    await page.wait_for_timeout(1100)
                    await page.evaluate(CLEAN)
                    await page.wait_for_timeout(120)
                    await page.screenshot(path=os.path.join(d, f"{shape}{i:02d}.jpg"), type="jpeg", quality=92)
                log.append(f"{name} {shape} ok h={h}")
            except Exception as e:
                log.append(f"{name} {shape} FALHOU {str(e)[:90]}")
            await ctx.close()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        sem, log = asyncio.Semaphore(4), []
        await asyncio.gather(*[run(b, n, u, sem, log) for n, u in TARGETS])
        await b.close()
    print("\n".join(sorted(log)))

asyncio.run(main())
