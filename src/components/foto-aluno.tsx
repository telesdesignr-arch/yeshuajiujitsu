"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Camera, Loader2, Trash2 } from "lucide-react";

import { saveStudentPhoto, type ActionState } from "@/actions/painel";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/field";
import { Avatar } from "@/components/ui/misc";
import { FOTO_LADO, FOTO_MAX_CARACTERES } from "@/lib/foto";

/**
 * Reduz a imagem escolhida a um quadrado pequeno, dentro do navegador.
 *
 * O corte e pelo centro: foto de celular vem em pe ou deitada, e recortar o
 * meio acerta o rosto na maioria das vezes. A qualidade vai caindo em passos
 * ate o texto final caber no limite do banco -- assim uma foto de 8 MP do
 * celular chega ao servidor com uns 10 KB.
 */
async function reduzir(arquivo: File): Promise<string> {
  const fonte = await carregar(arquivo);

  const lado = Math.min(fonte.width, fonte.height);
  const sx = (fonte.width - lado) / 2;
  const sy = (fonte.height - lado) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = FOTO_LADO;
  canvas.height = FOTO_LADO;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("sem canvas");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(fonte, sx, sy, lado, lado, 0, 0, FOTO_LADO, FOTO_LADO);

  for (const qualidade of [0.75, 0.65, 0.55, 0.45, 0.35]) {
    const url = canvas.toDataURL("image/jpeg", qualidade);
    if (url.length <= FOTO_MAX_CARACTERES) return url;
  }
  throw new Error("imagem grande demais");
}

/**
 * `createImageBitmap` com `from-image` respeita a orientacao gravada pelo
 * celular; sem isso, foto tirada em pe chega deitada. Navegador que nao aceita
 * a opcao cai no <img>, que ja aplica a orientacao sozinho.
 */
async function carregar(arquivo: File): Promise<CanvasImageSource & { width: number; height: number }> {
  try {
    return await createImageBitmap(arquivo, { imageOrientation: "from-image" });
  } catch {
    const url = URL.createObjectURL(arquivo);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

function BotaoSalvar({ temFoto }: { temFoto: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="md" disabled={pending || !temFoto}>
      {pending ? (
        <>
          <Loader2 aria-hidden className="size-4 animate-spin" />
          Salvando...
        </>
      ) : (
        "Salvar foto"
      )}
    </Button>
  );
}

export function FotoAluno({
  studentId,
  name,
  photoUrl,
}: {
  studentId: string;
  name: string;
  photoUrl: string | null;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    saveStudentPhoto,
    {},
  );
  const [previa, setPrevia] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [lendo, setLendo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Depois que o servidor confirma, a prévia sai de cena e a foto exibida
  // volta a ser a que veio do banco.
  useEffect(() => {
    if (state.success) {
      setPrevia(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [state.success]);

  async function escolher(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    setErro(null);
    setLendo(true);
    try {
      setPrevia(await reduzir(arquivo));
    } catch {
      setPrevia(null);
      setErro(
        "Não consegui ler essa imagem. Tente uma foto comum do celular (JPG ou PNG).",
      );
    } finally {
      setLendo(false);
    }
  }

  const mostrando = previa ?? photoUrl;

  return (
    <div className="space-y-4">
      {erro && <FormAlert>{erro}</FormAlert>}
      {state.error && <FormAlert>{state.error}</FormAlert>}
      {state.success && <FormAlert tone="success">{state.success}</FormAlert>}

      <div className="flex items-center gap-4">
        <Avatar name={name} src={mostrando} size={72} />

        <div className="min-w-0 flex-1">
          <label
            htmlFor={`foto-${studentId}`}
            className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-[10px] border border-line px-3.5 text-sm font-semibold transition-smooth hover:bg-ink-100"
          >
            {lendo ? (
              <Loader2 aria-hidden className="size-4 animate-spin" />
            ) : (
              <Camera aria-hidden className="size-4" />
            )}
            {mostrando ? "Trocar foto" : "Escolher foto"}
          </label>
          <input
            ref={inputRef}
            id={`foto-${studentId}`}
            type="file"
            accept="image/*"
            onChange={escolher}
            className="sr-only"
          />
          <p className="mt-1.5 text-xs text-ink-500">
            Vale foto do celular. O sistema corta um quadrado do meio e reduz o
            tamanho sozinho.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <form action={formAction}>
          <input type="hidden" name="studentId" value={studentId} />
          <input type="hidden" name="photo" value={previa ?? ""} />
          <BotaoSalvar temFoto={Boolean(previa)} />
        </form>

        {photoUrl && !previa && (
          <form action={formAction}>
            <input type="hidden" name="studentId" value={studentId} />
            <input type="hidden" name="remove" value="1" />
            <Button
              type="submit"
              variant="ghost"
              size="md"
              className="text-ink-500 hover:text-danger"
            >
              <Trash2 aria-hidden className="size-4" />
              Tirar foto
            </Button>
          </form>
        )}

        {previa && (
          <Button
            type="button"
            variant="ghost"
            size="md"
            className="text-ink-500"
            onClick={() => {
              setPrevia(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
          >
            Cancelar
          </Button>
        )}
      </div>
    </div>
  );
}
