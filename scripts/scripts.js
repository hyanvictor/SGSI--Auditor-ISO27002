// Dados Iniciais de Controles ISO 27002 (Exemplos)
// Dados com Checklist detalhado para cada controle
const controlesISO = [
    {
        id: 1,
        nome: "A.5.1 Políticas de Segurança",
        objeto: "Prover orientação da direção para segurança.",
        checklist: [
            "Existe uma política de segurança documentada?",
            "A política é revisada anualmente?",
            "A política foi comunicada a todos os funcionários?"
        ]
    },
    {
        id: 2,
        nome: "A.8.1 Responsabilidade pelos Ativos",
        objeto: "Identificar ativos e definir responsabilidades.",
        checklist: [
            "Existe um inventário de ativos atualizado?",
            "Todos os ativos possuem um dono (owner) definido?",
            "Há regras para o uso aceitável dos ativos?"
        ]
    },
    {
        id: 3,
        nome: "A.9.1 Requisitos de Controle de Acesso",
        objeto: "Limitar acesso a ativos de informação.",
        checklist: [
            "Existe uma política de controle de acesso físico e lógico?",
            "Os acessos são revisados periodicamente?",
            "Senhas seguem padrões de complexidade?"
        ]
    }
];

let ativos = JSON.parse(localStorage.getItem('ativos')) || [];
let vulnerabilidades = JSON.parse(localStorage.getItem('vulnerabilidades')) || [];
let ameacas = JSON.parse(localStorage.getItem('ameacas')) || [];

// --- Navegação ---
function showSection(id) {
    document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (id === 'ativos') renderAtivos();
    if (id === 'vulnerabilidades') { renderAllDropdowns(); renderRiscos(); }
}

// --- RF02, RF03, RF04, RF05 (Auditoria) ---
function initAuditoria() {
    const container = document.getElementById('controles-container');
    container.innerHTML = ""; // Limpa o container

    controlesISO.forEach(c => {
        const div = document.createElement('div');
        div.className = 'control-item';

        // Gera o HTML do checklist
        const checklistHTML = c.checklist.map((item, index) => `
            <div class="check-row">
                <input type="checkbox" class="chk-auditoria" id="c${c.id}i${index}" onchange="calcScore()">
                <label for="c${c.id}i${index}">${item}</label>
            </div>
        `).join('');

        div.innerHTML = `
            <h4>${c.nome}</h4>
            <p><strong>Objetivo:</strong> ${c.objeto}</p>
            <div class="checklist-box">
                ${checklistHTML}
            </div>
        `;
        container.appendChild(div);
    });
    calcScore(); // Inicializa o score em 0%
}

function calcScore() {
    const checkboxes = document.querySelectorAll('.chk-auditoria');
    const totalItens = checkboxes.length;
    const marcados = document.querySelectorAll('.chk-auditoria:checked').length;

    let porcentagem = 0;
    if (totalItens > 0) {
        porcentagem = ((marcados / totalItens) * 100).toFixed(1);
    }

    const display = document.getElementById('total-score');
    display.innerText = porcentagem + "%";

    // Efeito visual: muda a cor conforme a conformidade
    if (porcentagem < 50) display.style.color = "#e74c3c"; // Vermelho
    else if (porcentagem < 80) display.style.color = "#f39c12"; // Laranja
    else display.style.color = "#27ae60"; // Verde
}

// --- RF06 (Gestão de Ativos - CRUD) ---
document.getElementById('form-ativo').onsubmit = function (e) {
    e.preventDefault();

    const idExistente = document.getElementById('ativo-id').value;

    const dadosAtivo = {
        id: idExistente ? idExistente : Date.now().toString(), // Mantém o ID ou cria um novo
        nome: document.getElementById('at-nome').value,
        tipo: document.getElementById('at-tipo').value,
        dono: document.getElementById('at-dono').value,
        local: document.getElementById('at-local').value,
        formato: document.getElementById('at-formato').value,
        classificacao: document.getElementById('at-class').value,
        valor: document.getElementById('at-valor').value,
        custo: document.getElementById('at-custo').value,
        idade: document.getElementById('at-idade').value,
        reposicao: document.getElementById('at-reposicao').value
    };

    if (idExistente) {
        // Lógica de Alterar (Update)
        const index = ativos.findIndex(a => a.id == idExistente);
        ativos[index] = dadosAtivo;
        alert("Ativo atualizado com sucesso!");
    } else {
        // Lógica de Incluir (Create)
        ativos.push(dadosAtivo);
        alert("Ativo cadastrado com sucesso!");
    }

    // Salvar no LocalStorage e resetar interface
    localStorage.setItem('ativos', JSON.stringify(ativos));
    this.reset();
    document.getElementById('ativo-id').value = ""; // Limpa o ID oculto
    document.querySelector('.btn-save').innerText = "Salvar Ativo"; // Volta o botão ao normal
    renderAtivos();
};

