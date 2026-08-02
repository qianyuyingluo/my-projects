import { laserPinnSections, quantumPinnSections } from "./pinnResearch";

export type CategoryId = "pinn" | "simulation" | "tools" | "agents";

export interface ResearchSection {
  id: string;
  label: string;
  content?: string;
  paragraphs?: string[];
  bullets?: string[];
  code?: string;
  facts?: Array<{ label: string; value: string }>;
  formulas?: Array<{ latex: string; label: string; caption?: string }>;
  media?: Array<{
    src: string;
    alt: string;
    caption?: string;
    aspect?: "wide" | "square" | "ultrawide";
    fit?: "cover" | "contain";
  }>;
  note?: string;
  tags?: string[];
  links?: Array<{ label: string; href: string; external?: boolean }>;
}

export interface Project {
  slug: string;
  title: string;
  shortTitle?: string;
  category: CategoryId;
  repositoryUrl: string;
  launches?: Array<{
    index: string;
    label: string;
    description: string;
    href: string;
    mode: "2D" | "3D";
  }>;
  sections: ResearchSection[];
  equations: string[];
  status?: string;
}

export interface Category {
  id: CategoryId;
  index: string;
  eyebrow: string;
  title: string;
  background: string;
  detailBackground: string;
  focalPoint: string;
  detailPresentation: "portrait" | "title" | "artwork";
}

export const researchSections: ResearchSection[] = [
  { id: "overview", label: "Research Overview", content: "" },
  { id: "question", label: "Research Question", content: "" },
  { id: "methodology", label: "Methodology", content: "" },
  { id: "equations", label: "Equations", content: "" },
  { id: "results", label: "Results", content: "" },
  { id: "reproducibility", label: "Reproducibility", content: "" },
];

const emptySections = () => researchSections.map((section) => ({ ...section }));

const karnaughSections: ResearchSection[] = [
  {
    id: "overview",
    label: "Problem & Scope",
    content:
      "An interactive Karnaugh-map editor for two to six variables. Cells take 0, 1, or X, and the solver returns a minimum Sum-of-Products expression.",
    facts: [
      { label: "Variables", value: "2–6" },
      { label: "Cell states", value: "0 / 1 / X" },
      { label: "Candidate patterns", value: "3ⁿ − 1" },
      { label: "Output", value: "Minimum SOP" },
    ],
    tags: ["Gray-code layout", "Manual grouping", "Automatic minimization", "KaTeX output"],
  },
  {
    id: "legal-groups",
    label: "Legal Group Constraints",
    content:
      "Let O, D, and Z denote the 1, don't-care, and 0 minterms. A pattern uses 0, 1, or a dash for each variable; the all-dash pattern is excluded.",
    formulas: [
      {
        label: "Input partition",
        caption: "Input domain",
        latex: String.raw`\begin{aligned}n&\in\{2,3,4,5,6\}\\\Omega&=\{0,\ldots,2^n-1\}=\mathcal O\,\dot\cup\,\mathcal D\,\dot\cup\,\mathcal Z\end{aligned}`,
      },
      {
        label: "Set of valid Karnaugh groups",
        caption: "Every enumerated group must avoid zero cells and include at least one required one",
        latex: String.raw`\begin{aligned}\mathcal C=\{C(p)\mid\;&p\in\{0,1,\mathtt{-}\}^{n}\setminus\{\mathtt{-}^{n}\},\\&C(p)\cap\mathcal Z=\varnothing,\\&C(p)\cap\mathcal O\neq\varnothing\}\end{aligned}`,
      },
      {
        label: "Group size and literal count",
        caption: "A dash removes one literal",
        latex: String.raw`\begin{aligned}|C_i|&=2^{k_i},\qquad k_i=\#\{r:p_{ir}=\mathtt{-}\}\\L_i&=n-k_i=n-\log_2|C_i|\end{aligned}`,
      },
    ],
  },
  {
    id: "cover-model",
    label: "Minimum Cover Model",
    content:
      "For M required one-minterms and N legal groups, aji records whether group Ci covers minterm mj. Binary xi selects a group.",
    formulas: [
      {
        label: "Coverage matrix definition",
        caption: "Coverage matrix",
        latex: String.raw`\begin{aligned}A&=(a_{ji})\in\{0,1\}^{M\times N}\\a_{ji}&=\begin{cases}1,&m_j\in C_i\\0,&m_j\notin C_i\end{cases}\end{aligned}`,
      },
      {
        label: "Primary integer program with all constraints",
        caption: "Stage 1 — minimum number of product terms",
        latex: String.raw`\begin{aligned}T_{\min}&=\min_{\mathbf x}\sum_{i=1}^{N}x_i\\[2pt]\text{s.t.}\quad&\sum_{i=1}^{N}a_{ji}x_i\ge 1,\quad j=1,\ldots,M\\&x_i\in\{0,1\},\quad i=1,\ldots,N\end{aligned}`,
      },
    ],
  },
  {
    id: "lexicographic",
    label: "Large-Group Tie Break",
    content:
      "After fixing the minimum term count, the solver minimizes total literals. This is a lexicographic objective: term count first, literal count second.",
    formulas: [
      {
        label: "Secondary integer program with fixed minimum term count",
        caption: "Stage 2 — minimum literals under the Stage 1 optimum",
        latex: String.raw`\begin{aligned}L_{\min}&=\min_{\mathbf x}\sum_{i=1}^{N}L_i x_i\\[2pt]\text{s.t.}\quad&\sum_{i=1}^{N}a_{ji}x_i\ge 1,\quad j=1,\ldots,M\\&\sum_{i=1}^{N}x_i=T_{\min}\\&x_i\in\{0,1\},\quad i=1,\ldots,N\end{aligned}`,
      },
      {
        label: "Equivalent lexicographic objective",
        caption: "Equivalent compact form",
        latex: String.raw`\min_{\mathbf x}^{\mathrm{lex}}\left(\sum_{i=1}^{N}x_i,\ \sum_{i=1}^{N}L_i x_i\right)`,
      },
    ],
  },
  {
    id: "bitmask",
    label: "BigInt Solver",
    content:
      "Each required minterm is one bit. Backtracking visits larger groups first and prunes states that cannot improve the current pair of term and literal counts.",
    formulas: [
      {
        label: "BigInt cover mask construction and full cover test",
        caption: "Coverage is an exact bitwise equality",
        latex: String.raw`\begin{aligned}b_i&=\sum_{j=1}^{M}a_{ji}2^{j-1},\qquad B_{\mathrm{all}}=2^M-1\\\bigvee_{i:x_i=1}b_i&=B_{\mathrm{all}}\end{aligned}`,
      },
      {
        label: "Redundant group condition",
        caption: "A selected group is removed if the others still cover every required minterm",
        latex: String.raw`\bigvee_{i\in\mathcal S\setminus\{k\}}b_i=B_{\mathrm{all}}\quad\Longrightarrow\quad C_k\ \text{is redundant}`,
      },
    ],
    note: "BigInt avoids JavaScript's 32-bit bitwise limit when the number of required minterms grows.",
  },
  {
    id: "output",
    label: "Output & Stack",
    content:
      "A 0 keeps the complemented variable, a 1 keeps the direct variable, and a dash removes that variable from the product term.",
    formulas: [
      {
        label: "Product term and final Sum of Products",
        caption: "Selected groups are converted to the final Boolean expression",
        latex: String.raw`\begin{aligned}P_i&=\prod_{r:p_{ir}=1}Q_r\prod_{r:p_{ir}=0}\overline{Q_r}\\F&=P_1+P_2+\cdots+P_{T_{\min}}\end{aligned}`,
      },
    ],
    media: [
      {
        src: "images/research/karnaugh/four-variable-use-case.png",
        alt: "Four-variable Karnaugh map use case showing edited cells, selected groups, and the minimized Boolean expression",
        caption:
          "Four-variable example: the editor groups the selected 1 and don't-care cells, then renders the minimized Sum-of-Products expression with KaTeX.",
        aspect: "ultrawide",
        fit: "contain",
      },
    ],
    tags: ["HTML", "CSS", "Vanilla JavaScript", "BigInt", "KaTeX", "Express"],
    code: "npm install\nnpm start\n# http://localhost:3000",
  },
];

