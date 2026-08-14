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

import { BELTS, MAX_DEGREE, graduationRank, nextStep } from "../src/lib/belts";

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

function atHour(date: Date, time: string) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

const SENHA_PADRAO = "yeshua123";

// ---------------------------------------------------------------------------
// Horarios das aulas (FICTICIOS - trocar pelos horarios reais da academia)
// ---------------------------------------------------------------------------

const HORARIOS = [
  { weekday: 1, startTime: "07:00", endTime: "08:00", title: "Jiu-Jitsu", type: "GI" },
  { weekday: 1, startTime: "12:00", endTime: "13:00", title: "Jiu-Jitsu", type: "GI" },
  { weekday: 1, startTime: "17:30", endTime: "18:30", title: "Jiu-Jitsu Kids", type: "KIDS" },
  { weekday: 1, startTime: "19:00", endTime: "20:30", title: "Jiu-Jitsu", type: "GI" },
  { weekday: 2, startTime: "07:00", endTime: "08:00", title: "Jiu-Jitsu", type: "GI" },
  { weekday: 2, startTime: "19:00", endTime: "20:30", title: "No-Gi", type: "NOGI" },
  { weekday: 2, startTime: "20:30", endTime: "21:30", title: "Boxe", type: "BOXE" },
  { weekday: 3, startTime: "07:00", endTime: "08:00", title: "Jiu-Jitsu", type: "GI" },
  { weekday: 3, startTime: "12:00", endTime: "13:00", title: "Jiu-Jitsu", type: "GI" },
  { weekday: 3, startTime: "17:30", endTime: "18:30", title: "Jiu-Jitsu Kids", type: "KIDS" },
  { weekday: 3, startTime: "19:00", endTime: "20:30", title: "Jiu-Jitsu", type: "GI" },
  { weekday: 4, startTime: "19:00", endTime: "20:30", title: "No-Gi", type: "NOGI" },
  { weekday: 4, startTime: "20:30", endTime: "21:30", title: "Boxe", type: "BOXE" },
  { weekday: 5, startTime: "07:00", endTime: "08:00", title: "Jiu-Jitsu", type: "GI" },
  { weekday: 5, startTime: "19:00", endTime: "20:30", title: "Jiu-Jitsu", type: "GI" },
  { weekday: 6, startTime: "10:00", endTime: "11:30", title: "Treino Livre (Open Mat)", type: "OPEN_MAT" },
];

// Aulas que entram na chamada do dia a dia (as que geram presenca).
const AULAS_PRINCIPAIS = HORARIOS.filter((h) =>
  ["GI", "NOGI", "OPEN_MAT"].includes(h.type),
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
  competitor?: boolean;
  monthlyGoal?: number;
  phone?: string;
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
  const steps: { belt: string; degree: number }[] = [];
  const targetRank = graduationRank(belt, degree);
  for (const b of BELTS) {
    for (let d = 0; d <= MAX_DEGREE; d++) {
      if (graduationRank(b.key, d) > targetRank) break;
      steps.push({ belt: b.key, degree: d });
    }
    if (graduationRank(b.key, MAX_DEGREE) >= targetRank) break;
  }

  const dates: Date[] = new Array(steps.length);
  dates[steps.length - 1] = currentSince;
  for (let i = steps.length - 2; i >= 0; i--) {
    const gap = nextStep(steps[i].belt, steps[i].degree).expectedMonths ?? 6;
    // pequena variacao para nao ficar tudo no mesmo dia do mes
    const jitter = Math.floor(random() * 2);
    dates[i] = addMonths(dates[i + 1], -(gap + jitter));
  }

  return steps.map((s, i) => ({ ...s, date: dates[i] }));
}

async function main() {
  console.log("Limpando dados antigos...");
  await prisma.attendance.deleteMany();
  await prisma.attendanceSession.deleteMany();
  await prisma.studentNote.deleteMany();
  await prisma.graduation.deleteMany();
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
  const alunosCriados: { id: string; consistency: number; joinedAt: Date }[] = [];

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
        isCompetitor: aluno.competitor ?? false,
        phone: aluno.phone,
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
    const aulasDoDia = AULAS_PRINCIPAIS.filter((h) => h.weekday === weekday);
    if (aulasDoDia.length === 0) continue;

    for (const aula of aulasDoDia) {
      const schedule = scheduleByKey.get(`${aula.weekday}-${aula.startTime}`);
      const session = await prisma.attendanceSession.create({
        data: {
          date: atHour(dia, aula.startTime),
          title: `${aula.title} · ${aula.startTime}`,
          type: aula.type,
          scheduleId: schedule?.id,
          professorId: renato.id,
          techniques: TECNICAS[Math.floor(random() * TECNICAS.length)],
        },
      });
      sessoes += 1;

      // Cada aluno tem uma chance de estar nesta aula. Dividimos pela
      // quantidade de aulas da semana para que a media caia perto da meta.
      const aulasPorSemana = AULAS_PRINCIPAIS.length;
      const rows = [];
      for (const aluno of alunosCriados) {
        if (dia < aluno.joinedAt) continue;
        const chance = (aluno.consistency * 12) / (aulasPorSemana * 4.33);
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
      location: "Tijuca Tênis Clube — Rio de Janeiro",
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
