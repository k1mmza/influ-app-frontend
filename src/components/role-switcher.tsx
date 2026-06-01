"use client";

import { Role } from "@/lib/types";
import { useUserStore } from "@/store/useUserStore";
import { cn } from "@/lib/utils";

const roles: Role[] = ["agency", "brand", "influencer"];

export function RoleSwitcher() {
  const { role, setRole } = useUserStore();

  return (
    <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex flex-wrap gap-2">
        {roles.map((item) => (
          <button
            key={item}
            onClick={() => setRole(item)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold capitalize transition",
              role === item
                ? "bg-secondary text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            )}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