const localDropSections: ResearchSection[] = [
  {
    id: "overview",
    label: "Use Case",
    content:
      "LocalDrop is a lightweight transfer board for text and files between browsers on the same trusted LAN or Wi-Fi. It needs no cloud relay or account.",
    tags: ["Text", "Images", "Video", "Audio", "Arbitrary files", "Cross-device browser UI"],
  },
  {
    id: "architecture",
    label: "Architecture",
    content:
      "One Node.js process serves the static client, JSON endpoints, upload streams, downloads, and the live event channel.",
    bullets: [
      "Browser clients discover configuration and previous messages through HTTP JSON endpoints.",
      "Uploads stream directly from the request into the configured local upload directory.",
      "Message metadata is persisted to storage/messages.json and broadcast to connected clients.",
      "Server-Sent Events push new messages while a 20-second heartbeat keeps the stream alive.",
    ],
    facts: [
      { label: "Client", value: "Static browser app" },
      { label: "Hub", value: "Node.js HTTP server" },
      { label: "Realtime", value: "SSE / EventSource" },
      { label: "Persistence", value: "JSON + filesystem" },
    ],
  },
  {
    id: "stack",
    label: "Technology Stack",
    content: "The implementation deliberately avoids frameworks and runtime packages.",
    facts: [
      { label: "Frontend", value: "HTML5, CSS, Vanilla JavaScript" },
      { label: "Browser APIs", value: "Fetch, XHR, EventSource, Drag & Drop, Clipboard, localStorage" },
      { label: "Backend", value: "Node.js core http, fs, os, path, crypto, URL" },
      { label: "Protocol", value: "REST-style JSON, raw binary POST, SSE, HTTP Range" },
      { label: "Storage", value: "messages.json and uploaded files" },
      { label: "Runtime dependencies", value: "0" },
    ],
    tags: ["Node.js", "HTTP/1.1", "Server-Sent Events", "XMLHttpRequest", "File streams", "Range requests"],
  },
  {
    id: "transfer-flow",
    label: "Transfer Flow",
    content: "The upload and download paths stay streaming so large files are not buffered into memory as one object.",
    bullets: [
      "The client queues pasted, selected, or dropped files and reports XHR upload progress.",
      "POST /api/uploads carries the raw file body plus encoded file and device names in headers.",
      "fs.createWriteStream stores the request incrementally and enforces the configured byte limit.",
      "Downloads use fs.createReadStream; valid Range headers return 206 Partial Content for media seeking and resume.",
    ],
  },
  {
    id: "configuration",
    label: "Configuration",
    content:
      "At startup, os.networkInterfaces() finds available IPv4 addresses and prints preferred LAN URLs. The checked-in configuration is:",
    facts: [
      { label: "Bind address", value: "0.0.0.0" },
      { label: "Port", value: "3030" },
      { label: "Message history", value: "300 entries" },
      { label: "Text limit", value: "1,000,000 characters" },
      { label: "JSON request limit", value: "10 MiB" },
      { label: "Configured file limit", value: "50 GiB" },
    ],
  },
  {
    id: "run",
    label: "Run & Boundary",
    content:
      "Start the hub, open the printed LAN address on devices connected to the same network, then paste or drop content in the browser.",
    code: "node backend/start.js\n# or\ncd backend\nnpm start",
    bullets: [
      "Uploaded files and message metadata stay on the host machine.",
      "The current project uses plain HTTP and does not implement user authentication; use it on a trusted LAN.",
      "The repository README marks stability and edge cases as work that still needs validation.",
    ],
    tags: ["Local-first", "No cloud relay", "MIT License"],
  },
];

