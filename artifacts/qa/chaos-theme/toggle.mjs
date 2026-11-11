// src/components/ThemeToggle.tsx
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { jsx } from "react/jsx-runtime";
function ThemeToggle() {
  const [theme, setTheme] = useState("dark");
  useEffect(() => {
    setTheme(document.documentElement.dataset.theme || "dark");
  }, []);
  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    setTheme(next);
    try {
      localStorage.setItem("aqw-theme", next);
    } catch {
    }
  }
  return /* @__PURE__ */ jsx("button", { className: "theme-toggle", onClick: toggle, "aria-label": theme === "dark" ? "Chuy\u1EC3n sang giao di\u1EC7n s\xE1ng" : "Chuy\u1EC3n sang giao di\u1EC7n t\u1ED1i", title: theme === "dark" ? "Giao di\u1EC7n s\xE1ng" : "Giao di\u1EC7n t\u1ED1i", children: theme === "dark" ? /* @__PURE__ */ jsx(Sun, { size: 20 }) : /* @__PURE__ */ jsx(Moon, { size: 20 }) });
}
export {
  ThemeToggle
};
