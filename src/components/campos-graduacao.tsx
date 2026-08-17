"use client";

import { useState } from "react";

import { BeltBar, BeltSelectOptions } from "@/components/belt";
import { Field, Select } from "@/components/ui/field";
import { beltInfo, grausDaFaixa, grauValido } from "@/lib/belts";

/**
 * Faixa + grau, sempre juntos.
 *
 * Andam em par porque o grau depende da faixa: as coloridas vao ate o 4o, a
 * preta ate o 6o e a coral so existe como 7o. Se fossem dois campos
 * independentes, daria para gravar "coral 2o grau", que nao existe.
 *
 * Ao trocar a faixa, o grau se encaixa sozinho no que a faixa nova aceita.
 */
export function CamposDeGraduacao({
  idPrefix,
  beltPadrao = "BRANCA",
  grauPadrao = 0,
  mostraPreview = false,
}: {
  idPrefix: string;
  beltPadrao?: string;
  grauPadrao?: number;
  mostraPreview?: boolean;
}) {
  const [belt, setBelt] = useState(beltPadrao);
  const [grau, setGrau] = useState(grauValido(beltPadrao, grauPadrao));

  const info = beltInfo(belt);
  const graus = grausDaFaixa(belt);
  const grauAtual = grauValido(belt, grau);

  function trocarFaixa(nova: string) {
    setBelt(nova);
    setGrau(grauValido(nova, grau));
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Faixa" htmlFor={`${idPrefix}-belt`} required>
          <Select
            id={`${idPrefix}-belt`}
            name="belt"
            value={belt}
            onChange={(e) => trocarFaixa(e.target.value)}
            required
          >
            <BeltSelectOptions />
          </Select>
        </Field>

        <Field
          label="Graus"
          htmlFor={`${idPrefix}-degree`}
          required
          hint={
            info.minDegree === info.maxDegree
              ? `A faixa ${info.label} é o ${info.minDegree}º grau: não tem grau anterior.`
              : undefined
          }
        >
          <Select
            id={`${idPrefix}-degree`}
            name="degree"
            value={String(grauAtual)}
            onChange={(e) => setGrau(Number(e.target.value))}
            required
            disabled={graus.length === 1}
          >
            {graus.map((g) => (
              <option key={g} value={g}>
                {g === 0 ? "Faixa lisa (sem grau)" : `${g}º grau`}
              </option>
            ))}
          </Select>
          {/* Campo desabilitado não é enviado pelo formulário: quando só existe
              um grau possível, este escondido garante que ele vá junto. */}
          {graus.length === 1 && (
            <input type="hidden" name="degree" value={grauAtual} />
          )}
        </Field>
      </div>

      {mostraPreview && (
        <div>
          <p className="mb-1.5 text-xs font-semibold tracking-wide text-ink-500 uppercase">
            Como vai aparecer
          </p>
          <BeltBar belt={belt} degree={grauAtual} height={28} />
        </div>
      )}
    </>
  );
}
