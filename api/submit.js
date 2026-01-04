import { Resend } from "resend";

const resend = new Resend("re_a2ziy8Xq_AhtnJ3ZigyaD5xMFJFbVsTLM");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Método não permitido" });
  }

  try {
    const {
      companyName,
      respondentName,
      email,
      companySize,
      role,
      answers
    } = req.body;

    if (
      !companyName ||
      !respondentName ||
      !email ||
      !companySize ||
      !role ||
      !Array.isArray(answers)
    ) {
      return res.status(400).json({ ok: false, error: "Dados incompletos" });
    }

    const totalScore = answers.reduce((sum, val) => sum + Number(val), 0);

    const levels = [
      {
        min: 10,
        max: 17,
        key: "Cultura de Emergência Crítica",
        description: `
          <p>A cultura da sua empresa opera em modo de sobrevivência.</p>
          <p>As decisões são reativas e focadas em manter a operação funcionando.</p>
          <p>Não existe base estável para crescimento e qualquer instabilidade pode comprometer o negócio.</p>
          <p>A cultura consome energia ao invés de gerar força estratégica.</p>
        `
      },
      {
        min: 18,
        max: 25,
        key: "Cultura da Instabilidade Crônica",
        description: `
          <p>A empresa opera em ciclos de altos e baixos.</p>
          <p>Os resultados aparecem, mas não se sustentam.</p>
          <p>A cultura ainda não cria estabilidade, fazendo com que o desempenho dependa de esforço individual e controle constante.</p>
        `
      },
      {
        min: 26,
        max: 33,
        key: "Cultura de Fortalecimento Estrutural",
        description: `
          <p>A empresa está fortalecendo sua base cultural.</p>
          <p>Já existem padrões e processos, trazendo mais estabilidade.</p>
          <p>A cultura ainda depende de cobrança para funcionar.</p>
          <p>É um estágio de transição rumo à consistência.</p>
        `
      },
      {
        min: 34,
        max: 41,
        key: "Cultura de Estabilidade Orgânica",
        description: `
          <p>A cultura já está incorporada à rotina da empresa.</p>
          <p>O time executa com autonomia e consistência.</p>
          <p>O crescimento acontece de forma previsível.</p>
          <p>O dono atua como direcionador estratégico.</p>
        `
      },
      {
        min: 42,
        max: 50,
        key: "Cultura de Expansão e Escalabilidade",
        description: `
          <p>A cultura é um motor de crescimento.</p>
          <p>Sustenta alta performance, atrai os talentos certos e garante resultados previsíveis.</p>
          <p>A empresa está pronta para escalar com vantagem competitiva.</p>
        `
      }
    ];

    const level = levels.find(
      l => totalScore >= l.min && totalScore <= l.max
    );

    const emailHtml = `
      <h2>Resultado do Índice de Maturidade Cultural</h2>
      <p><strong>Empresa:</strong> ${companyName}</p>
      <p><strong>Pontuação:</strong> ${totalScore} de 50 pontos</p>
      <p><strong>Nível:</strong> ${level.key}</p>
      <hr />
      ${level.description}
      <br />
      <p>Quer um diagnóstico completo e direcionado para sua empresa?</p>
      <p>
        <a href="https://api.whatsapp.com/send/?phone=5511976743472&text=Quero%20meu%20diagn%C3%B3stico%20completo">
          Falar com um especialista
        </a>
      </p>
    `;

    await resend.emails.send({
      from: "Índice Cultural <consultoria@aculturadonnegocio.com.br>",
      to: email,
      subject: "Seu resultado do Índice de Maturidade Cultural",
      html: emailHtml
    });

    return res.status(200).json({
      ok: true,
      result: {
        totalScore,
        levelKey: level.key,
        descriptionHtml: level.description
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: "Erro interno" });
  }
}
