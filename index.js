const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const path = require('path'); 

const app = express();
const port = 3000;

// Criar a conexão com o banco de dados fora das rotas
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'listatarefas'
});

// Estabelecer a conexão com o MySQL
connection.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        return;
    }
    console.log('Conexão bem-sucedida com o banco de dados MySQL!');
});

// Configuração do Handlebars
app.engine('handlebars', exphbs({
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
}));
app.set('view engine', 'handlebars');

// Middleware para análise do corpo da solicitação
app.use(bodyParser.urlencoded({ extended: true }));

// Configuração para servir arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Rota principal para exibir a página de cadastro de tarefas
app.get("/", (req, res) => {
    res.render("register");
});

// Rota para lidar com o cadastro de tarefa
app.post('/cadastrar-tarefa', (req, res) => {
    const { nome, estado, nivel_importancia, categoria, data_criacao } = req.body;
    console.log('Dados recebidos:', { nome, estado, nivel_importancia, categoria, data_criacao });

    // Realizar a consulta para inserir a tarefa
    connection.query('INSERT INTO Tarefas (nome, estado, nivel_importancia, categoria, data_criacao) VALUES (?, ?, ?, ?, ?)',
        [nome, estado, nivel_importancia, categoria, data_criacao],
        (err, results) => {
            if (err) {
                console.error('Erro ao inserir tarefa:', err);
                res.status(500).send('Erro ao salvar tarefa');
            } else {
                // Se a tarefa for salva com sucesso, redirecione o usuário para a página de visualização
                res.redirect('/visualizacao');
            }
        });
});

app.post('/cadastrar-tarefa', (req, res) => {
    const { nome, estado, nivel_importancia, categoria, data_criacao } = req.body;
    console.log('Dados recebidos:', { nome, estado, nivel_importancia, categoria, data_criacao });

    // Realizar a consulta para inserir a tarefa
    connection.query('INSERT INTO Tarefas (nome, estado, nivel_importancia, categoria, data_criacao) VALUES (?, ?, ?, ?, ?)',
        [nome, estado, nivel_importancia, categoria, data_criacao],
        (err, results) => {
            if (err) {
                console.error('Erro ao inserir tarefa:', err);
                // Exibir detalhes do erro no console
                console.error(err.message);
                // Enviar uma resposta ao cliente com uma mensagem de erro mais específica
                res.status(500).send(`Erro ao salvar tarefa: ${err.message}`);
            } else {
                // Se a tarefa for salva com sucesso, redirecione o usuário para a página de visualização
                res.redirect('/visualizacao');
            }
        });
});



// Rota para exibir a página de visualização das tarefas
app.get("/visualizacao", (req, res) => {
    connection.query('SELECT * FROM Tarefas', (err, results) => {
        if (err) {
            console.error('Erro ao recuperar tarefas:', err);
            res.status(500).send('Erro ao recuperar tarefas');
        } else {
            res.render('visualizacao', { tarefas: results });
        }
    });
});

// Fechar a conexão quando o servidor for encerrado
process.on('SIGINT', () => {
    console.log('Fechando conexão com o banco de dados MySQL...');
    connection.end();
    process.exit();
});

// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
