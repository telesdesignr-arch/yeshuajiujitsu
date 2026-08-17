/**
 * Popula o banco com dados de exemplo para a academia rodar desde o primeiro
 * minuto: professor, alunos, horarios, chamadas dos ultimos 6 meses,
 * graduacoes e eventos.
 *
 * TODOS os dados aqui sao ficticios. Quando o Renato passar os horarios e a
 * lista real de alunos, e so trocar as listas abaixo e rodar `npm run db:reset`.
 *
 * Rodar:  npm run db:seed
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import {
  beltInfo,
  beltsDaTrilha,
  grausDaFaixa,
  graduationRank,
  nextStep,
} from "../src/lib/belts";

const prisma = new PrismaClient();

// Gerador de numeros pseudo-aleatorios com semente fixa: rodar o seed duas
// vezes produz exatamente os mesmos dados.
function makeRandom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = makeRandom(20260813);

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

// Monta o instante de uma aula sempre em horario de Brasilia, para os dados
// de exemplo nascerem no mesmo fuso que o sistema usa em producao.
function atHour(date: Date, time: string) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const dia = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return new Date(`${dia}T${time}:00-03:00`);
}

const SENHA_PADRAO = "yeshua123";

// ---------------------------------------------------------------------------
// Horarios das aulas (FICTICIOS - trocar pelos horarios reais da academia)
// ---------------------------------------------------------------------------

// Segunda, quarta e sexta, nas duas modalidades.
//
// Os horarios de boxe entre 12h e 16h que o Renato citou nao entram aqui: sao
// horarios que a academia tem disponiveis mas ainda sem turma formada. Se
// entrassem, o professor abriria a chamada e nao teria ninguem.
const DIAS_DE_AULA = [1, 3, 5]; // segunda, quarta, sexta

const AULAS_DO_DIA = [
  // Boxe da manha
  { startTime: "07:00", endTime: "08:00", title: "Boxe", modality: "BOXE", type: "BOXE" },
  { startTime: "08:00", endTime: "09:00", title: "Boxe", modality: "BOXE", type: "BOXE" },
  // Jiu-Jitsu da manha
  { startTime: "09:00", endTime: "10:00", title: "Jiu-Jitsu", modality: "JIU_JITSU", type: "ADULTO" },
  // Boxe do fim da manha
  { startTime: "10:00", endTime: "11:00", title: "Boxe", modality: "BOXE", type: "BOXE" },
  { startTime: "11:00", endTime: "12:00", title: "Boxe", modality: "BOXE", type: "BOXE" },
  // Boxe da tarde
  { startTime: "16:00", endTime: "17:00", title: "Boxe", modality: "BOXE", type: "BOXE" },
  // Jiu-Jitsu da tarde e noite
  { startTime: "17:00", endTime: "18:00", title: "Jiu-Jitsu Adolescentes", modality: "JIU_JITSU", type: "ADOLESCENTE" },
  { startTime: "18:00", endTime: "19:00", title: "Jiu-Jitsu Kids", modality: "JIU_JITSU", type: "KIDS" },
  { startTime: "19:00", endTime: "20:00", title: "Jiu-Jitsu", modality: "JIU_JITSU", type: "ADULTO" },
  // Boxe da noite
  { startTime: "20:00", endTime: "21:00", title: "Boxe", modality: "BOXE", type: "BOXE" },
];

const HORARIOS = DIAS_DE_AULA.flatMap((weekday) =>
  AULAS_DO_DIA.map((aula) => ({ weekday, ...aula })),
).concat([
  // Jiu-Jitsu extra de sexta a noite
  {
    weekday: 5,
    startTime: "20:30",
    endTime: "22:00",
    title: "Jiu-Jitsu",
    modality: "JIU_JITSU",
    type: "ADULTO",
  },
]);

// Quantas aulas por semana cada turma tem. Usado para calibrar a chance de
// presenca: quem treina numa turma com menos aulas precisa de chance maior por
// aula para chegar na mesma meta mensal.
const AULAS_POR_SEMANA: Record<string, number> = HORARIOS.reduce(
  (acc, h) => ({ ...acc, [h.type]: (acc[h.type] ?? 0) + 1 }),
  {} as Record<string, number>,
);

const TECNICAS = [
  "Passagem de guarda com pressão · joelho na barriga",
  "Raspagem da meia-guarda · underhook",
  "Estrangulamento cruzado da montada",
  "Armlock da guarda fechada · quebra de postura",
  "Triângulo · ajustes de ângulo e finalização",
  "Defesa de queda · sprawl e transição para as costas",
  "Berimbolo · entrada pela De La Riva",
  "Kimura da meia-guarda invertida",
  "Passagem toreando e consolidação lateral",
  "Fuga de quadril e recomposição de guarda",
  "Guilhotina em pé e no chão",
  "Americana da cem quilos",
];

// ---------------------------------------------------------------------------
// Alunos (FICTICIOS)
// ---------------------------------------------------------------------------

type SeedStudent = {
  name: string;
  email: string;
  belt: string;
  degree: number;
  /** ha quantos meses recebeu a graduacao atual */
  gradeAgeMonths: number;
  /** 0 a 1: quao assiduo ele e */
  consistency: number;
  /** o que ele treina: JIU_JITSU | BOXE | AMBOS */
  modality?: string;
  /** turmas que ele frequenta (define de quais aulas recebe presenca) */
  turmas?: string[];
  competitor?: boolean;
  monthlyGoal?: number;
  phone?: string;
  guardian?: string;
};

