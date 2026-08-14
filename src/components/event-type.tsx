import {
  Award,
  Camera,
  GraduationCap,
  PartyPopper,
  Trophy,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/misc";

export const EVENT_TYPES: Record<
  string,
  { label: string; icon: LucideIcon; tone: "brand" | "dark" | "success" | "warning" | "neutral" }
> = {
  CAMPEONATO: { label: "Campeonato", icon: Trophy, tone: "warning" },
  GRADUACAO: { label: "Graduação", icon: GraduationCap, tone: "brand" },
  SEMINARIO: { label: "Seminário", icon: Award, tone: "dark" },
  TREINO_ESPECIAL: { label: "Treino especial", icon: Camera, tone: "neutral" },
  CONFRATERNIZACAO: { label: "Confraternização", icon: PartyPopper, tone: "success" },
  OUTRO: { label: "Evento", icon: CalendarDays, tone: "neutral" },
};

export function eventType(type: string) {
  return EVENT_TYPES[type] ?? EVENT_TYPES.OUTRO;
}

export function EventTypeBadge({ type }: { type: string }) {
  const info = eventType(type);
  const Icon = info.icon;
  return (
    <Badge tone={info.tone}>
      <Icon aria-hidden className="size-3.5" />
      {info.label}
    </Badge>
  );
}

/** Tipos de aula usados na grade de horários. */
export const CLASS_TYPES: Record<string, { label: string; short: string }> = {
  ADULTO: { label: "Turma adulta", short: "Adultos" },
  ADOLESCENTE: { label: "Turma de adolescentes", short: "Adolescentes" },
  KIDS: { label: "Turma infantil", short: "Crianças" },
  NOGI: { label: "Jiu-Jitsu sem kimono", short: "No-Gi" },
  OPEN_MAT: { label: "Treino livre", short: "Open Mat" },
  FEMININO: { label: "Turma feminina", short: "Feminino" },
  BOXE: { label: "Boxe", short: "Boxe" },
  GI: { label: "Jiu-Jitsu com kimono", short: "Gi" },
};

export function classType(type: string) {
  return CLASS_TYPES[type] ?? { label: type, short: type };
}

/** Turmas de crianças e adolescentes, destacadas na grade de horários. */
export const TURMAS_JOVENS = ["KIDS", "ADOLESCENTE"];
