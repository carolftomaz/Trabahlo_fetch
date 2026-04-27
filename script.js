const API_URL = "https://backend-node-nmze.onrender.com/featured";

const produtosContainer = document.getElementById("produtos");
const loading = document.getElementById("loading");
const mensagem = document.getElementById("mensagem");
const buscaNome = document.getElementById("buscaNome");
const buscaPreco = document.getElementById("buscaPreco");

let produtosValidos = [];

const mockProdutos = [
    { name: "Notebook Gamer", price: 4500 },
    { name: "Mouse RGB", price: 200 },
    { name: "Headset 7.1", price: 99.90 },
    { name: "Cadeira Ergonômica", price: 1200 },
    { name: "Webcam Full HD", price: 350 },
    { name: "Microfone Condensador", price: 599 },
    { name: "SSD 1TB", price: 450 },
    { name: "Memória RAM 16GB", price: 380 },
    { name: "Placa de Vídeo", price: 2500.50 },
    { name: "Placa Mãe", price: 890 },
    { name: "Fonte 600W", price: 350 },
    { name: "Monitor Secundário", price: 700 },
    { name: "Mousepad XL", price: 80 },
    { name: "Cabo HDMI", price: 25 },
    { name: "Adaptador Wifi", price: 45 },
    { name: "Hub USB", price: 120 }
];

function mostrarLoading(status) {
    loading.style.display = status ? "block" : "none";
}

function mostrarMensagem(texto) {
    mensagem.textContent = texto;
}

function validarProduto(produto) {
    const nome = produto.name || produto.nome || produto.title;
    const preco = produto.price || produto.preco;

    if (!nome) return false;
    if (!preco) return false;
    if (isNaN(preco)) return false;
    if (Number(preco) <= 0) return false;

    return true;
}

function normalizarProduto(produto) {
    const nome = produto.name || produto.nome || produto.title;
    const preco = produto.price || produto.preco;

    return {
        name: nome,
        price: Number(preco),
        description: produto.description || produto.descricao || "Produto em destaque."
    };
}

function salvarCache(produtos) {
    localStorage.setItem("produtosDestaque", JSON.stringify({
        tempo: Date.now(),
        produtos: produtos
    }));
}

function buscarCache() {
    const cache = localStorage.getItem("produtosDestaque");

    if (!cache) return null;

    try {
        const dados = JSON.parse(cache);

        if (Date.now() - dados.tempo < 120000) {
            return dados.produtos;
        }

        localStorage.removeItem("produtosDestaque");
        return null;
    } catch {
        localStorage.removeItem("produtosDestaque");
        return null;
    }
}

function pegarLista(dados) {
    if (Array.isArray(dados)) return dados;
    if (Array.isArray(dados.items)) return dados.items;
    if (Array.isArray(dados.products)) return dados.products;
    if (Array.isArray(dados.produtos)) return dados.produtos;

    return [];
}

async function buscarAPI() {
    for (let tentativa = 1; tentativa <= 5; tentativa++) {
        try {
            const resposta = await fetch(API_URL);

            if (!resposta.ok) {
                throw new Error();
            }

            const dados = await resposta.json();
            const lista = pegarLista(dados);

            if (lista.length === 0) {
                throw new Error();
            }

            return lista;
        } catch {
            if (tentativa === 5) {
                mostrarMensagem("API indisponível. Produtos carregados do MOCK local.");
                return mockProdutos;
            }

            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
}

function exibirProdutos(lista) {
    produtosContainer.innerHTML = "";

    if (lista.length === 0) {
        mostrarMensagem("Nenhum produto encontrado.");
        return;
    }

    lista.forEach(produto => {
        produtosContainer.innerHTML += `
            <article class="card">
                <h2>${produto.name}</h2>
                <p>${produto.description}</p>
                <div class="preco">R$ ${produto.price.toFixed(2).replace(".", ",")}</div>
            </article>
        `;
    });
}

function filtrarProdutos() {
    const nome = buscaNome.value.toLowerCase().trim();
    const preco = parseFloat(buscaPreco.value);

    const filtrados = produtosValidos.filter(produto => {
        const filtroNome = produto.name.toLowerCase().includes(nome);

        const filtroPreco = isNaN(preco)
            ? true
            : produto.price === preco;

        return filtroNome && filtroPreco;
    });

    exibirProdutos(filtrados);
}

async function carregarProdutos() {
    mostrarLoading(true);
    mostrarMensagem("");

    const cache = buscarCache();

    if (cache) {
        produtosValidos = cache;
        exibirProdutos(produtosValidos);
        mostrarLoading(false);
        return;
    }

    const dados = await buscarAPI();

    produtosValidos = dados
        .filter(validarProduto)
        .map(normalizarProduto)
        .slice(0, 16);

    salvarCache(produtosValidos);
    exibirProdutos(produtosValidos);

    mostrarLoading(false);
}

buscaNome.addEventListener("input", filtrarProdutos);
buscaPreco.addEventListener("input", filtrarProdutos);

carregarProdutos();
