import type { ResearchSection } from "./projects";

export const quantumPinnSections: ResearchSection[] = [
  {
    id: "overview",
    label: "Problem and Research Workflow",
    content:
      "This project studies a one-dimensional stationary quantum inverse problem: recover continuous wavefunctions, an unknown potential, and energy eigenvalues from only a small number of discrete wavefunction samples. No analytic form is assumed for the potential. Instead, the Schrödinger equation, boundary conditions, normalization, orthogonality, and potential smoothness are encoded jointly in the loss function.",
    facts: [
      { label: "Input", value: "Coordinate x and sparse ψₙ(x) samples" },
      { label: "Outputs", value: "V(x), ψₙ(x), and Eₙ" },
      { label: "Networks", value: "Shared VNet + independent PsiNets" },
      { label: "Training", value: "Two-stage Adam optimization" },
      { label: "Numerical reference", value: "2,000-point finite-difference grid" },
      { label: "Observed samples", value: "Typically 30–40 points" },
    ],
    media: [
      {
        src: "images/research/quantum/workflow.png",
        alt: "Workflow from sparse quantum data and physics constraints to inverse-potential validation",
        caption: "Workflow from the paper: construct the networks, impose physical constraints, provide sparse data, optimize with Adam, and validate the recovered solution.",
        fit: "contain",
      },
    ],
    tags: ["PINN", "Inverse problem", "Stationary Schrödinger equation", "PyTorch", "ONNX"],
  },
  {
    id: "inverse-problem",
    label: "Inverse-Problem Formulation",
    content:
      "For stationary state n, the coordinate x is the only independent variable. The unknowns are the wavefunction ψₙ(x), the potential V(x), and the scalar energy Eₙ. The implementation sets ℏ=m=1, so the kinetic term reduces to a second derivative evaluated directly by automatic differentiation.",
    formulas: [
      {
        label: "One-dimensional stationary Schrodinger equation",
        caption: "One-dimensional stationary Schrödinger equation",
        latex: String.raw`-\frac{\hbar^2}{2m}\frac{\mathrm d^2\psi_n}{\mathrm dx^2}+V(x)\psi_n(x)=E_n\psi_n(x)`,
      },
      {
        label: "Dimensionless project equation",
        caption: "Training equation after setting ℏ=1 and m=1",
        latex: String.raw`-\frac{1}{2}\psi_n''(x)+V(x)\psi_n(x)=E_n\psi_n(x)`,
      },
      {
        label: "Trainable parameter collection",
        caption: "One shared potential network, N independent wavefunction networks, and N trainable energies",
        latex: String.raw`\Theta=\left\{\phi,\theta_0,\ldots,\theta_{N-1},E_0,\ldots,E_{N-1}\right\}`,
      },
    ],
    bullets: [
      "VNet is shared by every eigenstate, ensuring that all wavefunctions experience the same potential surface.",
      "Each eigenstate has a PsiNet with its own parameter set, preventing interference between energy levels in a shared output head.",
      "Eₙ is not a network-generated curve; it is a trainable scalar updated together with the weights and biases.",
    ],
  },
  {
    id: "architecture",
    label: "Network Architecture and Full Transformation Matrices",
    content:
      "PsiNet and VNet use the same fully connected 1→64→64→1 architecture. Both hidden layers use tanh, while the output layer remains linear so that wavefunctions and potentials may take any real value. The three affine transformations and their complete matrix shapes are expanded below.",
    formulas: [
      {
        label: "First layer full transformation matrix",
        caption: "Layer 1: expand scalar x into 64 features",
        latex: String.raw`\mathbf z^{(1)}=W_1x+\mathbf b_1=\begin{bmatrix}w^{(1)}_{1,1}\\w^{(1)}_{2,1}\\\vdots\\w^{(1)}_{64,1}\end{bmatrix}x+\begin{bmatrix}b^{(1)}_1\\b^{(1)}_2\\\vdots\\b^{(1)}_{64}\end{bmatrix},\quad W_1\in\mathbb R^{64\times1},\ \mathbf b_1\in\mathbb R^{64}`,
      },
      {
        label: "Second layer full transformation matrix",
        caption: "Layer 2: fully mix the 64 nonlinear features",
        latex: String.raw`\mathbf z^{(2)}=W_2\mathbf h^{(1)}+\mathbf b_2=\begin{bmatrix}w^{(2)}_{1,1}&w^{(2)}_{1,2}&\cdots&w^{(2)}_{1,64}\\w^{(2)}_{2,1}&w^{(2)}_{2,2}&\cdots&w^{(2)}_{2,64}\\\vdots&\vdots&\ddots&\vdots\\w^{(2)}_{64,1}&w^{(2)}_{64,2}&\cdots&w^{(2)}_{64,64}\end{bmatrix}\begin{bmatrix}h^{(1)}_1\\h^{(1)}_2\\\vdots\\h^{(1)}_{64}\end{bmatrix}+\begin{bmatrix}b^{(2)}_1\\b^{(2)}_2\\\vdots\\b^{(2)}_{64}\end{bmatrix}`,
      },
      {
        label: "Output layer full transformation matrix",
        caption: "Output layer: linearly read 64 features into one physical scalar",
        latex: String.raw`f(x)=W_3\mathbf h^{(2)}+b_3=\begin{bmatrix}w^{(3)}_{1}&w^{(3)}_{2}&\cdots&w^{(3)}_{64}\end{bmatrix}\begin{bmatrix}h^{(2)}_1\\h^{(2)}_2\\\vdots\\h^{(2)}_{64}\end{bmatrix}+b_3,\quad W_3\in\mathbb R^{1\times64}`,
      },
      {
        label: "Complete neural mapping",
        caption: "Complete forward mapping",
        latex: String.raw`\boxed{f(x)=W_3\tanh\!\left(W_2\tanh\!\left(W_1x+\mathbf b_1\right)+\mathbf b_2\right)+b_3}`,
      },
      {
        label: "Tanh derivative structure",
        caption: "tanh is smooth and twice differentiable, which is required for ψ″ in the Schrödinger equation",
        latex: String.raw`\sigma(x)=\tanh x,\qquad \sigma'(x)=1-\tanh^2x,\qquad \sigma''(x)=-2\tanh x\left(1-\tanh^2x\right)`,
      },
    ],
    note: "The implementation creates one independent PsiNet for each input wavefunction column. VNet is instantiated once and shared by all eigenstates.",
  },
  {
    id: "physics-loss",
    label: "Physical Constraints and Loss Function",
    content:
      "The loss combines finite, discrete observations with continuous physical laws. The PDE residual enforces the Schrödinger equation, the data term anchors sparse measurements, boundary, normalization, and orthogonality terms constrain the quantum states, and a first-derivative regularizer suppresses nonphysical spikes in the potential.",
    formulas: [
      {
        label: "Schrodinger residual and PDE loss",
        caption: "Schrödinger PDE residual",
        latex: String.raw`r_n(x_j)=-\frac12\psi_n''(x_j)+V(x_j)\psi_n(x_j)-E_n\psi_n(x_j),\quad \mathcal L_{\mathrm{PDE}}=\frac1{N_c}\sum_j\sum_n r_n(x_j)^2`,
      },
      {
        label: "Data and boundary losses",
        caption: "Sparse wavefunction observations and fixed boundary conditions",
        latex: String.raw`\mathcal L_{\mathrm{data}}=\frac1{N_d}\sum_i\sum_n\left(\psi_n(x_i)-\psi^{\mathrm{data}}_n(x_i)\right)^2,\qquad \mathcal L_{\mathrm{bc}}=\sum_n\left(\psi_n(a)^2+\psi_n(b)^2\right)`,
      },
      {
        label: "Normalization and orthogonality losses",
        caption: "Normalization and eigenstate orthogonality",
        latex: String.raw`\mathcal L_{\mathrm{norm}}=\sum_n\left(\int_a^b|\psi_n|^2\,\mathrm dx-1\right)^2,\qquad \mathcal L_{\mathrm{orth}}=\sum_{m<n}\left(\int_a^b\psi_m\psi_n\,\mathrm dx\right)^2`,
      },
      {
        label: "Potential smoothness loss",
        caption: "Potential-smoothness regularization",
        latex: String.raw`\mathcal L_{\mathrm{smooth}}=\frac1{N_s}\sum_{\ell=1}^{N_s}\left[V'(x_\ell)\right]^2`,
      },
      {
        label: "Weighted total PINN loss",
        caption: "Loss weights used in the implementation",
        latex: String.raw`\mathcal L=20\mathcal L_{\mathrm{PDE}}+8\mathcal L_{\mathrm{data}}+5\mathcal L_{\mathrm{norm}}+\mathcal L_{\mathrm{bc}}+5\mathcal L_{\mathrm{orth}}+10^{-3}\mathcal L_{\mathrm{smooth}}`,
      },
    ],
  },
  {
    id: "optimization",
    label: "Gradient Descent and Two-Stage Adam",
    content:
      "The paper explains gradient descent as walking downhill along the steepest local slope: the gradient points toward the fastest increase in loss, so the parameters move in the opposite direction. Training uses Adam. After Stage 1, the energies are recalculated with the Rayleigh quotient before optimization continues with a smaller energy learning rate.",
    formulas: [
      {
        label: "Gradient descent update",
        caption: "Gradient-descent parameter update",
        latex: String.raw`\Theta_{k+1}=\Theta_k-\eta\,\nabla_{\Theta}\mathcal L(\Theta_k)`,
      },
      {
        label: "Rayleigh quotient energy refinement",
        caption: "Refine the energy eigenvalues between stages using the inner-product formulation",
        latex: String.raw`E_n=\frac{\langle\psi_n|\hat H|\psi_n\rangle}{\langle\psi_n|\psi_n\rangle}=\frac{\int\psi_n^*(x)\left[-\frac12\psi_n''(x)+V(x)\psi_n(x)\right]\mathrm dx}{\int|\psi_n(x)|^2\mathrm dx}`,
      },
    ],
    media: [
      {
        src: "images/research/quantum/gradient-descent.jpeg",
        alt: "Gradient descent illustrated as descending from a mountain toward the lowest point",
        caption: "Original figure from the paper: gradient descent recomputes the local slope at every step, while the learning rate controls the step size.",
        fit: "contain",
      },
    ],
    facts: [
      { label: "Stage 1", value: "100,000 epochs; lr=10⁻³ for ψ, V, and E" },
      { label: "Energy refinement", value: "Rayleigh quotient over 1,601 integration points" },
      { label: "Stage 2", value: "200,000 epochs; lr=10⁻³ for ψ/V and 10⁻⁴ for E" },
      { label: "Constraint grids", value: "10,000 points each for PDE, normalization, and smoothness" },
    ],
  },
  {
    id: "numerical-data",
    label: "Finite-Difference Data Generation",
    content:
      "The training set does not expose ground-truth potential labels. Instead, a second-order central difference discretizes the Hamiltonian on [a,b] into a tridiagonal matrix. Dense numerical eigenvectors are solved first, then only a small number of wavefunction values are sampled from the 2,000-point grid.",
    formulas: [
      {
        label: "Second derivative finite difference",
        caption: "Second-order central difference",
        latex: String.raw`\psi''(x_i)\approx\frac{\psi_{i+1}-2\psi_i+\psi_{i-1}}{\Delta x^2}`,
      },
      {
        label: "Full tridiagonal Hamiltonian matrix",
        caption: "Complete discrete Hamiltonian matrix, where κ=ℏ²/(2mΔx²)",
        latex: String.raw`H=\begin{bmatrix}2\kappa+V_1&-\kappa&0&\cdots&0\\-\kappa&2\kappa+V_2&-\kappa&\ddots&\vdots\\0&-\kappa&2\kappa+V_3&\ddots&0\\\vdots&\ddots&\ddots&\ddots&-\kappa\\0&\cdots&0&-\kappa&2\kappa+V_N\end{bmatrix},\qquad H\boldsymbol\psi_n=E_n\boldsymbol\psi_n`,
      },
    ],
    bullets: [
      "The generator supports harmonic, ramp, and double-Gaussian potentials.",
      "The boundaries satisfy ψ(a)=ψ(b)=0, and the eigenvectors are renormalized by numerical integration.",
      "By default, the repository generates data from dense numerical solutions and exports wavefunctions.csv for the PINN.",
    ],
  },
  {
    id: "results",
    label: "Results for Three Potential Families",
    content:
      "Harmonic, ramp, and double-Gaussian potentials demonstrate that the same network design and loss weights transfer across different potential shapes. The largest errors occur near the domain edges, where the wavefunction amplitude is small.",
    media: [
      {
        src: "images/research/quantum/harmonic-potential.png",
        alt: "Recovered harmonic-oscillator potential",
        caption: "Harmonic oscillator: the recovered potential preserves the correct parabolic shape in the region of significant probability density.",
        fit: "contain",
      },
      {
        src: "images/research/quantum/harmonic-wavefunctions.png",
        alt: "Recovered ground-state and first-excited-state harmonic wavefunctions",
        caption: "Harmonic oscillator: recovered ground-state and first-excited-state wavefunctions.",
        fit: "contain",
      },
      {
        src: "images/research/quantum/ramp-potential.png",
        alt: "Recovered one-dimensional ramp potential",
        caption: "Ramp potential: the shape is recovered, while the absolute energy origin exhibits a global offset.",
        fit: "contain",
      },
      {
        src: "images/research/quantum/ramp-wavefunctions.png",
        alt: "Recovered ground-state and first-excited-state ramp wavefunctions",
        caption: "Ground-state and first-excited-state wavefunctions for the ramp potential.",
        fit: "contain",
      },
      {
        src: "images/research/quantum/double-gaussian-recovered.png",
        alt: "Recovered double-Gaussian potential well",
        caption: "Double-Gaussian well: the recovered double-well profile closely matches the reference shape.",
        fit: "contain",
      },
      {
        src: "images/research/quantum/double-gaussian-wavefunctions.png",
        alt: "Recovered wavefunctions in the double-Gaussian well",
        caption: "Recovered ground-state and first-excited-state wavefunctions in the double-Gaussian well.",
        fit: "contain",
      },
    ],
  },
  {
    id: "interpretation",
    label: "Identifiability and Limitations",
    content:
      "The Schrödinger equation constrains only the difference between potential and energy, so wavefunctions alone cannot determine the absolute potential zero. The global sign of a wavefunction is likewise unidentifiable. For visualization, the project aligns potentials using V(0) and treats these differences as physically equivalent solutions rather than training failures.",
    formulas: [
      {
        label: "Energy gauge invariance",
        caption: "Shifting the potential and energy together leaves the wavefunction unchanged",
        latex: String.raw`-\frac12\psi_n''+(V+C)\psi_n=(E_n+C)\psi_n`,
      },
      {
        label: "Wavefunction sign ambiguity",
        caption: "Normalization and the Schrödinger equation cannot determine the global phase",
        latex: String.raw`\psi_n(x)\sim e^{i\varphi}\psi_n(x)\quad\text{(for real wavefunctions: }\psi_n\sim-\psi_n\text{)}`,
      },
    ],
    bullets: [
      "Current validation is limited to one-dimensional stationary problems and ideal numerical data; measurement noise has not yet been studied systematically.",
      "Where |ψ| is small, the PDE is weakly sensitive to the local potential, so edge regions are more prone to distortion.",
      "The result is sensitive to loss weights and energy initialization, and second-order automatic differentiation makes training computationally expensive.",
    ],
  },
  {
    id: "reproducibility",
    label: "Reproducibility and Model Export",
    content:
      "The repository provides independently runnable paths for data generation, PINN training, and ONNX inference. The trained composite model accepts coordinate batches of arbitrary length and returns V[N,1], ψ[N,Nstate], and E[Nstate].",
    code: "pip install numpy torch matplotlib pyqt5 onnx onnxruntime openvino\npython generate_data.py\npython train_pinn.py\npython infer_onnx.py",
    links: [
      { label: "Open GitHub Repository", href: "https://github.com/qianyuyingluo/pinn-quantum-potential-inversion", external: true },
      { label: "View Training Script", href: "https://github.com/qianyuyingluo/pinn-quantum-potential-inversion/blob/main/train_pinn.py", external: true },
    ],
    tags: ["FP32 / TF32", "Automatic differentiation", "ONNX opset 17", "CPU / CUDA / OpenVINO"],
  },
];

