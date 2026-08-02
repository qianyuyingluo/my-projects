"""Generate reproducible figures for the scientific-simulation project pages."""

from __future__ import annotations

import os
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
from PIL import Image
from scipy.integrate import solve_ivp
from scipy.special import j1


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "images" / "simulations"
GROUP_SOURCE = Path(
    os.environ.get(
        "POINT_GROUP_SCREENSHOT_DIR",
        r"C:\Users\a1721\Desktop\group\output\group-3d-screenshots",
    )
)

INK = "#18324f"
MUTED = "#63758a"
BLUE = "#2d7dd2"
CYAN = "#49afd9"
PINK = "#ef4f91"
ORANGE = "#ef8f35"
GREEN = "#3d9b76"
PAPER = "#f7fbff"
GRID = "#dce8f3"


def configure_plotting() -> None:
    plt.rcParams.update(
        {
            "font.family": "DejaVu Sans",
            "font.size": 10,
            "axes.labelcolor": INK,
            "axes.titlecolor": INK,
            "axes.edgecolor": "#9db2c7",
            "xtick.color": MUTED,
            "ytick.color": MUTED,
            "figure.facecolor": PAPER,
            "axes.facecolor": "#ffffff",
            "grid.color": GRID,
            "grid.alpha": 0.72,
        }
    )