// Os valores de gradeAgeMonths foram escolhidos para dar uma turma realista:
// alguns prontos para graduar, alguns a caminho, e dois que já cumpriram o
// tempo mas sumiram do tatame (Anderson e Marcelo) -- justamente o caso que a
// tela de graduações precisa mostrar como "ainda não".
const ALUNOS: SeedStudent[] = [
  { name: "João Silva", email: "joao@exemplo.com", belt: "AZUL", degree: 2, gradeAgeMonths: 7, consistency: 0.92, competitor: true, monthlyGoal: 15, phone: "(21) 98888-1001" },
  { name: "Pedro Henrique Alves", email: "pedro@exemplo.com", belt: "AZUL", degree: 3, gradeAgeMonths: 4, consistency: 0.78, competitor: true, phone: "(21) 98888-1002" },
  { name: "Mariana Costa", email: "mariana@exemplo.com", belt: "ROXA", degree: 1, gradeAgeMonths: 6, consistency: 0.88, competitor: true, monthlyGoal: 14, phone: "(21) 98888-1003" },
  { name: "Lucas Teles", email: "lucas@exemplo.com", belt: "BRANCA", degree: 3, gradeAgeMonths: 2, consistency: 0.85, monthlyGoal: 12, phone: "(21) 98888-1004" },
  { name: "Rafael Moreira", email: "rafael@exemplo.com", belt: "BRANCA", degree: 4, gradeAgeMonths: 3, consistency: 0.7, phone: "(21) 98888-1005" },
  { name: "Camila Duarte", email: "camila@exemplo.com", belt: "BRANCA", degree: 1, gradeAgeMonths: 3, consistency: 0.63, monthlyGoal: 10, phone: "(21) 98888-1006" },
  { name: "Bruno Cardoso", email: "bruno@exemplo.com", belt: "MARROM", degree: 2, gradeAgeMonths: 5, consistency: 0.74, competitor: true, phone: "(21) 98888-1007" },
  { name: "Thiago Nogueira", email: "thiago@exemplo.com", belt: "AZUL", degree: 0, gradeAgeMonths: 3, consistency: 0.55, phone: "(21) 98888-1008" },
  { name: "Larissa Prado", email: "larissa@exemplo.com", belt: "BRANCA", degree: 2, gradeAgeMonths: 3, consistency: 0.8, monthlyGoal: 10, phone: "(21) 98888-1009" },
  { name: "Vinícius Barreto", email: "vinicius@exemplo.com", belt: "BRANCA", degree: 0, gradeAgeMonths: 1, consistency: 0.48, phone: "(21) 98888-1010" },
  { name: "Diego Fontes", email: "diego@exemplo.com", belt: "ROXA", degree: 3, gradeAgeMonths: 2, consistency: 0.66, phone: "(21) 98888-1011" },
  { name: "Anderson Lima", email: "anderson@exemplo.com", belt: "BRANCA", degree: 1, gradeAgeMonths: 5, consistency: 0.22, phone: "(21) 98888-1012" },
  { name: "Fernanda Rocha", email: "fernanda@exemplo.com", belt: "AZUL", degree: 1, gradeAgeMonths: 4, consistency: 0.71, monthlyGoal: 12, phone: "(21) 98888-1013" },
  { name: "Gabriel Souza", email: "gabriel@exemplo.com", belt: "BRANCA", degree: 4, gradeAgeMonths: 7, consistency: 0.9, competitor: true, monthlyGoal: 16, phone: "(21) 98888-1014" },
  { name: "Marcelo Antunes", email: "marcelo@exemplo.com", belt: "BRANCA", degree: 2, gradeAgeMonths: 5, consistency: 0.31, phone: "(21) 98888-1015" },

  // Turmas infantil e de adolescentes, para exercitar a escada de 13 faixas
  // Turma infantil (crianças): faixas mais baixas, tempo de casa plausível
  { name: "Miguel Ramos", email: "miguel@exemplo.com", belt: "INF_CINZA_PRETA", degree: 2, gradeAgeMonths: 3, consistency: 0.8, modality: "JIU_JITSU", turmas: ["KIDS"], monthlyGoal: 10, guardian: "Patrícia Ramos, (21) 98888-2001" },
  { name: "Helena Duarte", email: "helena@exemplo.com", belt: "INF_CINZA", degree: 1, gradeAgeMonths: 2, consistency: 0.72, modality: "JIU_JITSU", turmas: ["KIDS"], monthlyGoal: 10, guardian: "Carlos Duarte, (21) 98888-2002" },
  { name: "Isabela Freitas", email: "isabela@exemplo.com", belt: "INF_AMARELA_BRANCA", degree: 4, gradeAgeMonths: 4, consistency: 0.9, modality: "JIU_JITSU", turmas: ["KIDS"], monthlyGoal: 10, guardian: "Renata Freitas, (21) 98888-2003" },
  // Turma de adolescentes: mais anos de casa, faixas mais altas
  { name: "Enzo Martins", email: "enzo@exemplo.com", belt: "INF_AMARELA_PRETA", degree: 3, gradeAgeMonths: 3, consistency: 0.85, modality: "JIU_JITSU", turmas: ["ADOLESCENTE"], monthlyGoal: 10, competitor: true, guardian: "Sandra Martins, (21) 98888-2004" },
  { name: "Sophia Nunes", email: "sophia@exemplo.com", belt: "INF_LARANJA_BRANCA", degree: 1, gradeAgeMonths: 2, consistency: 0.68, modality: "JIU_JITSU", turmas: ["ADOLESCENTE"], monthlyGoal: 10, guardian: "Marcos Nunes, (21) 98888-2005" },
  { name: "Davi Carvalho", email: "davi@exemplo.com", belt: "INF_LARANJA_PRETA", degree: 4, gradeAgeMonths: 5, consistency: 0.76, modality: "JIU_JITSU", turmas: ["ADOLESCENTE"], monthlyGoal: 10, guardian: "Juliana Carvalho, (21) 98888-2006" },

  // Turma de boxe. Não têm faixa nem graduação: o campo belt existe no banco
  // mas nunca é mostrado para quem só treina boxe.
  { name: "Rodrigo Peixoto", email: "rodrigo@exemplo.com", belt: "BRANCA", degree: 0, gradeAgeMonths: 6, consistency: 0.88, modality: "BOXE", turmas: ["BOXE"], monthlyGoal: 12, phone: "(21) 98888-3001" },
  { name: "Aline Barros", email: "aline@exemplo.com", belt: "BRANCA", degree: 0, gradeAgeMonths: 4, consistency: 0.74, modality: "BOXE", turmas: ["BOXE"], monthlyGoal: 12, phone: "(21) 98888-3002" },
  { name: "Wesley Amorim", email: "wesley@exemplo.com", belt: "BRANCA", degree: 0, gradeAgeMonths: 3, consistency: 0.62, modality: "BOXE", turmas: ["BOXE"], monthlyGoal: 10, phone: "(21) 98888-3003" },
  { name: "Tatiane Lopes", email: "tatiane@exemplo.com", belt: "BRANCA", degree: 0, gradeAgeMonths: 2, consistency: 0.35, modality: "BOXE", turmas: ["BOXE"], monthlyGoal: 12, phone: "(21) 98888-3004" },

  // Quem faz as duas modalidades: vê a grade inteira e tem faixa de Jiu-Jitsu.
  { name: "Caio Bastos", email: "caio@exemplo.com", belt: "BRANCA", degree: 2, gradeAgeMonths: 3, consistency: 0.9, modality: "AMBOS", turmas: ["ADULTO", "BOXE"], monthlyGoal: 16, phone: "(21) 98888-3005" },
  { name: "Priscila Mendes", email: "priscila@exemplo.com", belt: "AZUL", degree: 1, gradeAgeMonths: 5, consistency: 0.8, modality: "AMBOS", turmas: ["ADULTO", "BOXE"], monthlyGoal: 14, competitor: true, phone: "(21) 98888-3006" },
];

