/* PET'S HUB - Sistema de Gestão Operacional */
const DB_PETSHUB = {
    clientes: JSON.parse(localStorage.getItem('ph_clientes')) || [],
    pets: JSON.parse(localStorage.getItem('ph_pets')) || [],
    atendimentos: JSON.parse(localStorage.getItem('ph_atendimentos')) || [],

    salvar: function() {
        localStorage.setItem('ph_clientes', JSON.stringify(this.clientes));
        localStorage.setItem('ph_pets', JSON.stringify(this.pets));
        localStorage.setItem('ph_atendimentos', JSON.stringify(this.atendimentos));
    }
};

function escaparHTML(texto) {
    if (!texto) return '';
    return texto.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function carregarDadosIniciais() {
    if (DB_PETSHUB.clientes.length === 0) {
        DB_PETSHUB.clientes.push({ id: 1, nome: "Mariana Costa", telefone: "(81) 99999-1111" });
        DB_PETSHUB.clientes.push({ id: 2, nome: "Roberto Almeida", telefone: "(81) 98888-2222" });

        DB_PETSHUB.pets.push({ id: 1, clienteId: 1, nome: "Thor", raca: "Shih Tzu", observacoes: "Muito assustado com o barulho do secador." });
        DB_PETSHUB.pets.push({ id: 2, clienteId: 2, nome: "Mel", raca: "Golden Retriever", observacoes: "Alergia a perfumes intensos. Usar xampu neutro." });

        DB_PETSHUB.atendimentos.push({ id: 1, petId: 1, servico: "Banho e Tosa Completa", valor: 80.00, status: "Fila", data: new Date() });
        DB_PETSHUB.atendimentos.push({ id: 2, petId: 2, servico: "Apenas Banho", valor: 120.00, status: "Andamento", data: new Date() });

        DB_PETSHUB.salvar();
        console.log("Pet's Hub: Banco de dados inicializado com dados de teste.");
    }
}
function inicializarRotas() {
    const links = document.querySelectorAll('.nav-link');
    const views = document.querySelectorAll('.app-view');

    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            const targetViewId = this.getAttribute('data-target');

            links.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            views.forEach(view => {
                if (view.id === targetViewId) {
                    view.classList.add('active');
                    view.classList.remove('hidden');
                } else {
                    view.classList.remove('active');
                    view.classList.add('hidden');
                }
            });
        });
    });
}

function renderizarKanban() {
    
    const containerFila = document.getElementById('container-fila');
    const containerAndamento = document.getElementById('container-andamento');
    const containerPronto = document.getElementById('container-pronto');

    let htmlFila = '';
    let htmlAndamento = '';
    let htmlPronto = '';

    let qtdFila = 0;
    let qtdAndamento = 0;
    let qtdPronto = 0;

    DB_PETSHUB.atendimentos.forEach(atendimento => {
        const pet = DB_PETSHUB.pets.find(p => p.id === atendimento.petId);
        if (!pet) return;

        const cliente = DB_PETSHUB.clientes.find(c => c.id === pet.clienteId);
        if (!cliente) return;

        const temAlerta = pet.observacoes && pet.observacoes.trim() !== '';
        const nomeSeguro = escaparHTML(pet.nome);
        const racaSegura = escaparHTML(pet.raca);
        const servicoSeguro = escaparHTML(atendimento.servico);
        const tutorSeguro = escaparHTML(cliente.nome);
        const obsSegura = temAlerta ? escaparHTML(pet.observacoes) : '';

        const classeBadge = servicoSeguro === 'Banho Simples' ? 'badge-banho' : 
                            servicoSeguro === 'Banho e Tosa Higiênica' ? 'badge-tosa' : 
                            'badge-completo';

        const cardHTML = `
            <div class="kanban-card ${temAlerta ? 'tem-alerta' : ''}" draggable="true" data-id="${atendimento.id}">
                <h4>${nomeSeguro}</h4>
                <p><small>Tutor: ${tutorSeguro}</small></p>
                ${temAlerta ? `<p style="font-size: 0.8rem; color: #ef4444; margin-top: 6px; font-weight: 500;">⚠️ ${obsSegura}</p>` : ''}
                <span class="badge-servico ${classeBadge}">${servicoSeguro}</span>
                
                <div class="acoes-card" style="margin-top: 12px; display: flex; gap: 8px;">
                    ${atendimento.status === 'Fila' ? `<button onclick="cancelarAtendimento(${atendimento.id})" class="btn-excluir" style="flex: 1; padding: 6px; font-size: 0.8rem; border-radius: 4px;">❌ Cancelar</button>` : ''}
                    ${atendimento.status === 'Pronto' ? `<button onclick="entregarPet(${atendimento.id})" class="btn-submit" style="flex: 1; padding: 6px; font-size: 0.8rem; border-radius: 4px;">🐾 Entregar</button>` : ''}
                </div>
            </div>
        `;

        if (atendimento.status === 'Fila') {
            htmlFila += cardHTML;
            qtdFila++;
        } else if (atendimento.status === 'Andamento') {
            htmlAndamento += cardHTML;
            qtdAndamento++;
        } else if (atendimento.status === 'Pronto') {
            htmlPronto += cardHTML;
            qtdPronto++;
        }
    });

    containerFila.innerHTML = htmlFila;
    containerAndamento.innerHTML = htmlAndamento;
    containerPronto.innerHTML = htmlPronto;

    document.getElementById('count-fila').textContent = qtdFila;
    document.getElementById('count-andamento').textContent = qtdAndamento;
    document.getElementById('count-pronto').textContent = qtdPronto;

    renderizarDashboard();
}

