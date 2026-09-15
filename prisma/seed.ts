import { PrismaClient, Level, Track, CourseKind } from "@prisma/client";
import bcrypt from "bcryptjs";
import { slugify } from "../src/lib/utils";

const prisma = new PrismaClient();

// Vidéos de démo libres (Google sample bucket) — provider LOCAL passe par le proxy signé.
const DEMO_VIDEOS = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
];

const LEVEL_LABELS: Record<Level, string> = {
  TRONC_COMMUN: "Tronc commun",
  BAC_1: "1ère année bac",
  BAC_2: "2ème année bac",
  CONCOURS: "Concours",
};

type CourseSpec = {
  title: string;
  short: string;
  level: Level;
  track: Track | null; // null = toutes les branches du niveau
  kind: CourseKind;
  premium: boolean;
  chapters: { title: string; lessons: string[] }[];
};

const COURSES: CourseSpec[] = [
  // 1ʳᵉ séance de chaque cours COURS = aperçu gratuit (offre Gratuit).

  // ----- Tronc commun (sans branche) -----
  {
    title: "Ensembles de nombres & calcul",
    short: "ℕ, ℤ, ℚ, ℝ : calcul, ordre et valeur absolue.",
    level: Level.TRONC_COMMUN, track: null, kind: CourseKind.COURS, premium: true,
    chapters: [
      { title: "Les ensembles", lessons: ["De ℕ à ℝ", "Puissances et racines"] },
      { title: "Ordre dans ℝ", lessons: ["Inégalités & encadrements", "Valeur absolue"] },
    ],
  },
  {
    title: "Polynômes & équations",
    short: "Polynômes du second degré, factorisation et résolution.",
    level: Level.TRONC_COMMUN, track: null, kind: CourseKind.COURS, premium: true,
    chapters: [
      { title: "Second degré", lessons: ["Forme canonique", "Discriminant & racines"] },
      { title: "Applications", lessons: ["Signe d'un trinôme", "Inéquations"] },
    ],
  },

  // ----- 1ère année bac -----
  {
    title: "Généralités sur les fonctions",
    short: "Domaine, parité, monotonie et représentation graphique.",
    level: Level.BAC_1, track: Track.SM, kind: CourseKind.COURS, premium: true,
    chapters: [
      { title: "Notions de base", lessons: ["Ensemble de définition", "Parité & périodicité"] },
      { title: "Variations", lessons: ["Taux de variation", "Extremums"] },
    ],
  },
  {
    title: "Barycentre & produit scalaire",
    short: "Outils vectoriels du plan pour la géométrie analytique.",
    level: Level.BAC_1, track: Track.S_EX, kind: CourseKind.COURS, premium: true,
    chapters: [
      { title: "Barycentre", lessons: ["Définition & propriétés", "Applications"] },
      { title: "Produit scalaire", lessons: ["Expressions", "Orthogonalité"] },
    ],
  },

  // ----- Programme 2ème année bac -----
  {
    title: "Limites & Continuité",
    short: "Maîtrise le calcul de limites et la continuité des fonctions.",
    level: Level.BAC_2, track: Track.SM, kind: CourseKind.COURS, premium: true,
    chapters: [
      { title: "Notion de limite", lessons: ["Limite en un point", "Limite à l'infini", "Limites usuelles"] },
      { title: "Continuité", lessons: ["Définition & théorèmes", "Théorème des valeurs intermédiaires"] },
    ],
  },
  {
    title: "Dérivation",
    short: "Dérivées, tangentes, variations et optimisation.",
    level: Level.BAC_2, track: Track.SM, kind: CourseKind.COURS, premium: true,
    chapters: [
      { title: "Nombre dérivé", lessons: ["Taux d'accroissement", "Tangente à une courbe"] },
      { title: "Fonction dérivée", lessons: ["Dérivées usuelles", "Opérations sur les dérivées", "Sens de variation"] },
    ],
  },
  {
    title: "Suites numériques",
    short: "Suites arithmétiques, géométriques, récurrence et convergence.",
    level: Level.BAC_2, track: Track.SM, kind: CourseKind.COURS, premium: true,
    chapters: [
      { title: "Généralités", lessons: ["Définitions & notations", "Suites monotones"] },
      { title: "Convergence", lessons: ["Limite d'une suite", "Théorèmes de comparaison"] },
    ],
  },
  {
    title: "Intégrales",
    short: "Primitives, intégration et calcul d'aires.",
    level: Level.BAC_2, track: Track.SM, kind: CourseKind.COURS, premium: true,
    chapters: [
      { title: "Primitives", lessons: ["Notion de primitive", "Primitives usuelles"] },
      { title: "Intégration", lessons: ["Intégrale & aire", "Intégration par parties"] },
    ],
  },
  {
    title: "Probabilités",
    short: "Dénombrement, probabilités conditionnelles et variables aléatoires.",
    level: Level.BAC_2, track: Track.S_EX, kind: CourseKind.COURS, premium: true,
    chapters: [
      { title: "Dénombrement", lessons: ["Arrangements & combinaisons", "Le triangle de Pascal"] },
      { title: "Probabilités", lessons: ["Probabilité conditionnelle", "Variable aléatoire"] },
    ],
  },
  {
    title: "Nombres complexes",
    short: "Forme algébrique, trigonométrique et applications géométriques.",
    level: Level.BAC_2, track: Track.SM, kind: CourseKind.COURS, premium: true,
    chapters: [
      { title: "Forme algébrique", lessons: ["Définition & opérations", "Conjugué & module"] },
      { title: "Forme trigonométrique", lessons: ["Argument", "Formule de Moivre"] },
    ],
  },
  {
    title: "Géométrie dans l'espace",
    short: "Vecteurs, droites, plans et produit scalaire dans l'espace.",
    level: Level.BAC_2, track: Track.SM, kind: CourseKind.COURS, premium: true,
    chapters: [
      { title: "Repérage", lessons: ["Coordonnées dans l'espace", "Vecteurs"] },
      { title: "Produit scalaire", lessons: ["Définition", "Équations de plans"] },
    ],
  },

  // ----- Préparation concours, par leçons de maths (offre « Concours ») -----
  {
    title: "Fonctions",
    short: "Études complètes de fonctions pour les concours.",
    level: Level.CONCOURS, track: null, kind: CourseKind.CONCOURS, premium: true,
    chapters: [
      { title: "Généralités", lessons: ["Domaine & parité", "Variations & extremums"] },
      { title: "Études poussées", lessons: ["Asymptotes & branches", "Tracé de courbes"] },
    ],
  },
  {
    title: "Limites",
    short: "Calcul de limites et formes indéterminées niveau concours.",
    level: Level.CONCOURS, track: null, kind: CourseKind.CONCOURS, premium: true,
    chapters: [
      { title: "Techniques", lessons: ["Formes indéterminées", "Limites usuelles avancées"] },
      { title: "Continuité", lessons: ["Théorèmes clés", "Prolongement par continuité"] },
    ],
  },
  {
    title: "Suites",
    short: "Convergence, récurrence et suites adjacentes pour les concours.",
    level: Level.CONCOURS, track: null, kind: CourseKind.CONCOURS, premium: true,
    chapters: [
      { title: "Convergence", lessons: ["Théorèmes de convergence", "Suites adjacentes"] },
      { title: "Récurrence", lessons: ["Raisonnement par récurrence", "Suites définies par récurrence"] },
    ],
  },
  {
    title: "Sommes",
    short: "Sommes télescopiques, sommes de Riemann et séries.",
    level: Level.CONCOURS, track: null, kind: CourseKind.CONCOURS, premium: true,
    chapters: [
      { title: "Sommes finies", lessons: ["Sommes télescopiques", "Sommes usuelles"] },
      { title: "Vers les séries", lessons: ["Sommes de Riemann", "Introduction aux séries"] },
    ],
  },
  {
    title: "Arctan",
    short: "Fonctions réciproques et arctan : maîtrise concours.",
    level: Level.CONCOURS, track: null, kind: CourseKind.CONCOURS, premium: true,
    chapters: [
      { title: "Fonctions réciproques", lessons: ["Définition & propriétés", "Dérivée de arctan"] },
      { title: "Applications", lessons: ["Équations avec arctan", "Calculs de limites & intégrales"] },
    ],
  },
];

