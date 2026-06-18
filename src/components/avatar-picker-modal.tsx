"use client";

import { useRef, useState } from "react";
import { Search, Upload, Loader2, X, ShuffleIcon } from "lucide-react";

// ── Preset avatar catalogue ───────────────────────────────────────────────────

type Style = "thumbs" | "fun-emoji" | "shapes" | "adventurer-neutral" | "bottts-neutral";

interface Preset {
  id: string;
  name: string;
  style: Style;
  seed: string;
}

const PRESETS: Preset[] = [
  // Thumbs — warm & colourful
  { id: "th-aurora",   name: "Aurora",   style: "thumbs", seed: "Aurora"   },
  { id: "th-blaze",    name: "Blaze",    style: "thumbs", seed: "Blaze"    },
  { id: "th-cleo",     name: "Cleo",     style: "thumbs", seed: "Cleo"     },
  { id: "th-dash",     name: "Dash",     style: "thumbs", seed: "Dash"     },
  { id: "th-echo",     name: "Echo",     style: "thumbs", seed: "Echo"     },
  { id: "th-frost",    name: "Frost",    style: "thumbs", seed: "Frost"    },
  { id: "th-gem",      name: "Gem",      style: "thumbs", seed: "Gem"      },
  { id: "th-haven",    name: "Haven",    style: "thumbs", seed: "Haven"    },
  // Fun Emoji — playful
  { id: "fe-nova",     name: "Nova",     style: "fun-emoji", seed: "Nova"     },
  { id: "fe-orbit",    name: "Orbit",    style: "fun-emoji", seed: "Orbit"    },
  { id: "fe-pearl",    name: "Pearl",    style: "fun-emoji", seed: "Pearl"    },
  { id: "fe-quest",    name: "Quest",    style: "fun-emoji", seed: "Quest"    },
  { id: "fe-river",    name: "River",    style: "fun-emoji", seed: "River"    },
  { id: "fe-sky",      name: "Sky",      style: "fun-emoji", seed: "Sky"      },
  { id: "fe-tide",     name: "Tide",     style: "fun-emoji", seed: "Tide"     },
  { id: "fe-vega",     name: "Vega",     style: "fun-emoji", seed: "Vega"     },
  // Shapes — abstract / geometric
  { id: "sh-indigo",   name: "Indigo",   style: "shapes", seed: "Indigo"   },
  { id: "sh-jazz",     name: "Jazz",     style: "shapes", seed: "Jazz"     },
  { id: "sh-kira",     name: "Kira",     style: "shapes", seed: "Kira"     },
  { id: "sh-luna",     name: "Luna",     style: "shapes", seed: "Luna"     },
  { id: "sh-miko",     name: "Miko",     style: "shapes", seed: "Miko"     },
  { id: "sh-neon",     name: "Neon",     style: "shapes", seed: "Neon"     },
  { id: "sh-onyx",     name: "Onyx",     style: "shapes", seed: "Onyx"     },
  { id: "sh-prism",    name: "Prism",    style: "shapes", seed: "Prism"    },
  // Adventurer — character avatars
  { id: "av-reef",     name: "Reef",     style: "adventurer-neutral", seed: "Reef"     },
  { id: "av-sage",     name: "Sage",     style: "adventurer-neutral", seed: "Sage"     },
  { id: "av-terra",    name: "Terra",    style: "adventurer-neutral", seed: "Terra"    },
  { id: "av-uno",      name: "Uno",      style: "adventurer-neutral", seed: "Uno"      },
  { id: "av-wave",     name: "Wave",     style: "adventurer-neutral", seed: "Wave"     },
  { id: "av-xena",     name: "Xena",     style: "adventurer-neutral", seed: "Xena"     },
  { id: "av-york",     name: "York",     style: "adventurer-neutral", seed: "York"     },
  { id: "av-zara",     name: "Zara",     style: "adventurer-neutral", seed: "Zara"     },
  // Bottts — robot avatars
  { id: "bt-alpha",    name: "Alpha",    style: "bottts-neutral", seed: "Alpha"    },
  { id: "bt-beta",     name: "Beta",     style: "bottts-neutral", seed: "Beta"     },
  { id: "bt-chip",     name: "Chip",     style: "bottts-neutral", seed: "Chip"     },
  { id: "bt-delta",    name: "Delta",    style: "bottts-neutral", seed: "Delta"    },
  { id: "bt-echo",     name: "E-Bot",    style: "bottts-neutral", seed: "EBot"     },
  { id: "bt-flux",     name: "Flux",     style: "bottts-neutral", seed: "Flux"     },
  { id: "bt-grid",     name: "Grid",     style: "bottts-neutral", seed: "Grid"     },
  { id: "bt-hex",      name: "Hex",      style: "bottts-neutral", seed: "Hex"      },
];