const solidSimSections: ResearchSection[] = [
  {
    id: "atomic-chain-dispersion",
    label: "Atomic-Chain Dispersion",
    content:
      "The first simulator plots monoatomic or diatomic nearest-neighbour lattice dispersion in the first Brillouin zone. Canvas 2D redraws the acoustic and optical branches as masses and spring constants change.",
    formulas: [
      {
        label: "Monoatomic and diatomic-chain dispersion relations",
        caption: "The minus sign gives the acoustic branch; the plus sign gives the optical branch",
        latex: String.raw`\begin{aligned}\omega_{\mathrm{mono}}^2(k)&=\frac{4C}{M}\sin^2\!\left(\frac{ka}{2}\right)\\[3pt]S&=\frac{1}{M_1}+\frac{1}{M_2}\\\omega_{\pm}^{2}(k)&=C\left[S\pm\sqrt{S^2-\frac{4\sin^2(ka/2)}{M_1M_2}}\right],\quad -\frac{\pi}{a}\le k\le\frac{\pi}{a}\end{aligned}`,
      },
    ],
    media: [
      {
        src: "images/simulations/solid-sim-lab/01-atomic-chain-dispersion.jpg",
        alt: "Canvas plot of the one-dimensional atomic-chain dispersion relation",
        caption: "2D Canvas output for the monoatomic-chain dispersion relation.",
        fit: "contain",
      },
    ],
    tags: ["2D Canvas", "Acoustic branch", "Optical branch"],
  },
  {
    id: "atomic-chain-vibration",
    label: "Atomic-Chain Vibration",
    content:
      "The only 3D module evaluates a selected normal mode on every animation frame. Three.js updates atom instances and spring geometry, while drag and wheel gestures rotate or zoom the scene.",
    formulas: [
      {
        label: "Normal-mode displacement, amplitude ratio and phase",
        caption: "Acoustic modes move neighbouring atoms approximately in phase; optical modes move them out of phase",
        latex: String.raw`\begin{aligned}u_n(t)&=A\cos(nka-\omega t)\\\left|\frac{v}{u}\right|&=\sqrt{\operatorname{Re}(v/u)^2+\operatorname{Im}(v/u)^2}\\\phi&=\operatorname{atan2}\!\left(\operatorname{Im}(v/u),\operatorname{Re}(v/u)\right)\end{aligned}`,
      },
    ],
    media: [
      {
        src: "images/simulations/solid-sim-lab/02-atomic-chain-vibration.jpg",
        alt: "Three-dimensional atomic-chain vibration interface with blue atoms",
        caption: "3D Three.js display of a one-dimensional chain normal mode.",
        fit: "contain",
      },
    ],
    tags: ["3D Three.js", "WebGL", "OrbitControls", "Normal modes"],
  },
  {
    id: "einstein-debye-heat-capacity",
    label: "Einstein & Debye Heat Capacity",
    content:
      "This 2D comparison normalizes both solid heat-capacity models by the Dulong-Petit limit. Slider changes update the characteristic temperatures and the sampled curves immediately.",
    formulas: [
      {
        label: "Normalized Einstein and Debye heat capacities",
        caption: "The Debye integral is evaluated numerically in the original simulator",
        latex: String.raw`\begin{aligned}\frac{C_V^{(E)}}{3Nk_B}&=\frac{x^2e^x}{(e^x-1)^2},\qquad x=\frac{\Theta_E}{T}\\[4pt]\frac{C_V^{(D)}}{3Nk_B}&=3\left(\frac{T}{\Theta_D}\right)^3\int_0^{\Theta_D/T}\frac{x^4e^x}{(e^x-1)^2}\,dx\end{aligned}`,
      },
    ],
    media: [
      {
        src: "images/simulations/solid-sim-lab/03-einstein-debye.jpg",
        alt: "Einstein and Debye normalized heat-capacity curves",
        caption: "2D comparison of Einstein and Debye heat-capacity curves.",
        fit: "contain",
      },
    ],
    tags: ["2D Canvas", "Composite Simpson integration", "Dulong-Petit limit"],
  },
  {
    id: "statistical-distributions",
    label: "Statistical Distributions",
    content:
      "The fourth simulator places Bose-Einstein, Maxwell-Boltzmann and Fermi-Dirac occupation laws on one 2D coordinate system so their classical and quantum limits can be compared directly.",
    formulas: [
      {
        label: "Three equilibrium occupation functions",
        caption: "x = (epsilon - mu) / (kBT)",
        latex: String.raw`\begin{aligned}n_{\mathrm{BE}}(x)&=\frac{1}{e^x-1}\\n_{\mathrm{MB}}(x)&=e^{-x}\\n_{\mathrm{FD}}(x)&=\frac{1}{e^x+1}\end{aligned}`,
      },
    ],
    media: [
      {
        src: "images/simulations/solid-sim-lab/04-statistical-distributions.jpg",
        alt: "Bose-Einstein, Maxwell-Boltzmann and Fermi-Dirac curves",
        caption: "2D occupation-number comparison for the three statistical distributions.",
        fit: "contain",
      },
    ],
    tags: ["2D Canvas", "Bose-Einstein", "Maxwell-Boltzmann", "Fermi-Dirac"],
  },
  {
    id: "metal-thermal-conductivity",
    label: "Metal Thermal Conductivity",
    content:
      "A compact low-temperature transport model separates defect scattering from electron-phonon scattering. The 2D plot can retain several alpha-beta parameter groups for comparison.",
    formulas: [
      {
        label: "Low-temperature electronic thermal conductivity",
        caption: "beta/T represents defect scattering and alpha T squared represents electron-phonon scattering",
        latex: String.raw`K_{\mathrm{el}}(T)=\frac{1}{\beta/T+\alpha T^2}=\frac{T}{\beta+\alpha T^3}`,
      },
    ],
    media: [
      {
        src: "images/simulations/solid-sim-lab/05-metal-thermal-conductivity.jpg",
        alt: "Low-temperature metal thermal-conductivity curves for three parameter groups",
        caption: "2D thermal-conductivity output for three scattering-parameter groups.",
        fit: "contain",
      },
    ],
    tags: ["2D Canvas", "Defect scattering", "Electron-phonon scattering"],
  },
  {
    id: "metal-heat-capacity",
    label: "Metal Heat Capacity",
    content:
      "The sixth module adds the electronic linear term and lattice cubic term. It shows both contributions and their sum in a single 2D low-temperature curve view.",
    formulas: [
      {
        label: "Electronic, lattice and total low-temperature heat capacity",
        caption: "Dividing by T yields the standard linear relation used to extract gamma and a",
        latex: String.raw`\begin{aligned}C_{\mathrm{el}}(T)&=\gamma T,\qquad C_{\mathrm{lat}}(T)=aT^3\\C(T)&=\gamma T+aT^3\\\frac{C(T)}{T}&=\gamma+aT^2\end{aligned}`,
      },
    ],
    media: [
      {
        src: "images/simulations/solid-sim-lab/06-metal-heat-capacity.jpg",
        alt: "Low-temperature metal heat-capacity curves with electronic and lattice contributions",
        caption: "2D output of electronic, lattice and total metal heat capacity.",
        fit: "contain",
      },
    ],
    tags: ["2D Canvas", "Sommerfeld term", "Debye T cubed law"],
  },
  {
    id: "plane-wave-energy-bands",
    label: "Plane-Wave Energy Bands",
    content:
      "The final simulator expands a Bloch state in a truncated reciprocal-lattice basis. For each wavevector it diagonalizes a 13 by 13 Hamiltonian and draws the lowest three bands across neighbouring Brillouin zones.",
    formulas: [
      {
        label: "Periodic potential, Bloch basis and plane-wave Hamiltonian",
        caption: "G = 2 pi / a, n = -6,...,6 and the potential couples neighbouring plane-wave coefficients",
        latex: String.raw`\begin{aligned}V(x)&=2\pi^2q\cos\!\left(\frac{2\pi x}{a}\right)\\\psi_k(x)&=\sum_{n=-6}^{6}c_ne^{i(k+nG)x}\\H_{mn}&=(ka+2\pi n)^2\delta_{mn}\\&\quad+\pi^2q\left(\delta_{m,n+1}+\delta_{m,n-1}\right)\\\sum_{n=-6}^{6}H_{mn}c_n&=E(k)c_m\\E_j(k+G)&=E_j(k)\end{aligned}`,
      },
    ],
    media: [
      {
        src: "images/simulations/solid-sim-lab/07-plane-wave-bands.jpg",
        alt: "Plane-wave-expansion energy-band simulation showing three bands",
        caption: "2D extended-zone display of the lowest three plane-wave energy bands.",
        fit: "contain",
      },
    ],
    tags: ["2D Canvas", "Bloch theorem", "13 x 13 eigensystem", "Extended-zone scheme"],
  },
];