const SAMPLE_QUESTIONS = [
  {
    statement: "Quelle est la limite de (sin x)/x quand x tend vers 0 ?",
    optionA: "0", optionB: "1", optionC: "+∞", optionD: "n'existe pas", optionE: "−1",
    correctAnswer: "B",
    explanation: "C'est une limite usuelle de référence : lim (sin x)/x = 1 en 0.",
    tip: "Pense au développement limité sin x ≈ x au voisinage de 0.",
    difficulty: "FACILE" as const,
  },
  {
    statement: "La dérivée de f(x) = x³ est :",
    optionA: "3x²", optionB: "x²", optionC: "3x", optionD: "x⁴/4", optionE: "2x³",
    correctAnswer: "A",
    explanation: "(xⁿ)' = n·xⁿ⁻¹, donc (x³)' = 3x².",
    tip: "Multiplie par l'exposant puis baisse l'exposant de 1.",
    difficulty: "FACILE" as const,
  },
  {
    statement: "Une suite (uₙ) géométrique de raison q converge si et seulement si :",
    optionA: "q > 1", optionB: "q = 1", optionC: "−1 < q ≤ 1", optionD: "q < −1", optionE: "q = 2",
    correctAnswer: "C",
    explanation: "Elle converge pour −1 < q < 1 (vers 0) et pour q = 1 (constante).",
    tip: "Le cas |q| < 1 fait tendre qⁿ vers 0.",
    difficulty: "MOYEN" as const,
  },
];