function renderAtivos() {
    const tbody = document.querySelector('#tabela-ativos tbody');
    tbody.innerHTML = ativos.map(a => `
        <tr>
            <td>${a.nome}</td>
            <td>${a.tipo}</td>
            <td>${a.classificacao}</td>
            <td>
                <button class="btn-edit" onclick="editarAtivo('${a.id}')">Editar</button>
                <button class="btn-delete" onclick="deletarAtivo('${a.id}')">Excluir</button>
            </td>
        </tr>
    `).join('');
}

function deletarAtivo(id) {
    if (confirm("Tem certeza que deseja excluir este ativo? Isso removerá todas as vulnerabilidades e ameaças associadas a ele.")) {

        // 1. Remove as Ameaças ligadas às Vulnerabilidades deste Ativo
        const vulnsDoAtivo = vulnerabilidades.filter(v => v.ativoId == id).map(v => v.id);
        ameacas = ameacas.filter(a => !vulnsDoAtivo.includes(a.vulnId));

        // 2. Remove as Vulnerabilidades ligadas a este Ativo
        vulnerabilidades = vulnerabilidades.filter(v => v.ativoId != id);

        // 3. Remove o Ativo em si
        ativos = ativos.filter(a => a.id != id);

        // 4. Salva tudo no LocalStorage
        localStorage.setItem('ativos', JSON.stringify(ativos));
        localStorage.setItem('vulnerabilidades', JSON.stringify(vulnerabilidades));
        localStorage.setItem('ameacas', JSON.stringify(ameacas));

        // 5. Atualiza as telas
        renderAtivos();
        renderRiscos(); // Garante que a aba de riscos seja limpa
        renderAllDropdowns(); // Atualiza os selects de cadastro
    }
}

function editarAtivo(id) {
    // 1. Encontrar o ativo pelo ID
    const ativo = ativos.find(a => a.id == id);

    if (ativo) {
        // 2. Preencher o campo oculto de ID (RF06 - Alterar)
        document.getElementById('ativo-id').value = ativo.id;

        // 3. Preencher os demais campos do formulário
        document.getElementById('at-nome').value = ativo.nome;
        document.getElementById('at-tipo').value = ativo.tipo;
        document.getElementById('at-dono').value = ativo.dono;
        document.getElementById('at-local').value = ativo.local;
        document.getElementById('at-formato').value = ativo.formato;
        document.getElementById('at-class').value = ativo.classificacao;
        document.getElementById('at-valor').value = ativo.valor;
        document.getElementById('at-custo').value = ativo.custo;
        document.getElementById('at-idade').value = ativo.idade;
        document.getElementById('at-reposicao').value = ativo.reposicao;

        // 4. Mudar o texto do botão para indicar edição e rolar para o topo
        document.querySelector('.btn-save').innerText = "Atualizar Ativo";
        document.getElementById('form-ativo').scrollIntoView({ behavior: 'smooth' });
    }
}

// --- RF07 (vulnerabilidades, riscos, ameaças e ativos) ---
document.getElementById('form-vuln').onsubmit = function (e) {
    e.preventDefault();
    const vuln = {
        id: Date.now(),
        ativoId: document.getElementById('vuln-ativo-ref').value,
        desc: document.getElementById('vuln-desc').value,
        tipo: document.getElementById('vuln-tipo').value
    };
    vulnerabilidades.push(vuln);
    localStorage.setItem('vulnerabilidades', JSON.stringify(vulnerabilidades));
    renderRiscos();
    renderAllDropdowns();
};