def save_figure(fig: plt.Figure, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(
        path,
        dpi=220,
        bbox_inches="tight",
        facecolor=fig.get_facecolor(),
        pil_kwargs={"quality": 95, "subsampling": 0},
    )
    plt.close(fig)


def potential(q: float, x: np.ndarray, a: float = 1.0) -> np.ndarray:
    return 2.0 * np.pi**2 * q * np.cos(2.0 * np.pi * x / a)


def fdm_hamiltonian(q: float, k: float, n: int, a: float = 1.0) -> tuple[np.ndarray, float]:
    dx = a / n
    hopping = 1.0 / dx**2  # hbar=1 and m=0.5
    x = np.arange(n) * dx
    h = np.zeros((n, n), dtype=np.complex128)
    np.fill_diagonal(h, 2.0 * hopping + potential(q, x, a))
    off = np.arange(n - 1)
    h[off, off + 1] = -hopping
    h[off + 1, off] = -hopping
    phase = np.exp(1j * k * a)
    h[0, -1] = -hopping * np.conj(phase)
    h[-1, 0] = -hopping * phase
    return h, dx


def solve_fdm_bands(q: float, r_values: np.ndarray, bands: int = 3, n: int = 120) -> np.ndarray:
    energies = np.empty((bands, len(r_values)))
    for index, r in enumerate(r_values):
        h, _ = fdm_hamiltonian(q, r * np.pi, n)
        energies[:, index] = np.linalg.eigvalsh(h)[:bands]
    return energies


def solve_pwe_bands(
    q: float,
    r_values: np.ndarray,
    bands: int = 3,
    gmax: int = 6,
) -> np.ndarray:
    g_values = 2.0 * np.pi * np.arange(-gmax, gmax + 1)
    coupling = np.pi**2 * q
    energies = np.empty((bands, len(r_values)))
    for index, r in enumerate(r_values):
        k = r * np.pi
        h = np.diag((k + g_values) ** 2)
        h += np.diag(np.full(len(g_values) - 1, coupling), 1)
        h += np.diag(np.full(len(g_values) - 1, coupling), -1)
        energies[:, index] = np.linalg.eigvalsh(h)[:bands]
    return energies


def generate_band_figures() -> None:
    out = OUTPUT / "crystal-physics"
    r_values = np.linspace(-1.0, 1.0, 101)
    fdm = solve_fdm_bands(2.4, r_values)
    pwe = solve_pwe_bands(2.4, r_values)
    colors = (BLUE, ORANGE, GREEN)

    fig, axes = plt.subplots(1, 2, figsize=(12.4, 4.7), sharex=True, sharey=True)
    fig.subplots_adjust(wspace=0.12)
    for axis, values, title in zip(
        axes,
        (fdm, pwe),
        ("Finite difference + Bloch boundary", "Plane-wave expansion"),
    ):
        for band, color in enumerate(colors):
            axis.plot(r_values, values[band], color=color, linewidth=2.2, label=f"Band {band + 1}")
        axis.axvline(-1, color=PINK, linewidth=1, linestyle="--", alpha=0.65)
        axis.axvline(1, color=PINK, linewidth=1, linestyle="--", alpha=0.65)
        axis.set_title(title, fontsize=12, weight="semibold", pad=12)
        axis.set_xlabel(r"Reduced wavevector $r=ka/\pi$")
        axis.grid(True)
        axis.legend(frameon=False, fontsize=8, loc="best")
    axes[0].set_ylabel("Dimensionless energy E")
    fig.suptitle(r"1D cosine potential — $q=2.4$", fontsize=15, weight="bold", y=1.02)
    save_figure(fig, out / "band-comparison.jpg")

    r_pick = 0.35
    h, dx = fdm_hamiltonian(2.4, r_pick * np.pi, 260)
    eigenvalues, eigenvectors = np.linalg.eigh(h)
    psi = eigenvectors[:, 0]
    psi /= np.sqrt(np.sum(np.abs(psi) ** 2) * dx)
    x = np.arange(len(psi)) * dx
    phase = np.exp(1j * r_pick * np.pi)
    derivative = np.empty_like(psi)
    derivative[1:-1] = (psi[2:] - psi[:-2]) / (2 * dx)
    derivative[0] = (psi[1] - np.conj(phase) * psi[-1]) / (2 * dx)
    derivative[-1] = (phase * psi[0] - psi[-2]) / (2 * dx)
    density = np.abs(psi) ** 2
    current = 2.0 * np.imag(np.conj(psi) * derivative)
    periodic = psi * np.exp(-1j * r_pick * np.pi * x)
    orders = np.arange(-10, 11)
    coeffs = np.array(
        [np.sum(periodic * np.exp(-1j * 2 * np.pi * order * x)) * dx for order in orders]
    )

    fig, axes = plt.subplots(1, 3, figsize=(13.2, 4.25))
    axes[0].plot(x, density, color=BLUE, linewidth=2.3)
    axes[0].fill_between(x, density, color=BLUE, alpha=0.12)
    axes[0].set_title(r"Density $|\psi(x)|^2$", weight="semibold")
    axes[0].set_xlabel("x / a")
    axes[0].set_ylabel("Probability density")
    axes[1].plot(x, current, color=PINK, linewidth=2.3)
    axes[1].axhline(0, color="#9db2c7", linewidth=1)
    axes[1].set_title(r"Current $J(x)$", weight="semibold")
    axes[1].set_xlabel("x / a")
    axes[1].set_ylabel("Dimensionless current")
    axes[2].stem(orders, np.abs(coeffs), linefmt=GREEN, markerfmt="o", basefmt=" ")
    axes[2].set_title(r"Fourier amplitudes $|c_n|$", weight="semibold")
    axes[2].set_xlabel("Reciprocal-lattice index n")
    axes[2].set_ylabel("Amplitude")
    for axis in axes:
        axis.grid(True)
    fig.suptitle(
        rf"Representative Bloch state — $q=2.4$, $r={r_pick}$, band 1, $E={eigenvalues[0]:.3f}$",
        fontsize=14,
        weight="bold",
        y=1.03,
    )
    fig.tight_layout()
    save_figure(fig, out / "bloch-observables.jpg")


def sinc(value: np.ndarray) -> np.ndarray:
    return np.sinc(value / np.pi)


def generate_fraunhofer_figures() -> None:
    out = OUTPUT / "fraunhofer"
    coordinate = np.linspace(-12.0, 12.0, 620)
    u, v = np.meshgrid(coordinate, coordinate)
    radius = np.hypot(u, v)
    airy_amplitude = np.ones_like(radius)
    mask = radius > 1e-12
    airy_amplitude[mask] = 2 * j1(radius[mask]) / radius[mask]
    patterns = [
        (sinc(u) ** 2, "Single slit"),
        (sinc(u) ** 2 * np.cos(2.35 * u) ** 2, "Double slit"),
        ((sinc(u) * sinc(0.65 * v)) ** 2, "Rectangular aperture"),
        (airy_amplitude**2, "Circular aperture / Airy pattern"),
    ]

    fig, axes = plt.subplots(2, 2, figsize=(10.8, 8.9), facecolor="#101725")
    for axis, (intensity, title) in zip(axes.flat, patterns):
        mapped = np.arcsinh(18 * intensity) / np.arcsinh(18)
        axis.imshow(mapped, cmap="magma", origin="lower", extent=(-12, 12, -12, 12))
        axis.set_title(title, color="white", fontsize=12, weight="semibold", pad=9)
        axis.set_xticks([])
        axis.set_yticks([])
        for spine in axis.spines.values():
            spine.set_visible(False)
    fig.suptitle("Fraunhofer far-field intensity — theoretical reconstruction", color="white", fontsize=15, weight="bold")
    fig.tight_layout(rect=(0, 0, 1, 0.96))
    save_figure(fig, out / "diffraction-patterns.jpg")

    theta = np.linspace(-10.0, 10.0, 1600)
    single = sinc(theta) ** 2
    double = single * np.cos(2.35 * theta) ** 2
    radial = np.abs(theta)
    airy_line = np.ones_like(radial)
    nonzero = radial > 1e-12
    airy_line[nonzero] = (2 * j1(radial[nonzero]) / radial[nonzero]) ** 2
    fig, axis = plt.subplots(figsize=(10.8, 4.65))
    axis.plot(theta, single, color=BLUE, linewidth=2.2, label="Single slit")
    axis.plot(theta, double, color=PINK, linewidth=1.8, label="Double slit")
    axis.plot(theta, airy_line, color=ORANGE, linewidth=1.8, label="Circular aperture")
    axis.set_xlabel("Normalized screen coordinate")
    axis.set_ylabel(r"Normalized intensity $I/I_0$")
    axis.set_title("Central intensity profiles", fontsize=14, weight="bold", pad=12)
    axis.set_ylim(-0.02, 1.04)
    axis.grid(True)
    axis.legend(frameon=False, ncol=3)
    save_figure(fig, out / "intensity-profiles.jpg")


def rutherford_rhs(_: float, state: np.ndarray) -> np.ndarray:
    x, y, vx, vy = state
    radius = max(np.hypot(x, y), 1e-16)
    coulomb = 8.988e9 * 2 * 79 * (1.602e-19) ** 2
    factor = coulomb / (6.644e-27 * radius**3)
    return np.array([vx, vy, factor * x, factor * y])


def generate_rutherford_figures() -> None:
    out = OUTPUT / "rutherford"
    fig, axis = plt.subplots(figsize=(10.8, 5.8))
    impact_parameters = np.array([-6.0, -4.0, -2.4, -1.2, 1.2, 2.4, 4.0, 6.0]) * 1e-14
    colors = plt.cm.coolwarm(np.linspace(0.08, 0.92, len(impact_parameters)))
    for impact, color in zip(impact_parameters, colors):
        solution = solve_ivp(
            rutherford_rhs,
            (0.0, 3.5e-20),
            [-2.6e-13, impact, 2.0e7, 0.0],
            rtol=2e-8,
            atol=1e-18,
            max_step=2e-23,
        )
        axis.plot(solution.y[0] * 1e13, solution.y[1] * 1e13, color=color, linewidth=1.75)
    nucleus = plt.Circle((0, 0), 0.11, color="#e8b13f", ec="#8f5b00", linewidth=1.2, zorder=5)
    axis.add_patch(nucleus)
    axis.annotate("Au nucleus", (0, 0), xytext=(14, 12), textcoords="offset points", color=INK, weight="semibold")
    axis.set_xlim(-2.8, 3.1)
    axis.set_ylim(-2.2, 2.2)
    axis.set_aspect("equal")
    axis.set_xlabel(r"x  ($10^{-13}$ m)")
    axis.set_ylabel(r"y  ($10^{-13}$ m)")
    axis.set_title("Alpha-particle trajectories for several impact parameters", fontsize=14, weight="bold", pad=12)
    axis.grid(True)
    save_figure(fig, out / "scattering-trajectories.jpg")

    angles = np.linspace(12, 168, 180)
    theory = 1.0 / np.sin(np.deg2rad(angles) / 2) ** 4
    theory /= theory.max()
    rng = np.random.default_rng(20260802)
    sampled_angles = np.linspace(14, 164, 34)
    sampled = np.interp(sampled_angles, angles, theory)
    sampled *= np.exp(rng.normal(0.0, 0.09, sampled.size))
    fig, axis = plt.subplots(figsize=(10.8, 5.2))
    axis.semilogy(angles, theory, color=BLUE, linewidth=2.4, label=r"Rutherford $\csc^4(\theta/2)$")
    axis.semilogy(sampled_angles, sampled, "o", color=PINK, markersize=4.8, alpha=0.86, label="Sampled detector bins")
    axis.set_xlabel(r"Scattering angle $\theta$ (degrees)")
    axis.set_ylabel("Normalized differential count")
    axis.set_title("Angular scattering law", fontsize=14, weight="bold", pad=12)
    axis.grid(True, which="both")
    axis.legend(frameon=False)
    save_figure(fig, out / "rutherford-law.jpg")


def export_point_group_screenshots() -> None:
    out = OUTPUT / "point-groups"
    out.mkdir(parents=True, exist_ok=True)
    sources = {
        "18-C3v.png": "c3v.jpg",
        "15-D4h.png": "d4h.jpg",
        "32-Oh.png": "oh.jpg",
    }
    for source_name, output_name in sources.items():
        source = GROUP_SOURCE / source_name
        if not source.exists():
            raise FileNotFoundError(f"Point-group screenshot not found: {source}")
        with Image.open(source) as image:
            image = image.convert("RGB")
            # Use only the scientific 3D viewport; omit local-only sidebar additions.
            left = int(image.width * 0.225)
            cropped = image.crop((left, 0, image.width, image.height))
            cropped.save(out / output_name, format="JPEG", quality=95, subsampling=0, optimize=True)


def main() -> None:
    configure_plotting()
    generate_band_figures()
    generate_fraunhofer_figures()
    generate_rutherford_figures()
    export_point_group_screenshots()
    generated = sorted(OUTPUT.glob("**/*.jpg"))
    print(f"generated={len(generated)}")
    for path in generated:
        print(path.relative_to(ROOT))


if __name__ == "__main__":
    main()
