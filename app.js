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
                
                ${atendimento.status === 'Pronto' ? `<button onclick="entregarPet(${atendimento.id})" class="btn-submit" style="margin-top: 12px; padding: 8px; font-size: 0.85rem;">🐾 Entregar Pet</button>` : ''}
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

    DB_PETSHUB.atendimentos.forEach(atendimento => {
        if (atendimento.status === 'Fila') {
            qtdFila++;
        } else if (atendimento.status === 'Pronto' || atendimento.status === 'Entregue') {
            qtdConcluidos++;
            faturamento += atendimento.valor;
        }
    });

    document.getElementById('dash-faturamento').textContent = `R$ ${faturamento.toFixed(2).replace('.', ',')}`;
    document.getElementById('dash-fila').textContent = qtdFila;
    document.getElementById('dash-concluidos').textContent = qtdConcluidos;
}

function mudarStatusAtendimento(atendimentoId, novoStatus) {
    const atendimento = DB_PETSHUB.atendimentos.find(a => a.id === atendimentoId);
    
    if (atendimento) {
        atendimento.status = novoStatus;
        
        DB_PETSHUB.salvar();
        
        renderizarKanban();
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
                <button onclick="prepararNovoAtendimento(${pet.id})" style="margin-top: 10px; width: 100%;">+ Novo Atendimento</button>
                
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

document.addEventListener('DOMContentLoaded', () => {
    carregarDadosIniciais();
    inicializarRotas();
    renderizarKanban();
    renderizarDashboard();
    renderizarPetsCadastrados();
    inicializarFormulario();
    inicializarDragAndDrop();
});