// Garanta que o array de riscos esteja inicializado no topo do arquivo
let riscos = JSON.parse(localStorage.getItem('riscos')) || [];

// --- FORMULÁRIO DE RISCO (Correção da lógica e do push) ---
document.getElementById('form-risc').onsubmit = function (e) {
    e.preventDefault();

    // Pegamos os valores dos campos
    const ativoId = document.getElementById('risc-ativo-ref').value;
    const prob = parseInt(document.getElementById('risc-probabilidade').value) || 0;
    const imp = parseInt(document.getElementById('risc-impacto').value) || 0;

    const risc = {
        id: Date.now(),
        ativoId: ativoId,
        desc: document.getElementById('threat-desc').value,
        probabilidade: prob,
        impacto: imp,
        valorTotal: prob * imp // Cálculo automático de criticidade
    };

    riscos.push(risc);
    localStorage.setItem('riscos', JSON.stringify(riscos));

    renderRiscos();     // Atualiza a lista visual
    renderAllDropdowns(); // ATUALIZA O SELECT DE CONTRAMEDIDAS
    this.reset();
};

document.getElementById('form-threat').onsubmit = function (e) {
    e.preventDefault();
    const threat = {
        id: Date.now(),
        vulnId: document.getElementById('threat-vuln-ref').value,
        desc: document.getElementById('threat-desc').value,
        fonte: document.getElementById('threat-fonte').value,
        tipo: document.getElementById('threat-tipo').value
    };
    ameacas.push(threat);
    localStorage.setItem('ameacas', JSON.stringify(ameacas));
    renderRiscos();
};

function renderAllDropdowns() {
    // Dropdown de Ativos (em Vulns e Riscos)
    const ativosHTML = ativos.map(a => `<option value="${a.id}">${a.nome}</option>`).join('');
    document.getElementById('vuln-ativo-ref').innerHTML = ativosHTML;
    document.getElementById('risc-ativo-ref').innerHTML = ativosHTML;

    // Dropdown de Vulnerabilidades (em Ameaças)
    document.getElementById('threat-vuln-ref').innerHTML = vulnerabilidades.map(v =>
        `<option value="${v.id}">${v.desc.substring(0, 25)}...</option>`
    ).join('');

    // Dropdown de RISCOS (Para as Contramedidas) - O QUE ESTAVA FALTANDO
    const selRisk = document.getElementById('counter-risk-ref');
    if (selRisk) {
        if (riscos.length === 0) {
            selRisk.innerHTML = '<option value="">Nenhum risco cadastrado</option>';
        } else {
            selRisk.innerHTML = '<option value="">Vincular ao Risco...</option>' +
                riscos.map(r => `<option value="${r.id}">${r.desc || 'Risco sem descrição'} (Score: ${r.valorTotal})</option>`).join('');
        }
    }
}

function renderRiscos() {
    const container = document.getElementById('riscos-lista');
    if (!container) return;

    // Renderiza o Bloco por Vulnerabilidade
    let html = vulnerabilidades.map(v => {
        const ativo = ativos.find(a => a.id == v.ativoId);
        const ameacasRel = ameacas.filter(t => t.vulnId == v.id);

        // Buscamos os riscos vinculados a esta vulnerabilidade específica
        // (Ou ao ativo, dependendo de como você salvou o 'risc-threat-ref')
        const riscosRel = riscos.filter(r => r.ativoId == v.ativoId);

        return `
            <div class="control-item" style="border-left: 5px solid #3498db; margin-bottom: 20px; padding: 15px; background: #fff; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between;">
                    <strong>Ativo: ${ativo ? ativo.nome : 'N/A'}</strong>
                    <button onclick="deletarVuln('${v.id}')" style="color: #e74c3c; background: none; border: none; cursor: pointer; font-size: 0.8em;">Excluir Vulnerabilidade</button>
                </div>
                <div style="margin-top: 5px; color: #555;">
                    <strong>Vulnerabilidade:</strong> ${v.desc} <small>(${v.tipo})</small>
                </div>
                
                <ul style="margin-top: 10px; list-style-type: none; padding-left: 10px;">
                    ${ameacasRel.map(t => `
                        <li style="margin-bottom: 5px;">⚠️ <strong>Ameaça:</strong> ${t.desc}</li>
                    `).join('')}

                    ${riscosRel.map(r => {
            // Buscamos as contramedidas deste risco específico
            const countersRel = contramedidas.filter(c => c.riskId == r.id);

            return `
                            <li style="color: #c0392b; margin-top: 10px; padding: 8px; background: #fdf2f2; border-radius: 4px;">
                                <strong>Risco:</strong> ${r.desc} (Nível: ${r.valorTotal})
                                
                                <div style="margin-left: 15px; margin-top: 5px; color: #2c3e50; font-size: 0.9em;">
                                    ${countersRel.length > 0 ?
                    '<strong>🛡️ Contramedidas:</strong>' + countersRel.map(c => `
                                            <div style="margin-top:3px; display:flex; justify-content:space-between; border-bottom: 1px dashed #ccc;">
                                                <span>${c.desc} <small>[${c.objetivo} | ${c.natureza}]</small></span>
                                                <button onclick="deletarCounter('${c.id}')" style="color:red; border:none; background:none; cursor:pointer;">&times;</button>
                                            </div>
                                        `).join('')
                    : '<br><em style="color:#7f8c8d;">Nenhuma contramedida aplicada.</em>'}
                                </div>
                            </li>
                        `;
        }).join('')}
                </ul>
            </div>
        `;
    }).join('');

    container.innerHTML = html || "<p style='text-align:center; color:#999;'>Nenhum dado registrado.</p>";
}