function renderizarDashboard() {
    let faturamento = 0;
    let qtdFila = 0;
    let qtdConcluidos = 0;

    let countBanho = 0;
    let countTosaHig = 0;
    let countCompleta = 0;

    DB_PETSHUB.atendimentos.forEach(atendimento => {
        if (atendimento.status === 'Fila') {
            qtdFila++;
        } else if (atendimento.status === 'Pronto' || atendimento.status === 'Entregue') {
            qtdConcluidos++;
            
            faturamento += parseFloat(atendimento.valor) || 0;
            
            if (atendimento.servico === 'Banho Simples') countBanho++;
            else if (atendimento.servico === 'Banho e Tosa Higiênica') countTosaHig++;
            else if (atendimento.servico === 'Banho e Tosa Completa') countCompleta++;
        }
    });

    document.getElementById('dash-faturamento').textContent = `R$ ${faturamento.toFixed(2).replace('.', ',')}`;
    document.getElementById('dash-fila').textContent = qtdFila;
    document.getElementById('dash-concluidos').textContent = qtdConcluidos;

    try {
        const ctx = document.getElementById('graficoServicos');
        if (!ctx) return;

        if (meuGrafico) {
            meuGrafico.data.datasets[0].data = [countBanho, countTosaHig, countCompleta];
            meuGrafico.update();
        } else {
            meuGrafico = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Banho Simples', 'Tosa Higiênica', 'Tosa Completa'],
                    datasets: [{
                        data: [countBanho, countTosaHig, countCompleta],
                        backgroundColor: ['#0ea5e9', '#f59e0b', '#10b981'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'right' } }
                }
            });
        }
    } catch (erro) {
        console.warn("Aguardando tela visível para renderizar o gráfico.");
    }

    const gastosPorPet = {};

    DB_PETSHUB.atendimentos.forEach(atendimento => {
        if (atendimento.status === 'Pronto' || atendimento.status === 'Entregue') {
            const petId = atendimento.petId;
            const valor = parseFloat(atendimento.valor) || 0;
            
            if (!gastosPorPet[petId]) {
                gastosPorPet[petId] = 0;
            }
            gastosPorPet[petId] += valor;
        }
    });

    const ranking = Object.keys(gastosPorPet).map(petId => {
        return {
            petId: parseInt(petId),
            totalGasto: gastosPorPet[petId]
        };
    }).sort((a, b) => b.totalGasto - a.totalGasto).slice(0, 5);

    const tbodyRanking = document.getElementById('dash-ranking-body');
    if (tbodyRanking) {
        let htmlRanking = '';
        
        if (ranking.length === 0) {
            htmlRanking = '<tr><td colspan="4" style="padding: 15px; text-align: center; color: #64748b;">Nenhum faturamento registrado ainda.</td></tr>';
        } else {
            ranking.forEach((item, index) => {
                const pet = DB_PETSHUB.pets.find(p => p.id === item.petId);
                if (!pet) return;
                const cliente = DB_PETSHUB.clientes.find(c => c.id === pet.clienteId);
                
                let medalha = `${index + 1}º`;
                if (index === 0) medalha = '🥇 1º';
                if (index === 1) medalha = '🥈 2º';
                if (index === 2) medalha = '🥉 3º';

                htmlRanking += `
                    <tr style="border-bottom: 1px solid var(--border-color); transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                        <td style="padding: 12px 10px; font-weight: bold; color: var(--text-color);">${medalha}</td>
                        <td style="padding: 12px 10px;">${escaparHTML(pet.nome)} <span style="font-size: 0.8rem; color: #64748b;">(${escaparHTML(pet.raca)})</span></td>
                        <td style="padding: 12px 10px;">${escaparHTML(cliente ? cliente.nome : 'Desconhecido')}</td>
                        <td style="padding: 12px 10px; font-weight: bold; color: var(--success-color);">R$ ${item.totalGasto.toFixed(2).replace('.', ',')}</td>
                    </tr>
                `;
            });
        }
        tbodyRanking.innerHTML = htmlRanking;
    }
}