const OBSERVACOES = [
  "Evoluiu bastante na passagem de guarda. Precisa trabalhar mais a defesa de costas.",
  "Postura em pé melhorou muito. Continuar insistindo nas quedas.",
  "Muito consistente nos treinos. Já pode começar a puxar os alunos novos.",
  "Está segurando bem a pressão na meia-guarda. Faltou treinar finalização de costas.",
  "Voltou bem depois da lesão. Ir com calma no sparring por mais duas semanas.",
  "Excelente atitude no treino. Chega cedo e ajuda a montar o tatame.",
];

/**
 * Monta a escada de graduacoes de um aluno, de tras para frente, para que as
 * datas fiquem coerentes com o tempo esperado em cada grau.
 */
function buildGraduationHistory(belt: string, degree: number, currentSince: Date) {
  const info = beltInfo(belt);
  const escada = beltsDaTrilha(info.track);
  const targetRank = graduationRank(belt, degree);

  // Nas faixas infantis registramos so a troca de faixa das etapas antigas, e
  // os graus apenas da faixa atual.
  //
  // Se gerassemos os 4 graus de cada uma das 13 faixas, um adolescente de 13
  // anos apareceria com 49 graduacoes e doze anos de academia -- teria comecado
  // com um ano de idade. Na pratica a crianca nao percorre todos os graus de
  // todas as faixas: ela pula degraus pelo caminho.
  const compacto = info.track === "INFANTIL";

  const steps: { belt: string; degree: number }[] = [];
  for (const b of escada) {
    // Cada faixa tem a propria escala de graus: as coloridas vao ate o 4o, a
    // preta ate o 6o e a coral so existe como 7o.
    for (const d of grausDaFaixa(b.key)) {
      if (graduationRank(b.key, d) > targetRank) break;
      if (compacto && b.key !== belt && d > 0) continue;
      steps.push({ belt: b.key, degree: d });
    }
    if (b.key === belt) break;
  }

  const dates: Date[] = new Array(steps.length);
  dates[steps.length - 1] = currentSince;

  for (let i = steps.length - 2; i >= 0; i--) {
    const trocaDeFaixa = steps[i].belt !== steps[i + 1].belt;
    // Uma troca de faixa infantil representa o ciclo inteiro daquela faixa.
    const anterior = beltInfo(steps[i].belt);
    const gap = trocaDeFaixa
      ? anterior.monthsPerDegree * (anterior.maxDegree - anterior.minDegree) +
        (anterior.monthsToNextBelt ?? 6)
      : (nextStep(steps[i].belt, steps[i].degree).expectedMonths ?? 6);
    // pequena variacao para nao ficar tudo no mesmo dia do mes
    const jitter = Math.floor(random() * 2);
    dates[i] = addMonths(dates[i + 1], -(gap + jitter));
  }

  return steps.map((s, i) => ({ ...s, date: dates[i] }));
}

