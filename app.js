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

    containerFila.innerHTML = '';
    containerAndamento.innerHTML = '';
    containerPronto.innerHTML = '';

    let qtdFila = 0;
    let qtdAndamento = 0;
    let qtdPronto = 0;

    DB_PETSHUB.atendimentos.forEach(atendimento => {
        
        const pet = DB_PETSHUB.pets.find(p => p.id === atendimento.petId);
        const cliente = DB_PETSHUB.clientes.find(c => c.id === pet.clienteId);

        const temAlerta = pet.observacoes && pet.observacoes.trim() !== '';

        const cardHTML = `
            <div class="pet-card ${temAlerta ? 'tem-alerta' : ''}" role="listitem">
                <h4>${pet.nome} <span class="badge-raca">(${pet.raca})</span></h4>
                <p><strong>Serviço:</strong> ${atendimento.servico}</p>
                <p><strong>Tutor:</strong> ${cliente.nome} - ${cliente.telefone}</p>
                
                ${temAlerta ? `<p class="txt-alerta">⚠️ <strong>Restrição:</strong> ${pet.observacoes}</p>` : ''}
                
                <div class="card-actions">
                    ${atendimento.status === 'Fila' ? 
                        `<button onclick="mudarStatusAtendimento(${atendimento.id}, 'Andamento')">Iniciar Banho ➔</button>` : ''}
                    
                    ${atendimento.status === 'Andamento' ? 
                        `<button onclick="mudarStatusAtendimento(${atendimento.id}, 'Pronto')">Finalizar ➔</button>` : ''}
                    
                    ${atendimento.status === 'Pronto' ? 
                        `<span class="txt-concluido">✓ Pronto para Retirada</span>` : ''}
                </div>
            </div>
        `;

        if (atendimento.status === 'Fila') {
            containerFila.innerHTML += cardHTML;
            qtdFila++;
        } else if (atendimento.status === 'Andamento') {
            containerAndamento.innerHTML += cardHTML;
            qtdAndamento++;
        } else if (atendimento.status === 'Pronto') {
            containerPronto.innerHTML += cardHTML;
            qtdPronto++;
        }
    });

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

        const novoClienteId = DB_PETSHUB.clientes.length > 0 ? Math.max(...DB_PETSHUB.clientes.map(c => c.id)) + 1 : 1;
        const novoPetId = DB_PETSHUB.pets.length > 0 ? Math.max(...DB_PETSHUB.pets.map(p => p.id)) + 1 : 1;
        const novoAtendimentoId = DB_PETSHUB.atendimentos.length > 0 ? Math.max(...DB_PETSHUB.atendimentos.map(a => a.id)) + 1 : 1;

        DB_PETSHUB.clientes.push({
            id: novoClienteId,
            nome: nomeTutor,
            telefone: telTutor
        });

        DB_PETSHUB.pets.push({
            id: novoPetId,
            clienteId: novoClienteId,
            nome: nomePet,
            raca: racaPet,
            observacoes: observacoes
        });

        DB_PETSHUB.atendimentos.push({
            id: novoAtendimentoId,
            petId: novoPetId,
            servico: servico,
            valor: valor,
            status: 'Fila',
            data: new Date()
        });

        DB_PETSHUB.salvar();

        form.reset();

        alert(`Check-in do pet ${nomePet} realizado com sucesso!`);
        
        document.querySelector('.nav-link[data-target="view-dashboard"]').click();
        
        renderizarKanban();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    carregarDadosIniciais();
    inicializarRotas();
    renderizarKanban();
    inicializarFormulario();
});