function entregarPet(atendimentoId) {
    const atendimento = DB_PETSHUB.atendimentos.find(a => a.id === atendimentoId);
    if (atendimento) {
        atendimento.status = 'Entregue';
        DB_PETSHUB.salvar();
        renderizarKanban();
    }
}

function cancelarAtendimento(atendimentoId) {
    if (confirm("Tem certeza que deseja cancelar e remover este serviço da fila? (O cadastro do pet continuará salvo no sistema)")) {
        DB_PETSHUB.atendimentos = DB_PETSHUB.atendimentos.filter(a => a.id !== atendimentoId);
        
        DB_PETSHUB.salvar();
        renderizarKanban();
    }
}

function inicializarFormulario() {
    const form = document.getElementById('form-checkin');

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const nomeTutor = document.getElementById('tutor-nome').value.trim();
        const telTutor = document.getElementById('tutor-telefone').value.trim();
        const nomePet = document.getElementById('pet-nome').value.trim();
        const racaPet = document.getElementById('pet-raca').value.trim();
        const servico = document.getElementById('servico-tipo').value;
        const valor = parseFloat(document.getElementById('servico-valor').value);
        const observacoes = document.getElementById('pet-obs').value.trim();

        const modoEdicao = form.dataset.modoEdicao === 'true';

        if (!nomeTutor || !telTutor || !nomePet || !racaPet) {
            alert("Por favor, preencha os dados do tutor e do pet.");
            return;
        }
        if (!modoEdicao && (!servico || isNaN(valor))) {
            alert("Por favor, preencha os dados do serviço obrigatórios.");
            return;
        }

        let clienteAtualId = form.dataset.clienteId ? parseInt(form.dataset.clienteId) : null;
        let petAtualId = form.dataset.petId ? parseInt(form.dataset.petId) : null;

        if (modoEdicao) {
            const clienteEditado = DB_PETSHUB.clientes.find(c => c.id === clienteAtualId);
            const petEditado = DB_PETSHUB.pets.find(p => p.id === petAtualId);

            if (clienteEditado) {
                clienteEditado.nome = nomeTutor;
                clienteEditado.telefone = telTutor;
            }
            if (petEditado) {
                petEditado.nome = nomePet;
                petEditado.raca = racaPet;
                petEditado.observacoes = observacoes;
            }

            DB_PETSHUB.salvar();
            alert(`Cadastro de ${nomePet} atualizado com sucesso!`);
            
            document.querySelector('.nav-link[data-target="view-cadastrados"]').click();

        } else {
            if (!petAtualId) {
                clienteAtualId = DB_PETSHUB.clientes.length > 0 ? Math.max(...DB_PETSHUB.clientes.map(c => c.id)) + 1 : 1;
                petAtualId = DB_PETSHUB.pets.length > 0 ? Math.max(...DB_PETSHUB.pets.map(p => p.id)) + 1 : 1;

                DB_PETSHUB.clientes.push({ id: clienteAtualId, nome: nomeTutor, telefone: telTutor });
                DB_PETSHUB.pets.push({ id: petAtualId, clienteId: clienteAtualId, nome: nomePet, raca: racaPet, observacoes: observacoes });
            } else {
                const petExistente = DB_PETSHUB.pets.find(p => p.id === petAtualId);
                if (petExistente) petExistente.observacoes = observacoes;
            }

            const novoAtendimentoId = DB_PETSHUB.atendimentos.length > 0 ? Math.max(...DB_PETSHUB.atendimentos.map(a => a.id)) + 1 : 1;
            DB_PETSHUB.atendimentos.push({
                id: novoAtendimentoId,
                petId: petAtualId,
                servico: servico,
                valor: valor,
                status: 'Fila',
                data: new Date()
            });

            DB_PETSHUB.salvar();
            alert(`Serviço para ${nomePet} registrado com sucesso!`);
            document.querySelector('.nav-link[data-target="view-dashboard"]').click();
        }

        form.reset();
        form.removeAttribute('data-pet-id');
        form.removeAttribute('data-cliente-id');
        form.removeAttribute('data-modo-edicao');
        
        document.getElementById('servico-tipo').parentElement.style.display = 'block';
        document.getElementById('servico-valor').parentElement.style.display = 'block';
        document.querySelector('#form-checkin .btn-submit').textContent = "Dar Entrada na Fila";
        
        ['tutor-nome', 'tutor-telefone', 'pet-nome', 'pet-raca'].forEach(id => {
            document.getElementById(id).readOnly = false;
            document.getElementById(id).style.backgroundColor = '';
        });

        renderizarKanban();
        renderizarPetsCadastrados();
    });
}

