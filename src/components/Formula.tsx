import katex from "katex";

interface FormulaProps {
  latex: string;
  label?: string;
}

export function InlineFormula({ latex, label }: FormulaProps) {
  return (
    <span
      className="formula-inline"
      aria-label={label ?? latex}
      dangerouslySetInnerHTML={{
        __html: katex.renderToString(latex, {
          displayMode: false,
          throwOnError: false,
          strict: "warn",
        }),
      }}
    />
  );
}

export function BlockFormula({ latex, label }: FormulaProps) {
  return (
    <div
      className="formula-block"
      role="math"
      aria-label={label ?? latex}
      dangerouslySetInnerHTML={{
        __html: katex.renderToString(latex, {
          displayMode: true,
          throwOnError: false,
          strict: "warn",
        }),
      }}
    />
  );
}
