import { useEffect } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Bot,
  Code2,
  Database,
  Github,
  Monitor,
  Network,
  Sparkles,
  Workflow,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { rememberHomeSection } from "../navigation";

const imageUrl = (path: string) => new URL(path, document.baseURI).toString();

interface AgentStage {
  slug: string;
  index: string;
  label: string;
  title: string;
  subtitle: string;
  question: string;
  summary: string[];
  capabilities: string[];
  engineering: string;
  stack: string[];
  lesson: string;
  repositoryUrl: string;
  tone: "blue" | "violet" | "cyan" | "rose";
}

const agentStages: AgentStage[] = [
  {
    slug: "labflow-ai",
    index: "01",
    label: "Tool-Using Prototype",
    title: "LabFlow AI",
    subtitle: "The first attempt to make AI execute real scientific work.",
    question: "Can a language model move beyond text and complete a computational workflow?",
    summary: [
      "LabFlow AI was my first Agent project. The architecture was direct and exploratory, but it crossed an important boundary: the model could decide when to call a local Python sandbox instead of only returning prose.",
      "It also introduced a team mode in which coordination, data analysis, and image understanding were assigned to different AI roles before their outputs were consolidated.",
    ],
    capabilities: [
      "Automatic Python sandbox invocation",
      "Scientific calculation, data processing, and plotting",
      "Image-assisted interpretation of experimental results",
      "Single-agent and multi-agent team configurations",
    ],
    engineering:
      "A configuration-led local prototype connected a static web interface, a Node.js service layer, a Python model service, and an isolated scientific-computing environment.",
    stack: [
      "HTML",
      "CSS",
      "JavaScript",
      "Node.js",
      "Python",
      "OpenAI-compatible API",
      "NumPy",
      "SciPy",
      "SymPy",
      "Pandas",
      "Matplotlib",
      "OpenPyXL",
      "JSON configuration",
    ],
    lesson:
      "The central lesson was that an Agent is not only a model. It is the connection between reasoning, tool selection, execution boundaries, and returned evidence.",
    repositoryUrl: "https://github.com/qianyuyingluo/LabFlow-AI",
    tone: "blue",
  },
  {
    slug: "yingluo-studio",
    index: "02",
    label: "Reliable API Client",
    title: "Yingluo Studio",
    subtitle: "A deliberate return to the foundations of a dependable AI application.",
    question: "Can model access, file input, and technical content rendering become stable enough for daily use?",
    summary: [
      "After LabFlow AI, I temporarily reduced the scope. Yingluo Studio did not pursue autonomous planning or multi-agent orchestration; it focused on a clear desktop client for OpenAI-compatible APIs.",
      "This stage strengthened the interaction layer that later Agent systems would depend on: model configuration, local history, document extraction, vision input, formula rendering, and Windows packaging.",
    ],
    capabilities: [
      "Configurable OpenAI-compatible model access",
      "Text chat and optional vision input",
      "Client-side extraction for common document formats",
      "Markdown and KaTeX rendering in a packaged desktop app",
    ],
    engineering:
      "The project treated interface reliability and desktop delivery as first-class engineering problems, while keeping the execution model intentionally simple.",
    stack: [
      "React 18",
      "Vite",
      "Electron",
      "react-markdown",
      "rehype-katex",
      "PDF.js",
      "Mammoth",
      "SheetJS",
      "JSZip",
      "Electron Builder",
      "Local browser storage",
    ],
    lesson:
      "Before an Agent can become more autonomous, its API boundary, content pipeline, and everyday interface must be predictable.",
    repositoryUrl: "https://github.com/qianyuyingluo/yingluo-studio",
    tone: "violet",
  },
  {
    slug: "lab-ai",
    index: "03",
    label: "Planned Research Workspace",
    title: "LabAI",
    subtitle: "A structured Agent workspace built around planning, persistence, and control.",
    question: "Can complex tasks be planned, reviewed, persisted, and executed as an inspectable process?",
    summary: [
      "LabAI returned to the Agent problem with a more disciplined architecture. Plan Mode asks the model to produce an execution plan first; the user can approve it or request a revision before the system continues.",
      "SQLite persistence and explicit run state replaced temporary browser-only conversations. The frontend was also rebuilt to present streaming Markdown, formulas, attachments, long conversations, and execution state more clearly.",
    ],
    capabilities: [
      "Plan generation, approval, revision, and execution",
      "Persistent chats, messages, model profiles, and run state",
      "SSE streaming with explicit task status",
      "Local parsing for scientific and office documents",
    ],
    engineering:
      "A typed Next.js frontend and layered FastAPI backend separated model adapters, database models, prompts, file services, planning, and execution concerns.",
    stack: [
      "Next.js",
      "React",
      "TypeScript",
      "Tailwind CSS",
      "Radix UI",
      "FastAPI",
      "SQLAlchemy",
      "SQLite",
      "OpenAI Python SDK",
      "Pydantic Settings",
      "Server-Sent Events",
      "Markdown",
      "KaTeX",
    ],
    lesson:
      "This stage moved the work from a functional prototype toward an engineered system: actions needed durable state, visible progress, and a clear point for human approval.",
    repositoryUrl: "https://github.com/qianyuyingluo/LabAI",
    tone: "cyan",
  },
  {
    slug: "lingyin-agent",
    index: "04",
    label: "Embodied Desktop Agent",
    title: "Lingyin Agent",
    subtitle: "An animated desktop character transformed into an operational assistant.",
    question: "Can an Agent become a persistent desktop presence rather than another isolated chat window?",
    summary: [
      "Lingyin began as an anime-style desktop character designed mainly for visual presence. I later connected the capabilities developed through LabAI so the character could open a complete office assistant, call tools, parse files, and run constrained Python analysis.",
      "Plan Mode was intentionally removed. LabAI optimizes for deliberate, reviewable work; Lingyin prioritizes immediacy and companionship. Agent states such as idle, running, waiting, review, and failure are reflected through character animation.",
    ],
    capabilities: [
      "Transparent animated character on the Windows desktop",
      "Direct conversation, office tools, and Python analysis",
      "Agent-state-to-animation mapping",
      "Portable and installed releases with a bundled Python runtime",
    ],
    engineering:
      "The product combines a layered WinForms character window, a WebView2 interface, a local FastAPI service, SQLite storage, and a validated animation-asset pipeline.",
    stack: [
      "C#",
      "WinForms",
      "WebView2",
      "React",
      "TypeScript",
      "Vite",
      "FastAPI",
      "SQLite",
      "HTTP + SSE",
      "PyInstaller",
      "Bundled CPython",
      "Pillow",
      "OpenCV",
      "NumPy",
      "PowerShell",
    ],
    lesson:
      "The final shift was interaction design: the character is not a decorative skin, but a visible representation of an Agent's state, availability, and ongoing work.",
    repositoryUrl: "https://github.com/qianyuyingluo/Lingyin-agent",
    tone: "rose",
  },
];

