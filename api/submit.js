module.exports = async function handler(req, res) {
  // Sempre responder JSON
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  // CORS (se precisar futuramente, já está ok)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Método não permitido" });
  }

  try {
    // Garantir que req.body existe e é objeto
    const body = req.body && typeof req.body === "object" ? req.body : null;

    if (!body) {
      return res.status(400).json({ ok: false, error: "Body inválido (JSON não recebido)" });
    }

    const {
      companyName,
      respondentName,
      email,
      companySize,
      role,
      answers
    } = body;

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

    const totalScore = answers.reduce((sum, val) => sum + Number(val || 0), 0);

    const levels = [
      {
        min: 10,
        max: 17,
        key: "Cultura de Emergência Crítica",
        descriptionText:
          "A cultura da sua empresa opera em modo de sobrevivência. As decisões são reativas e focadas em manter a operação funcionando. Não existe base estável para crescimento e qualquer instabilidade pode comprometer o negócio. A cultura consome energia ao invés de gerar força estratégica.",
      },
      {
        min: 18,
        max: 25,
        key: "Cultura da Instabilidade Crônica",
        descriptionText:
          "A empresa opera em ciclos de altos e baixos. Os resultados aparecem, mas não se sustentam. A cultura ainda não cria estabilidade, fazendo com que o desempenho dependa de esforço individual e controle constante, sem previsibilidade.",
      },
      {
        min: 26,
        max: 33,
        key: "Cultura de Fortalecimento Estrutural",
        descriptionText:
          "A empresa está fortalecendo sua base cultural. Já existem padrões e processos, o que traz mais estabilidade, mas a cultura ainda depende de cobrança para funcionar. O time começa a se alinhar, mas ainda não atua com autonomia. É um estágio de transição rumo à consistência.",
      },
      {
        min: 34,
        max: 41,
        key: "Cultura de Estabilidade Orgânica",
        descriptionText:
          "A cultura já está incorporada à rotina da empresa. O time executa com autonomia e consistência, e o crescimento acontece de forma previsível. O dono atua como direcionador estratégico e a cultura já sustenta o negócio com estabilidade.",
      },
      {
        min: 42,
        max: 50,
        key: "Cultura de Expansão e Escalabilidade",
        descriptionText:
          "A cultura é um motor de crescimento. Ela sustenta alta performance, atrai talentos certos e garante resultados previsíveis e escaláveis. A empresa está pronta para dominar mercado com consistência e vantagem competitiva.",
      },
    ];

    const level = levels.find((l) => totalScore >= l.min && totalScore <= l.max);

    if (!level) {
      return res.status(400).json({
        ok: false,
        error: "Pontuação fora do intervalo esperado (10 a 50).",
        totalScore
      });
    }

    const descriptionHtml = `
      <p>${level.descriptionText}</p>
    `;

    // Envio de e-mail via API REST do Resend (sem dependência de biblioteca)
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        ok: false,
        error: "RESEND_API_KEY não configurada no Vercel."
      });
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Resultado do Índice de Maturidade Cultural</h2>
        <p><strong>Empresa:</strong> ${companyName}</p>
        <p><strong>Respondente:</strong> ${respondentName}</p>
        <p><strong>Cargo:</strong> ${role}</p>
        <p><strong>Tamanho da empresa:</strong> ${companySize}</p>
        <p><strong>Pontuação:</strong> ${totalScore} de 50 pontos</p>
        <p><strong>Nível:</strong> ${level.key}</p>
        <hr />
        ${descriptionHtml}
      </div>
    `;

    // IMPORTANTE:
    // Se seu domínio ainda não estiver verificado no Resend,
    // troque o "from" temporariamente para onboarding@resend.dev para testar.
    const fromAddress = "Índice Cultural <consultoria@aculturadonnegocio.com.br>";

    const sendResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [email],
        subject: "Seu resultado do Índice de Maturidade Cultural",
        html: emailHtml
      })
    });

    const sendText = await sendResp.text();

    // Se der erro, devolve JSON com o retorno do Resend (pra gente enxergar)
    if (!sendResp.ok) {
      return res.status(502).json({
        ok: false,
        error: "Falha ao enviar e-mail via Resend",
        resendStatus: sendResp.status,
        resendResponse: sendText
      });
    }

    // Se o Resend respondeu OK, tenta parsear
    let resendJson = null;
    try {
      resendJson = JSON.parse(sendText);
    } catch (e) {
      // ok, não bloqueia
    }

    return res.status(200).json({
      ok: true,
      result: {
        totalScore,
        levelKey: level.key,
        descriptionText: level.descriptionText,
        descriptionHtml
      },
      resend: resendJson || { raw: sendText }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      error: "Erro interno no servidor",
      details: String(error && error.message ? error.message : error)
    });
  }
};
