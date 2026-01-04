document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("culture-form");
  const btn = document.getElementById("submitBtn");

  if (!form) {
    console.error("Form #culture-form não encontrado.");
    return;
  }

  const setLoading = (isLoading) => {
    if (!btn) return;
    btn.disabled = isLoading;
    btn.textContent = isLoading ? "Calculando..." : "VER MEU RESULTADO";
  };

  const getAnswers = () => {
    // Pega todos os selects que representam as respostas
    // Ajuste se seus selects tiverem outra classe/atributo
    const selects = form.querySelectorAll("select[data-score], select.imc-answer, select[name^='q']");
    const values = [];

    // Se você não tiver esses seletores acima, ele vai pegar todos os selects do form
    const fallback = form.querySelectorAll("select");
    const list = selects.length ? selects : fallback;

    list.forEach((sel) => {
      const v = sel.value;
      if (v !== "" && v !== null && v !== undefined) values.push(Number(v));
    });

    return values;
  };

  const safeJsonParse = (text) => {
    try {
      return { ok: true, json: JSON.parse(text) };
    } catch (e) {
      return { ok: false, error: e, text };
    }
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Ajuste estes IDs se os seus inputs tiverem nomes diferentes
      const companyName = (document.getElementById("companyName")?.value || "").trim();
      const respondentName = (document.getElementById("respondentName")?.value || "").trim();
      const email = (document.getElementById("email")?.value || "").trim();
      const companySize = (document.getElementById("companySize")?.value || "").trim();
      const role = (document.getElementById("role")?.value || "").trim();

      const answers = getAnswers();

      const payload = {
        companyName,
        respondentName,
        email,
        companySize,
        role,
        answers
      };

      const resp = await fetch("/api/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const text = await resp.text();
      const parsed = safeJsonParse(text);

      if (!parsed.ok) {
        // Aqui é exatamente onde estava quebrando antes.
        // Agora a gente mostra o retorno real do servidor, mesmo que seja HTML.
        alert(
          "Erro ao processar o resultado.\n\n" +
          "O servidor não retornou JSON.\n\n" +
          "Status: " + resp.status + "\n\n" +
          "Trecho do retorno:\n" +
          (text || "").slice(0, 400)
        );
        return;
      }

      const data = parsed.json;

      if (!resp.ok || !data.ok) {
        alert(
          "Erro ao processar o resultado.\n\n" +
          "Status: " + resp.status + "\n" +
          "Mensagem: " + (data.error || "Erro desconhecido")
        );
        return;
      }

      // Aqui você decide o que fazer com o resultado.
      // Se sua tela de resultado estiver em outra página, redirecione com querystring/localStorage.
      // Vou deixar o resultado salvo para a página de resultado ler.
      localStorage.setItem("imc_result", JSON.stringify(data));

      // Se você já tem uma página de resultado, ajuste o nome abaixo.
      // Se você usa modal/mesma página, me diga que eu adapto para renderizar aqui.
      window.location.href = "/resultado.html";

    } catch (err) {
      alert("Erro ao processar o resultado: " + (err?.message || err));
    } finally {
      setLoading(false);
    }
  });
});
