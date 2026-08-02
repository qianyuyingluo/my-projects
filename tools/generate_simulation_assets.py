"""Generate portfolio figures from the original simulation projects.

The source projects are read-only. All generated JPEG assets are written under
my-projects/public/images/simulations.
"""

from __future__ import annotations

import importlib.util
import math
from pathlib import Path

import matplotlib
import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright


matplotlib.use("Agg", force=True)
import matplotlib.pyplot as plt  # noqa: E402


ORIGINAL_ROOT = Path(r"E:\桌面")
PORTFOLIO_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_ROOT = PORTFOLIO_ROOT / "public" / "images" / "simulations"
EDGE_CANDIDATES = (
    Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"),
    Path(r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"),
)

INK = "#17345d"
BLUE = "#3979c6"
CYAN = "#39a9d6"
ORANGE = "#ef8a38"
PINK = "#e94588"
GREEN = "#4b9b68"
GRID = "#dce7f2"


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load source module: {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def configure_axes(ax, title: str, xlabel: str, ylabel: str) -> None:
    ax.set_title(title, color=INK, fontsize=13, fontweight=650, pad=10)
    ax.set_xlabel(xlabel, color=INK)
    ax.set_ylabel(ylabel, color=INK)
    ax.grid(True, color=GRID, linewidth=0.8, alpha=0.8)
    ax.tick_params(colors="#53657d")
    for spine in ax.spines.values():
        spine.set_color("#b9cadc")


def save_figure(fig, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(
        path,
        dpi=220,
        format="jpeg",
        pil_kwargs={"quality": 95},
        bbox_inches="tight",
        facecolor="#f8fbff",
    )
    plt.close(fig)


def generate_crystal_physics() -> None:
    source = ORIGINAL_ROOT / "CrystalPhysics-coursework" / "simulate.py"
    module = load_module("original_crystal_physics", source)
    plt.switch_backend("Agg")

    output = OUTPUT_ROOT / "crystal-physics-coursework"
    q = 2.4
    bands = 3
    r_fdm, energy_fdm = module.solve_bands_fdm_torch(
        q=q,
        N=180,
        num_k=101,
        num_bands=bands,
    )
    r_pwe, energy_pwe = module.solve_bands_pwe(
        q=q,
        Gmax=6,
        num_k=101,
        num_bands=bands,
    )

    fig, axes = plt.subplots(1, 2, figsize=(12.8, 5.4), constrained_layout=True)
    colors = (BLUE, ORANGE, GREEN)
    for index, color in enumerate(colors):
        axes[0].plot(r_fdm, energy_fdm[index], color=color, linewidth=2.2, label=f"Band {index + 1}")
        axes[1].plot(r_pwe, energy_pwe[index], color=color, linewidth=2.2, label=f"Band {index + 1}")
    configure_axes(axes[0], "Finite difference + Bloch boundary", r"$r=ka/\pi$", "Energy")
    configure_axes(axes[1], "Plane-wave expansion", r"$r=ka/\pi$", "Energy")
    for ax in axes:
        ax.axvline(-1, color=PINK, linestyle="--", linewidth=1, alpha=0.65)
        ax.axvline(1, color=PINK, linestyle="--", linewidth=1, alpha=0.65)
        ax.legend(frameon=False, fontsize=9)
    fig.suptitle(rf"1D periodic cosine potential · $q={q}$", color=INK, fontsize=16, fontweight=650)
    save_figure(fig, output / "fdm-pwe-bands.jpg")

    r_pick = 0.35
    x, energy, _psi, _u, rho, current, indices, coeffs = module.solve_one_state_fdm_torch(
        q=q,
        r=r_pick,
        band_index=0,
        N=400,
    )
    fig, axes = plt.subplots(1, 3, figsize=(14.4, 4.7), constrained_layout=True)
    axes[0].plot(x, rho, color=BLUE, linewidth=2.2)
    configure_axes(axes[0], "Probability density", r"$x/a$", r"$|\psi(x)|^2$")
    axes[1].plot(x, current, color=ORANGE, linewidth=2.2)
    configure_axes(axes[1], "Probability current", r"$x/a$", r"$J(x)$")
    markerline, stemlines, baseline = axes[2].stem(indices, np.abs(coeffs), basefmt=" ")
    plt.setp(markerline, markerfacecolor=PINK, markeredgecolor=PINK, markersize=5)
    plt.setp(stemlines, color=PINK, linewidth=1.5)
    baseline.set_visible(False)
    configure_axes(axes[2], "Periodic-part Fourier amplitudes", r"$n$ in $G_n=2\pi n/a$", r"$|c_n|$")
    fig.suptitle(
        rf"Selected Bloch state · $q={q}$ · $r={r_pick}$ · first band · $E={energy:.3f}$",
        color=INK,
        fontsize=15,
        fontweight=650,
    )
    save_figure(fig, output / "bloch-observables.jpg")


def capture_fraunhofer() -> None:
    source = ORIGINAL_ROOT / "fraunhofer" / "fraunhofer.html"
    output = OUTPUT_ROOT / "fraunhofer"
    output.mkdir(parents=True, exist_ok=True)
    edge = next((candidate for candidate in EDGE_CANDIDATES if candidate.exists()), None)
    if edge is None:
        raise RuntimeError("Microsoft Edge was not found")

    captures = (
        ("double", "double-slit.jpg"),
        ("circle", "circular-aperture.jpg"),
        ("doubleCircle", "double-aperture.jpg"),
    )
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path=str(edge), headless=True)
        context = browser.new_context(viewport={"width": 1500, "height": 1000}, device_scale_factor=2)
        page = context.new_page()
        page.goto(source.as_uri(), wait_until="load")
        for pattern, filename in captures:
            page.evaluate(
                """pattern => {
                  document.querySelector('#pattern').value = pattern;
                  document.querySelector('#grid').value = '800';
                  document.querySelector('#mapMode').value = 'asinh';
                  document.querySelector('#cmap').value = 'inferno';
                }""",
                pattern,
            )
            page.locator("#renderBtn").click()
            page.wait_for_timeout(180)
            page.locator("#view").screenshot(path=output / filename, type="jpeg", quality=95)
        browser.close()


def generate_rutherford() -> None:
    source = ORIGINAL_ROOT / "rutherford-scattering-simulator" / "rutherford_scattering_simulator.py"
    module = load_module("original_rutherford", source)
    plt.switch_backend("Agg")
    output = OUTPUT_ROOT / "rutherford-scattering-simulator"

    v0 = 2.0e7
    x0 = -2.0e-13
    impact_parameters = np.linspace(-2.0e-13, 2.0e-13, 13)
    trajectories = [
        module.RutherfordScatteringApp.compute_basic_trajectory(
            None,
            v0,
            x0,
            float(impact),
            t_max=4.0e-20,
            N=2200,
        )
        for impact in impact_parameters
    ]

    fig, ax = plt.subplots(figsize=(10.8, 6.1), constrained_layout=True)
    for index, trajectory in enumerate(trajectories):
        color = plt.cm.viridis(index / max(1, len(trajectories) - 1))
        ax.plot(trajectory[:, 0] * 1e13, trajectory[:, 1] * 1e13, color=color, linewidth=1.5, alpha=0.88)
    ax.scatter([0], [0], s=165, color="#d8a514", edgecolor="white", linewidth=1.6, zorder=5, label="Au nucleus")
    configure_axes(ax, "Numerically integrated alpha-particle trajectories", r"$x\;(10^{-13}\,\mathrm{m})$", r"$y\;(10^{-13}\,\mathrm{m})$")
    ax.set_aspect("equal", adjustable="box")
    ax.legend(frameon=False)
    save_figure(fig, output / "trajectory-bundle.jpg")

    z_target = 79.0
    energy = 5.5e6 * module.e_charge
    coulomb_factor = module.Z_alpha * z_target * module.e_charge**2 / (4 * math.pi * module.epsilon_0)
    b = np.geomspace(1e-15, 2e-13, 240)
    theta = 2 * np.arctan(coulomb_factor / (2 * energy * b))
    theta_deg = np.degrees(theta)
    theta_axis = np.linspace(20, 150, 600)
    normalized_cross_section = np.sin(np.radians(theta_axis) / 2) ** -4
    normalized_cross_section /= normalized_cross_section.max()

    fig, axes = plt.subplots(1, 2, figsize=(12.8, 5.2), constrained_layout=True)
    axes[0].semilogx(b * 1e13, theta_deg, color=BLUE, linewidth=2.3)
    configure_axes(axes[0], "Impact parameter to scattering angle", r"$b\;(10^{-13}\,\mathrm{m})$", r"$\theta$ (degrees)")
    axes[1].semilogy(theta_axis, normalized_cross_section, color=PINK, linewidth=2.3)
    configure_axes(axes[1], "Rutherford angular law", r"$\theta$ (degrees)", r"normalized $d\sigma/d\Omega$")
    fig.suptitle("Rutherford scattering law · 5.5 MeV alpha particles on gold", color=INK, fontsize=15, fontweight=650)
    save_figure(fig, output / "scattering-law.jpg")


def copy_point_group_captures() -> None:
    source_root = Path(r"C:\Users\a1721\Desktop\group\output\group-3d-screenshots")
    output = OUTPUT_ROOT / "group"
    output.mkdir(parents=True, exist_ok=True)
    for source_name, target_name in (
        ("18-C3v.png", "c3v.jpg"),
        ("15-D4h.png", "d4h.jpg"),
        ("32-Oh.png", "oh.jpg"),
    ):
        with Image.open(source_root / source_name) as image:
            image.convert("RGB").save(output / target_name, format="JPEG", quality=95, optimize=True)


def main() -> int:
    generate_crystal_physics()
    capture_fraunhofer()
    generate_rutherford()
    copy_point_group_captures()
    for path in sorted(OUTPUT_ROOT.rglob("*.jpg")):
        print(path.relative_to(PORTFOLIO_ROOT))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