const crystalPhysicsSections: ResearchSection[] = [
  {
    id: "model",
    label: "Periodic Model",
    content:
      "A one-dimensional cosine potential is solved inside one primitive cell. Bloch periodicity turns the infinite lattice into a finite eigenvalue problem parameterized by k.",
    formulas: [
      {
        label: "One-dimensional periodic Schrodinger equation",
        caption: "Cosine potential used by the coursework",
        latex: String.raw`\begin{aligned}\left[-\frac{\hbar^2}{2m}\frac{d^2}{dx^2}+V_0\cos\!\left(\frac{2\pi x}{a}\right)\right]\psi_k(x)&=E_n(k)\psi_k(x)\\V_0&=2\pi^2q\end{aligned}`,
      },
      {
        label: "Bloch boundary condition and reduced wavevector",
        caption: "The first Brillouin zone is sampled with r in [-1, 1]",
        latex: String.raw`\psi_k(x+a)=e^{ika}\psi_k(x),\qquad r=\frac{ka}{\pi}\in[-1,1]`,
      },
    ],
    facts: [
      { label: "Default lattice constant", value: "a = 1" },
      { label: "Dimensionless units", value: "hbar = 1, m = 0.5" },
      { label: "Default potential", value: "q = 2.4" },
      { label: "Computed bands", value: "3" },
    ],
  },
  {
    id: "fdm",
    label: "Finite Difference Method",
    content:
      "The real-space solver discretizes one cell and inserts the Bloch phase only in the two corner couplings of the Hermitian Hamiltonian.",
    formulas: [
      {
        label: "Finite-difference scale and interior matrix elements",
        caption: "Second-order central difference",
        latex: String.raw`\begin{aligned}\Delta x&=\frac{a}{N},\qquad t=\frac{\hbar^2}{2m(\Delta x)^2}\\H_{jj}&=2t+V(x_j)\\H_{j,j+1}&=H_{j+1,j}=-t\end{aligned}`,
      },
      {
        label: "Bloch boundary couplings",
        caption: "The corner elements close the primitive cell with the correct phase",
        latex: String.raw`H_{0,N-1}=-t\,e^{-ika},\qquad H_{N-1,0}=-t\,e^{ika}`,
      },
    ],
  },
  {
    id: "pwe",
    label: "Plane-Wave Expansion",
    content:
      "The independent reciprocal-space solver truncates the plane-wave basis and diagonalizes the central-equation matrix at every reduced wavevector.",
    formulas: [
      {
        label: "Bloch-state plane-wave expansion",
        caption: "G = 2 pi n / a is a reciprocal-lattice vector",
        latex: String.raw`\psi_k(x)=\sum_G c_Ge^{i(k+G)x}`,
      },
      {
        label: "Central-equation Hamiltonian",
        caption: "For the cosine potential only the nearest reciprocal components couple",
        latex: String.raw`\begin{aligned}H_{GG'}&=(k+G)^2\delta_{GG'}+V_{G-G'}\\V_{\pm 2\pi/a}&=\frac{V_0}{2}=\pi^2q,\qquad V_{\Delta G}=0\ \text{otherwise}\\\sum_{G'}H_{GG'}c_{G'}&=E_n(k)c_G\end{aligned}`,
      },
    ],
  },
  {
    id: "observables",
    label: "Bloch-State Observables",
    content:
      "After selecting one eigenstate, the script normalizes the wavefunction, evaluates its density and current, and transforms the periodic part into reciprocal-space coefficients.",
    formulas: [
      {
        label: "Normalization, periodic part and probability density",
        caption: "Quantities evaluated inside one primitive cell",
        latex: String.raw`\begin{aligned}\int_0^a|\psi_k(x)|^2\,dx&=1\\u_k(x)&=e^{-ikx}\psi_k(x)\\\rho(x)&=|\psi_k(x)|^2\end{aligned}`,
      },
      {
        label: "Probability current and Fourier coefficients",
        caption: "The derivative uses the same Bloch phase at the cell boundary",
        latex: String.raw`\begin{aligned}J(x)&=\frac{\hbar}{m}\operatorname{Im}\!\left[\psi_k^*(x)\frac{\partial\psi_k}{\partial x}\right]\\c_n&=\frac{1}{a}\int_0^a u_k(x)e^{-iG_nx}\,dx,\qquad G_n=\frac{2\pi n}{a}\end{aligned}`,
      },
    ],
  },
  {
    id: "results",
    label: "Numerical Results",
    content:
      "The two independent solvers agree at the plotted resolution. A representative nonzero-k state shows the real-space density, conserved current and dominant reciprocal components.",
    media: [
      {
        src: "images/simulations/crystal-physics-coursework/fdm-pwe-bands.jpg",
        alt: "Comparison of finite-difference and plane-wave energy bands for a one-dimensional cosine potential",
        caption: "Output from the original solver at q = 2.4: the FDM and PWE curves coincide at the plotted resolution.",
        fit: "contain",
      },
      {
        src: "images/simulations/crystal-physics-coursework/bloch-observables.jpg",
        alt: "Probability density, probability current and Fourier amplitudes for a Bloch eigenstate",
        caption: "Original-code output for a first-band Bloch state at r = 0.35: density, probability current and reciprocal amplitudes.",
        fit: "contain",
      },
    ],
  },
  {
    id: "reproducibility",
    label: "Reproducibility",
    content:
      "The original script uses PyTorch for the finite-difference eigensystem and NumPy for the plane-wave solver, automatically selecting CUDA when available.",
    tags: ["Python", "NumPy", "PyTorch", "Matplotlib", "Bloch boundary", "FDM", "PWE"],
    code: "pip install numpy matplotlib torch\npython simulate.py",
  },
];

