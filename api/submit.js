export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      ok: false,
      error: 'Método não permitido'
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
        error: 'Dados incompletos'
      });
    }

    const totalScore = answers.reduce((sum, v) => sum + Number(v || 0), 0);

    let levelKey = '';
    let descriptionHtml = '';

    if (totalScore <= 20) {
      levelKey = 'Cultura Reativa';
      descriptionHtml =
        '<p>A cultura hoje reage aos problemas, não antecipa resultados.</p>';
    } else if (totalScore <= 30) {
      levelKey = 'Cultura Operacional';
      descriptionHtml =
        '<p>Existe organização, mas ainda há dependência excessiva do dono.</p>';
    } else if (totalScore <= 40) {
      levelKey = 'Cultura Estruturada';
      descriptionHtml =
        '<p>A cultura sustenta resultados e dá previsibilidade ao negócio.</p>';
    } else {
      levelKey = 'Cultura Estratégica';
      descriptionHtml =
        '<p>A cultura impulsiona crescimento, lucro e escala.</p>';
    }

    return res.status(200).json({
      ok: true,
      result: {
        totalScore,
        levelKey,
        descriptionHtml
      }
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: 'Erro interno no servidor'
    });
  }
}