/**
 * Trava de seguranca.
 *
 * Este script APAGA tudo antes de recriar. Enquanto o banco era um arquivo
 * local isso era inofensivo. Agora que o .env pode apontar para o banco de
 * producao (com os alunos de verdade da academia), um comando distraido
 * apagaria a academia inteira.
 *
 * Em banco que nao seja local, o script so roda se quem chamou disser
 * explicitamente que e isso mesmo:
 *   CONFIRMAR_SEED_EM_PRODUCAO=sim npm run db:seed
 */
function conferirBanco() {
  const url = process.env.DATABASE_URL ?? "";
  const ehLocal =
    url.startsWith("file:") ||
    url.includes("localhost") ||
    url.includes("127.0.0.1");

  if (ehLocal || process.env.CONFIRMAR_SEED_EM_PRODUCAO === "sim") return;

  console.error("");
  console.error("  PAREI POR SEGURANCA.");
  console.error("");
  console.error("  O DATABASE_URL nao aponta para um banco local, e este");
  console.error("  script apaga TODOS os dados antes de recriar.");
  console.error("");
  console.error("  Se voce tem certeza de que quer apagar este banco, rode:");
  console.error("    CONFIRMAR_SEED_EM_PRODUCAO=sim npm run db:seed");
  console.error("");
  process.exit(1);
}

