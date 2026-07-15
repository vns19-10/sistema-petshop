const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const port = 3000;

// Configurações de segurança e formato de dados
app.use(cors()); // Permite que o front-end converse com este back-end
app.use(express.json()); // Permite que o servidor entenda dados no formato JSON

// Configuração da conexão com o Banco de Dados MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Geralmente é 'root' no ambiente local
    password: '', // ⚠️ ATENÇÃO: Coloque a senha do seu MySQL aqui
    database: 'pets_hub'
});

// Conectando ao banco
db.connect((erro) => {
    if (erro) {
        console.error('❌ Erro ao conectar no banco de dados:', erro.message);
        return;
    }
    console.log('✅ Conectado ao banco de dados MySQL (pets_hub)!');
});

// --- ROTAS DA NOSSA API ---

// Rota de Teste para ver se o servidor está vivo
app.get('/api/status', (req, res) => {
    res.json({ mensagem: "Servidor do Pet's Hub está rodando 100%!" });
});

// Rota para cadastrar um Novo Check-in completo (Cliente, Pet e Atendimento)
app.post('/api/checkin', (req, res) => {
    const { tutorNome, tutorTelefone, petNome, petRaca, servico, valor } = req.body;

    const sqlCliente = 'INSERT INTO clientes (nome, telefone) VALUES (?, ?)';
    
    db.query(sqlCliente, [tutorNome, tutorTelefone], (erroCliente, resultCliente) => {
        if (erroCliente) {
            console.error('Erro no Cliente:', erroCliente);
            return res.status(500).json({ erro: 'Erro ao salvar cliente no banco de dados.' });
        }
        
        const clienteId = resultCliente.insertId;

        const sqlPet = 'INSERT INTO pets (clienteId, nome, raca) VALUES (?, ?, ?)';
        
        db.query(sqlPet, [clienteId, petNome, petRaca], (erroPet, resultPet) => {
            if (erroPet) {
                console.error('Erro no Pet:', erroPet);
                return res.status(500).json({ erro: 'Erro ao salvar pet no banco de dados.' });
            }
            
            const petId = resultPet.insertId;

            const sqlAtendimento = 'INSERT INTO atendimentos (petId, servico, valor, status) VALUES (?, ?, ?, ?)';
            
            db.query(sqlAtendimento, [petId, servico, valor, 'Fila'], (erroAtendimento, resultAtendimento) => {
                if (erroAtendimento) {
                    console.error('Erro no Atendimento:', erroAtendimento);
                    return res.status(500).json({ erro: 'Erro ao salvar atendimento no banco de dados.' });
                }
                
                res.status(201).json({ 
                    mensagem: 'Check-in realizado com sucesso!', 
                    atendimentoId: resultAtendimento.insertId 
                });
            });
        });
    });
});

// Rota para BUSCAR (GET) a fila completa
app.get('/api/fila', (req, res) => {
    const sql = `
        SELECT 
            a.id AS atendimentoId,
            c.nome AS tutorNome,
            c.telefone AS tutorTelefone,
            p.nome AS petNome,
            p.raca AS petRaca,
            a.servico,
            a.valor,
            a.status,
            a.data
        FROM atendimentos a
        JOIN pets p ON a.petId = p.id
        JOIN clientes c ON p.clienteId = c.id
        ORDER BY a.id DESC;
    `; 

    db.query(sql, (erro, resultados) => {
        if (erro) {
            console.error('❌ Erro ao buscar os dados da fila no MySQL:', erro);
            return res.status(500).json({ erro: 'Erro ao buscar as informações no banco de dados.' });
        }
        
        res.status(200).json(resultados);
    });
});

// Rota para ATUALIZAR o status do atendimento (Drag and Drop)
app.put('/api/atualizar-status/:id', (req, res) => {
    const atendimentoId = req.params.id; 
    const novoStatus = req.body.status;  

    const sql = 'UPDATE atendimentos SET status = ? WHERE id = ?';
    
    db.query(sql, [novoStatus, atendimentoId], (erro, resultado) => {
        if (erro) {
            console.error('Erro ao atualizar status no MySQL:', erro);
            return res.status(500).json({ erro: 'Erro interno no servidor' });
        }
        res.json({ mensagem: 'Status atualizado com sucesso!' });
    });
});

// 🟢 NOVA ROTA ADICIONADA: Rota para DELETAR/CANCELAR um atendimento
app.delete('/api/atendimentos/:id', (req, res) => {
    const atendimentoId = req.params.id;

    const sql = 'DELETE FROM atendimentos WHERE id = ?';
    
    db.query(sql, [atendimentoId], (erro, resultado) => {
        if (erro) {
            console.error('Erro ao deletar atendimento no MySQL:', erro);
            return res.status(500).json({ erro: 'Erro ao cancelar o atendimento no banco.' });
        }
        res.status(200).json({ mensagem: 'Atendimento cancelado com sucesso!' });
    });
});

// Iniciando o servidor
app.listen(port, () => {
    console.log(`🚀 Servidor rodando na porta http://localhost:${port}`);
    console.log(`Acesse http://localhost:${port}/api/status para testar.`);
});