export const laserPinnSections: ResearchSection[] = [
  {
    id: "overview",
    label: "Problem and Five-Step Algorithm",
    content:
      "The project infers an unknown injection current and the difficult-to-measure carrier density from observable output intensity. The algorithm first generates reference trajectories with the laser rate equations and RK4, then reconstructs q, n, and i with a state PINN. Because the single-stage current estimate remains locally oscillatory, a second network fixes q and n and performs a physics-based correction of the current alone.",
    facts: [
      { label: "Observation", value: "Log intensity q(τ)" },
      { label: "Latent state", value: "Carrier density n(τ)" },
      { label: "Inverse target", value: "Injection current i(τ)" },
      { label: "Forward solver", value: "Fourth-order Runge–Kutta" },
      { label: "State network", value: "1→128×8→3" },
      { label: "Correction network", value: "1→64×3→1" },
    ],
    media: [
      {
        src: "images/research/laser/workflow.png",
        alt: "Five-step workflow for semiconductor-laser current inversion",
        caption: "Original workflow from the paper: forward simulation, state reconstruction, state freezing, current correction, and final comparison.",
        fit: "contain",
      },
    ],
    tags: ["Semiconductor laser", "PINN", "RK4", "Inverse current", "ONNX"],
  },
  {
    id: "physical-model",
    label: "Semiconductor-Laser Rate Equations",
    content:
      "Carrier density N and photon density S form a coupled dynamical system. Injection current supplies carriers, while recombination and stimulated emission deplete them. Photons are generated by stimulated and spontaneous emission and decay on the photon-lifetime scale.",
    formulas: [
      {
        label: "Dimensional carrier rate equation",
        caption: "Dimensional carrier-density rate equation",
        latex: String.raw`\frac{\mathrm dN}{\mathrm dt}=\frac{I(t)}{q_eV_a}-\frac{N}{\tau_n}-g_0\left(N-N_{\mathrm{tr}}\right)S`,
      },
      {
        label: "Dimensional photon rate equation",
        caption: "Dimensional photon-density rate equation",
        latex: String.raw`\frac{\mathrm dS}{\mathrm dt}=\Gamma g_0\left(N-N_{\mathrm{tr}}\right)S-\frac{S}{\tau_p}+\Gamma\beta\frac{N}{\tau_n}`,
      },
      {
        label: "Threshold carrier density and current",
        caption: "Threshold quantities obtained by balancing gain and cavity loss",
        latex: String.raw`N_{\mathrm{th}}=N_{\mathrm{tr}}+\frac{1}{\Gamma g_0\tau_p},\qquad I_{\mathrm{th}}=\frac{q_eV_aN_{\mathrm{th}}}{\tau_n}`,
      },
    ],
    facts: [
      { label: "qₑ", value: "1.6×10⁻¹⁹ C" },
      { label: "Vₐ", value: "3.0×10⁻¹¹" },
      { label: "τₙ", value: "1.0 ns" },
      { label: "τₚ", value: "2.0 ps" },
      { label: "Γ", value: "0.3" },
      { label: "β", value: "1.0×10⁻⁴" },
    ],
  },
  {
    id: "nondimensionalization",
    label: "Nondimensionalization",
    content:
      "Time, carrier density, photon density, and current span several orders of magnitude, making direct neural-network optimization difficult. The project defines dimensionless variables using the carrier lifetime, threshold density, maximum photon density, and threshold current, then applies a logarithmic intensity transform to control sharp peaks. The complete step-by-step derivation is available on a dedicated research page.",
    formulas: [
      {
        label: "Dimensionless variables",
        caption: "Four fundamental dimensionless variables",
        latex: String.raw`\tau=\frac{t}{\tau_n},\qquad n=\frac{N}{N_{\mathrm{th}}},\qquad s=\frac{S}{S_{\max}},\qquad i=\frac{I}{I_{\mathrm{th}}}`,
      },
      {
        label: "Log intensity transform",
        caption: "Logarithmic intensity transformation",
        latex: String.raw`q=\ln(s+\varepsilon),\qquad s=e^q-\varepsilon,\qquad \varepsilon=10^{-12}`,
      },
      {
        label: "Final dimensionless rate equations",
        caption: "Dimensionless equations enforced by the state PINN",
        latex: String.raw`\frac{\mathrm dn}{\mathrm d\tau}=i-n-A(n-\eta)s,\qquad \frac{\mathrm dq}{\mathrm d\tau}=\frac{B(n-\eta)s-Cs+Dn}{s+\varepsilon}`,
      },
    ],
    links: [
      { label: "Read the Complete Nondimensionalization Derivation", href: "#/projects/semiconductor-laser-pinn/nondimensionalization" },
    ],
    note: "The dedicated page follows the original derivation order in Section 2.2 and retains every intermediate variable and constant definition.",
  },
  {
    id: "architecture",
    label: "Dual-Network Architecture and Full Matrices",
    content:
      "The state network takes normalized time x as its only input and uses eight 128-dimensional tanh layers to produce q, n, and i simultaneously. softplus constrains n and i to be nonnegative. The current-correction network also receives only x; q and n from Stage 1 are frozen and used in the Stage 2 physics residual, while the correction network relearns only the current required by the carrier equation. Every affine transformation in both networks is expanded below.",
    facts: [
      { label: "State-network matrices", value: "1→128×8→3; 116,227 parameters" },
      { label: "Correction-network matrices", value: "1→64×3→1; 8,513 parameters" },
      { label: "Hidden activation", value: "tanh" },
      { label: "Output constraints", value: "Linear q; softplus for n and i" },
    ],
    media: [
      {
        src: "images/research/laser/state-network.png",
        alt: "State-network architecture from scalar time to three laser-state outputs",
        caption: "State network: scalar time passes through eight 128-dimensional feature layers to produce q, softplus(n), and softplus(i).",
        fit: "contain",
      },
      {
        src: "images/research/laser/current-correction.png",
        alt: "Current-correction workflow after freezing intensity and carrier density",
        caption: "Current-correction network: after q and n are frozen, only the current curve is relearned and exported to ONNX.",
        fit: "contain",
      },
    ],
    formulas: [
      {
        label: "Normalized network input",
        caption: "Map dimensionless time to [-1,1]",
        latex: String.raw`x=2\frac{\tau-\tau_{\min}}{\tau_{\max}-\tau_{\min}}-1`,
      },
      {
        label: "State network first-layer matrix",
        caption: "State network Layer 1: expand scalar time into 128 features",
        latex: String.raw`\begin{aligned}\mathbf z_{s}^{(1)}&=W_{s}^{(1)}x+\mathbf b_{s}^{(1)}\\&=\begin{bmatrix}w^{s,1}_{1,1}\\w^{s,1}_{2,1}\\\vdots\\w^{s,1}_{128,1}\end{bmatrix}x+\begin{bmatrix}b^{s,1}_1\\b^{s,1}_2\\\vdots\\b^{s,1}_{128}\end{bmatrix},\qquad W_s^{(1)}\in\mathbb R^{128\times1},\ \mathbf b_s^{(1)}\in\mathbb R^{128}\\\mathbf h_s^{(1)}&=\tanh\!\left(\mathbf z_s^{(1)}\right)\end{aligned}`,
      },
      {
        label: "State network hidden-layer matrices",
        caption: "State network Layers 2–8: complete 128×128 feature mixing at every layer",
        latex: String.raw`\begin{aligned}\mathbf z_s^{(\ell)}&=W_s^{(\ell)}\mathbf h_s^{(\ell-1)}+\mathbf b_s^{(\ell)}\\&=\begin{bmatrix}w^{s,\ell}_{1,1}&w^{s,\ell}_{1,2}&\cdots&w^{s,\ell}_{1,128}\\w^{s,\ell}_{2,1}&w^{s,\ell}_{2,2}&\cdots&w^{s,\ell}_{2,128}\\\vdots&\vdots&\ddots&\vdots\\w^{s,\ell}_{128,1}&w^{s,\ell}_{128,2}&\cdots&w^{s,\ell}_{128,128}\end{bmatrix}\begin{bmatrix}h^{s,\ell-1}_1\\h^{s,\ell-1}_2\\\vdots\\h^{s,\ell-1}_{128}\end{bmatrix}+\begin{bmatrix}b^{s,\ell}_1\\b^{s,\ell}_2\\\vdots\\b^{s,\ell}_{128}\end{bmatrix},\quad \ell=2,\ldots,8\\\mathbf h_s^{(\ell)}&=\tanh\!\left(\mathbf z_s^{(\ell)}\right),\qquad W_s^{(\ell)}\in\mathbb R^{128\times128}\end{aligned}`,
      },
      {
        label: "State network output matrix",
        caption: "State-network output layer: read 128 features into the three physical variables q, n, and i",
        latex: String.raw`\begin{aligned}\mathbf y_s&=W_s^{(9)}\mathbf h_s^{(8)}+\mathbf b_s^{(9)}\\&=\begin{bmatrix}w^{s,9}_{q,1}&w^{s,9}_{q,2}&\cdots&w^{s,9}_{q,128}\\w^{s,9}_{n,1}&w^{s,9}_{n,2}&\cdots&w^{s,9}_{n,128}\\w^{s,9}_{i,1}&w^{s,9}_{i,2}&\cdots&w^{s,9}_{i,128}\end{bmatrix}\begin{bmatrix}h^{s,8}_1\\h^{s,8}_2\\\vdots\\h^{s,8}_{128}\end{bmatrix}+\begin{bmatrix}b_q^{s,9}\\b_n^{s,9}\\b_i^{s,9}\end{bmatrix},\quad W_s^{(9)}\in\mathbb R^{3\times128}\end{aligned}`,
      },
      {
        label: "State network output transform",
        caption: "Complete state-network output constraints",
        latex: String.raw`\Phi_s\!\left(\begin{bmatrix}y_q\\y_n\\y_i\end{bmatrix}\right)=\begin{bmatrix}y_q\\\operatorname{softplus}(y_n)\\\operatorname{softplus}(y_i)\end{bmatrix}=\begin{bmatrix}q_{\mathrm{pred}}\\n_{\mathrm{pred}}\\i_{\mathrm{pred}}\end{bmatrix},\qquad \operatorname{softplus}(u)=\ln(1+e^u)`,
      },
      {
        label: "State network complete mapping",
        caption: "Complete composite mapping from time to the three physical outputs",
        latex: String.raw`\boxed{\begin{bmatrix}q_{\mathrm{pred}}\\n_{\mathrm{pred}}\\i_{\mathrm{pred}}\end{bmatrix}=\Phi_s\!\left(W_s^{(9)}\tanh\!\left(W_s^{(8)}\cdots\tanh\!\left(W_s^{(2)}\tanh\!\left(W_s^{(1)}x+\mathbf b_s^{(1)}\right)+\mathbf b_s^{(2)}\right)\cdots+\mathbf b_s^{(8)}\right)+\mathbf b_s^{(9)}\right)}`,
      },
      {
        label: "Correction network first-layer matrix",
        caption: "Correction network Layer 1: expand scalar time into 64 features",
        latex: String.raw`\begin{aligned}\mathbf z_c^{(1)}&=W_c^{(1)}x+\mathbf b_c^{(1)}\\&=\begin{bmatrix}w^{c,1}_{1,1}\\w^{c,1}_{2,1}\\\vdots\\w^{c,1}_{64,1}\end{bmatrix}x+\begin{bmatrix}b^{c,1}_1\\b^{c,1}_2\\\vdots\\b^{c,1}_{64}\end{bmatrix},\qquad W_c^{(1)}\in\mathbb R^{64\times1}\\\mathbf h_c^{(1)}&=\tanh\!\left(\mathbf z_c^{(1)}\right)\end{aligned}`,
      },
      {
        label: "Correction network hidden-layer matrices",
        caption: "Correction network Layers 2–3: complete 64×64 feature mixing",
        latex: String.raw`\begin{aligned}\mathbf z_c^{(\ell)}&=W_c^{(\ell)}\mathbf h_c^{(\ell-1)}+\mathbf b_c^{(\ell)}\\&=\begin{bmatrix}w^{c,\ell}_{1,1}&w^{c,\ell}_{1,2}&\cdots&w^{c,\ell}_{1,64}\\w^{c,\ell}_{2,1}&w^{c,\ell}_{2,2}&\cdots&w^{c,\ell}_{2,64}\\\vdots&\vdots&\ddots&\vdots\\w^{c,\ell}_{64,1}&w^{c,\ell}_{64,2}&\cdots&w^{c,\ell}_{64,64}\end{bmatrix}\begin{bmatrix}h^{c,\ell-1}_1\\h^{c,\ell-1}_2\\\vdots\\h^{c,\ell-1}_{64}\end{bmatrix}+\begin{bmatrix}b^{c,\ell}_1\\b^{c,\ell}_2\\\vdots\\b^{c,\ell}_{64}\end{bmatrix},\quad \ell=2,3\\\mathbf h_c^{(\ell)}&=\tanh\!\left(\mathbf z_c^{(\ell)}\right),\qquad W_c^{(\ell)}\in\mathbb R^{64\times64}\end{aligned}`,
      },
      {
        label: "Correction network output matrix",
        caption: "Correction-network output layer: read 64 features into a nonnegative current",
        latex: String.raw`\begin{aligned}y_c&=W_c^{(4)}\mathbf h_c^{(3)}+b_c^{(4)}\\&=\begin{bmatrix}w^{c,4}_{1}&w^{c,4}_{2}&\cdots&w^{c,4}_{64}\end{bmatrix}\begin{bmatrix}h^{c,3}_1\\h^{c,3}_2\\\vdots\\h^{c,3}_{64}\end{bmatrix}+b_c^{(4)},\qquad W_c^{(4)}\in\mathbb R^{1\times64}\\i_{\mathrm{corr}}(\tau)&=\operatorname{softplus}(y_c)=\ln(1+e^{y_c})\end{aligned}`,
      },
      {
        label: "Correction network complete mapping",
        caption: "Complete 1→64→64→64→1 composite mapping of the current-correction network",
        latex: String.raw`\boxed{i_{\mathrm{corr}}(\tau)=\operatorname{softplus}\!\left(W_c^{(4)}\tanh\!\left(W_c^{(3)}\tanh\!\left(W_c^{(2)}\tanh\!\left(W_c^{(1)}x+\mathbf b_c^{(1)}\right)+\mathbf b_c^{(2)}\right)+\mathbf b_c^{(3)}\right)+b_c^{(4)}\right)}`,
      },
    ],
  },
  {
    id: "losses",
    label: "Observation Loss and Physics Residuals",
    content:
      "The state network is supervised directly only by q_obs; it never receives ground-truth n or I. Carrier density and current are determined indirectly through the two dimensionless rate equations. Stage 2 removes the intensity-fitting term and retains only the carrier-equation residual evaluated with the frozen states.",
    formulas: [
      {
        label: "Observed light loss",
        caption: "The only directly observed supervision term",
        latex: String.raw`\mathcal L_q=\frac1N\sum_{j=1}^N\left[q_{\mathrm{pred}}(\tau_j)-q_{\mathrm{obs}}(\tau_j)\right]^2`,
      },
      {
        label: "Photon equation residual",
        caption: "Photon-equation residual",
        latex: String.raw`r_q=\frac{\mathrm dq_{\mathrm{pred}}}{\mathrm d\tau}-\frac{B(n_{\mathrm{pred}}-\eta)s_{\mathrm{pred}}-Cs_{\mathrm{pred}}+Dn_{\mathrm{pred}}}{s_{\mathrm{pred}}+\varepsilon}`,
      },
      {
        label: "Carrier equation residual",
        caption: "Carrier-equation residual",
        latex: String.raw`r_n=\frac{\mathrm dn_{\mathrm{pred}}}{\mathrm d\tau}-\left[i_{\mathrm{pred}}-n_{\mathrm{pred}}-A(n_{\mathrm{pred}}-\eta)s_{\mathrm{pred}}\right]`,
      },
      {
        label: "State network weighted loss",
        caption: "Implementation weights: 10,000 for q observations and 1 for each physics residual",
        latex: String.raw`\mathcal L_{\mathrm{state}}=10^4\mathcal L_q+\frac1N\sum_j r_q(\tau_j)^2+\frac1N\sum_j r_n(\tau_j)^2`,
      },
      {
        label: "Current correction loss",
        caption: "Single-variable current correction after freezing q and n",
        latex: String.raw`r_I=\frac{\mathrm dn_{\mathrm{fixed}}}{\mathrm d\tau}-\left[i_{\mathrm{corr}}-n_{\mathrm{fixed}}-A(n_{\mathrm{fixed}}-\eta)s_{\mathrm{fixed}}\right],\qquad \mathcal L_I=\frac1N\sum_jr_I(\tau_j)^2`,
      },
    ],
  },
  {
    id: "optimization",
    label: "Gradient Descent and Training Configuration",
    content:
      "The paper uses the same downhill analogy to explain gradient descent: an excessively large learning rate may overshoot the valley, while a very small one converges slowly. The implementation uses Adam's first- and second-moment estimates to adapt the update scale of each parameter.",
    formulas: [
      {
        label: "Laser PINN gradient descent update",
        caption: "Parameter-update equation used in the paper",
        latex: String.raw`\Theta_{k+1}=\Theta_k-\mathrm{lr}\,\frac{\partial\mathcal L}{\partial\Theta_k}`,
      },
    ],
    media: [
      {
        src: "images/research/laser/gradient-descent.jpeg",
        alt: "Downhill gradient-descent illustration from the semiconductor-laser paper",
        caption: "Original figure from the paper: each step follows the negative gradient, and the learning rate determines its length.",
        fit: "contain",
      },
    ],
    facts: [
      { label: "State network", value: "30,000 epochs; Adam; lr=10⁻³; FP32" },
      { label: "Current correction", value: "10,000 epochs; Adam; lr=5×10⁻⁴" },
      { label: "Initialization", value: "Xavier normal + zero bias" },
      { label: "Device", value: "Automatic CUDA / MPS / CPU selection" },
    ],
  },
  {
    id: "results",
    label: "Forward Dynamics and Inversion Results",
    content:
      "The forward simulations reproduce the intensity spike and relaxation oscillations after threshold crossing. The state network reconstructs the principal dynamics of q, s, and n, although its initial current estimate contains local oscillations. After q and n are frozen, the independent correction network brings both parabolic and sinusoidal currents much closer to the reference trajectories.",
    media: [
      {
        src: "images/research/laser/forward-parabolic.png",
        alt: "RK4 forward simulation under a parabolic injection current",
        caption: "Parabolic current: photon spikes and damped oscillations appear after the carrier density crosses threshold.",
        fit: "contain",
      },
      {
        src: "images/research/laser/forward-sine.png",
        alt: "RK4 forward simulation under a sinusoidal injection current",
        caption: "Carrier and photon dynamics under a single-cycle sinusoidal current.",
        fit: "contain",
      },
      {
        src: "images/research/laser/state-parabolic.png",
        alt: "State-network prediction for the parabolic current case",
        caption: "Stage 1: q, s, and n are fitted well, but the inferred current still deviates from the reference.",
        fit: "contain",
      },
      {
        src: "images/research/laser/state-sine.png",
        alt: "State-network prediction for the sinusoidal current case",
        caption: "Stage 1: the network captures the oscillatory dynamics and the overall sinusoidal current trend.",
        fit: "contain",
      },
      {
        src: "images/research/laser/current-parabolic.png",
        alt: "Corrected parabolic injection current",
        caption: "Stage 2: the corrected current nearly overlaps the reference parabolic curve.",
        fit: "contain",
      },
      {
        src: "images/research/laser/current-sine.png",
        alt: "Corrected sinusoidal injection current",
        caption: "Stage 2: both phase and amplitude of the sinusoidal current are recovered consistently.",
        fit: "contain",
      },
    ],
  },
  {
    id: "reproducibility",
    label: "Reproducibility, Export, and Scope",
    content:
      "The forward script generates separate Excel training and reference tables, and the state and current networks are exported independently to ONNX. The training table intentionally excludes n_true and I_true supervision; the ground-truth trajectories are used only in the final validation plots.",
    code: "pip install numpy pandas matplotlib openpyxl PyQt5 onnx onnxruntime\npython 1.py\npython run_all.py\n# Alternatively: 2.py, test2.py, 3.py, then test3.py",
    links: [
      { label: "Open GitHub Repository", href: "https://github.com/qianyuyingluo/Semiconductor-Laser-PINN", external: true },
      { label: "Read the Nondimensionalization Page", href: "#/projects/semiconductor-laser-pinn/nondimensionalization" },
    ],
    bullets: [
      "Current validation uses simulated data; measurement noise, parameter drift, and bandwidth limits require separate evaluation.",
      "Stage 2 uses a numerical derivative of the frozen n, so sampling density and Stage 1 smoothness affect the corrected current.",
      "ONNX decouples training from inference, supporting later experimental analysis or embedded deployment.",
    ],
    tags: ["PyTorch", "ONNX Runtime", "Excel", "PyQt5", "CUDA", "FP32"],
  },
];

