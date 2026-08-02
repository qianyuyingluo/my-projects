import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

interface WheelSection {
  id: string;
  label: string;
}

interface SectionWheelNavProps {
  label: string;
  sections: WheelSection[];
}

const wheelX = [14, 4, -10, -24];
const wheelScale = [1.2, 0.96, 0.84, 0.74];
const wheelOpacity = [1, 0.82, 0.58, 0.3];

export default function SectionWheelNav({ label, sections }: SectionWheelNavProps) {
  const reduceMotion = useReducedMotion();
  const sectionKey = useMemo(() => sections.map((section) => section.id).join("|"), [sections]);
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    setActiveId(sections[0]?.id ?? "");
  }, [sectionKey, sections]);

  useEffect(() => {
    let frame = 0;

    const updateActiveSection = () => {
      frame = 0;
      const marker = window.innerHeight * 0.42;
      let nextId = sections[0]?.id ?? "";

      for (const section of sections) {
        const node = document.getElementById(section.id);
        if (!node) continue;
        if (node.getBoundingClientRect().top <= marker) nextId = section.id;
      }

      setActiveId((current) => (current === nextId ? current : nextId));
    };

    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateActiveSection);
    };

    updateActiveSection();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [sectionKey, sections]);

  const activeIndex = Math.max(0, sections.findIndex((section) => section.id === activeId));

  const goToSection = (id: string) => {
    setActiveId(id);
    document.getElementById(id)?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <aside className="research-index section-wheel" aria-label={label}>
      <p>{label}</p>
      <nav>
        {sections.map((section, index) => {
          const offset = index - activeIndex;
          const distance = Math.abs(offset);
          const visible = distance <= 3;

          return (
            <motion.button
              key={section.id}
              className={offset === 0 ? "section-wheel-item is-active" : "section-wheel-item"}
              type="button"
              data-section-id={section.id}
              aria-current={offset === 0 ? "location" : undefined}
              aria-hidden={!visible}
              tabIndex={visible ? 0 : -1}
              initial={false}
              animate={{
                opacity: visible ? wheelOpacity[Math.min(distance, 3)] : 0,
                scale: wheelScale[Math.min(distance, 3)],
                x: wheelX[Math.min(distance, 3)],
                y: offset * 66,
              }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { type: "spring", bounce: 0, duration: 0.42 }
              }
              style={{ pointerEvents: visible ? "auto" : "none" }}
              onClick={() => goToSection(section.id)}
            >
              <span>{(index + 1).toString().padStart(2, "0")}</span>
              <strong>{section.label}</strong>
            </motion.button>
          );
        })}
      </nav>
    </aside>
  );
}
