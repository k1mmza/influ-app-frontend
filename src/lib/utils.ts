import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge only knows Tailwind's DEFAULT font-size scale. The travelogue
 * theme adds custom fontSize keys (text-tv-display-lg, text-tv-label-caps, …),
 * and because they are unknown, tailwind-merge classifies them as text-COLOUR
 * utilities. It then treats them as conflicting with real colour classes and
 * silently drops whichever came first:
 *
 *   cn("text-white/70", "text-tv-label-caps")  ->  "text-tv-label-caps"
 *        (colour lost — element inherits dark text on a dark image)
 *   cn("text-tv-label-caps", "text-tv-muted-text")  ->  "text-tv-muted-text"
 *        (size lost — label renders at the inherited size)
 *
 * Registering them under `font-size` makes the two independent again, so a
 * size and a colour can coexist. Keep this list in sync with the `tv` fontSize
 * keys in tailwind.config.ts.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "tv-display-lg",
            "tv-headline-lg",
            "tv-headline-lg-mobile",
            "tv-headline-md",
            "tv-italic-serif",
            "tv-body-lg",
            "tv-body-md",
            "tv-label-caps",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Copy text to the clipboard, robust to the cases where navigator.clipboard is
 * unavailable or rejects — notably when the copy happens AFTER an `await` (the
 * browser drops the user-gesture / transient activation, and Safari rejects the
 * async clipboard write). Falls back to a hidden-textarea execCommand copy, which
 * still works from a selection. Returns true only if something was actually copied.
 */
export async function copyText(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* fall through to execCommand */
    }
  }
  if (typeof document === "undefined") return false;
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "0";
    ta.style.left = "0";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
