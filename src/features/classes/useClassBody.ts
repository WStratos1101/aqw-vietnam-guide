import { useEffect, useState } from "react";
import { initialImportedBody } from "../../lib/imported";
import { isClassBody } from "../../lib/classes";
import type { AqwClass, ClassBody } from "../../types/classes";
export function useClassBody(profile: AqwClass) {
  const [body, setBody] = useState<ClassBody | null>(() => {
    const seed: unknown = initialImportedBody();
    return isClassBody(seed, profile.id) ? seed : null;
  });
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (body) return;
    const controller = new AbortController();
    fetch(profile.bodyUrl, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw Error("Không tải được nội dung Class.");
        return r.json();
      })
      .then((value) => {
        if (!isClassBody(value, profile.id))
          throw Error("Nội dung Class chưa hợp lệ.");
        setBody(value);
        setError("");
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => controller.abort();
  }, [body, profile, attempt]);
  return { body, error, retry: () => setAttempt((n) => n + 1) };
}
