"use client";

import {useState} from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

type Question = {
  id: string;
  text: string;
  options: Record<string, string>;
  correctAnswer: string;
  subject?: string;
  year?: number;
  hasPassage?: boolean;
  section?: string | null;
};

type QuizState = "idle" | "loading" | "ready" | "complete" | "error";

const optionLabels = ["A", "B", "C", "D"];

function normalizeContent(value: string) {
  return value
    .replace(/Ã—/g, "×")
    .replace(/Ã/g, "×")
    .replace(/Â/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\u00a0/g, " ");
}

function RichText({value}: {value: string}) {
  const parts = normalizeContent(value).split(
    /(<sup>.*?<\/sup>|<sub>.*?<\/sub>|<br\s*\/?\s*>)/gi,
  );

  return (
    <>
      {parts.map((part, index) => {
        const superscript = part.match(/^<sup>(.*?)<\/sup>$/i);
        const subscript = part.match(/^<sub>(.*?)<\/sub>$/i);

        if (superscript) return <sup key={index}>{superscript[1]}</sup>;
        if (subscript) return <sub key={index}>{subscript[1]}</sub>;
        if (/^<br\s*\/?\s*>$/i.test(part)) return <br key={index} />;
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

function MathExpression({value}: {value: string}) {
  const normalized = normalizeContent(value)
    .replace(/<sup>(.*?)<\/sup>/gi, "^{$1}")
    .replace(/<sub>(.*?)<\/sub>/gi, "_{$1}")
    .replace(/<[^>]+>/g, "")
    .trim();
  const fraction = normalized.match(/^([0-9().!]+)\s*\/\s*([0-9().!]+)$/);
  const latex = (
    fraction ? `\\frac{${fraction[1]}}{${fraction[2]}}` : normalized
  )
    .replace(/×/g, "\\times ")
    .replace(/÷/g, "\\div ");

  try {
    return (
      <span
        className="math-expression"
        dangerouslySetInnerHTML={{
          __html: katex.renderToString(latex, {throwOnError: false}),
        }}
      />
    );
  } catch {
    return <RichText value={value} />;
  }
}

export default function Home() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState<QuizState>("idle");
  const [error, setError] = useState("");

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const score = questions.reduce(
    (total, question, index) =>
      total + (answers[index] === question.correctAnswer ? 1 : 0),
    0,
  );

  async function loadQuestions() {
    setStatus("loading");
    setError("");
    setQuestions([]);
    setAnswers({});
    setCurrentIndex(0);

    try {
      const response = await fetch("/api/questions?limit=10");
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.message || "Unable to load questions.");
      }

      if (!Array.isArray(body.data) || body.data.length === 0) {
        throw new Error("No Mathematics questions were returned for 2023.");
      }

      setQuestions(body.data);
      setStatus("ready");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Something went wrong while loading questions.",
      );
      setStatus("error");
    }
  }

  function selectAnswer(option: string) {
    if (status !== "ready") return;
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [currentIndex]: option,
    }));
  }

  function finishQuiz() {
    setStatus("complete");
  }

  function restartReview() {
    setAnswers({});
    setCurrentIndex(0);
    setStatus("ready");
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            P
          </div>
          <div>
            <p className="brand-name">PQ Paddi</p>
            <p className="brand-caption">Content lab / JAMB</p>
          </div>
        </div>
        <span className="status-pill">
          <span className="status-dot" /> API tester
        </span>
      </header>

      <section className="intro">
        <p className="eyebrow">JAMB 2023 · Mathematics</p>
        <h1>
          Practice with the
          <br />
          <em>real questions.</em>
        </h1>
        <p className="intro-copy">
          A small, honest testing room for checking ALOC question quality before
          we build the full learning experience.
        </p>
      </section>

      {status === "idle" || status === "loading" || status === "error" ? (
        <section className="launch-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Your practice set</p>
              <h2>Mathematics · 2023</h2>
            </div>
            <span className="year-badge">JAMB</span>
          </div>
          <div className="set-details">
            <div>
              <span className="detail-label">Subject</span>
              <strong>Mathematics</strong>
            </div>
            <div>
              <span className="detail-label">Exam year</span>
              <strong>2023</strong>
            </div>
            <div>
              <span className="detail-label">Question set</span>
              <strong>Up to 10</strong>
            </div>
          </div>
          {error && (
            <div className="error-box" role="alert">
              {error}
            </div>
          )}
          <button
            className="primary-button"
            onClick={loadQuestions}
            disabled={status === "loading"}
          >
            {status === "loading"
              ? "Fetching questions..."
              : status === "error"
                ? "Try again"
                : "Load questions"}
            <span aria-hidden="true">→</span>
          </button>
          <p className="credit-note">
            Questions are fetched from ALOC Station on demand.
          </p>
        </section>
      ) : status === "complete" ? (
        <section className="result-panel">
          <p className="section-kicker">Set complete</p>
          <div className="score-row">
            <div>
              <span className="score-number">{score}</span>
              <span className="score-total"> / {questions.length}</span>
            </div>
            <div className="score-percent">
              {Math.round((score / questions.length) * 100)}%
            </div>
          </div>
          <p className="result-copy">
            Your answers have been checked locally against the answer keys
            returned by ALOC.
          </p>
          <div className="result-actions">
            <button className="primary-button" onClick={restartReview}>
              Review answers <span aria-hidden="true">→</span>
            </button>
            <button className="text-button" onClick={loadQuestions}>
              Load a fresh set
            </button>
          </div>
        </section>
      ) : currentQuestion ? (
        <section className="quiz-layout">
          <aside className="quiz-sidebar">
            <div className="sidebar-top">
              <span className="section-kicker">Practice set</span>
              <span className="progress-label">
                {currentIndex + 1} / {questions.length}
              </span>
            </div>
            <div className="progress-track">
              <span
                style={{
                  width: `${((currentIndex + 1) / questions.length) * 100}%`,
                }}
              />
            </div>
            <div className="question-grid">
              {questions.map((_, index) => (
                <button
                  key={index}
                  className={`question-number ${index === currentIndex ? "active" : ""} ${answers[index] ? "answered" : ""}`}
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`Question ${index + 1}`}
                >
                  {String(index + 1).padStart(2, "0")}
                </button>
              ))}
            </div>
            <div className="sidebar-footer">
              <span className="legend-dot answered-dot" /> Answered{" "}
              <span className="legend-dot" /> Unanswered
            </div>
          </aside>

          <div className="question-panel">
            <div className="question-meta">
              <span>Question {String(currentIndex + 1).padStart(2, "0")}</span>
              <span>{answeredCount} answered</span>
            </div>
            {currentQuestion.hasPassage && currentQuestion.section && (
              <div className="passage">
                <RichText value={currentQuestion.section} />
              </div>
            )}
            <h2 className="question-text">
              <RichText value={currentQuestion.text} />
            </h2>
            <div className="options-list">
              {optionLabels
                .filter((label) => currentQuestion.options[label] !== undefined)
                .map((label) => (
                  <button
                    key={label}
                    className={`option ${answers[currentIndex] === label ? "selected" : ""}`}
                    onClick={() => selectAnswer(label)}
                  >
                    <span className="option-key">{label}</span>
                    <span className="option-content">
                      <MathExpression value={currentQuestion.options[label]} />
                    </span>
                  </button>
                ))}
            </div>
            <div className="quiz-controls">
              <button
                className="secondary-button"
                onClick={() =>
                  setCurrentIndex((index) => Math.max(0, index - 1))
                }
                disabled={currentIndex === 0}
              >
                ← Previous
              </button>
              {currentIndex === questions.length - 1 ? (
                <button
                  className="primary-button compact"
                  onClick={finishQuiz}
                  disabled={!answers[currentIndex]}
                >
                  Finish set <span aria-hidden="true">→</span>
                </button>
              ) : (
                <button
                  className="primary-button compact"
                  onClick={() =>
                    setCurrentIndex((index) =>
                      Math.min(questions.length - 1, index + 1),
                    )
                  }
                  disabled={!answers[currentIndex]}
                >
                  Next question <span aria-hidden="true">→</span>
                </button>
              )}
            </div>
          </div>
        </section>
      ) : null}

      <footer className="footer">
        <span>Prototype 01</span>
        <span>ALOC content integration</span>
        <span>JAMB / NG</span>
      </footer>
    </main>
  );
}