const pointGroupSections: ResearchSection[] = [
  {
    id: "scope",
    label: "32 Crystallographic Point Groups",
    content:
      "The viewer organizes all crystallographic point groups by crystal system and pairs the Schoenflies symbol with its Hermann-Mauguin notation.",
    facts: [
      { label: "Triclinic", value: "2 groups" },
      { label: "Monoclinic", value: "3 groups" },
      { label: "Orthorhombic", value: "3 groups" },
      { label: "Tetragonal", value: "7 groups" },
      { label: "Trigonal", value: "5 groups" },
      { label: "Hexagonal", value: "7 groups" },
      { label: "Cubic", value: "5 groups" },
    ],
    note: "The fivefold icosahedral groups are excluded because they are incompatible with three-dimensional translational periodicity.",
  },
  {
    id: "rotation",
    label: "Rotations",
    content:
      "A Cn operation rotates every model point through an integer fraction of a full turn around a normalized axis. The implementation constructs the equivalent matrix through a Three.js quaternion.",
    formulas: [
      {
        label: "Rotation angle for the kth Cn operation",
        caption: "k = 0 gives the identity operation",
        latex: String.raw`\theta_{n,k}=\frac{2\pi k}{n}`,
      },
      {
        label: "Rodrigues rotation matrix",
        caption: "Matrix form equivalent to the quaternion used by the renderer",
        latex: String.raw`R_{\hat{\mathbf n}}(\theta)=\cos\theta\,I+(1-\cos\theta)\hat{\mathbf n}\hat{\mathbf n}^{\mathsf T}+\sin\theta\,[\hat{\mathbf n}]_{\times}`,
      },
    ],
  },
  {
    id: "reflection-inversion",
    label: "Reflection, Inversion & Sn",
    content:
      "Mirror operations are represented by the plane normal, inversion changes the sign of every Cartesian coordinate, and an improper rotation composes Cn with a perpendicular reflection.",
    formulas: [
      {
        label: "Reflection through a plane normal to n",
        caption: "Householder reflection used by reflectionMatrix",
        latex: String.raw`\sigma_{\hat{\mathbf n}}=I-2\hat{\mathbf n}\hat{\mathbf n}^{\mathsf T}`,
      },
      {
        label: "Inversion and improper rotation",
        caption: "The operation order matches the matrix composition in the public source",
        latex: String.raw`\begin{aligned}\mathcal I&=-I_3\\S_n^{,k}&=\sigma_{\hat{\mathbf n}}\,C_n^{,k}\end{aligned}`,
      },
      {
        label: "Orthogonality of symmetry transformations",
        caption: "Proper rotations have determinant +1; reflections and inversion may have determinant -1",
        latex: String.raw`R^{\mathsf T}R=I,\qquad \det R\in\{+1,-1\}`,
      },
    ],
  },
  {
    id: "data-model",
    label: "Representations & Tables",
    content:
      "Each point-group record declares its symbols, symmetry elements and operation descriptors. The latest local build also validates multiplication tables, character tables, direct products and orbital splittings.",
    formulas: [
      {
        label: "Group representation consistency",
        caption: "Sequential point transformations must reproduce the composed group operation",
        latex: String.raw`D(g_i)D(g_j)=D(g_ig_j),\qquad D(e)=I`,
      },
      {
        label: "Character-row orthogonality",
        caption: "Class sizes n_C weight the inner product over a group of order h",
        latex: String.raw`\frac{1}{h}\sum_C n_C\,\chi^{(\alpha)}(C)^*\chi^{(\beta)}(C)=\delta_{\alpha\beta}`,
      },
      {
        label: "Direct-product character and irrep multiplicity",
        caption: "The character product is decomposed back into irreducible representations",
        latex: String.raw`\begin{aligned}\chi_{\Gamma\otimes\Lambda}(g)&=\chi_\Gamma(g)\chi_\Lambda(g)\\a_\gamma&=\frac{1}{h}\sum_C n_C\chi_\Gamma(C)\chi_\Lambda(C)\chi_\gamma(C)^*\end{aligned}`,
      },
    ],
    tags: ["Schoenflies", "Hermann-Mauguin", "Multiplication tables", "Character tables", "Kronecker products"],
  },
  {
    id: "visualization",
    label: "3D Symmetry Display",
    content:
      "The Three.js scene combines a representative ball-and-stick model with colored rotation axes, translucent mirror planes and inversion markers. OrbitControls provides inspection from any viewing angle.",
    media: [
      {
        src: "images/simulations/group/c3v.jpg",
        alt: "Three-dimensional C3v point-group model with a threefold axis and vertical mirror planes",
        caption: "C3v / 3m: one threefold principal axis and three vertical mirror planes.",
        fit: "contain",
      },
      {
        src: "images/simulations/group/d4h.jpg",
        alt: "Three-dimensional D4h point-group model with axes, mirror planes and inversion center",
        caption: "D4h / 4mmm: tetragonal axes, mirror planes and a central inversion marker.",
        fit: "contain",
      },
      {
        src: "images/simulations/group/oh.jpg",
        alt: "Three-dimensional Oh cubic point-group model with labeled symmetry elements",
        caption: "Oh / m-3m: representative cubic symmetry with fourfold and threefold axes.",
        fit: "contain",
      },
    ],
  },
  {
    id: "reproducibility",
    label: "Rendering Stack",
    content:
      "The latest local implementation is a Vite application built with Three.js, modular point-group data, shared geometry generators and matrix-based operation animation.",
    tags: ["Vite", "JavaScript", "Three.js", "OrbitControls", "Matrix4", "Quaternion", "KaTeX"],
    code: "npm install\nnpm run validate:symmetry\nnpm run dev",
  },
];

