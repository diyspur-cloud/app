'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { submitChapterQuiz } from '@/features/chapters/actions';

type Question = { id: string; question: string; options: unknown; position: number };
type Answer = { question_id: string; chosen_idx: number };

export function QuizPanel({ chapterId, questions, signedIn }: { chapterId: string; questions: Question[]; signedIn: boolean }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ score: number; total: number; duplicate: boolean } | null>(null);
  const [message, setMessage] = useState('');
  const [requestKey, setRequestKey] = useState<{ fingerprint: string; id: string } | null>(null);
  const [busy, startTransition] = useTransition();

  function submit() {
    setMessage('');
    const payload: Answer[] = Object.entries(answers).map(([question_id, chosen_idx]) => ({ question_id, chosen_idx }));
    const fingerprint = JSON.stringify({ chapterId, answers: payload });
    const requestId = requestKey?.fingerprint === fingerprint ? requestKey.id : crypto.randomUUID();
    setRequestKey({ fingerprint, id: requestId });
    startTransition(async () => {
      const outcome = await submitChapterQuiz({ chapterId, answers: payload, requestId });
      if (!outcome.ok) { setMessage(outcome.message); return; }
      setResult({ score: outcome.score, total: outcome.total, duplicate: outcome.duplicate });
      setMessage('');
    });
  }

  function retry() {
    setResult(null);
    setMessage('');
    setRequestKey(null);
    setAnswers({});
  }

  return <section className="quiz-panel" aria-labelledby="quiz-heading">
    <span className="eyebrow">Confira sua leitura</span><h2 id="quiz-heading">Quiz do capítulo</h2>
    {!signedIn ? <div className="empty-state"><p>Entre para responder. As respostas corretas não são enviadas ao navegador.</p><Link className="button button-small" href={`/entrar?redirect=${encodeURIComponent(`/capitulos/${chapterId}`)}`}>Entrar para responder</Link></div> : !questions.length ? <p className="muted-copy">Ainda não há perguntas publicadas para este capítulo.</p> : <>
      <ol className="quiz-questions">{questions.map((question, index) => {
        const options = Array.isArray(question.options) ? question.options : [];
        return <li key={question.id} className="quiz-question"><fieldset><legend><span className="eyebrow">Pergunta {index + 1}</span><strong>{question.question}</strong></legend><div className="quiz-options">{options.map((option, optionIndex) => <label className="quiz-option" key={`${question.id}-${optionIndex}`}><input type="radio" name={question.id} value={optionIndex} checked={answers[question.id] === optionIndex} disabled={Boolean(result)} onChange={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))} /><span>{String(option)}</span></label>)}</div></fieldset></li>;
      })}</ol>
      {result ? <div className="quiz-result" role="status"><strong>Resultado: {result.score} de {result.total}</strong><p>{result.duplicate ? 'Esta tentativa já havia sido registrada; o resultado foi recuperado com segurança.' : 'Sua tentativa foi validada pelo servidor.'}</p><button className="button button-quiet button-small" type="button" onClick={retry}>Tentar novamente</button></div> : <button className="button button-small" type="button" onClick={submit} disabled={busy || !questions.length}>{busy ? 'Validando…' : 'Enviar respostas'}</button>}
      <p className="field-hint">Perguntas sem resposta são consideradas incorretas; o servidor valida o resultado e controla tentativas/retries.</p>
    </>}
    {message && <p className="action-feedback" role="alert">{message}</p>}
  </section>;
}