let contramedidas = JSON.parse(localStorage.getItem('contramedidas')) || [];

// --- RF11: Salvar Contramedida ---
document.getElementById('form-counter').onsubmit = function (e) {
    e.preventDefault();

    const novaCounter = {
        id: Date.now(),
        riskId: document.getElementById('counter-risk-ref').value,
        desc: document.getElementById('counter-desc').value,
        objetivo: document.getElementById('counter-objetivo').value,
        natureza: document.getElementById('counter-natureza').value
    };

    contramedidas.push(novaCounter);
    localStorage.setItem('contramedidas', JSON.stringify(contramedidas));

    this.reset();
    renderRiscos(); // Para mostrar a contramedida na lista
    renderCounterDropdowns();
    alert("Contramedida aplicada com sucesso!");
};


// Função auxiliar para deletar apenas a vulnerabilidade (e suas ameaças)
function deletarVuln(id) {
    // Convertemos o ID recebido para String para garantir a comparação correta
    const idParaDeletar = id.toString();

    if (confirm("Tem certeza que deseja excluir esta vulnerabilidade e todas as ameaças e riscos vinculados a ela?")) {

        // 1. Remove as Ameaças vinculadas
        ameacas = ameacas.filter(a => a.vulnId.toString() !== idParaDeletar);

        // 2. Remove os Riscos vinculados
        // Nota: Se o seu risco estiver vinculado ao Ativo e não à Vuln, 
        // a lógica abaixo remove riscos baseados no ID da vulnerabilidade se você tiver essa ref.
        if (typeof riscos !== 'undefined') {
            riscos = riscos.filter(r => r.vulnId && r.vulnId.toString() !== idParaDeletar);
            localStorage.setItem('riscos', JSON.stringify(riscos));
        }

        // 3. Remove a Vulnerabilidade em si
        vulnerabilidades = vulnerabilidades.filter(v => v.id.toString() !== idParaDeletar);

        // 4. Salva as alterações
        localStorage.setItem('vulnerabilidades', JSON.stringify(vulnerabilidades));
        localStorage.setItem('ameacas', JSON.stringify(ameacas));

        // 5. Atualiza a interface (Chame as funções com os nomes que estão no seu código)
        renderRiscos();
        if (typeof renderAllDropdowns === 'function') {
            renderAllDropdowns();
        } else if (typeof renderAllDropdowns === 'function') {
            renderAllDropdowns();
        }

        console.log("Vulnerabilidade " + idParaDeletar + " excluída com sucesso.");
    }
}

function deletarCounter(id) {
    if (confirm("Remover esta contramedida?")) {
        contramedidas = contramedidas.filter(c => c.id != id);
        localStorage.setItem('contramedidas', JSON.stringify(contramedidas));
        renderRiscos();
    }
}