const stageIcons = {
  "labflow-ai": Code2,
  "yingluo-studio": Monitor,
  "lab-ai": Workflow,
  "lingyin-agent": Sparkles,
};

const evolutionQuestions = [
  { icon: Code2, label: "Execute", text: "Can AI perform a real task?" },
  { icon: Network, label: "Connect", text: "Can model access feel reliable?" },
  { icon: Database, label: "Plan", text: "Can work stay controlled and persistent?" },
  { icon: Bot, label: "Embody", text: "Can the Agent live on the desktop?" },
];

interface AgentEvolutionPageProps {
  activeSlug: string;
}

export default function AgentEvolutionPage({ activeSlug }: AgentEvolutionPageProps) {
  const reduceMotion = useReducedMotion();
  const activeStage = agentStages.find((stage) => stage.slug === activeSlug) ?? agentStages[0];

  useEffect(() => {
    let settleFrame = 0;
    const layoutFrame = window.requestAnimationFrame(() => {
      settleFrame = window.requestAnimationFrame(() => {
        document.getElementById(`agent-${activeStage.slug}`)?.scrollIntoView({
          behavior: "instant",
          block: "start",
        });
      });
    });

    return () => {
      window.cancelAnimationFrame(layoutFrame);
      window.cancelAnimationFrame(settleFrame);
    };
  }, [activeStage.slug]);

  return (
    <div
      className="agent-evolution-page theme-agents"
      style={{ "--agent-hero-image": `url("${imageUrl("images/agents-sr.jpg")}")` } as React.CSSProperties}
    >
      <div className="research-nav-actions">
        <a className="nav-back" href="#/">
          <ArrowLeft size={16} aria-hidden="true" />
          <span>All projects</span>
        </a>
        <a className="nav-repository" href={activeStage.repositoryUrl} target="_blank" rel="noreferrer">
          <Github size={16} aria-hidden="true" />
          <span>Repository</span>
        </a>
      </div>
      <main className="agent-evolution-main">
        <section id="agent-overview" className="agent-evolution-hero" aria-labelledby="agent-evolution-title">
          <div className="agent-evolution-art" aria-hidden="true" />
          <div className="agent-evolution-wash" aria-hidden="true" />
          <motion.div
            className="agent-hero-glass"
            initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", bounce: 0, duration: 0.42 }}
          >
            <p className="agent-overline">Four projects · One evolving idea</p>
            <h1 id="agent-evolution-title">From API Calls to Embodied Agents</h1>
            <p className="agent-hero-summary">
              A chronological record of how my work moved from tool invocation, to a dependable model client,
              to planned execution, and finally to an animated desktop assistant.
            </p>
            <div className="agent-route-map" aria-label="Agent evolution stages">
              {agentStages.map((stage) => (
                <a
                  key={stage.slug}
                  className={stage.slug === activeStage.slug ? "agent-route-step is-active" : "agent-route-step"}
                  href={`#/projects/${stage.slug}`}
                  onClick={() => rememberHomeSection("agents")}
                  aria-current={stage.slug === activeStage.slug ? "page" : undefined}
                >
                  <span>{stage.index}</span>
                  <strong>{stage.title}</strong>
                </a>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="agent-questions" aria-labelledby="agent-questions-title">
          <div className="agent-section-intro">
            <p className="agent-overline">Evolution, not accumulation</p>
            <h2 id="agent-questions-title">Four different design questions</h2>
            <p>
              The sequence did not simply add more features. Each project narrowed in on a different relationship
              between models, tools, users, and interfaces.
            </p>
          </div>
          <div className="agent-question-grid">
            {evolutionQuestions.map(({ icon: Icon, label, text }, index) => (
              <motion.article
                key={label}
                className="agent-question-card"
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ type: "spring", bounce: 0, duration: 0.35, delay: index * 0.04 }}
              >
                <Icon size={19} aria-hidden="true" />
                <span>{label}</span>
                <p>{text}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <div className="agent-timeline" aria-label="Agent project timeline">
          {agentStages.map((stage, stageIndex) => {
            const Icon = stageIcons[stage.slug as keyof typeof stageIcons];
            const isActive = stage.slug === activeStage.slug;

            return (
              <section
                id={`agent-${stage.slug}`}
                key={stage.slug}
                className={`agent-stage agent-tone-${stage.tone}${isActive ? " is-active" : ""}`}
                aria-labelledby={`agent-${stage.slug}-title`}
              >
                <div className="agent-stage-marker" aria-hidden="true">
                  <span>{stage.index}</span>
                  <i />
                </div>
                <motion.article
                  className="agent-stage-card"
                  initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.99 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ type: "spring", bounce: 0, duration: 0.42 }}
                >
                  <header className="agent-stage-heading">
                    <div className="agent-stage-icon"><Icon size={21} aria-hidden="true" /></div>
                    <div>
                      <p>{stage.label}</p>
                      <h2 id={`agent-${stage.slug}-title`}>{stage.title}</h2>
                      <span>{stage.subtitle}</span>
                    </div>
                    <span className="agent-stage-order">{stageIndex + 1} / {agentStages.length}</span>
                  </header>

                  <blockquote className="agent-stage-question">{stage.question}</blockquote>

                  <div className="agent-stage-body">
                    <div className="agent-stage-narrative">
                      {stage.summary.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    </div>
                    <div className="agent-capability-panel">
                      <h3>What changed</h3>
                      <ul>
                        {stage.capabilities.map((capability) => <li key={capability}>{capability}</li>)}
                      </ul>
                    </div>
                  </div>

                  <div className="agent-engineering-note">
                    <Network size={18} aria-hidden="true" />
                    <div>
                      <h3>Engineering focus</h3>
                      <p>{stage.engineering}</p>
                    </div>
                  </div>

                  <div className="agent-stack-block">
                    <h3>Technology stack</h3>
                    <div className="agent-stack-list">
                      {stage.stack.map((technology) => <span key={technology}>{technology}</span>)}
                    </div>
                  </div>

                  <footer className="agent-stage-footer">
                    <p><strong>Lesson.</strong> {stage.lesson}</p>
                    <a href={stage.repositoryUrl} target="_blank" rel="noreferrer">
                      Open repository
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </a>
                  </footer>
                </motion.article>
              </section>
            );
          })}
        </div>

        <section className="agent-conclusion" aria-labelledby="agent-conclusion-title">
          <div className="agent-conclusion-icon"><Bot size={26} aria-hidden="true" /></div>
          <div>
            <p className="agent-overline">The resulting trajectory</p>
            <h2 id="agent-conclusion-title">From generating answers to designing complete interactions</h2>
            <p>
              LabFlow AI established tool use and collaboration. Yingluo Studio strengthened the client and content
              pipeline. LabAI introduced planning, durable state, and a more disciplined architecture. Lingyin Agent
              then explored how those capabilities could inhabit a visible, responsive desktop character.
            </p>
          </div>
        </section>
      </main>

      <footer className="research-footer agent-footer">
        <span>Agent Evolution</span>
        <a href="#/">Explore all projects</a>
      </footer>
    </div>
  );
}