const fraunhoferSections: ResearchSection[] = [
  {
    id: "scope",
    label: "Source-Backed Far Field",
    content:
      "The software-copyright implementation computes five common Fraunhofer patterns from closed-form intensity equations, then applies display-only contrast mappings before plotting the result.",
    facts: [
      { label: "Apertures", value: "5 types" },
      { label: "Physical output", value: "I(x, y) on an N x N grid" },
      { label: "Grid range", value: "80 to 4000; default 1200" },
      { label: "Desktop view", value: "PyQt5 + Matplotlib" },
      { label: "Companion view", value: "JavaScript + Canvas" },
    ],
    note: "The equations below follow the supplied software-copyright source; the displayed patterns are captured from the original project implementation.",
  },
  {
    id: "fourier-optics",
    label: "Screen Sampling",
    content:
      "Fraunhofer diffraction is the Fourier transform of the aperture function. For the supported apertures the program evaluates the corresponding analytic intensity directly on a finite screen grid.",
    formulas: [
      {
        label: "Scalar Fraunhofer diffraction integral",
        caption: "Aperture coordinates are xi and eta; screen coordinates are x and y",
        latex: String.raw`\begin{aligned}U(x,y;z)&=\frac{e^{ikz}}{i\lambda z}\,e^{\frac{ik}{2z}(x^2+y^2)}\\&\quad\times\iint t(\xi,\eta)e^{-i\frac{2\pi}{\lambda z}(x\xi+y\eta)}\,d\xi\,d\eta\\I(x,y)&=|U(x,y;z)|^2\end{aligned}`,
      },
      {
        label: "Sampled screen and stable horizontal angle",
        caption: "The implementation uses the exact normalized x component instead of x/z when the span is large",
        latex: String.raw`\begin{aligned}x,y&\in\left[-\frac{s}{2},\frac{s}{2}\right]\\\rho&=\sqrt{x^2+y^2}\\\sin\theta_x&=\frac{x}{\sqrt{x^2+z^2}}\end{aligned}`,
      },
    ],
  },
  {
    id: "slits",
    label: "Slits & Rectangle",
    content:
      "The single-slit envelope is reused by the double-slit model, while the rectangular aperture separates into independent horizontal and vertical sinc-squared factors.",
    formulas: [
      {
        label: "Single-slit intensity",
        caption: "a is the slit width",
        latex: String.raw`I_{1}(\theta_x)=I_0\left(\frac{\sin\beta}{\beta}\right)^2,\qquad \beta=\frac{\pi a\sin\theta_x}{\lambda}`,
      },
      {
        label: "Double-slit intensity",
        caption: "a is each slit width and d is the center separation",
        latex: String.raw`\begin{aligned}I_{2}(\theta_x)&=4I_0\left(\frac{\sin\alpha}{\alpha}\right)^2\cos^2\beta\\\alpha&=\frac{\pi a\sin\theta_x}{\lambda},\qquad \beta=\frac{\pi d\sin\theta_x}{\lambda}\end{aligned}`,
      },
      {
        label: "Rectangular-aperture intensity",
        caption: "D and H are the aperture width and height",
        latex: String.raw`I_{\mathrm{rect}}(x,y)=I_0\,\operatorname{sinc}^2\!\left(\frac{\pi D x}{\lambda z}\right)\operatorname{sinc}^2\!\left(\frac{\pi H y}{\lambda z}\right)`,
      },
    ],
  },
  {
    id: "two-dimensional-apertures",
    label: "Circular Apertures",
    content:
      "A circular pupil produces an Airy envelope through the first-order Bessel function. A pair of circular apertures multiplies that radial envelope by an x-directed interference term.",
    formulas: [
      {
        label: "Circular-aperture Airy pattern",
        caption: "r is the aperture radius and J1 is the first-order Bessel function",
        latex: String.raw`\begin{aligned}\alpha&=\frac{2\pi r\rho}{\lambda z},\qquad \rho=\sqrt{x^2+y^2}\\I_{\mathrm{Airy}}(x,y)&=I_0\left[\frac{2J_1(\alpha)}{\alpha}\right]^2\end{aligned}`,
      },
      {
        label: "Double circular aperture",
        caption: "Interference fringes are modulated by the Airy envelope",
        latex: String.raw`I_{\mathrm{double}}(x,y)=I_{\mathrm{Airy}}(x,y)\cos^2\!\left(\frac{\pi d\sin\theta_x}{\lambda}\right)`,
      },
    ],
  },
  {
    id: "patterns",
    label: "Original Simulation Output",
    content:
      "These JPEGs are exported from the original simulator. They show the one-dimensional slit family and the radial or mixed two-dimensional aperture families without replacing the underlying physical intensity calculation.",
    media: [
      {
        src: "images/simulations/fraunhofer/double-slit.jpg",
        alt: "Original Fraunhofer double-slit simulation with bright vertical interference fringes inside a diffraction envelope",
        caption: "Double slit: fine interference fringes modulated by the finite single-slit envelope.",
        aspect: "square",
      },
      {
        src: "images/simulations/fraunhofer/circular-aperture.jpg",
        alt: "Original circular-aperture Airy diffraction pattern with a bright central disk and concentric rings",
        caption: "Circular aperture: central Airy disk and successive Bessel-function dark rings.",
        aspect: "square",
      },
      {
        src: "images/simulations/fraunhofer/double-aperture.jpg",
        alt: "Original double-circular-aperture diffraction pattern combining Airy rings with vertical interference modulation",
        caption: "Double circular aperture: the Airy envelope is crossed by the aperture-pair interference term.",
        aspect: "square",
      },
    ],
  },
  {
    id: "display-mapping",
    label: "Display Mapping & Range",
    content:
      "The source first normalizes the nonnegative physical intensity, applies a selectable visual mapping, normalizes again and optionally clips the upper percentile. Automatic framing reaches the fifth slit order or fifth Airy zero.",
    formulas: [
      {
        label: "Four display mappings",
        caption: "These transformations affect only displayed brightness, not the physical intensity field",
        latex: String.raw`\begin{aligned}\widehat I&=I/\max(I)\\D_{\mathrm{linear}}&=\widehat I,\qquad D_{\ln}=\ln(1+\widehat I)\\D_{\gamma}&=\widehat I^{\gamma},\qquad D_{\mathrm{asinh}}=\frac{\operatorname{asinh}(k\widehat I)}{\operatorname{asinh}(k)}\end{aligned}`,
      },
      {
        label: "Fifth-order automatic half ranges",
        caption: "j_1,5 is the fifth positive zero of J1",
        latex: String.raw`x_5^{\mathrm{slit}}\simeq\frac{5\lambda z}{a},\qquad x_5^{\mathrm{double}}\simeq\frac{5\lambda z}{d},\qquad R_5^{\mathrm{Airy}}\simeq\frac{j_{1,5}\lambda z}{2\pi r}`,
      },
    ],
    tags: ["Fraunhofer diffraction", "NumPy", "SciPy J1", "PyQt5", "Matplotlib", "Canvas 2D"],
    code: "pip install numpy scipy PyQt5 matplotlib\npython fraunhofer.pyw",
  },
];