function presetUrl(p: Preset) {
  return `https://api.dicebear.com/9.x/${p.style}/svg?seed=${encodeURIComponent(p.seed)}`;
}

const STYLE_LABELS: Record<Style, string> = {
  "thumbs": "Thumbs",
  "fun-emoji": "Emoji",
  "shapes": "Shapes",
  "adventurer-neutral": "Character",
  "bottts-neutral": "Robot",
};

const ALL_STYLES = Object.keys(STYLE_LABELS) as Style[];

// ── Component ─────────────────────────────────────────────────────────────────

interface AvatarPickerModalProps {
  currentUrl: string;
  onSelect: (url: string) => Promise<void>;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
  onClose: () => void;
}

export function AvatarPickerModal({
  currentUrl,
  onSelect,
  onUpload,
  onRemove,
  onClose,
}: AvatarPickerModalProps) {
  const [filter, setFilter] = useState("");
  const [activeStyle, setActiveStyle] = useState<Style | "all">("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = PRESETS.filter((p) => {
    const matchesStyle = activeStyle === "all" || p.style === activeStyle;
    const matchesFilter = p.name.toLowerCase().includes(filter.toLowerCase());
    return matchesStyle && matchesFilter;
  });

  const handleSelect = async (preset: Preset) => {
    setLoadingId(preset.id);
    try { await onSelect(presetUrl(preset)); } finally { setLoadingId(null); }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try { await onRemove(); onClose(); } finally { setRemoving(false); }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try { await onUpload(file); onClose(); } finally { setUploading(false); }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-card shadow-2xl border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-bold text-foreground">Select a profile image</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRemove}
              disabled={removing}
              className="flex items-center gap-1 text-xs font-semibold text-destructive hover:underline disabled:opacity-50"
            >
              {removing && <Loader2 className="h-3 w-3 animate-spin" />}
              Remove
            </button>
            <button
              onClick={onClose}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
            />
          </div>

          {/* Style tabs */}
          <div className="flex flex-wrap gap-1.5">
            {(["all", ...ALL_STYLES] as const).map((s) => (
              <button
                key={s}
                onClick={() => setActiveStyle(s)}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-colors ${
                  activeStyle === s
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {s === "all" ? "All" : STYLE_LABELS[s]}
              </button>
            ))}
          </div>

          {/* Avatar grid */}
          <div className="grid grid-cols-6 gap-2 max-h-56 overflow-y-auto pr-1">
            {filtered.map((preset) => {
              const url = presetUrl(preset);
              const isActive = url === currentUrl;
              const isLoading = loadingId === preset.id;
              return (
                <button
                  key={preset.id}
                  title={preset.name}
                  disabled={!!loadingId || uploading}
                  onClick={() => handleSelect(preset)}
                  className={`relative rounded-xl overflow-hidden transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary ${
                    isActive
                      ? "ring-2 ring-primary ring-offset-2"
                      : "hover:scale-110 hover:shadow-md"
                  }`}
                >
                  <img
                    src={url}
                    alt={preset.name}
                    className="h-full w-full aspect-square object-cover bg-muted"
                  />
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                    </div>
                  )}
                  {isActive && !isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary/20 rounded-xl">
                      <div className="h-2.5 w-2.5 rounded-full bg-primary shadow" />
                    </div>
                  )}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="col-span-6 py-6 text-center text-xs text-muted-foreground">
                No avatars match &ldquo;{filter}&rdquo;
              </p>
            )}
          </div>
        </div>

        {/* Upload section */}
        <div className="border-t border-border px-5 py-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Or upload your own
          </p>
          <button
            type="button"
            disabled={uploading || !!loadingId}
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 py-3 text-sm font-semibold text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary disabled:opacity-50"
          >
            {uploading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</>
            ) : (
              <><Upload className="h-4 w-4" /> Choose photo (JPG · PNG · WebP · GIF)</>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleUpload}
          />
        </div>
      </div>
    </div>
  );
}
