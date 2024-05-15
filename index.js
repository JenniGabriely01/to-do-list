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

// Criar o engine Handlebars com os helpers registrados
const hbs = exphbs.create({
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    helpers: {
        ifEquals: function (arg1, arg2, options) {
            return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
        }
    }
});

// Configurar o engine Handlebars para o Express
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');


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


// Rota para exibir a página de visualização das tarefas
app.get("/visualizacao", (req, res) => {
    connection.query('SELECT * FROM Tarefas', (err, results) => {
        if (err) {
            console.error('Erro ao recuperar tarefas:', err);
            res.status(500).send('Erro ao recuperar tarefas');
        } else {
            // Separar as tarefas por estado
            const toDoTasks = results.filter(task => task.estado === 'feito');
            const inProgressTasks = results.filter(task => task.estado === 'em_progresso');
            const doneTasks = results.filter(task => task.estado === 'pronto');

            // Formatando a data para uma representação mais compacta e legível
            results.forEach(task => {
                task.data_criacao = new Date(task.data_criacao).toLocaleDateString('pt-BR');
            });

            res.render('visualizacao', {
                toDoTasks: toDoTasks,
                inProgressTasks: inProgressTasks,
                doneTasks: doneTasks,
                allTasks: results
            });
        }
    });
});

/* ver detalhes por id */
app.get('/visualizacao/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'SELECT * FROM Tarefas WHERE id = ?';

    connection.query(sql, [id], (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).send('Erro ao recuperar tarefa');
        } else {
            if (data.length > 0) {
                const edit = data[0];
                edit.data_criacao = new Date(edit.data_criacao).toLocaleDateString('pt-BR'); // Formatar a data
                res.render('edit', { edit });
            } else {
                res.status(404).send('Tarefa não encontrada');
            }
        }
    });
});


app.post("/visualizacao/update",  (req, res) => {
    const { id, nome, estado, nivel_importancia, categoria, data_criacao } = req.body;

    const sql = `UPDATE Tarefas SET nome = '${nome}', estado = '${estado}', nivel_importancia = '${nivel_importancia}', categoria = '${categoria}', data_criacao = '${data_criacao}' WHERE id = ${id}`;

    connection.query(sql, function(err) {
        if (err) {
            console.log("error", err);
            return;
        }

        res.redirect('/visualizacao');
    });
});


app.post('/remove/:id', (req, res) => {
    const id = req.params.id;
    const sql = `DELETE FROM Tarefas WHERE id = ${id}`;
    connection.query(sql, function(err) {
        if (err) {
            console.log(err);
            res.status(500).send('Erro ao remover tarefa');
        } else {
            res.redirect('/visualizacao');
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
