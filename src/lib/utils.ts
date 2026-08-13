import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "Renato Pierre" -> "RP" */
export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** "Renato Pierre Silva" -> "Renato" */
export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function pluralize(n: number, singular: string, plural: string) {
  return n === 1 ? singular : plural;
}