async function main() {
  console.log("🌱 Nettoyage…");
  // Ordre de suppression respectant les contraintes.
  await prisma.quizAnswer.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.note.deleteMany();
  await prisma.lessonProgress.deleteMany();
  await prisma.courseProgress.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.course.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  console.log("👤 Utilisateurs…");
  const admin = await prisma.user.create({
    data: {
      name: "Admin Prép-Maths48",
      email: "admin@prepmaths48.com",
      passwordHash,
      role: "ADMIN",
    },
  });

  const student = await prisma.user.create({
    data: {
      name: "Yassine El Idrissi",
      email: "student@prepmaths48.com",
      passwordHash,
      role: "STUDENT",
      level: Level.BAC_2,
      track: Track.SM,
      city: "Casablanca",
      school: "Lycée Al Khawarizmi",
    },
  });

  // Abonnements ACTIFS pour la démo : accès complet Cours + Concours
  // (révoquer dans /admin/payments pour tester les états verrouillés).
  const oneYear = new Date(Date.now() + 365 * 24 * 3600 * 1000);
  for (const [plan, amount, ref] of [
    ["COURS", 19900, "DEMO-COURS"],
    ["CONCOURS", 49900, "DEMO-CONCOURS"],
  ] as const) {
    await prisma.subscription.create({
      data: {
        userId: student.id,
        plan,
        status: "ACTIVE",
        paymentProvider: "manual",
        startDate: new Date(),
        endDate: oneYear,
      },
    });
    await prisma.payment.create({
      data: {
        userId: student.id,
        amount,
        currency: "MAD",
        status: "PAID",
        provider: "manual",
        plan,
        providerRef: ref,
      },
    });
  }

  console.log("📚 Cours…");
  let courseOrder = 0;
  let videoIdx = 0;
  const firstLessonIds: string[] = [];

  for (const spec of COURSES) {
    const course = await prisma.course.create({
      data: {
        title: spec.title,
        slug: slugify(spec.title),
        description: `${spec.short}\n\nCe cours suit la méthode Prép-Maths48 : théorie claire, exemples guidés, exercices types et quiz de validation. Idéal pour les élèves de ${LEVEL_LABELS[spec.level]}.`,
        shortDescription: spec.short,
        level: spec.level,
        track: spec.track,
        kind: spec.kind,
        isPremium: spec.premium,
        isPublished: true,
        order: courseOrder++,
        thumbnailUrl: null,
      },
    });

    // Ressource PDF au niveau cours
    await prisma.resource.create({
      data: {
        courseId: course.id,
        title: `Fiche de synthèse — ${spec.title}`,
        fileUrl: "/demo/fiche-synthese.pdf",
        fileType: "PDF",
        allowDownload: !spec.premium,
        isPublished: true,
      },
    });

    let chapterOrder = 0;
    let courseFirstLesson = "";
    let isFirstLessonOfCourse = true;

    for (const ch of spec.chapters) {
      const chapter = await prisma.chapter.create({
        data: {
          courseId: course.id,
          title: ch.title,
          description: `Chapitre : ${ch.title}.`,
          order: chapterOrder++,
          isPublished: true,
        },
      });

      let lessonOrder = 0;
      for (const lessonTitle of ch.lessons) {
        const lesson = await prisma.lesson.create({
          data: {
            chapterId: chapter.id,
            title: lessonTitle,
            description: `Séance vidéo : ${lessonTitle}. Objectifs, démonstration et exercices d'application.`,
            videoUrl: DEMO_VIDEOS[videoIdx++ % DEMO_VIDEOS.length],
            videoProvider: "LOCAL",
            duration: 600 + Math.floor(Math.random() * 1200),
            order: lessonOrder++,
            // Offre Gratuit : 1ʳᵉ séance gratuite uniquement pour le programme 2è bac (Cours).
            isFreePreview: isFirstLessonOfCourse && spec.kind === CourseKind.COURS,
            isPublished: true,
          },
        });
        if (isFirstLessonOfCourse) {
          courseFirstLesson = lesson.id;
          isFirstLessonOfCourse = false;
        }

        // Ressource PDF liée à la séance
        await prisma.resource.create({
          data: {
            lessonId: lesson.id,
            courseId: course.id,
            title: `Exercices — ${lessonTitle}`,
            fileUrl: "/demo/exercices.pdf",
            fileType: "PDF",
            allowDownload: false,
            isPublished: true,
          },
        });
      }
    }
    if (courseFirstLesson) firstLessonIds.push(courseFirstLesson);

    // Quiz du cours
    const quiz = await prisma.quiz.create({
      data: {
        courseId: course.id,
        title: `Quiz — ${spec.title}`,
        description: `Teste tes acquis sur ${spec.title}.`,
        isPublished: true,
      },
    });
    let qOrder = 0;
    for (const q of SAMPLE_QUESTIONS) {
      await prisma.question.create({
        data: { quizId: quiz.id, ...q, order: qOrder++ },
      });
    }
  }

  // Un peu de progression de démo pour l'élève sur le 1er cours
  console.log("📈 Progression de démo…");
  const firstCourse = await prisma.course.findFirst({ orderBy: { order: "asc" } });
  if (firstCourse) {
    const lessons = await prisma.lesson.findMany({
      where: { chapter: { courseId: firstCourse.id } },
      orderBy: { order: "asc" },
    });
    if (lessons[0]) {
      await prisma.lessonProgress.create({
        data: {
          userId: student.id,
          lessonId: lessons[0].id,
          isCompleted: true,
          watchedSeconds: lessons[0].duration,
          completedAt: new Date(),
        },
      });
      await prisma.courseProgress.create({
        data: {
          userId: student.id,
          courseId: firstCourse.id,
          totalLessons: lessons.length,
          completedLessons: 1,
          progressPercent: Math.round((1 / lessons.length) * 100),
        },
      });
    }
  }

  console.log("✅ Seed terminé.");
  console.log("   Admin   : admin@prepmaths48.com / password123");
  console.log("   Élève   : student@prepmaths48.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
