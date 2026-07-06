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

        const cardHTML = `
            <div class="pet-card ${temAlerta ? 'tem-alerta' : ''}" role="listitem">
                <h4>${nomeSeguro} <span class="badge-raca">(${racaSegura})</span></h4>
                <p><strong>Serviço:</strong> ${servicoSeguro}</p>
                <p><strong>Tutor:</strong> ${tutorSeguro} - ${escaparHTML(cliente.telefone)}</p>
                
                ${temAlerta ? `<p class="txt-alerta">⚠️ <strong>Restrição:</strong> ${obsSegura}</p>` : ''}
                
                <div class="card-actions">
                    ${atendimento.status === 'Fila' ? 
                        `<button onclick="mudarStatusAtendimento(${atendimento.id}, 'Andamento')">Iniciar Banho ➔</button>` : ''}
                    
                    ${atendimento.status === 'Andamento' ? 
                        `<button onclick="mudarStatusAtendimento(${atendimento.id}, 'Pronto')">Finalizar ➔</button>` : ''}
                    
                    ${atendimento.status === 'Pronto' ? 
                        `<span class="txt-concluido">✓ Pronto para Retirada</span>
                         <button onclick="entregarPet(${atendimento.id})" style="background-color: #e53e3e; margin-top: 10px;">Entregar Pet ➔</button>` : ''}
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

        if (!nomeTutor || !telTutor || !nomePet || !racaPet || !servico || isNaN(valor)) {
            alert("Por favor, preencha todos os campos obrigatórios.");
            return;
        }

        let clienteAtualId = form.dataset.clienteId ? parseInt(form.dataset.clienteId) : null;
        let petAtualId = form.dataset.petId ? parseInt(form.dataset.petId) : null;

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

        form.reset();
        form.removeAttribute('data-pet-id');
        form.removeAttribute('data-cliente-id');
        ['tutor-nome', 'tutor-telefone', 'pet-nome', 'pet-raca'].forEach(id => {
            document.getElementById(id).readOnly = false;
            document.getElementById(id).style.backgroundColor = '';
        });

        alert(`Serviço para ${nomePet} registrado com sucesso!`);
        
        document.querySelector('.nav-link[data-target="view-dashboard"]').click();
        
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

document.querySelector('.nav-link[data-target="view-cadastro"]').addEventListener('click', () => {
    const form = document.getElementById('form-checkin');
    
    if (!form.dataset.petId) {
        form.reset();
        ['tutor-nome', 'tutor-telefone', 'pet-nome', 'pet-raca'].forEach(id => {
            document.getElementById(id).readOnly = false;
            document.getElementById(id).style.backgroundColor = '';
        });
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
    alert(`Preparando formulário para edição do pet ID ${petId}. Em breve!`);
}

document.addEventListener('DOMContentLoaded', () => {
    carregarDadosIniciais();
    inicializarRotas();
    renderizarKanban();
    renderizarPetsCadastrados();
    inicializarFormulario();
});