const rutherfordSections: ResearchSection[] = [
  {
    id: "model",
    label: "Coulomb Scattering Model",
    content:
      "A positively charged alpha particle approaches a gold nucleus and is deflected by the repulsive Coulomb field. The fixed-nucleus view is the heavy-target limit of the two-body problem.",
    formulas: [
      {
        label: "Coulomb potential and force",
        caption: "Z_alpha = 2 and Z_Au = 79 in the project",
        latex: String.raw`\begin{aligned}V(r)&=\frac{1}{4\pi\varepsilon_0}\frac{Z_{\alpha}Z_{\mathrm{Au}}e^2}{r}\\\mathbf F(\mathbf r)&=\frac{1}{4\pi\varepsilon_0}\frac{Z_{\alpha}Z_{\mathrm{Au}}e^2}{r^3}\mathbf r\end{aligned}`,
      },
      {
        label: "Initial-value dynamics",
        caption: "The numerical solvers integrate position and velocity",
        latex: String.raw`\dot{\mathbf r}=\mathbf v,\qquad m_{\alpha}\dot{\mathbf v}=\mathbf F(\mathbf r)` ,
      },
    ],
    facts: [
      { label: "Alpha charge", value: "+2e" },
      { label: "Gold charge", value: "+79e" },
      { label: "Default speed", value: "2 x 10^7 m/s" },
      { label: "Trajectory output", value: "Matplotlib animation" },
    ],
  },
  {
    id: "impact-parameter",
    label: "Impact Parameter",
    content:
      "For incident kinetic energy E and impact parameter b, conservation of energy and angular momentum gives a closed-form relation between the incoming offset and the asymptotic scattering angle.",
    formulas: [
      {
        label: "Rutherford impact-parameter relation",
        caption: "Smaller b produces a larger deflection",
        latex: String.raw`\theta(b)=2\arctan\!\left(\frac{Z_{\alpha}Z_{\mathrm{Au}}e^2}{8\pi\varepsilon_0Eb}\right)` ,
      },
      {
        label: "Equivalent inverse relation",
        caption: "Useful when sampling particles by detector angle",
        latex: String.raw`b(\theta)=\frac{Z_{\alpha}Z_{\mathrm{Au}}e^2}{8\pi\varepsilon_0E}\cot\!\left(\frac{\theta}{2}\right)` ,
      },
    ],
  },
  {
    id: "cross-section",
    label: "Rutherford Law",
    content:
      "The verification view compares angular counts with the inverse fourth power of sin(theta/2), including the solid angle represented by each detector bin.",
    formulas: [
      {
        label: "Differential scattering cross section",
        caption: "Classical Rutherford law",
        latex: String.raw`\frac{d\sigma}{d\Omega}=\left(\frac{Z_{\alpha}Z_{\mathrm{Au}}e^2}{16\pi\varepsilon_0E}\right)^2\csc^4\!\left(\frac{\theta}{2}\right)` ,
      },
      {
        label: "Expected detector counts and angular-bin solid angle",
        caption: "n is target areal density, Phi is incident flux and tau is acquisition time",
        latex: String.raw`\begin{aligned}\frac{dN}{d\Omega}&=n\Phi\tau\frac{d\sigma}{d\Omega}\\\Delta\Omega&=2\pi(\cos\theta_1-\cos\theta_2)\end{aligned}` ,
      },
    ],
  },
  {
    id: "numerics",
    label: "Numerical Integration",
    content:
      "The basic tab uses a semi-implicit Euler update, while the application also imports SciPy integration and contains an enhanced movable-nucleus mode.",
    formulas: [
      {
        label: "Semi-implicit Euler step used by the basic trajectory solver",
        caption: "Velocity is updated before position",
        latex: String.raw`\begin{aligned}\mathbf v_{n+1}&=\mathbf v_n+\frac{\mathbf F(\mathbf r_n)}{m_{\alpha}}\Delta t\\\mathbf r_{n+1}&=\mathbf r_n+\mathbf v_{n+1}\Delta t\end{aligned}` ,
      },
      {
        label: "Movable target two-body system",
        caption: "The forces are equal and opposite",
        latex: String.raw`m_{\alpha}\ddot{\mathbf r}_{\alpha}=\mathbf F,\qquad m_{\mathrm{Au}}\ddot{\mathbf r}_{\mathrm{Au}}=-\mathbf F` ,
      },
    ],
  },
  {
    id: "results",
    label: "Trajectories & Angular Law",
    content:
      "The trajectory family shows the impact-parameter dependence directly; the logarithmic count plot makes the csc-fourth angular decay visible over several orders of magnitude.",
    media: [
      {
        src: "images/simulations/rutherford-scattering-simulator/trajectory-bundle.jpg",
        alt: "Numerically integrated alpha-particle trajectories around a gold nucleus for several impact parameters",
        caption: "Trajectories generated by the original solver: decreasing |b| produces progressively stronger deflection around the gold nucleus.",
        fit: "contain",
      },
      {
        src: "images/simulations/rutherford-scattering-simulator/scattering-law.jpg",
        alt: "Rutherford inverse-fourth-power angular scattering law with representative detector bins",
        caption: "The source's 5.5 MeV verification model: impact parameter versus angle and the normalized inverse-fourth-power angular law.",
        fit: "contain",
      },
    ],
  },
  {
    id: "reproducibility",
    label: "Application Modes",
    content:
      "The desktop application exposes fixed-nucleus trajectories, high-particle-count Pygame animation, scattering-law verification and a movable-gold-nucleus simulation.",
    tags: ["Python", "PyQt5", "NumPy", "SciPy", "Matplotlib", "Pygame", "RK4"],
    code: "pip install numpy matplotlib PyQt5 scipy pygame\npython rutherford_scattering_simulator.py",
  },
];

export const categories: Category[] = [
  {
    id: "pinn",
    index: "02",
    eyebrow: "Primary Research Direction",
    title: "Physics-Informed Neural Networks",
    background: "images/pinn-sr.jpg",
    detailBackground: "images/pinn-portrait-sr.jpg",
    focalPoint: "center center",
    detailPresentation: "portrait",
  },
  {
    id: "simulation",
    index: "03",
    eyebrow: "Scientific Computing",
    title: "Scientific Simulation",
    background: "images/simulation-sr.jpg",
    detailBackground: "images/simulation-sr.jpg",
    focalPoint: "center center",
    detailPresentation: "title",
  },
  {
    id: "tools",
    index: "04",
    eyebrow: "Practical Engineering",
    title: "Utility Tools",
    background: "images/tools-sr.jpg",
    detailBackground: "images/tools-sr.jpg",
    focalPoint: "center center",
    detailPresentation: "artwork",
  },
  {
    id: "agents",
    index: "05",
    eyebrow: "Applied Intelligence",
    title: "AI Agents",
    background: "images/agents-sr.jpg",
    detailBackground: "images/agents-sr.jpg",
    focalPoint: "center center",
    detailPresentation: "title",
  },
];

