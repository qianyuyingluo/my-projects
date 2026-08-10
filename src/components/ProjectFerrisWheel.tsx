import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { MoveUpRight, Pause, Play } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { projectRepositoryName, type Project } from "../data/projects";
import { rememberHomeSection } from "../navigation";

interface ProjectFerrisWheelProps {
  projects: Project[];
}

const AUTO_ADVANCE_MS = 2800;
const MANUAL_PAUSE_MS = 5200;

export default function ProjectFerrisWheel({ projects }: ProjectFerrisWheelProps) {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const dragStart = useRef<number | null>(null);
  const wheelDelta = useRef(0);
  const manualPauseUntil = useRef(0);
  const wheelRegion = useRef<HTMLElement | null>(null);

  const selectProject = (nextIndex: number, manual = true) => {
    setActiveIndex((nextIndex + projects.length) % projects.length);
    if (manual) manualPauseUntil.current = Date.now() + MANUAL_PAUSE_MS;
  };

  useEffect(() => {
    if (reduceMotion || paused || projects.length < 2) return;

    const timer = window.setInterval(() => {
      if (!interacting && Date.now() >= manualPauseUntil.current) {
        setActiveIndex((current) => (current + 1) % projects.length);
      }
    }, AUTO_ADVANCE_MS);

    return () => window.clearInterval(timer);
  }, [interacting, paused, projects.length, reduceMotion]);

  const relativeOffset = (index: number) => {
    const half = Math.floor(projects.length / 2);
    let offset = index - activeIndex;
    if (offset > half) offset -= projects.length;
    if (offset < -half) offset += projects.length;
    return offset;
  };

  useEffect(() => {
    const region = wheelRegion.current;
    if (!region) return;

    const handleWheel = (event: globalThis.WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      wheelDelta.current += event.deltaY || event.deltaX;
      if (Math.abs(wheelDelta.current) < 32) return;
      selectProject(activeIndex + Math.sign(wheelDelta.current));
      wheelDelta.current = 0;
    };

    region.addEventListener("wheel", handleWheel, { passive: false });
    return () => region.removeEventListener("wheel", handleWheel);
  }, [activeIndex, projects.length]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    dragStart.current = event.clientY;
    setInteracting(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (dragStart.current === null) return;
    const distance = dragStart.current - event.clientY;
    if (Math.abs(distance) < 44) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    selectProject(activeIndex + Math.sign(distance));
    dragStart.current = event.clientY;
  };

  const finishPointerInteraction = () => {
    dragStart.current = null;
    manualPauseUntil.current = Date.now() + MANUAL_PAUSE_MS;
    setInteracting(false);
  };

  return (
    <motion.aside
      className="project-ferris"
      aria-label="Browse all thirteen projects"
      initial={reduceMotion ? false : { opacity: 0, x: 16, scale: 0.985 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ type: "spring", bounce: 0, duration: 0.46 }}
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false);
      }}
    >
      <header className="project-ferris-header">
        <div>
          <p>Project Navigator</p>
          <span>{String(activeIndex + 1).padStart(2, "0")} / {projects.length} · Scroll or drag</span>
        </div>
        <button
          type="button"
          aria-label={paused ? "Resume automatic project rotation" : "Pause automatic project rotation"}
          aria-pressed={paused}
          onClick={() => setPaused((value) => !value)}
        >
          {paused ? <Play size={15} fill="currentColor" aria-hidden="true" /> : <Pause size={15} fill="currentColor" aria-hidden="true" />}
        </button>
      </header>

      <nav
        ref={wheelRegion}
        aria-label="Project carousel"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointerInteraction}
        onPointerCancel={finishPointerInteraction}
      >
        {projects.map((project, index) => {
          const offset = relativeOffset(index);
          const distance = Math.abs(offset);
          const visible = distance <= 3;
          const active = offset === 0;
          const scale = active ? 1.12 : [1, 0.94, 0.8, 0.67][distance];
          const horizontal = active ? 0 : [0, 28, 78, 138][distance];

          return (
            <motion.a
              key={project.slug}
              className={active ? "project-ferris-item is-active" : "project-ferris-item"}
              href={`#/projects/${project.slug}`}
              onClick={() => rememberHomeSection(project.category)}
              data-project-slug={project.slug}
              aria-current={active ? "true" : undefined}
              aria-hidden={!visible}
              tabIndex={visible ? 0 : -1}
              animate={{
                x: horizontal,
                y: offset * 64,
                scale,
                opacity: visible ? [1, 0.8, 0.54, 0.28][distance] : 0,
              }}
              transition={{ type: "spring", bounce: 0, duration: reduceMotion ? 0 : 0.42 }}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{projectRepositoryName(project)}</strong>
              <MoveUpRight size={15} aria-hidden="true" />
            </motion.a>
          );
        })}
      </nav>
    </motion.aside>
  );
}
