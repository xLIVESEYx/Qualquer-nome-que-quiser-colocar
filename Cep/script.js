const cepInput = document.getElementById("cep");
const ruaInput = document.getElementById("rua");
const bairroInput = document.getElementById("bairro");
const cidadeInput = document.getElementById("cidade");
const feedback = document.getElementById("Feedback");
const mapaCidade = document.getElementById("mapaCidade");
cepInput.addEventListener("blur", async () => {
    const cep = cepInput.value.replace("-", "").trim();
    if (cep.length !== 8) {

        feedback.textContent = "CEP inválido.";
        return;
    }
    try {
        const respostaCEP = await fetch(
            `https://viacep.com.br/ws/${cep}/json/`
        );

        const dadosCEP = await respostaCEP.json();
        // Verifica erro
        if (dadosCEP.erro) {
            feedback.textContent = "CEP não encontrado.";
            return;
        }
        // Preenche os campos
        ruaInput.value = dadosCEP.logradouro;
        bairroInput.value = dadosCEP.bairro;
        cidadeInput.value = dadosCEP.localidade;
        feedback.textContent = "Endereço encontrado!";
        const respostaMapa = await fetch(
            `https://nominatim.openstreetmap.org/search?city=${dadosCEP.localidade}&format=json`
        );
        const dadosMapa = await respostaMapa.json();
        // Latitude e longitude
        const latitude = Number(dadosMapa[0].lat);
        const longitude = Number(dadosMapa[0].lon);
        // URL do mapa
        const urlMapa =
        `https://www.openstreetmap.org/export/embed.html?bbox=${
            longitude - 0.05
        }%2C${
            latitude - 0.05
        }%2C${
            longitude + 0.05
        }%2C${
            latitude + 0.05
        }&layer=mapnik&marker=${latitude}%2C${longitude}`;
        // Exibe o mapa
        mapaCidade.src = urlMapa;
    }
    catch (erro) {
        feedback.textContent = "Erro ao buscar informações.";
    }
});

