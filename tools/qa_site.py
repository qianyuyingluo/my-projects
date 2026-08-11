"""Build-level browser checks and screenshots for the research portfolio."""

from __future__ import annotations

import subprocess
import sys
import time
import re
from pathlib import Path
from urllib.error import URLError
from urllib.request import urlopen

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "qa-output"
PORT = 4175
BASE_URL = f"http://127.0.0.1:{PORT}"
EDGE_CANDIDATES = (
    Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"),
    Path(r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"),
)


def wait_for_server(timeout: float = 15.0) -> None:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        try:
            with urlopen(BASE_URL, timeout=1) as response:
                if response.status == 200:
                    return
        except (URLError, TimeoutError):
            time.sleep(0.2)
    raise RuntimeError(f"Preview server did not start at {BASE_URL}")


def assert_no_overflow(page, label: str) -> None:
    sizes = page.evaluate(
        """() => ({
          viewport: document.documentElement.clientWidth,
          content: document.documentElement.scrollWidth,
        })"""
    )
    if sizes["content"] > sizes["viewport"] + 1:
        raise AssertionError(f"{label} has horizontal overflow: {sizes}")


def assert_no_han_text(page, label: str) -> None:
    text = page.locator("body").inner_text()
    match = re.search(r"[\u4e00-\u9fff]", text)
    if match:
        start = max(0, match.start() - 24)
        end = min(len(text), match.end() + 24)
        raise AssertionError(f"{label} still contains Chinese UI text: {text[start:end]!r}")


def assert_section_wheel(page, label: str, expected_items: int) -> None:
    wheel = page.locator(".section-wheel")
    if wheel.count() != 1:
        raise AssertionError(f"{label} is missing the section wheel")
    if wheel.locator(".section-wheel-item").count() != expected_items:
        raise AssertionError(f"{label} section wheel has the wrong item count")

    active = wheel.locator(".section-wheel-item.is-active")
    if active.count() != 1 or active.get_attribute("aria-current") != "location":
        raise AssertionError(f"{label} section wheel has no unique current item")

    geometry = page.evaluate(
        """() => {
          const wheel = document.querySelector('.section-wheel nav');
          const active = document.querySelector('.section-wheel-item.is-active');
          const main = document.querySelector('.research-main');
          if (!wheel || !active || !main) return null;
          const wheelBox = wheel.getBoundingClientRect();
          const activeBox = active.getBoundingClientRect();
          const mainBox = main.getBoundingClientRect();
          const matrix = new DOMMatrixReadOnly(getComputedStyle(active).transform);
          return {
            wheelCenter: wheelBox.top + wheelBox.height / 2,
            activeCenter: activeBox.top + activeBox.height / 2,
            scale: Math.hypot(matrix.a, matrix.b),
            mainWidth: mainBox.width,
            viewportWidth: document.documentElement.clientWidth,
          };
        }"""
    )
    if geometry is None:
        raise AssertionError(f"{label} section wheel geometry is unavailable")
    if abs(geometry["wheelCenter"] - geometry["activeCenter"]) > 8:
        raise AssertionError(f"{label} current section is not centered in the wheel: {geometry}")
    if not 1.16 <= geometry["scale"] <= 1.24:
        raise AssertionError(f"{label} current section is not scaled to 1.2: {geometry}")
    if geometry["mainWidth"] < geometry["viewportWidth"] * 0.9:
        raise AssertionError(f"{label} research page does not use enough viewport width: {geometry}")


def assert_all_figures_zoomable(page, label: str) -> None:
    image_count = page.locator(".research-figure img").count()
    trigger_count = page.locator(".research-figure-open").count()
    if image_count != trigger_count:
        raise AssertionError(
            f"{label} does not expose every project image through the original-image viewer: "
            f"images={image_count}, triggers={trigger_count}"
        )


def exercise_image_lightbox(page, label: str) -> None:
    assert_all_figures_zoomable(page, label)
    trigger = page.locator(".research-figure-open").first
    if trigger.count() != 1:
        raise AssertionError(f"{label} has no project screenshot to enlarge")

    trigger.scroll_into_view_if_needed()
    expected_src = trigger.locator("img").get_attribute("src")
    trigger.click()
    page.wait_for_selector(".image-lightbox")
    page.wait_for_timeout(420)

    lightbox = page.locator(".image-lightbox")
    if lightbox.get_attribute("role") != "dialog" or lightbox.get_attribute("aria-modal") != "true":
        raise AssertionError(f"{label} image viewer is missing dialog semantics")
    if lightbox.locator(".image-lightbox-figure img").get_attribute("src") != expected_src:
        raise AssertionError(f"{label} image viewer did not load the selected original image")
    if lightbox.locator(".image-lightbox-toolbar a").get_attribute("href") != expected_src:
        raise AssertionError(f"{label} image viewer has an invalid original-image link")
    if page.locator("html").evaluate("node => node.style.overflow") != "hidden":
        raise AssertionError(f"{label} page still scrolls behind the image viewer")

    page.screenshot(path=OUTPUT / f"lightbox-{label}.png")
    page.keyboard.press("Escape")
    page.wait_for_selector(".image-lightbox", state="detached")
    if page.locator("html").evaluate("node => node.style.overflow") == "hidden":
        raise AssertionError(f"{label} page scroll was not restored after closing the image viewer")


def main() -> int:
    edge = next((path for path in EDGE_CANDIDATES if path.exists()), None)
    if edge is None:
        raise RuntimeError("Microsoft Edge was not found")

    OUTPUT.mkdir(exist_ok=True)
    flags = subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
    server = subprocess.Popen(
        ["npm.cmd", "run", "preview", "--", "--host", "127.0.0.1", "--port", str(PORT)],
        cwd=ROOT,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        creationflags=flags,
    )

    try:
        wait_for_server()
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(executable_path=str(edge), headless=True)

            for label, viewport in (
                ("desktop", {"width": 1440, "height": 900}),
                ("mobile", {"width": 390, "height": 844}),
            ):
                page = browser.new_page(viewport=viewport)
                page.goto(BASE_URL, wait_until="networkidle")
                page.wait_for_selector(".project-stage")

                if page.locator(".project-stage").count() != 5:
                    raise AssertionError("Expected the GitHub landing section and four project sections")
                if page.locator(".project-action").count() != 13:
                    raise AssertionError("Expected thirteen project actions")
                if page.locator(".section-dot").count() != 5:
                    raise AssertionError("Expected five section navigation controls")

                hrefs = page.locator(".project-action").evaluate_all(
                    "nodes => nodes.map(node => node.getAttribute('href'))"
                )
                if len(set(hrefs)) != 13 or not all(href and "#/projects/" in href for href in hrefs):
                    raise AssertionError(f"Invalid or duplicate project routes: {hrefs}")

                missing_backgrounds = page.locator(".project-stage:not(.profile-stage)").evaluate_all(
                    """nodes => nodes.filter(node =>
                      getComputedStyle(node).getPropertyValue('--stage-image').trim() === ''
                    ).length"""
                )
                if missing_backgrounds:
                    raise AssertionError("A project section is missing its background")

                background_urls = page.locator(".project-stage:not(.profile-stage)").evaluate_all(
                    """nodes => nodes.map(node => {
                      const value = getComputedStyle(node).getPropertyValue('--stage-image').trim();
                      return value.slice(5, -2);
                    })"""
                )
                for background_url in background_urls:
                    response = page.request.get(background_url)
                    if not response.ok:
                        raise AssertionError(f"Background failed to load: {background_url} ({response.status})")

                profile_background = page.locator(".profile-stage-art").evaluate(
                    """node => {
                      const value = getComputedStyle(node).backgroundImage;
                      const match = value.match(/url\\([\"']?(.*?)[\"']?\\)/);
                      return match ? match[1] : '';
                    }"""
                )
                if not profile_background:
                    raise AssertionError("The GitHub landing section is missing its landscape background")
                profile_background_response = page.request.get(profile_background)
                if not profile_background_response.ok:
                    raise AssertionError(
                        f"Profile background failed to load: {profile_background} "
                        f"({profile_background_response.status})"
                    )

                if page.locator(".profile-intro").count() != 1:
                    raise AssertionError("The GitHub landing section is missing its short introduction")
                if page.get_by_text("Research Portfolio", exact=True).count() != 1:
                    raise AssertionError("The GitHub landing introduction title is missing")
                if page.get_by_text(
                    "Bridging Physical Laws and Artificial Intelligence", exact=True
                ).count() != 1:
                    raise AssertionError("The GitHub landing introduction subtitle is missing")
                intro_blur = page.locator(".profile-intro").evaluate(
                    "node => getComputedStyle(node).backdropFilter"
                )
                if "blur(" not in intro_blur:
                    raise AssertionError(f"Profile introduction is missing local glass blur: {intro_blur}")

                ferris = page.locator(".project-ferris")
                if ferris.count() != 1 or page.locator(".project-ferris-item").count() != 13:
                    raise AssertionError("Homepage project navigator must contain all 13 projects")
                ferris_hrefs = page.locator(".project-ferris-item").evaluate_all(
                    "nodes => nodes.map(node => node.getAttribute('href'))"
                )
                if len(set(ferris_hrefs)) != 13:
                    raise AssertionError("Homepage project navigator links are not unique")
                before_slug = page.locator(".project-ferris-item.is-active").get_attribute("data-project-slug")
                before_scroll = page.evaluate(
                    "() => ({page: scrollY, sections: document.querySelector('.project-sections').scrollTop})"
                )
                page.locator(".project-ferris nav").hover()
                page.mouse.wheel(0, 120)
                page.wait_for_timeout(450)
                after_slug = page.locator(".project-ferris-item.is-active").get_attribute("data-project-slug")
                after_scroll = page.evaluate(
                    "() => ({page: scrollY, sections: document.querySelector('.project-sections').scrollTop})"
                )
                if before_slug == after_slug:
                    raise AssertionError("Manual wheel input did not rotate the homepage project navigator")
                if before_scroll != after_scroll:
                    raise AssertionError(
                        f"Project navigator wheel leaked into homepage scrolling: {before_scroll} -> {after_scroll}"
                    )

                if viewport["width"] > 900:
                    first_dot = page.locator(".section-dot").nth(0).bounding_box()
                    last_dot = page.locator(".section-dot").nth(4).bounding_box()
                    if first_dot is None or last_dot is None:
                        raise AssertionError("Section dot geometry is unavailable for drag testing")
                    start = (first_dot["x"] + first_dot["width"] / 2, first_dot["y"] + first_dot["height"] / 2)
                    end = (last_dot["x"] + last_dot["width"] / 2, last_dot["y"] + last_dot["height"] / 2)
                    page.mouse.move(*start)
                    page.mouse.down()
                    page.mouse.move(*end, steps=8)
                    page.mouse.up()
                    page.wait_for_timeout(650)
                    if not page.locator(".section-dot").nth(4).get_attribute("aria-current") == "true":
                        raise AssertionError("Dragging section dots did not select the last section")
                    drag_stage = page.evaluate(
                        "() => document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.closest('.project-stage')?.id"
                    )
                    if drag_stage != "agents":
                        raise AssertionError(f"Dragging section dots did not scroll to agents: {drag_stage}")

                if page.locator(".profile-dashboard img").count() != 3:
                    raise AssertionError("Expected three enhanced profile visuals")
                incomplete_profile_images = page.locator(".profile-dashboard img").evaluate_all(
                    "nodes => nodes.filter(node => !node.complete || node.naturalWidth === 0).length"
                )
                if incomplete_profile_images:
                    raise AssertionError("A profile visual failed to load")

                snap_type = page.locator("html").evaluate("node => getComputedStyle(node).scrollSnapType")
                if snap_type not in {"y", "y proximity"}:
                    raise AssertionError(f"Nearest scroll snapping is not active: {snap_type}")

                if page.locator(".research-brand, .brand-mark").count() != 0:
                    raise AssertionError("The side Research Portfolio brand should be fully removed")

                header_box = page.locator(".header-meta").bounding_box()
                if header_box is None or header_box["x"] > 20 or header_box["y"] > 20:
                    raise AssertionError(f"GitHub summary is not fixed at the viewport upper-left: {header_box}")

                panel_blur = page.locator(".project-panel").first.evaluate(
                    "node => getComputedStyle(node).backdropFilter"
                )
                if "blur(" not in panel_blur:
                    raise AssertionError(f"Project panel is missing local glass blur: {panel_blur}")

                assert_no_overflow(page, label)
                for index, section in enumerate(page.locator(".project-stage").all(), start=1):
                    section.scroll_into_view_if_needed()
                    page.wait_for_timeout(260)
                    page.screenshot(path=OUTPUT / f"home-{label}-{index}.png")

                page.locator("#pinn").scroll_into_view_if_needed()
                page.wait_for_timeout(200)
                page.screenshot(path=OUTPUT / f"home-{label}.png", full_page=True)

                page.goto(BASE_URL, wait_until="networkidle")
                click_target = page.locator(
                    ".project-ferris-item[data-project-slug='solid-sim-lab']"
                )
                click_target.click(force=True)
                page.wait_for_selector(".research-page, .agent-evolution-page")
                if "#/projects/solid-sim-lab" not in page.url:
                    raise AssertionError(f"Project navigator click did not navigate: {page.url}")

                first_route = hrefs[0]
                page.goto(f"{BASE_URL}/{first_route}", wait_until="networkidle")
                page.wait_for_timeout(500)
                if page.locator(".research-section").count() != 9:
                    raise AssertionError("Quantum PINN page is missing a research section")
                if page.locator(".research-section-body[data-content-state='complete']").count() != 9:
                    raise AssertionError("Quantum PINN page is not fully populated")
                if page.locator(".empty-section").count() != 0:
                    raise AssertionError("Quantum PINN page still contains empty placeholders")
                if page.locator(".detail-portrait").count() != 1:
                    raise AssertionError("Portrait detail presentation was not applied")
                if page.locator(".research-hero").count() != 0:
                    raise AssertionError("PINN portrait hero should be removed")
                if page.locator(".research-formula .katex-display").count() < 17:
                    raise AssertionError("Quantum PINN equations are incomplete")
                if page.locator(".katex-error").count() != 0:
                    raise AssertionError("Quantum PINN page contains a KaTeX render error")
                if page.locator(".research-figure img").count() != 8:
                    raise AssertionError("Quantum PINN paper figures are incomplete")
                if page.locator("img[src*='quantum/gradient-descent.jpeg']").count() != 1:
                    raise AssertionError("Quantum paper gradient-descent figure is missing")
                if page.locator(".research-nav-actions").count() != 1:
                    raise AssertionError("PINN navigation was removed with the portrait hero")
                assert_section_wheel(page, f"{label} quantum PINN", 9)
                assert_no_han_text(page, f"{label} quantum PINN")
                assert_no_overflow(page, f"{label} detail")
                page.screenshot(path=OUTPUT / f"detail-portrait-{label}.png")
                page.locator("#optimization").scroll_into_view_if_needed()
                page.wait_for_timeout(250)
                active_wheel_section = page.locator(".section-wheel-item.is-active").get_attribute("data-section-id")
                if active_wheel_section != "optimization":
                    raise AssertionError(
                        f"Quantum PINN section wheel did not rotate to optimization: {active_wheel_section}"
                    )
                assert_section_wheel(page, f"{label} scrolled quantum PINN", 9)
                page.screenshot(path=OUTPUT / f"quantum-gradient-{label}.png")
                page.locator("#results").scroll_into_view_if_needed()
                page.wait_for_timeout(250)
                page.screenshot(path=OUTPUT / f"quantum-results-{label}.png")
                exercise_image_lightbox(page, f"quantum-{label}")

                page.goto(f"{BASE_URL}/#/projects/semiconductor-laser-pinn", wait_until="networkidle")
                page.wait_for_timeout(500)
                if page.locator(".research-section").count() != 8:
                    raise AssertionError("Semiconductor-laser PINN page is missing a research section")
                if page.locator(".research-section-body[data-content-state='complete']").count() != 8:
                    raise AssertionError("Semiconductor-laser PINN page is not fully populated")
                if page.locator(".research-formula .katex-display").count() < 22:
                    raise AssertionError("Semiconductor-laser PINN equations are incomplete")
                architecture = page.locator("#architecture")
                if architecture.get_by_text("Dual-Network Architecture and Full Matrices", exact=True).count() != 1:
                    raise AssertionError("Semiconductor-laser matrix section title is missing")
                if architecture.locator(".research-formula .katex-display").count() != 10:
                    raise AssertionError("Semiconductor-laser state/correction matrices are incomplete")
                if page.locator(".katex-error").count() != 0:
                    raise AssertionError("Semiconductor-laser PINN page contains a KaTeX render error")
                if page.locator(".research-figure img").count() != 10:
                    raise AssertionError("Semiconductor-laser paper figures are incomplete")
                if page.locator("img[src*='laser/gradient-descent.jpeg']").count() != 1:
                    raise AssertionError("Laser paper gradient-descent figure is missing")
                assert_no_han_text(page, f"{label} semiconductor-laser PINN")
                assert_no_overflow(page, f"{label} semiconductor laser")
                page.locator("#architecture").evaluate(
                    "node => { document.documentElement.style.scrollBehavior = 'auto'; node.scrollIntoView({block: 'start'}); }"
                )
                page.wait_for_timeout(600)
                architecture_opacity = float(architecture.evaluate("node => getComputedStyle(node).opacity"))
                if architecture_opacity < 0.99:
                    raise AssertionError(
                        f"Semiconductor-laser matrix section stayed hidden after entering the viewport: {architecture_opacity}"
                    )
                page.screenshot(path=OUTPUT / f"laser-architecture-{label}.png")
                page.locator("#results").scroll_into_view_if_needed()
                page.wait_for_timeout(250)
                page.screenshot(path=OUTPUT / f"laser-results-{label}.png")

                page.goto(
                    f"{BASE_URL}/#/projects/semiconductor-laser-pinn/nondimensionalization",
                    wait_until="networkidle",
                )
                page.wait_for_timeout(500)
                if page.locator(".derivation-page").count() != 1:
                    raise AssertionError("Laser nondimensionalization subpage is missing")
                if page.locator(".research-section").count() != 5:
                    raise AssertionError("Laser nondimensionalization derivation is incomplete")
                if page.locator(".research-formula .katex-display").count() < 11:
                    raise AssertionError("Laser nondimensionalization formulas are incomplete")
                if page.locator(".katex-error").count() != 0:
                    raise AssertionError("Laser nondimensionalization page contains a KaTeX render error")
                if page.get_by_text("Step-by-Step Carrier-Equation Transformation", exact=True).count() < 1:
                    raise AssertionError("Laser carrier-equation derivation is missing")
                assert_no_han_text(page, f"{label} laser nondimensionalization")
                assert_no_overflow(page, f"{label} nondimensionalization")
                page.screenshot(path=OUTPUT / f"laser-nondimensionalization-{label}.png")
                page.locator("#carrier-equation").scroll_into_view_if_needed()
                page.wait_for_timeout(250)
                page.screenshot(path=OUTPUT / f"laser-nondimensionalization-formulas-{label}.png")

                page.goto(f"{BASE_URL}/#/projects/solid-sim-lab", wait_until="networkidle")
                page.wait_for_timeout(500)
                if page.locator(".detail-title").count() != 1:
                    raise AssertionError("Title detail presentation was not applied")
                title_background_size = page.locator(".research-hero-image").evaluate(
                    "node => getComputedStyle(node).backgroundSize"
                )
                if title_background_size != "contain":
                    raise AssertionError(f"Detail title artwork is cropped: {title_background_size}")
                nav_position = page.locator(".research-nav-actions").evaluate(
                    "node => getComputedStyle(node).position"
                )
                if nav_position != "fixed":
                    raise AssertionError(f"Detail navigation is not fixed at the viewport upper-right: {nav_position}")
                nav_box = page.locator(".research-nav-actions").bounding_box()
                if nav_box is None or nav_box["x"] + nav_box["width"] > viewport["width"] + 1 or nav_box["y"] > 20:
                    raise AssertionError(f"Detail navigation is not at the viewport upper-right: {nav_box}")
                title_blur = page.locator(".research-hero-content").evaluate(
                    "node => getComputedStyle(node).backdropFilter"
                )
                if "blur(" not in title_blur:
                    raise AssertionError(f"Detail title is missing local glass blur: {title_blur}")
                if page.locator(".research-section-body[data-content-state='complete']").count() != 7:
                    raise AssertionError("SolidSim Lab page is not fully populated")
                if page.locator(".empty-section").count() != 0:
                    raise AssertionError("SolidSim Lab page still contains empty placeholders")
                if page.locator(".research-formula .katex-display").count() != 7:
                    raise AssertionError("SolidSim Lab must expose one formula set per simulation")
                if page.locator(".katex-error").count() != 0:
                    raise AssertionError("SolidSim Lab page contains a KaTeX render error")
                if page.locator(".research-figure img").count() != 7:
                    raise AssertionError("SolidSim Lab must expose one result figure per simulation")
                launch_cards = page.locator(".simulation-launch-card")
                if launch_cards.count() != 7:
                    raise AssertionError("SolidSim Lab is missing one of its seven launch buttons")
                launch_hrefs = launch_cards.evaluate_all(
                    "nodes => nodes.map(node => node.getAttribute('href'))"
                )
                if len(set(launch_hrefs)) != 7:
                    raise AssertionError(f"SolidSim Lab launch routes are not unique: {launch_hrefs}")
                for simulation_index, href in enumerate(launch_hrefs, start=1):
                    if f"#/simulations/page{simulation_index}" not in href:
                        raise AssertionError(f"SolidSim Lab launch order is invalid: {launch_hrefs}")
                    response = page.request.get(
                        f"{BASE_URL}/simulations/solid-sim-lab/legacy/page{simulation_index}/index.html"
                    )
                    if not response.ok:
                        raise AssertionError(
                            f"SolidSim Lab page{simulation_index} interface failed to load: {response.status}"
                        )
                launch_cards.first.scroll_into_view_if_needed()
                with page.expect_popup() as popup_info:
                    launch_cards.first.click()
                simulator_page = popup_info.value
                simulator_page.wait_for_load_state("networkidle")
                simulator_page.wait_for_selector(".viewer-frame")
                if "#/simulations/page1" not in simulator_page.url:
                    raise AssertionError(f"SolidSim Lab launch button opened the wrong route: {simulator_page.url}")
                simulator_frame = simulator_page.locator(".viewer-frame").element_handle().content_frame()
                simulator_frame.wait_for_selector("body")
                if "/legacy/page1/index.html" not in simulator_frame.url:
                    raise AssertionError(f"SolidSim Lab viewer loaded the wrong interface: {simulator_frame.url}")
                simulator_page.screenshot(path=OUTPUT / f"solid-sim-interface-page1-{label}.png")
                simulator_page.close()
                for figure in page.locator(".research-figure").all():
                    figure.scroll_into_view_if_needed()
                    page.wait_for_timeout(120)
                incomplete_solid_sim_images = page.locator(".research-figure img").evaluate_all(
                    "nodes => nodes.filter(node => !node.complete || node.naturalWidth === 0).length"
                )
                if incomplete_solid_sim_images:
                    raise AssertionError("A SolidSim Lab figure failed to load")
                assert_no_overflow(page, f"{label} title detail")
                page.screenshot(path=OUTPUT / f"detail-title-{label}.png")
                page.locator(".simulation-launch-deck").scroll_into_view_if_needed()
                page.wait_for_timeout(250)
                page.screenshot(path=OUTPUT / f"solid-sim-launches-{label}.png")
                page.locator("#atomic-chain-vibration").scroll_into_view_if_needed()
                page.wait_for_timeout(250)
                page.screenshot(path=OUTPUT / f"solid-sim-3d-{label}.png")
                page.locator("#plane-wave-energy-bands").scroll_into_view_if_needed()
                page.wait_for_timeout(250)
                page.screenshot(path=OUTPUT / f"solid-sim-pwe-{label}.png")

                simulation_pages = (
                    ("crystal-physics-coursework", 8, 2, "fdm", "results"),
                    ("group", 8, 3, "rotation", "visualization"),
                    ("fraunhofer", 9, 3, "fourier-optics", "patterns"),
                    ("rutherford-scattering-simulator", 8, 2, "cross-section", "results"),
                )
                for slug, formula_count, image_count, formula_section, result_section in simulation_pages:
                    page.goto(f"{BASE_URL}/#/projects/{slug}", wait_until="networkidle")
                    page.wait_for_timeout(350)
                    if slug == "rutherford-scattering-simulator":
                        hero_geometry = page.locator(".research-hero").evaluate(
                            """hero => {
                              const card = hero.querySelector('.research-hero-content').getBoundingClientRect();
                              const frame = hero.getBoundingClientRect();
                              return {
                                cardCenter: card.left + card.width / 2,
                                frameCenter: frame.left + frame.width / 2,
                                cardRatio: card.width / frame.width,
                              };
                            }"""
                        )
                        if label == "desktop" and (
                            abs(hero_geometry["cardCenter"] - hero_geometry["frameCenter"]) > 8
                            or hero_geometry["cardRatio"] > 0.36
                        ):
                            raise AssertionError(f"Rutherford title card is not compact and centered: {hero_geometry}")
                        page.screenshot(path=OUTPUT / f"rutherford-hero-{label}.png")
                    if page.locator(".research-section-body[data-content-state='complete']").count() != 6:
                        raise AssertionError(f"{slug} page is not fully populated")
                    if page.locator(".empty-section").count() != 0:
                        raise AssertionError(f"{slug} still contains empty placeholders")
                    if page.locator(".research-formula .katex-display").count() < formula_count:
                        raise AssertionError(f"{slug} equations are incomplete")
                    if page.locator(".katex-error").count() != 0:
                        raise AssertionError(f"{slug} contains a KaTeX render error")
                    if page.locator(".research-figure img").count() != image_count:
                        raise AssertionError(f"{slug} result figures are incomplete")
                    for figure in page.locator(".research-figure").all():
                        figure.scroll_into_view_if_needed()
                        page.wait_for_timeout(120)
                    incomplete_images = page.locator(".research-figure img").evaluate_all(
                        "nodes => nodes.filter(node => !node.complete || node.naturalWidth === 0).length"
                    )
                    if incomplete_images:
                        raise AssertionError(f"A {slug} figure failed to load")
                    assert_no_overflow(page, f"{label} {slug}")
                    page.locator(f"#{formula_section}").scroll_into_view_if_needed()
                    page.wait_for_timeout(180)
                    page.screenshot(path=OUTPUT / f"{slug}-formulas-{label}.png")
                    page.locator(f"#{result_section}").scroll_into_view_if_needed()
                    page.wait_for_timeout(180)
                    page.screenshot(path=OUTPUT / f"{slug}-results-{label}.png")

                page.goto(f"{BASE_URL}/#/projects/karnaugh-map", wait_until="networkidle")
                page.wait_for_timeout(500)
                if page.locator(".detail-artwork").count() != 1:
                    raise AssertionError("Tools artwork detail presentation was not applied")
                if page.locator(".research-hero-content .hero-repository").count() != 1:
                    raise AssertionError("Tools source action is not inside the title card")
                if page.locator(".research-hero > .hero-repository").count() != 0:
                    raise AssertionError("Tools source action still overlays the right-side artwork")
                tools_background = page.locator(".research-hero-image").evaluate(
                    "node => getComputedStyle(node).backgroundImage"
                )
                if "tools-sr.jpg" not in tools_background:
                    raise AssertionError(f"Tools hero is not using the full background artwork: {tools_background}")
                if label == "desktop":
                    title_and_hero = page.locator(".research-hero").evaluate(
                        """hero => {
                          const title = hero.querySelector('.research-hero-content').getBoundingClientRect();
                          const frame = hero.getBoundingClientRect();
                          return { titleRight: title.right, safeBoundary: frame.left + frame.width * 0.56 };
                        }"""
                    )
                    if title_and_hero["titleRight"] > title_and_hero["safeBoundary"]:
                        raise AssertionError(f"Tools title card intrudes into the portrait area: {title_and_hero}")
                if page.locator(".research-section-body[data-content-state='complete']").count() != 6:
                    raise AssertionError("Karnaugh page is not fully populated")
                if page.locator(".empty-section").count() != 0:
                    raise AssertionError("Karnaugh page still contains empty placeholders")
                if page.locator(".research-formula .katex-display").count() < 8:
                    raise AssertionError("Karnaugh constraints are missing KaTeX formulas")
                if page.locator(".katex-error").count() != 0:
                    raise AssertionError("Karnaugh page contains a KaTeX render error")
                use_case_image = page.locator("img[src*='karnaugh/four-variable-use-case.png']")
                if use_case_image.count() != 1:
                    raise AssertionError("Karnaugh use-case screenshot is missing")
                assert_no_overflow(page, f"{label} Karnaugh detail")
                page.screenshot(path=OUTPUT / f"tool-karnaugh-hero-{label}.png")
                use_case_image.scroll_into_view_if_needed()
                page.wait_for_timeout(180)
                if not use_case_image.evaluate("node => node.complete && node.naturalWidth > 0"):
                    raise AssertionError("Karnaugh use-case screenshot failed to load")
                page.locator("#cover-model").scroll_into_view_if_needed()
                page.wait_for_timeout(250)
                page.screenshot(path=OUTPUT / f"tool-karnaugh-formulas-{label}.png")
                page.locator("#output").scroll_into_view_if_needed()
                page.wait_for_timeout(250)
                page.screenshot(path=OUTPUT / f"tool-karnaugh-use-case-{label}.png")

                page.goto(f"{BASE_URL}/#/projects/local-drop", wait_until="networkidle")
                page.wait_for_timeout(500)
                if page.locator(".research-section-body[data-content-state='complete']").count() != 6:
                    raise AssertionError("LocalDrop page is not fully populated")
                if page.locator(".empty-section").count() != 0:
                    raise AssertionError("LocalDrop page still contains empty placeholders")
                if page.get_by_text("Runtime dependencies", exact=True).count() != 1:
                    raise AssertionError("LocalDrop technology stack is incomplete")
                if page.get_by_text("Server-Sent Events", exact=True).count() < 1:
                    raise AssertionError("LocalDrop realtime stack is missing")
                assert_no_overflow(page, f"{label} LocalDrop detail")
                page.screenshot(path=OUTPUT / f"tool-localdrop-hero-{label}.png")
                page.locator("#stack").scroll_into_view_if_needed()
                page.wait_for_timeout(250)
                page.screenshot(path=OUTPUT / f"tool-localdrop-stack-{label}.png")

                page.evaluate("sessionStorage.clear()")
                page.goto(f"{BASE_URL}/#/projects/labflow-ai", wait_until="networkidle")
                page.wait_for_selector(".agent-evolution-page")
                page.wait_for_timeout(500)
                if page.locator(".agent-stage").count() != 4:
                    raise AssertionError("Agent evolution page is missing a chronological stage")
                if page.locator(".agent-route-step").count() != 4:
                    raise AssertionError("Agent evolution page is missing a project route")
                if page.locator(".agent-stack-block").count() != 4:
                    raise AssertionError("Agent evolution page is missing a technology stack")
                if page.get_by_text("From API Calls to Embodied Agents", exact=True).count() != 1:
                    raise AssertionError("Agent evolution hero copy is missing")
                if page.locator(".agent-stage.is-active").get_attribute("id") != "agent-labflow-ai":
                    raise AssertionError("LabFlow AI route did not focus its timeline stage")
                active_stage_top = page.locator(".agent-stage.is-active").evaluate(
                    "node => Math.round(node.getBoundingClientRect().top)"
                )
                if active_stage_top < 0 or active_stage_top > 64:
                    raise AssertionError(f"LabFlow AI stage did not snap into view: {active_stage_top}")
                stage_blur = page.locator(".agent-stage-card").first.evaluate(
                    "node => getComputedStyle(node).backdropFilter"
                )
                if "blur(" not in stage_blur:
                    raise AssertionError(f"Agent stage is missing local glass blur: {stage_blur}")
                assert_no_overflow(page, f"{label} Agent evolution")
                page.screenshot(path=OUTPUT / f"agent-labflow-{label}.png")
                page.locator(".agent-evolution-hero").scroll_into_view_if_needed()
                page.wait_for_timeout(250)
                page.screenshot(path=OUTPUT / f"agent-overview-{label}.png")

                page.goto(f"{BASE_URL}/#/projects/lingyin-agent", wait_until="networkidle")
                page.wait_for_selector(".agent-evolution-page")
                page.wait_for_timeout(500)
                if page.locator(".agent-stage.is-active").get_attribute("id") != "agent-lingyin-agent":
                    raise AssertionError("Lingyin Agent route did not focus its timeline stage")
                active_stage_top = page.locator(".agent-stage.is-active").evaluate(
                    "node => Math.round(node.getBoundingClientRect().top)"
                )
                if active_stage_top < 0 or active_stage_top > 64:
                    raise AssertionError(f"Lingyin Agent stage did not snap into view: {active_stage_top}")
                assert_no_overflow(page, f"{label} Lingyin Agent")
                page.screenshot(path=OUTPUT / f"agent-lingyin-{label}.png")

                nav_back = page.locator(".nav-back")
                nav_back_box = nav_back.bounding_box()
                if nav_back_box is None:
                    raise AssertionError("Agent back button is not visible")
                nav_back_is_frontmost = page.evaluate(
                    """point => Boolean(
                      document.elementFromPoint(point.x, point.y)?.closest('.nav-back')
                    )""",
                    {
                        "x": nav_back_box["x"] + nav_back_box["width"] / 2,
                        "y": nav_back_box["y"] + nav_back_box["height"] / 2,
                    },
                )
                if not nav_back_is_frontmost:
                    raise AssertionError("Agent back button is covered by timeline content")
                nav_back.click()
                page.wait_for_selector(".profile-stage")
                page.wait_for_timeout(400)
                agent_return = page.evaluate(
                    """() => ({
                      hash: location.hash,
                      y: Math.round(scrollY),
                      stage: document.elementFromPoint(innerWidth / 2, innerHeight / 2)
                        ?.closest('.project-stage')?.id,
                    })"""
                )
                if agent_return != {"hash": "#/", "y": 0, "stage": "github"}:
                    raise AssertionError(
                        f"Lingyin Agent did not return to the top of the homepage: {agent_return}"
                    )

                page.goto(f"{BASE_URL}/#/projects/solid-sim-lab", wait_until="networkidle")
                page.evaluate("scrollTo(0, document.documentElement.scrollHeight)")
                page.wait_for_timeout(250)
                page.locator(".nav-back").click()
                page.wait_for_selector(".profile-stage")
                page.wait_for_timeout(400)
                project_return = page.evaluate(
                    """() => ({
                      hash: location.hash,
                      y: Math.round(scrollY),
                      stage: document.elementFromPoint(innerWidth / 2, innerHeight / 2)
                        ?.closest('.project-stage')?.id,
                    })"""
                )
                if project_return != {"hash": "#/", "y": 0, "stage": "github"}:
                    raise AssertionError(
                        f"Long project page did not return to the top of the homepage: {project_return}"
                    )
                page.close()

            route_page = browser.new_page(viewport={"width": 1024, "height": 768})
            for href in hrefs:
                route_page.goto(f"{BASE_URL}/{href}", wait_until="domcontentloaded")
                route_page.wait_for_selector(".research-hero h1, .research-section h2, .agent-evolution-hero h1")
                assert_all_figures_zoomable(route_page, href.removeprefix("#/projects/"))
            route_page.goto(f"{BASE_URL}/#/projects/not-a-project", wait_until="networkidle")
            if route_page.locator("text=Project not found").count() != 1:
                raise AssertionError("Missing project not-found state")
            route_page.close()
            browser.close()

        print("qa=ok sections=5 projects=13 routes=13 responsive=ok")
        return 0
    finally:
        server.terminate()
        try:
            server.wait(timeout=5)
        except subprocess.TimeoutExpired:
            server.kill()


if __name__ == "__main__":
    raise SystemExit(main())
