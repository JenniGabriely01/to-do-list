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

// Middleware para análise do corpo da solicitação
app.use(bodyParser.urlencoded({ extended: true }));

// Configuração para servir arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Rota principal para exibir a página de login
app.get("/", (req, res) => {
    res.render("login");
});

// Rota para exibir a página de visualização das tarefas
app.get("/visualizacao", (req, res) => {
    const userName = req.query.name || 'Visitor';
    connection.query('SELECT * FROM Tarefas', (err, results) => {
        if (err) {
            console.error('Erro ao recuperar tarefas:', err);
            res.status(500).send('Erro ao recuperar tarefas');
        } else {
            const toDoTasks = results.filter(task => task.estado === 'feito');
            const inProgressTasks = results.filter(task => task.estado === 'em_progresso');
            const doneTasks = results.filter(task => task.estado === 'pronto');

            results.forEach(task => {
                const date = new Date(task.data_criacao);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                task.data_criacao = `${year}-${month}-${day}`;
            });

            res.render('visualizacao', {
                userName: userName,
                toDoTasks: toDoTasks,
                inProgressTasks: inProgressTasks,
                doneTasks: doneTasks,
                allTasks: results
            });
        }
    });
});

// Rota para perfil, garantindo que o nome do usuário seja passado na query string
app.get("/perfil", (req, res) => {
    const userName = req.query.name || 'Visitor';
    res.render('perfil', {
        userName: userName
    });
});

// Rota para notificações, garantindo que o nome do usuário seja passado na query string
app.get('/notificacoes', (req, res) => {
    const userName = req.query.name || 'Visitor';
    res.render('notificacoes', {
        userName: userName
    });
});

app.get('/register', (req, res) => {
    res.render('register');
});

/* ver detalhes da tarefa por id */
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
                const date = new Date(edit.data_criacao);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                edit.data_criacao = `${year}-${month}-${day}`;
                res.render('edit', { edit });
            } else {
                res.status(404).send('Tarefa não encontrada');
            }
        }
    });
});

/* rota editar a tarefa */
app.post("/visualizacao/update", (req, res) => {
    const { id, nome, estado, nivel_importancia, categoria, data_criacao } = req.body;

    const sql = `UPDATE Tarefas SET nome = '${nome}', estado = '${estado}', nivel_importancia = '${nivel_importancia}', categoria = '${categoria}', data_criacao = '${data_criacao}' WHERE id = ${id}`;

    connection.query(sql, function (err) {
        if (err) {
            console.log("error", err);
            return;
        }

        res.redirect('/visualizacao');
    });
});

/* lógica e rota para remover tarefas */
app.post('/remove/:id', (req, res) => {
    const id = req.params.id;
    const sql = `DELETE FROM Tarefas WHERE id = ${id}`;
    connection.query(sql, function (err) {
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
