const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'pets_hub'
});

db.connect((erro) => {
    if (erro) {
        console.error('❌ Erro ao conectar no banco de dados:', erro.message);
        return;
    }
    console.log('✅ Conectado ao banco de dados MySQL (pets_hub)!');
});


app.get('/api/status', (req, res) => {
    res.json({ mensagem: "Servidor do Pet's Hub está rodando 100%!" });
});

app.post('/api/checkin', (req, res) => {
    const { clienteId, petId, tutorNome, tutorTelefone, petNome, petRaca, servico, valor } = req.body;

    if (clienteId && petId) {
        const sqlAtendimento = 'INSERT INTO atendimentos (petId, servico, valor, status) VALUES (?, ?, ?, ?)';
        
        db.query(sqlAtendimento, [petId, servico, valor, 'Fila'], (erroAtendimento, resultAtendimento) => {
            if (erroAtendimento) {
                console.error('Erro no Atendimento:', erroAtendimento);
                return res.status(500).json({ erro: 'Erro ao salvar atendimento no banco de dados.' });
            }
            return res.status(201).json({ mensagem: 'Novo atendimento adicionado para o pet com sucesso!', atendimentoId: resultAtendimento.insertId });
        });
        
    } else {
        const sqlCliente = 'INSERT INTO clientes (nome, telefone) VALUES (?, ?)';
        
        db.query(sqlCliente, [tutorNome, tutorTelefone], (erroCliente, resultCliente) => {
            if (erroCliente) return res.status(500).json({ erro: 'Erro ao salvar cliente.' });
            
            const novoClienteId = resultCliente.insertId;
            const sqlPet = 'INSERT INTO pets (clienteId, nome, raca) VALUES (?, ?, ?)';
            
            db.query(sqlPet, [novoClienteId, petNome, petRaca], (erroPet, resultPet) => {
                if (erroPet) return res.status(500).json({ erro: 'Erro ao salvar pet.' });
                
                const novoPetId = resultPet.insertId;
                const sqlAtendimento = 'INSERT INTO atendimentos (petId, servico, valor, status) VALUES (?, ?, ?, ?)';
                
                db.query(sqlAtendimento, [novoPetId, servico, valor, 'Fila'], (erroAtendimento, resultAtendimento) => {
                    if (erroAtendimento) return res.status(500).json({ erro: 'Erro ao salvar atendimento.' });
                    
                    res.status(201).json({ mensagem: 'Check-in completo realizado com sucesso!' });
                });
            });
        });
    }
});

app.get('/api/pets', (req, res) => {
    const sql = `
        SELECT 
            pets.id AS petId, 
            pets.nome AS petNome, 
            pets.raca, 
            clientes.id AS clienteId, 
            clientes.nome AS tutorNome, 
            clientes.telefone AS tutorTelefone
        FROM pets
        JOIN clientes ON pets.clienteId = clientes.id
    `;
    
    db.query(sql, (erro, resultados) => {
        if (erro) {
            console.error('Erro ao buscar pets:', erro);
            return res.status(500).json({ erro: 'Erro ao buscar pets no banco de dados.' });
        }
        res.status(200).json(resultados);
    });
});

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

app.listen(port, () => {
    console.log(`🚀 Servidor rodando na porta http://localhost:${port}`);
    console.log(`Acesse http://localhost:${port}/api/status para testar.`);
});