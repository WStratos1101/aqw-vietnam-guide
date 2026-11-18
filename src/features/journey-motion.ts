/* Scoped, optional animation adapter for the starter-class selector on Home.
 * It never edits or reorders the Class Codex data. If the correct section
 * cannot be identified, it does not animate anything.
 */
import { useEffect } from "react";

const STARTERS = new Set(["warrior", "mage", "healer", "rogue"]);

function findClassSection(): HTMLElement | null {
  const possible = [...document.querySelectorAll<HTMLElement>("section")].filter((section) => {
    const heading = [...section.querySelectorAll("h1,h2,h3")]
      .map((node) => node.textContent?.toLocaleLowerCase("vi") || "")
      .join(" ");
    return heading.includes("chọn con đường") || heading.includes("khắc tên vào lore");
  });
  if (!possible.length) return null;
  possible.sort((a, b) => (a.textContent?.length || 0) - (b.textContent?.length || 0));
  const root = possible[0];
  const label = (root.textContent || "").toLocaleLowerCase("vi");
  return STARTERS.size === [...STARTERS].filter((n) => label.includes(n)).length ? root : null;
}

function findArt(root: HTMLElement): HTMLElement | null {
  const images = [...root.querySelectorAll<HTMLImageElement>("img")]
    .filter((img) => {
      const r = img.getBoundingClientRect();
      return r.width >= 135 && r.height >= 165;
    })
    .sort((a, b) => (b.getBoundingClientRect().width * b.getBoundingClientRect().height) -
      (a.getBoundingClientRect().width * a.getBoundingClientRect().height));
  return images[0] || null;
}

function findInfo(root: HTMLElement): HTMLElement | null {
  // The information panel in the user-supplied screenshot contains these labels.
  const candidates = [...root.querySelectorAll<HTMLElement>("aside,article,div")]
    .filter((el) => {
      const content = el.textContent?.toLocaleLowerCase("vi") || "";
      const r = el.getBoundingClientRect();
      return r.width > 160 && r.height > 100 && content.includes("lối chơi") &&
        content.includes("enhancement") && content.includes("loại sát thương");
    })
    .sort((a,b) => (a.textContent?.length || 0) - (b.textContent?.length || 0));
  return candidates[0] || null;
}

function reveal(root: HTMLElement) {
  const art = findArt(root);
  const info = findInfo(root);
  if (info) {
    [...info.children].slice(0, 10).forEach((node, index) => {
      if (node instanceof HTMLElement) node.style.setProperty("--aqw-v5-line-index", String(index));
    });
  }
  for (const [el, className] of [[art, "aqw-jny-class-art-enter"], [info, "aqw-jny-class-detail-enter"]] as const) {
    if (!el) continue;
    el.classList.remove(className);
    void el.offsetWidth; // replay on every starter-class change
    el.classList.add(className);
  }
}

export function useJourneyMotion() {
  useEffect(() => {
    const journey = document.querySelector<HTMLElement>(".aqw-jny");
    const host = journey?.parentElement?.closest<HTMLElement>("section");
    // Only add the light theme marker to the external section that hosts Journey.
    if (journey?.classList.contains("aqw-jny--embedded") && host && host !== journey) {
      host.classList.add("aqw-jny-theme-host");
    }

    let timer: number | undefined;
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest<HTMLElement>("button, [role=tab], [role=button]");
      if (!button) return;
      const selected = (button.textContent || "").toLocaleLowerCase("vi").replace(/[↗↖→↑\s]+/g, "").trim();
      if (!STARTERS.has(selected)) return;
      const section = findClassSection();
      if (!section || !section.contains(button)) return;
      if (timer !== undefined) window.clearTimeout(timer);
      // Allow React to render the selected class first; artwork then appears,
      // followed by details from the right.
      timer = window.setTimeout(() => reveal(section), 35);
    };
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      if (timer !== undefined) window.clearTimeout(timer);
      host?.classList.remove("aqw-jny-theme-host");
    };
  }, []);
}
