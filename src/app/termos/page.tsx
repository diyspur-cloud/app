import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termos de uso',
  description: 'Termos de uso, convivência e transparência do DIYSPUR.',
};

export default function TermsPage() {
  return (
    <article className="container legal-copy">
      <header className="page-intro">
        <span className="eyebrow">Combinados do clube</span>
        <h1>
          Boas histórias,<br />
          <em>boas conversas.</em>
        </h1>
        <p>Termos de uso, diretrizes de convivência e transparência do DIYSPUR.</p>
      </header>

      <h2>1. Convivência e comunidade sem spoilers</h2>
      <p>
        O DIYSPUR é um espaço coletivo para leitores. Exigimos respeito mútuo, sem tolerância a assédio,
        discurso de ódio, discriminação ou exposição indevida de dados pessoais. Para preservar a experiência de
        todos os participantes, comentários contendo revelações de enredo devem obrigatoriamente utilizar a marcação de spoiler.
      </p>

      <h2>2. Segurança da conta</h2>
      <p>
        Você é responsável pela guarda de suas credenciais de autenticação e por todas as atividades realizadas em sua conta.
        Nunca compartilhe suas senhas de acesso. Caso suspeite de qualquer violação de segurança, comunique nossa equipe imediatamente.
      </p>

      <h2>3. Conteúdo e propriedade intelectual</h2>
      <p>
        Os direitos sobre os livros, capas, sinopses, metadados editoriais e vídeos incorporados permanecem integralmente com
        seus respectivos autores, editoras e titulares de direitos. O DIYSPUR utiliza imagens e dados sob o escopo de identificação
        bibliográfica, crítica e promoção da leitura coletiva (Lei nº 9.610/1998). Comentários, notas e reflexões são de responsabilidade
        de seus respectivos autores.
      </p>

      <h2>4. Links de afiliados e sustentabilidade</h2>
      <p>
        Para manter o clube aberto, gratuito e sem mensalidades obrigatórias, o DIYSPUR participa do Programa de Associados da Amazon.
        Ao clicar em nossos links e adquirir livros ou produtos qualificados, podemos receber uma comissão pela recomendação.
        Esse valor não altera o preço final do produto para você e ajuda a financiar a infraestrutura e a curadoria do clube.
      </p>

      <h2>5. Disponibilidade e evolução contínua</h2>
      <p>
        O serviço continua em evolução ativa. Recursos, cronogramas de temporadas e ferramentas podem ser aprimorados,
        ajustados ou descontinuados para garantir a melhor experiência para a comunidade de leitores.
      </p>

      <h2>6. Contato</h2>
      <p>
        Para dúvidas sobre os termos de uso ou reportar condutas inadequadas, entre em contato pelo email <code>oi@diyspur.com</code>.
      </p>
    </article>
  );
}