async function main() {
  conferirBanco();

  // A ordem importa: primeiro o que aponta para os outros.
  //
  // ATENCAO ao criar tabela nova: se ela nao entrar nesta lista, o seed passa
  // a DUPLICAR os registros dela a cada execucao, em vez de recriar. Foi o que
  // aconteceu com os campeonatos quando a tabela foi criada.
  console.log("Limpando dados antigos...");
  await prisma.attendance.deleteMany();
  await prisma.attendanceSession.deleteMany();
  await prisma.studentNote.deleteMany();
  await prisma.graduation.deleteMany();
  await prisma.competitionResult.deleteMany();
  await prisma.competition.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.student.deleteMany();
  await prisma.classSchedule.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  const senhaHash = await bcrypt.hash(SENHA_PADRAO, 10);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // -------------------------------------------------------------------------
  // Professor
  // -------------------------------------------------------------------------
  console.log("Criando professor...");
  const renato = await prisma.user.create({
    data: {
      name: "Renato Pierre",
      email: "renato@yeshuajiujitsu.com.br",
      passwordHash: senhaHash,
      role: "ADMIN",
      mustChangePassword: false,
    },
  });

  // -------------------------------------------------------------------------
  // Horarios fixos da semana
  // -------------------------------------------------------------------------
  console.log("Criando grade de horarios...");
  const schedules = [];
  for (const [i, h] of HORARIOS.entries()) {
    schedules.push(
      await prisma.classSchedule.create({
        data: { ...h, professorId: renato.id, sortOrder: i },
      }),
    );
  }
  const scheduleByKey = new Map(
    schedules.map((s) => [`${s.weekday}-${s.startTime}`, s]),
  );

  // -------------------------------------------------------------------------
  // Alunos + graduacoes
  // -------------------------------------------------------------------------
  console.log("Criando alunos e historico de graduacoes...");
  const alunosCriados: {
    id: string;
    consistency: number;
    joinedAt: Date;
    turmas: string[];
    meta: number;
  }[] = [];

  for (const aluno of ALUNOS) {
    const beltSinceAt = addMonths(hoje, -aluno.gradeAgeMonths);
    const historico = buildGraduationHistory(aluno.belt, aluno.degree, beltSinceAt);
    const joinedAt = historico[0].date;

    const user = await prisma.user.create({
      data: {
        name: aluno.name,
        email: aluno.email,
        passwordHash: senhaHash,
        role: "ALUNO",
        mustChangePassword: false,
      },
    });

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        professorId: renato.id,
        belt: aluno.belt,
        degree: aluno.degree,
        beltSinceAt,
        joinedAt,
        monthlyGoal: aluno.monthlyGoal ?? 12,
        modality: aluno.modality ?? "JIU_JITSU",
        isCompetitor: aluno.competitor ?? false,
        phone: aluno.phone,
        guardianName: aluno.guardian,
        active: true,
      },
    });

    for (const [i, g] of historico.entries()) {
      await prisma.graduation.create({
        data: {
          studentId: student.id,
          belt: g.belt,
          degree: g.degree,
          date: g.date,
          awardedById: renato.id,
          notes:
            i === historico.length - 1
              ? "Graduação entregue no fim do treino, com a turma toda presente."
              : null,
        },
      });
    }

    // Diario do aluno
    const quantasNotas = 1 + Math.floor(random() * 3);
    for (let i = 0; i < quantasNotas; i++) {
      await prisma.studentNote.create({
        data: {
          studentId: student.id,
          authorId: renato.id,
          content: OBSERVACOES[Math.floor(random() * OBSERVACOES.length)],
          date: addMonths(hoje, -(i + 1)),
          visibleToStudent: i === 0,
        },
      });
    }

    alunosCriados.push({
      id: student.id,
      consistency: aluno.consistency,
      joinedAt,
      turmas: aluno.turmas ?? ["ADULTO"],
      meta: aluno.monthlyGoal ?? 12,
    });
  }

  // -------------------------------------------------------------------------
  // Chamadas dos ultimos 6 meses
  // -------------------------------------------------------------------------
  console.log("Gerando 6 meses de chamada...");
  const inicio = addMonths(hoje, -6);
  let sessoes = 0;
  let presencas = 0;

  for (let d = new Date(inicio); d <= hoje; d.setDate(d.getDate() + 1)) {
    const dia = new Date(d);
    const weekday = dia.getDay();
    const aulasDoDia = HORARIOS.filter((h) => h.weekday === weekday);
    if (aulasDoDia.length === 0) continue;

    for (const aula of aulasDoDia) {
      const schedule = scheduleByKey.get(`${aula.weekday}-${aula.startTime}`);
      const session = await prisma.attendanceSession.create({
        data: {
          date: atHour(dia, aula.startTime),
          title: `${aula.title} · ${aula.startTime}`,
          modality: aula.modality,
          type: aula.type,
          scheduleId: schedule?.id,
          professorId: renato.id,
          techniques: TECNICAS[Math.floor(random() * TECNICAS.length)],
        },
      });
      sessoes += 1;

      // So entram nesta aula os alunos das turmas dela. Cada um tem uma chance
      // de estar presente, calibrada para a media cair perto da meta mensal --
      // dividida pelo total de aulas das turmas que ele frequenta, para quem
      // faz duas modalidades nao aparecer com o dobro de treinos.
      const rows = [];
      for (const aluno of alunosCriados) {
        if (!aluno.turmas.includes(aula.type)) continue;
        if (dia < aluno.joinedAt) continue;
        const aulasPorSemana = aluno.turmas.reduce(
          (soma, t) => soma + (AULAS_POR_SEMANA[t] ?? 0),
          0,
        );
        const chance =
          (aluno.consistency * aluno.meta) / (Math.max(1, aulasPorSemana) * 4.33);
        if (random() < chance) {
          rows.push({
            sessionId: session.id,
            studentId: aluno.id,
            present: true,
            date: session.date,
          });
        }
      }
      if (rows.length > 0) {
        await prisma.attendance.createMany({ data: rows });
        presencas += rows.length;
      }
    }
  }

  // -------------------------------------------------------------------------
  // Eventos da agenda
  // -------------------------------------------------------------------------
  console.log("Criando eventos...");
  const eventos = [
    {
      title: "Graduação de Meio de Ano",
      type: "GRADUACAO",
      startsAt: atHour(addMonths(hoje, 1), "19:00"),
      location: "Academia Yeshua Jiu-Jitsu",
      description:
        "Cerimônia de entrega de graus e faixas. Venha de kimono limpo e chegue 20 minutos antes. Traga a família.",
    },
    {
      title: "Copa Rio de Jiu-Jitsu 2026",
      type: "CAMPEONATO",
      startsAt: atHour(addMonths(hoje, 2), "08:00"),
      location: "Tijuca Tênis Clube, Rio de Janeiro",
      description:
        "Inscrições abertas para adulto e master, Gi e No-Gi. Fale com o professor Renato para acertar a categoria e o peso.",
    },
    {
      title: "Seminário de Guarda com faixa-preta convidado",
      type: "SEMINARIO",
      startsAt: atHour(addMonths(hoje, 1), "10:00"),
      location: "Academia Yeshua Jiu-Jitsu",
      description:
        "Três horas de guarda moderna: De La Riva, berimbolo e transições para as costas. Aberto a todas as faixas.",
    },
    {
      title: "Treino especial e foto oficial da equipe",
      type: "TREINO_ESPECIAL",
      startsAt: atHour(addMonths(hoje, 0), "10:00"),
      location: "Academia Yeshua Jiu-Jitsu",
      description:
        "Treino aberto seguido da foto oficial da equipe. Todo mundo de kimono da academia.",
    },
    {
      title: "Confraternização de fim de ano",
      type: "CONFRATERNIZACAO",
      startsAt: atHour(addMonths(hoje, 4), "13:00"),
      location: "A definir",
      description: "Churrasco da equipe com alunos e famílias. Detalhes em breve.",
    },
  ];

  for (const e of eventos) {
    await prisma.event.create({ data: e });
  }

  // -------------------------------------------------------------------------
  // Campeonatos e resultados (FICTICIOS)
  // -------------------------------------------------------------------------
  console.log("Criando campeonatos...");

  const passado1 = await prisma.competition.create({
    data: {
      name: "Copa Rio de Jiu-Jitsu 2026",
      date: atHour(addMonths(hoje, -4), "08:00"),
      location: "Tijuca Tênis Clube, Rio de Janeiro",
      organizer: "FJJRIO",
      modality: "GI",
      imageUrl:
        "https://www.fjjrio.app.br/app/img/eventos/Rei%20do%20Riof66cdbf1d24b3f69bc68e11fbb1142af553f5122.jpeg",
      description:
        "Etapa estadual com chaves do infantil ao master. A equipe levou nove atletas.",
    },
  });

  const passado2 = await prisma.competition.create({
    data: {
      name: "Rio Winter No-Gi Open 2026",
      date: atHour(addMonths(hoje, -2), "09:00"),
      location: "CEFAN, Rio de Janeiro",
      organizer: "CBJJD",
      modality: "NOGI",
      imageUrl:
        "https://www.fjjrio.app.br/app/img/eventos/Rolls%20Gracie2b1f15f7e10f3ef3dc39872ac5c8faa3aae62c9a.jpeg",
      description: "Primeira competição sem kimono da equipe no ano.",
    },
  });

  const futuro1 = await prisma.competition.create({
    data: {
      name: "Campeonato Estadual de Jiu-Jitsu 2026",
      date: atHour(addMonths(hoje, 2), "08:00"),
      endDate: atHour(addMonths(hoje, 2), "18:00"),
      location: "Ginásio do Maracanãzinho, Rio de Janeiro",
      organizer: "FJJRIO",
      modality: "AMBOS",
      registrationDeadline: atHour(addMonths(hoje, 1), "23:59"),
      registrationUrl: "https://www.fjjrio.app.br/",
      // Cartaz real, hospedado na propria FJJRIO -- formato banner (800x533)
      imageUrl:
        "https://www.fjjrio.app.br/app/img/eventos/Carioca7bd44d361c25e6223b0679dab35af887407e72bb.jpg",
      description:
        "Principal campeonato do estado. Chaves com e sem kimono, do infantil ao master. Fale com o professor Renato para acertar categoria e peso antes de se inscrever.",
    },
  });

  await prisma.competition.create({
    data: {
      name: "Rio Spring International Open 2026",
      date: atHour(addMonths(hoje, 3), "08:00"),
      location: "Rio de Janeiro, RJ",
      organizer: "CBJJ / IBJJF",
      modality: "GI",
      registrationDeadline: atHour(addMonths(hoje, 2), "23:59"),
      registrationUrl: "https://cbjj.com.br/events/championships",
      // Logo real da IBJJF -- formato quadrado (600x600), para exercitar o
      // caso em que o cartaz nao e um banner deitado
      imageUrl: "https://www.ibjjfdb.com/Championship/Logo/3369",
      description:
        "Campeonato internacional da IBJJF. Exige filiação e carteirinha em dia.",
    },
  });

  // Resultados dos passados
  const porEmail = new Map(
    ALUNOS.map((a, i) => [a.email, alunosCriados[i]?.id]).filter(
      (x): x is [string, string] => Boolean(x[1]),
    ),
  );

  const resultados = [
    { email: "joao@exemplo.com", comp: passado1.id, placement: 1, category: "Azul · Adulto · Médio", modality: "GI", notes: "Finalizou as três lutas: duas por armlock e uma por estrangulamento." },
    { email: "joao@exemplo.com", comp: passado1.id, placement: 3, category: "Absoluto", modality: "GI" },
    { email: "mariana@exemplo.com", comp: passado1.id, placement: 1, category: "Roxa · Adulto · Leve", modality: "GI" },
    { email: "bruno@exemplo.com", comp: passado1.id, placement: 2, category: "Marrom · Master 1 · Pesado", modality: "GI" },
    { email: "pedro@exemplo.com", comp: passado1.id, placement: 3, category: "Azul · Adulto · Pena", modality: "GI" },
    { email: "gabriel@exemplo.com", comp: passado1.id, placement: 0, category: "Branca · Adulto · Médio", modality: "GI", notes: "Primeira competição. Perdeu na semifinal nos pontos." },
    { email: "enzo@exemplo.com", comp: passado1.id, placement: 1, category: "Amarela e Preta · Infantil B", modality: "GI" },
    { email: "joao@exemplo.com", comp: passado2.id, placement: 2, category: "Azul · Adulto · Médio", modality: "NOGI" },
    { email: "mariana@exemplo.com", comp: passado2.id, placement: 1, category: "Roxa · Adulto · Leve", modality: "NOGI" },
    { email: "enzo@exemplo.com", comp: passado2.id, placement: 3, category: "Infantil B", modality: "NOGI" },
    { email: "bruno@exemplo.com", comp: passado2.id, placement: 0, category: "Marrom · Master 1", modality: "NOGI" },
  ];

  let registrados = 0;
  for (const r of resultados) {
    const studentId = porEmail.get(r.email);
    if (!studentId) continue;
    await prisma.competitionResult.create({
      data: {
        competitionId: r.comp,
        studentId,
        placement: r.placement,
        category: r.category,
        modality: r.modality,
        notes: r.notes ?? null,
      },
    });
    await prisma.student.update({
      where: { id: studentId },
      data: { isCompetitor: true },
    });
    registrados += 1;
  }

  console.log(`  ${registrados} resultados de campeonato`);
  void futuro1;

  // -------------------------------------------------------------------------
  // Financeiro
  //
  // O valor da mensalidade (R$ 90) e real, informado pela academia. Os alunos
  // e as mensalidades geradas abaixo continuam FICTICIOS.
  // -------------------------------------------------------------------------
  console.log("Criando planos e mensalidades...");

  await prisma.academySettings.upsert({
    where: { id: "unica" },
    create: {
      id: "unica",
      pixKey: "5521987059207",
      pixOwnerName: "Renato Pierre",
      defaultDueDay: 10,
    },
    update: {},
  });

  // Um valor unico para toda a academia: R$ 90, Jiu-Jitsu ou boxe, adulto ou
  // crianca. Se um dia a academia cobrar diferente por turma, o professor cria
  // outro plano pelo painel -- nao precisa mexer aqui.
  const plano = await prisma.plan.create({
    data: {
      name: "Mensalidade",
      priceCents: 9000,
      description: "Jiu-Jitsu e boxe, todas as turmas da semana.",
      sortOrder: 0,
    },
  });

  for (const criado of alunosCriados) {
    if (!criado) continue;
    await prisma.student.update({
      where: { id: criado.id },
      data: { planId: plano.id, dueDay: 10 },
    });
  }

  // Três meses de mensalidades: os dois anteriores quitados, o atual em aberto
  // com um pouco de tudo, para o professor ver a tela cheia de verdade.
  const alunosComPlano = await prisma.student.findMany({
    where: { active: true },
    include: { plan: true, user: { select: { name: true } } },
  });

  let mensalidadesCriadas = 0;
  for (let atras = 2; atras >= 0; atras--) {
    const ref = addMonths(hoje, -atras);
    const referenceMonth = `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, "0")}`;

    for (const [i, aluno] of alunosComPlano.entries()) {
      const valor = aluno.customFeeCents ?? aluno.plan?.priceCents ?? 0;
      if (valor === 0) continue;

      const vencimento = atHour(
        new Date(ref.getFullYear(), ref.getMonth(), aluno.dueDay),
        "12:00",
      );

      let status = "PAGO";
      let paidAt: Date | null = atHour(
        new Date(ref.getFullYear(), ref.getMonth(), Math.max(1, aluno.dueDay - 2)),
        "10:00",
      );

      if (atras === 0) {
        // Mês corrente: mistura de situações
        const sorte = (i + 1) % 5;
        if (sorte === 0) {
          status = "EM_ANALISE";
          paidAt = null;
        } else if (sorte === 1 || sorte === 2) {
          status = "PENDENTE";
          paidAt = null;
        }
      }

      await prisma.invoice.create({
        data: {
          studentId: aluno.id,
          referenceMonth,
          dueDate: vencimento,
          amountCents: valor,
          status,
          paidAt,
          paymentMethod: status === "PAGO" ? "PIX" : null,
          confirmedById: status === "PAGO" ? renato.id : null,
        },
      });
      mensalidadesCriadas += 1;
    }
  }

  console.log(`  ${mensalidadesCriadas} mensalidades`);

  console.log("");
  console.log("Pronto!");
  console.log(`  ${ALUNOS.length} alunos`);
  console.log(`  ${sessoes} aulas com chamada`);
  console.log(`  ${presencas} presencas registradas`);
  console.log("");
  console.log("Entrar como PROFESSOR:  renato@yeshuajiujitsu.com.br / " + SENHA_PADRAO);
  console.log("Entrar como ALUNO:      joao@exemplo.com / " + SENHA_PADRAO);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