function renderizarPetsCadastrados(filtro = '') {
    const container = document.getElementById('lista-pets');
    let htmlCadastrados = '';

    const petsFiltrados = DB_PETSHUB.pets.filter(pet => {
        const cliente = DB_PETSHUB.clientes.find(c => c.id === pet.clienteId);
        if (!cliente) return false;
        
        const termoBusca = filtro.toLowerCase();
        const nomePetMatch = pet.nome.toLowerCase().includes(termoBusca);
        const nomeTutorMatch = cliente.nome.toLowerCase().includes(termoBusca);
        
        return nomePetMatch || nomeTutorMatch;
    });

    petsFiltrados.forEach(pet => {
        const cliente = DB_PETSHUB.clientes.find(c => c.id === pet.clienteId);
        
        htmlCadastrados += `
            <div class="pet-card">
                <h4>${escaparHTML(pet.nome)} <span class="badge-raca">(${escaparHTML(pet.raca)})</span></h4>
                <p><strong>Tutor:</strong> ${escaparHTML(cliente.nome)}</p>
                <p><strong>Telefone:</strong> ${escaparHTML(cliente.telefone)}</p>
                
                <button onclick="prepararNovoAtendimento(${pet.id})" style="margin-top: 15px; width: 100%; padding: 8px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer; font-weight: bold; color: var(--text-color); transition: 0.2s;">+ Novo Atendimento</button>
                
                <button onclick="abrirModalHistorico(${pet.id})" style="margin-top: 8px; width: 100%; padding: 8px; background: white; border: 1px solid var(--primary-color); border-radius: 4px; cursor: pointer; font-weight: bold; color: var(--primary-color); transition: 0.2s;">📋 Ver Histórico</button>
                
                <div class="btn-group">
                    <button class="btn-editar" onclick="editarPet(${pet.id})">✏️ Editar</button>
                    <button class="btn-excluir" onclick="abrirModalExclusao(${pet.id})">🗑️ Excluir</button>
                </div>
            </div>
        `;
    });

    container.innerHTML = htmlCadastrados;
}
document.getElementById('input-busca').addEventListener('input', function(e) {
    const textoDigitado = e.target.value;
    renderizarPetsCadastrados(textoDigitado);
});

function prepararNovoAtendimento(petId) {
    const pet = DB_PETSHUB.pets.find(p => p.id === petId);
    const cliente = DB_PETSHUB.clientes.find(c => c.id === pet.clienteId);

    const form = document.getElementById('form-checkin');

    document.getElementById('tutor-nome').value = cliente.nome;
    document.getElementById('tutor-telefone').value = cliente.telefone;
    document.getElementById('pet-nome').value = pet.nome;
    document.getElementById('pet-raca').value = pet.raca;
    document.getElementById('pet-obs').value = pet.observacoes || '';

    const camposTravados = ['tutor-nome', 'tutor-telefone', 'pet-nome', 'pet-raca'];
    camposTravados.forEach(id => {
        document.getElementById(id).readOnly = true;
        document.getElementById(id).style.backgroundColor = '#e2e8f0';
    });

    form.dataset.petId = pet.id;
    form.dataset.clienteId = cliente.id;

    document.getElementById('servico-tipo').value = '';
    document.getElementById('servico-valor').value = '';

    document.querySelector('.nav-link[data-target="view-cadastro"]').click();
}

