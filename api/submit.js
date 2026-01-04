export const config = {
  runtime: "nodejs"
};

const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Método não permitido"
    });
  }

  try {
    const {
      companyName,
      respondentName,
      email,
      companySize,
      role,
      answers
    } = req.body || {};

    if (
      !companyName ||
      !respondentName ||
      !email ||
      !companySize ||
      !role ||
      !Array.isArray(answers)
    ) {
      return res.status(400).json({
        ok: false,
        error: "Dados incompletos"
      });
    }

    const totalScore = answers.reduce((sum, val) => sum + Number(val), 0);

    const levels = [
      {
        min: 10,
        max: 17,
        key: "Cultura de Emergência Crítica",
        description: `
        <p><strong>A cultura da sua empresa opera em modo de sobrevivência.</strong></p>
        <p>As decisões são reativas e focadas em manter a operação funcionando.</p>
        <p>Não existe base estável para crescimento.</p>
        <p>A cultura consome energia ao invés de gerar força estratégica.</p>
        `
      },
      {
        min: 18,
        max: 25,
        key: "Cultura da Instabilidade Crônica",
        description: `
        <p><strong>A empresa opera em ciclos de altos e baixos.</strong></p>
        <p>Os resultados aparecem, mas não se sustentam.</p>
        <p>Não há previsibilidade nem consistência.</p>
        `
      },
      {
        min: 26,
        max: 33,
        key: "Cultura de Fortalecimento Estrutural",
        description: `
        <p><strong>A empresa está fortalecendo sua base cultural.</strong></p>
        <p>Já existem padrões e processos.</p>
        <p>Ainda depende de cobrança para funcionar.</p>
        `
      },
      {
        min: 34,
        max: 41,
        key: "Cultura de Estabilidade Orgânica",
        description: `
        <p><strong>A cultura já está incorporada à rotina.</strong></p>
        <p>Execução com autonomia e previsibilidade.</p>
        `
      },
      {
        min: 42,
        max: 50,
        key: "Cultura de Expansão e Escalabilidade",
        description: `
        <p><strong>A cultura é um motor de crescimento.</strong></p>
        <p>Alta performance, atração de talentos e escala.</p>
        `
      }
    ];

    const level =
      levels.find(l => totalScore >= l.min && totalScore <= l.max) ||
      {
        key: "Resultado indefinido",
        description: "<p>Não foi possível classificar o resultado.</p>"
      };

    const emailHtml = `
      <h2>Resultado do Índice de Maturidade Cultural</h2>
      <p><strong>Empresa:</strong> ${companyName}</p>
      <p><strong>Respondente:</strong> ${respondentName}</p>
      <p><strong>Pontuação:</strong> ${totalScore} de 50 pontos</p>
      <p><strong>Nível:</strong> ${level.key}</p>
      <hr />
      ${level.description}
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
    console.error("Erro no submit:", error);
    return res.status(500).json({
      ok: false,
      error: "Erro interno no servidor"
    });
  }
};