export const laserNondimensionalizationSections: ResearchSection[] = [
  {
    id: "motivation",
    label: "2.2 Nondimensionalization: Purpose and Variables",
    paragraphs: [
      "The rate equations contain physical quantities with different dimensions, including time t, carrier density N, photon density S, and injection current I. Feeding these raw quantities directly into a neural network creates large numerical disparities and makes convergence difficult. Nondimensionalization removes the dimensional dependence and places the variables on comparable scales.",
      "First define the dimensionless time τ. Then normalize carrier density by the threshold density Nth to obtain n, photon density by the maximum photon density Smax to obtain s, and current by the threshold current Ith to obtain i.",
    ],
    formulas: [
      {
        label: "Original dimensionless definitions",
        caption: "The four scale definitions used in the original paper",
        latex: String.raw`\tau=\frac{t}{\tau_n},\qquad n=\frac{N}{N_{\mathrm{th}}},\qquad s=\frac{S}{S_{\max}},\qquad i=\frac{I}{I_{\mathrm{th}}}`,
      },
    ],
  },
  {
    id: "dimensional-equations",
    label: "Original Dimensional Rate Equations",
    paragraphs: ["The original dimensional semiconductor-laser rate equations are:"],
    formulas: [
      {
        label: "Original dimensional rate equation pair",
        caption: "Starting point of Section 2.2 in the paper",
        latex: String.raw`\begin{aligned}\frac{\mathrm dN}{\mathrm dt}&=\frac{I(t)}{q_eV_a}-\frac{N}{\tau_n}-g_0(N-N_{\mathrm{tr}})S\\\frac{\mathrm dS}{\mathrm dt}&=\Gamma g_0(N-N_{\mathrm{tr}})S-\frac{S}{\tau_p}+\Gamma\beta\frac{N}{\tau_n}\end{aligned}`,
      },
    ],
  },
  {
    id: "carrier-equation",
    label: "Step-by-Step Carrier-Equation Transformation",
    paragraphs: [
      "Substitute t=ττn and multiply both sides by τn. Next use n=N/Nth, s=S/Smax, and i=I/Ith, or equivalently N=nNth, S=sSmax, and I=iIth, and substitute these relations into the equation.",
      "At threshold, the carrier density has just reached Nth, dN/dt=0, and there is no laser output, so S=0. The threshold identity removes the dimensional coefficient of the injection term and yields the dimensionless carrier equation.",
    ],
    formulas: [
      {
        label: "Carrier equation after time scaling",
        caption: "Substitute t=ττn and multiply by τn",
        latex: String.raw`\frac{\mathrm dN}{\mathrm d\tau}=\frac{I(t)\tau_n}{q_eV_a}-N-\tau_ng_0(N-N_{\mathrm{tr}})S`,
      },
      {
        label: "Carrier equation after all substitutions",
        caption: "Substitute N=nNth, S=sSmax, and I=iIth, then divide by Nth",
        latex: String.raw`\frac{\mathrm dn}{\mathrm d\tau}=i\frac{I_{\mathrm{th}}\tau_n}{q_eV_aN_{\mathrm{th}}}-n-\tau_ng_0S_{\max}\left(n-\frac{N_{\mathrm{tr}}}{N_{\mathrm{th}}}\right)s`,
      },
      {
        label: "Threshold identity",
        caption: "At threshold, dN/dt=0 and S=0",
        latex: String.raw`\frac{I_{\mathrm{th}}}{q_eV_a}-\frac{N_{\mathrm{th}}}{\tau_n}=0\quad\Longrightarrow\quad \frac{I_{\mathrm{th}}\tau_n}{q_eV_aN_{\mathrm{th}}}=1`,
      },
      {
        label: "Final carrier equation",
        caption: "Define A=τng₀Smax and η=Ntr/Nth",
        latex: String.raw`\begin{aligned}A&=\tau_ng_0S_{\max}\\\eta&=\frac{N_{\mathrm{tr}}}{N_{\mathrm{th}}}\\\boxed{\frac{\mathrm dn}{\mathrm d\tau}}&=\boxed{i-n-A(n-\eta)s}\end{aligned}`,
      },
    ],
  },
  {
    id: "photon-equation",
    label: "Step-by-Step Photon-Equation Transformation",
    paragraphs: [
      "Apply the same procedure to the photon-density equation: substitute t=ττn, multiply by τn, insert the dimensionless variables, and finally divide both sides by Smax.",
      "Defining B, C, and D from the physical parameters and normalization scales gives the dimensionless photon-density equation.",
    ],
    formulas: [
      {
        label: "Photon equation after time scaling",
        caption: "Dimensionless time substitution",
        latex: String.raw`\frac{\mathrm dS}{\mathrm d\tau}=\tau_n\Gamma g_0(N-N_{\mathrm{tr}})S-\frac{\tau_n}{\tau_p}S+\Gamma\beta N`,
      },
      {
        label: "Photon equation after normalization",
        caption: "Substitute N=nNth and S=sSmax, then divide by Smax",
        latex: String.raw`\frac{\mathrm ds}{\mathrm d\tau}=\tau_n\Gamma g_0N_{\mathrm{th}}(n-\eta)s-\frac{\tau_n}{\tau_p}s+\frac{\Gamma\beta N_{\mathrm{th}}}{S_{\max}}n`,
      },
      {
        label: "Final photon density equation",
        caption: "Define B=τnΓg₀Nth, C=τn/τp, and D=ΓβNth/Smax",
        latex: String.raw`B=\tau_n\Gamma g_0N_{\mathrm{th}},\quad C=\frac{\tau_n}{\tau_p},\quad D=\frac{\Gamma\beta N_{\mathrm{th}}}{S_{\max}},\quad \boxed{\frac{\mathrm ds}{\mathrm d\tau}=B(n-\eta)s-Cs+Dn}`,
      },
    ],
  },
  {
    id: "log-intensity",
    label: "Logarithmic Intensity and Final Training Equations",
    paragraphs: [
      "Fully connected feedforward networks are sensitive to numerical scale, while the laser photon density s can exhibit a very large peak that causes exploding gradients during training. The transformation q=ln(s+ε) is introduced to compress this dynamic range.",
      "Here ε is a small positive constant that prevents ln(0) when s=0. Differentiating both sides with respect to τ gives the dimensionless rate equations used to train the neural networks.",
    ],
    formulas: [
      {
        label: "Log light transformation derivative",
        caption: "Chain rule from s to q",
        latex: String.raw`q=\ln(s+\varepsilon),\qquad \frac{\mathrm dq}{\mathrm d\tau}=\frac1{s+\varepsilon}\frac{\mathrm ds}{\mathrm d\tau}`,
      },
      {
        label: "Final log light equation",
        caption: "Substitute the dimensionless photon-density equation",
        latex: String.raw`\boxed{\frac{\mathrm dq}{\mathrm d\tau}=\frac{B(n-\eta)s-Cs+Dn}{s+\varepsilon}},\qquad s=e^q-\varepsilon`,
      },
      {
        label: "Final dimensionless training system",
        caption: "Shared physical foundation of the state and current-correction networks",
        latex: String.raw`\boxed{\begin{aligned}\frac{\mathrm dn}{\mathrm d\tau}&=i-n-A(n-\eta)s\\\frac{\mathrm dq}{\mathrm d\tau}&=\frac{B(n-\eta)s-Cs+Dn}{s+\varepsilon}\\q&=\ln(s+\varepsilon)\end{aligned}}`,
      },
    ],
    note: "The derivation follows the original order of the paper. Only the mathematical typesetting has been converted to KaTeX, using the repository definitions C=τn/τp and D=ΓβNth/Smax.",
    links: [
      { label: "Return to the Semiconductor-Laser Project", href: "#/projects/semiconductor-laser-pinn" },
    ],
  },
];
