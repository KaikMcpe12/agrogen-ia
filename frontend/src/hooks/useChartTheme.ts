import { useEffect, useState } from "react";

interface ChartTheme {
  textColor: string;
  gridColor: string;
  primaryColor: string;
  secondaryColor: string;
  successColor: string;
  warnColor: string;
  dangerColor: string;
  tooltipBg: string;
}

function readCssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function getChartTheme(): ChartTheme {
  return {
    textColor: readCssVar("--color-ink-3") || "#6b6b6b",
    gridColor: readCssVar("--color-line") || "#e6e3dc",
    primaryColor: readCssVar("--color-green-700") || "#2d6a4f",
    secondaryColor: readCssVar("--color-terra-500") || "#b98e6a",
    successColor: readCssVar("--color-ok") || "#15803d",
    warnColor: readCssVar("--color-warn") || "#b45309",
    dangerColor: readCssVar("--color-danger") || "#b91c1c",
    tooltipBg: readCssVar("--color-surface") || "#ffffff",
  };
}

export function useChartTheme(): ChartTheme {
  const [chartTheme, setChartTheme] = useState<ChartTheme>(getChartTheme);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setChartTheme(getChartTheme());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  return chartTheme;
}