function gerarRelatorioTXT() {
    return dados.map(ativos => {
        return {
            id: ativo.id,
            nome: ativo.nome,
            tipo: ativo.tipo,
            local: ativo.loca,
            formato: ativo.formato,
            classificacao: ativo.classificacao,
            valor: ativo.valor,
            custo: ativo.custo,
            idade: ativo.idade,
            reposicao: ativo.reposicao
        }
    })
}

// Inicialização
initAuditoria();

// Script de Carga de Dados - Estudo de Caso HealthData Solutions
function carregarCenarioHealthData() {
    // 1. Definindo os Ativos (RF06)
    const novosAtivos = [
        { id: "at_001", nome: "Servidor Físico (Sala-Cofre)", tipo: "Hardware", dono: "Gerente de Infraestrutura", local: "Sede - Sala-Cofre", formato: "Físico", classificacao: "Confidencial", valor: 10, custo: 85000, idade: 3, reposicao: 110000 },
        { id: "at_002", nome: "MediCloud (Código-Fonte Git)", tipo: "Software/Informação", dono: "CTO", local: "Servidor Próprio/Git", formato: "Digital", classificacao: "Confidencial", valor: 10, custo: 2400000, idade: 6, reposicao: 3000000 },
        { id: "at_003", nome: "Base de Dados Comercial (CRM)", tipo: "Informação", dono: "Gerente Comercial", local: "Servidor Interno/Nuvem", formato: "Digital", classificacao: "Interno", valor: 8, custo: 120000, idade: 4, reposicao: 120000 },
        { id: "at_004", nome: "Contratos Físicos de Clientes", tipo: "Documental", dono: "Diretor Administrativo", local: "Sede - Sala Administrativa", formato: "Físico", classificacao: "Confidencial", valor: 7, custo: 15000, idade: 5, reposicao: 200000 },
        { id: "at_005", nome: "Estação Financeira (Workstation)", tipo: "Hardware", dono: "Coordenador Financeiro", local: "Sala do Financeiro", formato: "Físico", classificacao: "Interno", valor: 6, custo: 7500, idade: 2, reposicao: 9000 }
    ];

    // 2. Definindo as Vulnerabilidades (RF07)
    const novasVulns = [
        { id: "v_001", ativoId: "at_001", desc: "Serviços expostos e atraso em atualizações", tipo: "Virtual" },
        { id: "v_002", ativoId: "at_002", desc: "Ausência de autenticação multifator (MFA)", tipo: "Organizacional" },
        { id: "v_003", ativoId: "at_003", desc: "Acesso via redes públicas e sessões longas", tipo: "Virtual" },
        { id: "v_004", ativoId: "at_004", desc: "Falta de registro de retirada e monitoramento físico", tipo: "Física" },
        { id: "v_005", ativoId: "at_005", desc: "Uso de e-mail e internet sem segmentação de rede", tipo: "Humana" }
    ];

    // 3. Definindo as Ameaças (RF07)
    const novasAmeacas = [
        { id: "t_001", vulnId: "v_001", desc: "Exploração de falhas de sistema (Invasão)", fonte: "Externa", tipo: "Intencional" },
        { id: "t_002", vulnId: "v_002", desc: "Campanhas de Phishing e Engenharia Social", fonte: "Externa", tipo: "Intencional" },
        { id: "t_003", vulnId: "v_003", desc: "Interceptação de sessão e instalação de Malware", fonte: "Externa", tipo: "Acidental" },
        { id: "t_004", vulnId: "v_004", desc: "Cópia, remoção ou fotografia não autorizada", fonte: "Interna", tipo: "Intencional" },
        { id: "t_005", vulnId: "v_005", desc: "Execução de anexos maliciosos (Ransomware)", fonte: "Externa", tipo: "Intencional" }
    ];

    // Salvando no LocalStorage para o App carregar
    localStorage.setItem('ativos', JSON.stringify(novosAtivos));
    localStorage.setItem('vulnerabilidades', JSON.stringify(novasVulns));
    localStorage.setItem('ameacas', JSON.stringify(novasAmeacas));

    alert("Cenário HealthData Solutions carregado com sucesso! Atualizando a página...");
    location.reload();
}

// Para rodar, você pode digitar carregarCenarioHealthData() no console.