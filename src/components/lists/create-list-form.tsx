'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { createReadingList } from '@/features/lists/actions';

export function CreateListForm() {
  const [feedback, setFeedback] = useState('');
  const [busy, startTransition] = useTransition();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    startTransition(async () => {
      const result = await createReadingList({ title: values.get('title'), description: values.get('description') });
      setFeedback(result.message);
      if (result.ok) form.reset();
    });
  }
  return <form className="member-card list-create-form" onSubmit={submit}><div className="section-head" style={{ marginBottom: 14 }}><div><span className="eyebrow">Organização</span><h2>Criar uma lista</h2></div></div><div className="field-group"><label htmlFor="list-title">Nome da lista</label><input id="list-title" className="field" name="title" maxLength={80} placeholder="Para ler no próximo ciclo" required /></div><div className="field-group"><label htmlFor="list-description">Descrição <span className="field-hint">(opcional)</span></label><textarea id="list-description" className="field" name="description" maxLength={500} rows={2} placeholder="Por que esta lista existe?" /></div><button className="button button-small" type="submit" disabled={busy}>{busy ? 'Criando…' : 'Criar lista privada'}</button>{feedback && <p className="action-feedback" role="status">{feedback}</p>}</form>;
}
