"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Lightbulb,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { DIFFICULTY_LABELS } from "@/types";
import { MathText } from "@/components/ui/math-text";

export type QuizQuestion = {
  id: string;
  statement: string;
  options: { key: string; text: string }[];
  difficulty: string;
};

type GradedResult = {
  questionId: string;
  selectedAnswer: string | null;
  isCorrect: boolean;
  correctAnswer: string | null;
  explanation: string | null;
  tip: string | null;
};

type SubmitResponse = {
  score: number;
  correct: number;
  total: number;
  results: GradedResult[];
};

export function QuizRunner({
  quizId,
  title,
  questions,
}: {
  quizId: string;
  title: string;
  questions: QuizQuestion[];
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResponse | null>(null);
  const startedAt = useMemo(() => Date.now(), []);

  const q = questions[current];
  const answeredCount = Object.keys(answers).length;

  function select(key: string) {
    setAnswers((prev) => ({ ...prev, [q.id]: key }));
  }

  async function submit() {
    if (answeredCount < questions.length) {
      const ok = confirm(
        `Il te reste ${questions.length - answeredCount} question(s) sans réponse. Soumettre quand même ?`
      );
      if (!ok) return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId,
          duration: Math.round((Date.now() - startedAt) / 1000),
          answers: questions.map((qq) => ({
            questionId: qq.id,
            selectedAnswer: answers[qq.id] ?? null,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setResult(data);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  }

  function restart() {
    setAnswers({});
    setCurrent(0);
    setResult(null);
  }

  // ---------- Écran de résultats ----------
  if (result) {
    const resById = new Map(result.results.map((r) => [r.questionId, r]));
    const passed = result.score >= 70;
    return (
      <div className="space-y-6">
        <div className="card flex flex-col items-center gap-3 p-8 text-center shadow-sm">
          <span
            className={`grid h-16 w-16 place-items-center rounded-full ${
              passed ? "bg-green/15 text-green" : "bg-accent-soft text-accent-2"
            }`}
          >
            <Trophy className="h-8 w-8" />
          </span>
          <div className="font-display text-[40px] font-bold">{result.score}%</div>
          <p className="text-[15px] text-muted">
            {result.correct} bonne(s) réponse(s) sur {result.total}.{" "}
            {passed ? "Bravo, c'est validé !" : "Continue, tu y es presque."}
          </p>
          <div className="mt-2 flex gap-2">
            <button onClick={restart} className="btn btn-ghost btn-sm">
              <RotateCcw className="h-4 w-4" /> Recommencer
            </button>
          </div>
        </div>

        <h3 className="font-display text-[18px] font-semibold">Correction</h3>
        <div className="space-y-4">
          {questions.map((qq, i) => {
            const r = resById.get(qq.id);
            return (
              <div key={qq.id} className="card p-5 shadow-sm">
                <div className="flex items-start gap-2">
                  <span className="mono mt-0.5 text-[12px] text-muted">Q{i + 1}</span>
                  <MathText as="p" className="flex-1 font-medium">
                    {qq.statement}
                  </MathText>
                  {r?.isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-green" />
                  ) : (
                    <XCircle className="h-5 w-5 shrink-0 text-[color:var(--red)]" />
                  )}
                </div>
                <div className="mt-3 space-y-1.5">
                  {qq.options.map((o) => {
                    const isCorrect = r?.correctAnswer === o.key;
                    const isChosen = r?.selectedAnswer === o.key;
                    return (
                      <div
                        key={o.key}
                        className={`flex items-center gap-2 rounded-md border px-3 py-2 text-[14px] ${
                          isCorrect
                            ? "border-green/40 bg-green/10"
                            : isChosen
                              ? "border-[color:var(--red)]/40 bg-red-50"
                              : "border-line"
                        }`}
                      >
                        <span className="mono font-bold">{o.key}</span>
                        <MathText as="span" className="flex-1">
                          {o.text}
                        </MathText>
                        {isCorrect && <span className="text-[11px] font-bold text-green">Bonne réponse</span>}
                      </div>
                    );
                  })}
                </div>
                {r?.explanation && (
                  <div className="mt-3 rounded-md bg-surface-2 p-3 text-[13.5px] text-ink-2">
                    <b>Explication :</b>{" "}
                    <MathText as="span">{r.explanation}</MathText>
                  </div>
                )}
                {r?.tip && (
                  <p className="mt-2 flex items-start gap-2 text-[13px] text-accent-2">
                    <Lightbulb className="h-4 w-4 shrink-0" />
                    <MathText as="span">{r.tip}</MathText>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ---------- Écran question ----------
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <span className="mono text-[12px] text-muted">
          Question {current + 1} / {questions.length}
        </span>
        <span className="badge badge-new" >{DIFFICULTY_LABELS[q.difficulty]}</span>
      </div>
      <div className="progress">
        <i style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
      </div>

      <div className="card p-6 shadow-sm">
        <h2 className="font-display text-[20px] font-semibold leading-snug">
          <MathText as="span">{q.statement}</MathText>
        </h2>
        <div className="mt-5 space-y-2.5">
          {q.options.map((o) => {
            const selected = answers[q.id] === o.key;
            return (
              <button
                key={o.key}
                onClick={() => select(o.key)}
                className={`flex w-full items-center gap-3 rounded-md border-[1.5px] px-4 py-3 text-left text-[15px] transition ${
                  selected
                    ? "border-accent bg-accent-soft"
                    : "border-line hover:border-line-2 hover:bg-surface-2"
                }`}
              >
                <span
                  className={`mono grid h-7 w-7 place-items-center rounded-md text-[13px] font-bold ${
                    selected ? "bg-accent text-accent-ink" : "bg-line-2 text-ink-2"
                  }`}
                >
                  {o.key}
                </span>
                <MathText as="span">{o.text}</MathText>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          className="btn btn-ghost btn-sm disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" /> Précédent
        </button>
        {current < questions.length - 1 ? (
          <button onClick={() => setCurrent((c) => c + 1)} className="btn btn-ghost btn-sm">
            Suivant <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={submit} disabled={submitting} className="btn btn-primary btn-sm">
            {submitting ? "Correction…" : "Terminer le quiz"}
          </button>
        )}
      </div>
    </div>
  );
}