document.querySelector('.nav-link[data-target="view-cadastro"]').addEventListener('click', (evento) => {
    const form = document.getElementById('form-checkin');
    
    if (evento.isTrusted) {
        form.reset();
        form.removeAttribute('data-pet-id');
        form.removeAttribute('data-cliente-id');
        form.removeAttribute('data-modo-edicao');

        document.getElementById('servico-tipo').parentElement.style.display = 'block';
        document.getElementById('servico-valor').parentElement.style.display = 'block';

        ['tutor-nome', 'tutor-telefone', 'pet-nome', 'pet-raca'].forEach(id => {
            document.getElementById(id).readOnly = false;
            document.getElementById(id).style.backgroundColor = '';
        });

        document.querySelector('#form-checkin .btn-submit').textContent = "Dar Entrada na Fila";
    }
});

let idPetParaExcluir = null;
let meuGrafico = null;

function abrirModalExclusao(petId) {
    idPetParaExcluir = petId;
    const pet = DB_PETSHUB.pets.find(p => p.id === petId);
    
    document.getElementById('modal-mensagem').innerHTML = `Tem certeza que deseja excluir o cadastro de <strong>${escaparHTML(pet.nome)}</strong>? O histórico de banhos também será apagado.`;
    
    document.getElementById('modal-overlay').classList.remove('hidden');
}

function fecharModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
    idPetParaExcluir = null;
}

document.getElementById('btn-modal-cancelar').addEventListener('click', fecharModal);

document.getElementById('btn-modal-confirmar').addEventListener('click', function() {
    if (idPetParaExcluir !== null) {
        DB_PETSHUB.atendimentos = DB_PETSHUB.atendimentos.filter(a => a.petId !== idPetParaExcluir);
        
        DB_PETSHUB.pets = DB_PETSHUB.pets.filter(p => p.id !== idPetParaExcluir);
        
        DB_PETSHUB.salvar();
        fecharModal();
        renderizarPetsCadastrados();
        renderizarKanban();
    }
});

function editarPet(petId) {
    const pet = DB_PETSHUB.pets.find(p => p.id === petId);
    if (!pet) return;
    
    const cliente = DB_PETSHUB.clientes.find(c => c.id === pet.clienteId);
    if (!cliente) return;

    const form = document.getElementById('form-checkin');

    document.getElementById('tutor-nome').value = cliente.nome;
    document.getElementById('tutor-telefone').value = cliente.telefone;
    document.getElementById('pet-nome').value = pet.nome;
    document.getElementById('pet-raca').value = pet.raca;
    document.getElementById('pet-obs').value = pet.observacoes || '';

    ['tutor-nome', 'tutor-telefone', 'pet-nome', 'pet-raca'].forEach(id => {
        document.getElementById(id).readOnly = false;
        document.getElementById(id).style.backgroundColor = '';
    });

    document.getElementById('servico-tipo').parentElement.style.display = 'none';
    document.getElementById('servico-valor').parentElement.style.display = 'none';

    form.dataset.petId = pet.id;
    form.dataset.clienteId = cliente.id;
    form.dataset.modoEdicao = 'true';

    document.querySelector('#form-checkin .btn-submit').textContent = "Salvar Alterações";

    document.querySelector('.nav-link[data-target="view-cadastro"]').click();
}

const inputBusca = document.getElementById('input-busca');
if (inputBusca) {
    inputBusca.addEventListener('input', function(e) {
        const textoDigitado = e.target.value;
        renderizarPetsCadastrados(textoDigitado);
    });
}

const btnCancelar = document.getElementById('btn-cancelar');
if (btnCancelar) {
    btnCancelar.addEventListener('click', () => {
        const form = document.getElementById('form-checkin');
        const estavaEditando = form.dataset.modoEdicao === 'true' || form.dataset.petId;

        form.reset();
        form.removeAttribute('data-pet-id');
        form.removeAttribute('data-cliente-id');
        form.removeAttribute('data-modo-edicao');

        document.getElementById('servico-tipo').parentElement.style.display = 'block';
        document.getElementById('servico-valor').parentElement.style.display = 'block';
        document.querySelector('#form-checkin .btn-submit').textContent = "Dar Entrada na Fila";

        ['tutor-nome', 'tutor-telefone', 'pet-nome', 'pet-raca'].forEach(id => {
            document.getElementById(id).readOnly = false;
        });

        if (estavaEditando) {
            document.querySelector('.nav-link[data-target="view-cadastrados"]').click();
        } else {
            document.querySelector('.nav-link[data-target="view-dashboard"]').click();
        }
    });
}

