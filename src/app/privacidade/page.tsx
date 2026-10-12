import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacidade e Proteção de Dados',
  description: 'Conheça nossa política de privacidade, cookies essenciais e controle de telemetria.',
};

export default function PrivacyPage() {
  return (
    <article className="container legal-copy">
      <header className="page-intro">
        <span className="eyebrow">Transparência e LGPD</span>
        <h1>Sua leitura é sua.</h1>
        <p>Política de privacidade e proteção de dados do clube DIYSPUR.</p>
      </header>

      <h2>1. Dados e propósito</h2>
      <p>
        Coletamos apenas os dados necessários para criar e autenticar sua conta, exibir seu perfil
        de acordo com as suas preferências, registrar o progresso de leitura e permitir a interação
        nos clubes e temporadas. Toda a persistência técnica é gerenciada no Supabase, com regras de
        segurança em nível de linha (RLS) habilitadas em todas as tabelas contendo dados de usuários.
      </p>

      <h2>2. Cookies essenciais e sessão</h2>
      <p>
        Utilizamos cookies técnicos estritamente necessários para manter e renovar sua sessão autenticada.
        A navegação nas áreas públicas do catálogo e das temporadas não exige a criação de conta nem
        o uso de cookies de rastreamento.
      </p>

      <h2>3. Telemetria e Analytics opcional</h2>
      <p>
        Para entender padrões de navegação e melhorar a estabilidade da plataforma, utilizamos métricas técnicas
        (Sentry para diagnóstico de falhas sem coleta de dados pessoais) e telemetria agregada de produto (PostHog).
      </p>
      <p>
        <strong>O analytics de produto só é ativado se você conceder consentimento explícito.</strong>
        {' '}A qualquer momento você pode alterar ou revogar sua escolha clicando no botão{' '}
        <em>Preferências de privacidade</em> presente no rodapé de todas as páginas.
        A recusa ou revogação não impede nem limita o uso das funcionalidades do clube.
      </p>

      <h2>4. Seus direitos sob a LGPD</h2>
      <p>
        Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você pode solicitar a
        confirmação da existência de tratamento, o acesso aos seus dados, a correção de dados incompletos ou
        a exclusão de sua conta a qualquer momento pelo suporte do clube.
      </p>

      <h2>5. Contato</h2>
      <p>
        Para dúvidas sobre privacidade ou exercer seus direitos de titular de dados, entre em contato pelo
        email <code>suporte@diyspur.com</code>.
      </p>
    </article>
  );
}
