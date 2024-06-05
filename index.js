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
    res.render("login");
});

// Rota para lidar com o cadastro de tarefa
app.post('/cadastrar-tarefa', (req, res) => {
    const { nome, estado, nivel_importancia, categoria, data_criacao, name, email } = req.body;
    const userName = name || 'Visitor';
    const emailValue = email || 'seuemail@email.com';

    console.log('Dados recebidos:', { nome, estado, nivel_importancia, categoria, data_criacao });

    connection.query('INSERT INTO Tarefas (nome, estado, nivel_importancia, categoria, data_criacao) VALUES (?, ?, ?, ?, ?)',
        [nome, estado, nivel_importancia, categoria, data_criacao],
        (err, results) => {
            if (err) {
                console.error('Erro ao inserir tarefa:', err);
                res.status(500).send('Erro ao salvar tarefa');
            } else {
                res.redirect(`/visualizacao?name=${userName}&email=${emailValue}`);
            }
        });
});


// Rota para exibir a página de visualização das tarefas
app.get("/visualizacao", (req, res) => {
    const userName = req.query.name || 'Visitor';
    const email = req.query.email || 'seuemail@email.com';

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
                const date = new Date(task.data_criacao);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                task.data_criacao = `${year}-${month}-${day}`
            });

            res.render('visualizacao', {
                userName: userName,
                email: email,
                toDoTasks: toDoTasks,
                inProgressTasks: inProgressTasks,
                doneTasks: doneTasks,
                allTasks: results
            });
        }
    });
});

app.get('/register', (req, res) => {
    const userName = req.query.name || 'Visitor';
    const email = req.query.email || 'seuemail@email.com';

    res.render('register', {
        userName: userName,
        email: email,
    });
});

/* ver detalhes da tarefa por id */
app.get('/visualizacao/:id', (req, res) => {
    const id = req.params.id;
    const userName = req.query.name || 'Visitor';
    const email = req.query.email || 'seuemail@email.com';

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
                res.render('edit', { edit, userName, email });
            } else {
                res.status(404).send('Tarefa não encontrada');
            }
        }
    });
});



app.post('/remove/:id', (req, res) => {
    const id = req.params.id;
    const userName = req.body.name || 'Visitor';
    const email = req.body.email || 'seuemail@email.com';

    const sql = `DELETE FROM Tarefas WHERE id = ${id}`;
    connection.query(sql, function (err) {
        if (err) {
            console.log(err);
            res.status(500).send('Erro ao remover tarefa');
        } else {
            res.redirect(`/visualizacao?name=${userName}&email=${email}`);
        }
    });
});


/* rota editar a tarefa */
app.post("/visualizacao/update", (req, res) => {
    const { id, nome, estado, nivel_importancia, categoria, data_criacao, name, email } = req.body;
    const userName = name || 'Visitor';
    const emailValue = email || 'seuemail@email.com';

    const sql = `UPDATE Tarefas SET nome = '${nome}', estado = '${estado}', nivel_importancia = '${nivel_importancia}', categoria = '${categoria}', data_criacao = '${data_criacao}' WHERE id = ${id}`;

    connection.query(sql, function (err) {
        if (err) {
            console.log("error", err);
            return;
        }

        res.redirect(`/visualizacao?name=${userName}&email=${emailValue}`);
    });
});



/* lógica e rota para remover tarefas */
app.get('/visualizacao/:id', (req, res) => {
    const id = req.params.id;
    const userName = req.query.name || 'Visitor';
    const email = req.query.email || 'seuemail@email.com';

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
                res.render('edit', { edit, userName, email });
            } else {
                res.status(404).send('Tarefa não encontrada');
            }
        }
    });
});

/* rota para perfil */
app.get("/perfil", (req, res) => {
    const userName = req.query.name || 'Visitor';
    const email = req.query.email || 'seuemail@email.com';

    res.render('perfil', {
        userName: userName,
        email: email
    });
});

/* rota para notificações */
app.get('/notificacoes', (req, res) => {
    const userName = req.query.name || 'Visitor';
    const email = req.query.email || 'seuemail@email.com';

    connection.query('SELECT * FROM Tarefas', (err, results) => {
        if (err) {
            console.error('Erro ao recuperar tarefas:', err);
            res.status(500).send('Erro ao recuperar tarefas');
        } else {
            const notificationsToday = [];
            const notificationsTomorrow = [];
            const notificationsExpired = [];
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            results.forEach(task => {
                if (!task.data_criacao || !task.nome) {
                    // Ignorar tarefas com valores NULL
                    return;
                }

                const taskDate = new Date(task.data_criacao);
                taskDate.setHours(0, 0, 0, 0); // Normalize to midnight to compare only dates
                const timeDiff = taskDate - today;
                const dayDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

                if (dayDiff === 0) {
                    // Caso a tarefa expire hoje
                    notificationsToday.push(`The deadline for task <strong>${task.nome}</strong> is today. Please ensure all necessary actions are taken to complete it on time.`);
                } else if (dayDiff === 1) {
                    // Caso a tarefa expire amanhã
                    notificationsTomorrow.push(`Attention! The deadline for task <strong>${task.nome}</strong> is approaching rapidly. Ensure all necessary actions are taken to meet the deadline effectively.`);
                } else if (dayDiff < 0) {
                    // Caso ela já esteja expirada
                    notificationsExpired.push(`The deadline for task <strong>${task.nome}</strong> has passed. Please review and address any outstanding items immediately to minimize any potential impact on our project timeline.`);
                }
            });

            res.render('notificacoes', {
                userName: userName,
                email: email,
                notificationsToday: notificationsToday.length > 0 ? notificationsToday : null,
                notificationsTomorrow: notificationsTomorrow.length > 0 ? notificationsTomorrow : null,
                notificationsExpired: notificationsExpired.length > 0 ? notificationsExpired : null,
                noNotifications: notificationsToday.length === 0 && notificationsTomorrow.length === 0 && notificationsExpired.length === 0
            });
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