function mudarStatusAtendimento(atendimentoId, novoStatus) {
    const atendimento = DB_PETSHUB.atendimentos.find(a => a.id === atendimentoId);
    
    if (atendimento) {
        atendimento.status = novoStatus;
        
        DB_PETSHUB.salvar();
        
        renderizarKanban();
    }
}

let cardArrastadoId = null;

function inicializarDragAndDrop() {
    const colunas = document.querySelectorAll('.kanban-coluna');
    const tabuleiro = document.querySelector('.kanban-board');

    if (!tabuleiro) return;

    tabuleiro.addEventListener('dragstart', (e) => {
        const card = e.target.closest('.kanban-card');
        if (card) {
            cardArrastadoId = card.dataset.id;
            card.style.opacity = '0.5';
        }
    });

    tabuleiro.addEventListener('dragend', (e) => {
        const card = e.target.closest('.kanban-card');
        if (card) card.style.opacity = '1';
        colunas.forEach(col => col.classList.remove('drag-over'));
    });

    colunas.forEach(coluna => {
        coluna.addEventListener('dragover', (e) => {
            e.preventDefault();
            coluna.classList.add('drag-over');
        });

        coluna.addEventListener('dragleave', () => {
            coluna.classList.remove('drag-over');
        });

        coluna.addEventListener('drop', () => {
            const novoStatus = coluna.dataset.status;
            if (cardArrastadoId && novoStatus) {
                mudarStatusAtendimento(parseInt(cardArrastadoId), novoStatus);
            }
        });
    });
}

function abrirModalHistorico(petId) {
    const pet = DB_PETSHUB.pets.find(p => p.id === petId);
    if (!pet) return;

    const atendimentosDoPet = DB_PETSHUB.atendimentos.filter(a => a.petId === petId);
    
    let totalVisitas = 0;
    let totalGasto = 0;
    let htmlTabela = '';

    if (atendimentosDoPet.length === 0) {
        htmlTabela = '<tr><td colspan="4" style="padding: 20px; text-align: center; color: #64748b;">Nenhum atendimento registrado ainda.</td></tr>';
    } else {
        [...atendimentosDoPet].reverse().forEach(atendimento => {
            totalVisitas++;
            
            if (atendimento.status === 'Pronto' || atendimento.status === 'Entregue') {
                totalGasto += parseFloat(atendimento.valor) || 0;
            }

            let dataFormatada = "--/--/----";
            if (atendimento.data) {
                const dataObj = new Date(atendimento.data);
                dataFormatada = dataObj.toLocaleDateString('pt-BR');
            }

            let corStatus = atendimento.status === 'Fila' ? '#f59e0b' : 
                            atendimento.status === 'Andamento' ? '#0ea5e9' : '#10b981';

            htmlTabela += `
                <tr style="border-bottom: 1px solid var(--border-color);">
                    <td style="padding: 12px 8px; font-size: 0.9rem;">${dataFormatada}</td>
                    <td style="padding: 12px 8px; font-size: 0.9rem;">${escaparHTML(atendimento.servico)}</td>
                    <td style="padding: 12px 8px; font-size: 0.9rem; font-weight: bold;">R$ ${(parseFloat(atendimento.valor) || 0).toFixed(2).replace('.', ',')}</td>
                    <td style="padding: 12px 8px; font-size: 0.9rem;">
                        <span style="background: ${corStatus}20; color: ${corStatus}; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold;">
                            ${atendimento.status}
                        </span>
                    </td>
                </tr>
            `;
        });
    }

    document.getElementById('hist-nome-pet').textContent = `🐾 Histórico: ${pet.nome}`;
    document.getElementById('hist-visitas').textContent = totalVisitas;
    document.getElementById('hist-gasto').textContent = `R$ ${totalGasto.toFixed(2).replace('.', ',')}`;
    document.getElementById('hist-lista-servicos').innerHTML = htmlTabela;

    document.getElementById('modal-historico').classList.remove('hidden');
}

function fecharModalHistorico() {
    document.getElementById('modal-historico').classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
    carregarDadosIniciais();
    inicializarRotas();
    renderizarKanban();
    renderizarDashboard();
    renderizarPetsCadastrados();
    inicializarFormulario();
    inicializarDragAndDrop();
});