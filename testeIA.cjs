const axios = require('axios');

async function testarIA() {
  try {
    const resposta = await axios.post('http://localhost:5001/analisar', {
      texto: "Olá IA, faça uma análise deste texto de teste."
    });

    console.log("Resposta da IA:", resposta.data);
  } catch (erro) {
    console.error("Erro ao chamar a IA:", erro.message);
  }
}

testarIA();
