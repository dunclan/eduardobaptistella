"""Revisão visual. uso: shoot.py <base> <saida> [desktop|mobile] [rota=fracoes,de,scroll ...]"""
import asyncio, os, sys
from playwright.async_api import async_playwright

base, out, shape = sys.argv[1], sys.argv[2], sys.argv[3]
routes = sys.argv[4:]
opts = dict(viewport={"width": 1440, "height": 900}) if shape == "desktop" else dict(viewport={"width": 375, "height": 812}, device_scale_factor=2, is_mobile=True, has_touch=True)

async def main():
    os.makedirs(out, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"])
        ctx = await b.new_context(**opts)
        page = await ctx.new_page()
        errs = []
        page.on("console", lambda m: errs.append(m.text[:160]) if m.type == "error" else None)
        page.on("pageerror", lambda e: errs.append(str(e)[:160]))
        for spec in routes:
            route, fr = spec.split("=")
            await page.goto(base + route, wait_until="load", timeout=60000)
            await page.evaluate("document.fonts.ready")
            await page.wait_for_timeout(1900)
            h = await page.evaluate("document.documentElement.scrollHeight")
            vh = page.viewport_size["height"]
            name = route.strip("/").replace("/", "_") or "home"
            for f in fr.split(","):
                y = int(float(f) * (h - vh))
                await page.evaluate(f"window.scrollTo({{top:{y},behavior:'instant'}})")
                await page.wait_for_timeout(1000)
                await page.screenshot(path=f"{out}/{shape[0]}_{name}_{f}.jpg", type="jpeg", quality=70)
            print(name, "h=", h, "overflowX=", await page.evaluate("document.documentElement.scrollWidth - innerWidth"))
        print("erros:", errs[:8])
        await b.close()

asyncio.run(main())