export const projects: Project[] = [
  {
    slug: "pinn-quantum-potential-inversion",
    title: "Inverse Quantum Potential with PINNs",
    shortTitle: "Quantum Potential Inversion",
    category: "pinn",
    repositoryUrl: "https://github.com/qianyuyingluo/pinn-quantum-potential-inversion",
    sections: quantumPinnSections,
    equations: ["stationary-schrodinger", "pinn-loss", "rayleigh-quotient", "finite-difference-hamiltonian"],
    status: "Complete architecture, loss formulation, and experimental results",
  },
  {
    slug: "semiconductor-laser-pinn",
    title: "Semiconductor Laser Current Inversion",
    shortTitle: "Laser Current Inversion",
    category: "pinn",
    repositoryUrl: "https://github.com/qianyuyingluo/Semiconductor-Laser-PINN",
    sections: laserPinnSections,
    equations: ["laser-rate-equations", "nondimensionalization", "state-pinn", "current-correction"],
    status: "Dual-network current inversion and full nondimensionalization derivation",
  },
  {
    slug: "solid-sim-lab",
    title: "SolidSim Lab",
    category: "simulation",
    repositoryUrl: "https://github.com/qianyuyingluo/SolidSim-Lab",
    launches: [
      {
        index: "01",
        label: "Atomic-Chain Dispersion",
        description: "Monoatomic and diatomic dispersion curves",
        href: "simulations/solid-sim-lab/index.html#/simulations/page1",
        mode: "2D",
      },
      {
        index: "02",
        label: "Atomic-Chain Vibration",
        description: "Interactive normal-mode animation",
        href: "simulations/solid-sim-lab/index.html#/simulations/page2",
        mode: "3D",
      },
      {
        index: "03",
        label: "Einstein & Debye Heat Capacity",
        description: "Normalized solid heat-capacity models",
        href: "simulations/solid-sim-lab/index.html#/simulations/page3",
        mode: "2D",
      },
      {
        index: "04",
        label: "Statistical Distributions",
        description: "BE, MB and FD occupation laws",
        href: "simulations/solid-sim-lab/index.html#/simulations/page4",
        mode: "2D",
      },
      {
        index: "05",
        label: "Metal Thermal Conductivity",
        description: "Low-temperature scattering model",
        href: "simulations/solid-sim-lab/index.html#/simulations/page5",
        mode: "2D",
      },
      {
        index: "06",
        label: "Metal Heat Capacity",
        description: "Electronic and lattice contributions",
        href: "simulations/solid-sim-lab/index.html#/simulations/page6",
        mode: "2D",
      },
      {
        index: "07",
        label: "Plane-Wave Energy Bands",
        description: "Bloch bands from a 13 x 13 eigensystem",
        href: "simulations/solid-sim-lab/index.html#/simulations/page7",
        mode: "2D",
      },
    ],
    sections: solidSimSections,
    equations: ["lattice-dispersion", "normal-modes", "heat-capacity", "statistics", "transport", "plane-wave-expansion"],
    status: "Seven interactive simulations with formulas and 2D / 3D displays",
  },
  {
    slug: "crystal-physics-coursework",
    title: "1D Periodic-Potential Band Structure",
    shortTitle: "Band Structure Simulation",
    category: "simulation",
    repositoryUrl: "https://github.com/qianyuyingluo/CrystalPhysics-coursework",
    sections: crystalPhysicsSections,
    equations: ["bloch-boundary", "finite-difference", "plane-wave-expansion"],
    status: "FDM and PWE notes available",
  },
  {
    slug: "group",
    title: "3D Crystallographic Point Groups",
    shortTitle: "Crystallographic Point Groups",
    category: "simulation",
    repositoryUrl: "https://github.com/qianyuyingluo/group",
    sections: pointGroupSections,
    equations: ["rotation", "reflection", "improper-rotation"],
    status: "32-point-group notes available",
  },
  {
    slug: "fraunhofer",
    title: "Fraunhofer Diffraction Simulator",
    category: "simulation",
    repositoryUrl: "https://github.com/qianyuyingluo/fraunhofer",
    sections: fraunhoferSections,
    equations: ["fraunhofer-transform", "slit-diffraction", "airy-pattern"],
    status: "Theory reconstruction available",
  },
  {
    slug: "rutherford-scattering-simulator",
    title: "Rutherford Scattering Simulator",
    category: "simulation",
    repositoryUrl: "https://github.com/qianyuyingluo/rutherford-scattering-simulator",
    sections: rutherfordSections,
    equations: ["coulomb-dynamics", "impact-parameter", "rutherford-cross-section"],
    status: "Scattering equations and results available",
  },
  {
    slug: "karnaugh-map",
    title: "Karnaugh Map Simplifier",
    category: "tools",
    repositoryUrl: "https://github.com/qianyuyingluo/karnaugh-map",
    sections: karnaughSections,
    equations: ["minimum-cover", "minimum-literals", "bigint-cover"],
    status: "Algorithm documentation available",
  },
  {
    slug: "local-drop",
    title: "LocalDrop",
    shortTitle: "LocalDrop File Transfer",
    category: "tools",
    repositoryUrl: "https://github.com/qianyuyingluo/LocalDrop",
    sections: localDropSections,
    equations: [],
    status: "Implementation documentation available",
  },
  {
    slug: "lingyin-agent",
    title: "Lingyin Desktop Agent",
    category: "agents",
    repositoryUrl: "https://github.com/qianyuyingluo/Lingyin-agent",
    sections: emptySections(),
    equations: [],
  },
  {
    slug: "lab-ai",
    title: "LabAI",
    shortTitle: "LabAI Research Workspace",
    category: "agents",
    repositoryUrl: "https://github.com/qianyuyingluo/LabAI",
    sections: emptySections(),
    equations: [],
  },
  {
    slug: "labflow-ai",
    title: "LabFlow AI",
    shortTitle: "LabFlow Data Platform",
    category: "agents",
    repositoryUrl: "https://github.com/qianyuyingluo/LabFlow-AI",
    sections: emptySections(),
    equations: [],
  },
  {
    slug: "yingluo-studio",
    title: "Yingluo Studio",
    category: "agents",
    repositoryUrl: "https://github.com/qianyuyingluo/yingluo-studio",
    sections: emptySections(),
    equations: [],
  },
];

export const projectsByCategory = (category: CategoryId) =>
  projects.filter((project) => project.category === category);

export const projectRepositoryName = (project: Project) =>
  decodeURIComponent(project.repositoryUrl.replace(/\/$/, "").split("/").pop() ?? project.title);

export const categoryById = (category: CategoryId) =>
  categories.find((item) => item.id === category)!;
