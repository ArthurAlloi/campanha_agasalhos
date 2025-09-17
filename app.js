// Importação de bibliotecas necessárias
const express = require('express'); // Framework para servidor web
const session = require('express-session'); // Gerenciamento de sessões
const sqlite3 = require('sqlite3'); // Banco de dados SQLite
const path = require('path'); // Manipulação de caminhos de arquivos

const app = express(); // Inicialização do aplicativo Express
const PORT = 8000; // Porta em que o servidor irá rodar

// Configurações básicas do servidor
app.use(express.urlencoded({ extended: true })); 
app.use(session({ secret: 'banguela', resave: false, saveUninitialized: true })); 
app.use("/static", express.static(path.join(__dirname, "static"))); 
app.set('view engine', 'ejs'); 

// ─────────────────────── Banco de Usuários ───────────────────────
const db = new sqlite3.Database("adm.db");
db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, cpf TEXT UNIQUE, password TEXT)");

// Garante que exista um admin padrão
db.get("SELECT * FROM users WHERE cpf = '00000000000'", function(err, row) {
  if (!row) {
    db.run("INSERT INTO users (cpf, password) VALUES ('00000000000', 'adm123')");
  }
});

// ─────────────────────── Banco de Roupas ───────────────────────
const dbRoupas = new sqlite3.Database("pontuacaoroupas.db");
dbRoupas.run("CREATE TABLE IF NOT EXISTS roupa (id INTEGER PRIMARY KEY AUTOINCREMENT, descricao TEXT, pontos INTEGER)");
dbRoupas.get("SELECT COUNT(*) as total FROM roupa", function(err, row) {
  if (row.total === 0) {
    dbRoupas.run("INSERT INTO roupa (descricao, pontos) VALUES ('Roupas comuns usadas', 1)");
    dbRoupas.run("INSERT INTO roupa (descricao, pontos) VALUES ('Roupas de frio usadas', 2)");
    dbRoupas.run("INSERT INTO roupa (descricao, pontos) VALUES ('Roupas novas embaladas com etiqueta', 3)");
    dbRoupas.run("INSERT INTO roupa (descricao, pontos) VALUES ('Roupas de cama de inverno usadas', 10)");
    dbRoupas.run("INSERT INTO roupa (descricao, pontos) VALUES ('Roupas de cama de inverno novas', 20)");
  }
});

// ─────────────────────── Banco de Turmas ───────────────────────
const dbTurmas = new sqlite3.Database("turmas.db");
dbTurmas.run("CREATE TABLE IF NOT EXISTS turma (id INTEGER PRIMARY KEY AUTOINCREMENT, sigla TEXT, docente TEXT)");
dbTurmas.get("SELECT COUNT(*) as total FROM turma", function(err, row) {
  if (row.total === 0) {
    dbTurmas.run("INSERT INTO turma (sigla, docente) VALUES ('M14', 'WILLIAM')");
    dbTurmas.run("INSERT INTO turma (sigla, docente) VALUES ('M3A', 'FABIO')");
    dbTurmas.run("INSERT INTO turma (sigla, docente) VALUES ('M3B', 'EPAMINONDAS')");
  }
});

// ─────────────────────── Banco de Arrecadação ───────────────────────
const dbArrecadacao = new sqlite3.Database("arrecadacao.db");
dbArrecadacao.run("CREATE TABLE IF NOT EXISTS ARRECADACAO (id INTEGER PRIMARY KEY AUTOINCREMENT, turma TEXT, item TEXT, quantidade INTEGER, pontos INTEGER, data TEXT)");

// ─────────────────────── Roteamento ───────────────────────

// Página inicial
app.get("/", function(req, res) {
  console.log("/Home GET");
  res.render("pages/index", { título: "Index", req });
});

// Páginas fixas
app.get("/sobre", function(req, res) {
  console.log("/Sobre GET");
  res.render("pages/sobre", { título: "Sobre", req });
});

app.get("/localizacao", function(req, res) {
  console.log("/Localizacao GET");
  res.render("pages/localizacao", { título: "Localizacao", req });
});

app.get("/cadastro", function(req, res) {
  console.log("/Cadastro GET");
  res.render("pages/cadastro", { título: "Cadastro", req, erro: null });
});

app.get("/cadastro", function(req, res) {
  res.render("pages/cadastro", { título: "Cadastro", req });
});


// Login - GET exibe o formulário, POST valida o usuário
app.get("/login", function(req, res) {
  console.log("/Login GET");
  res.render("pages/login", { título: "Login", req, erro: null });
});

app.post("/login", function(req, res) {
  const { cpf, password } = req.body;
  db.get("SELECT * FROM users WHERE cpf = ? AND password = ?", [cpf, password], function(err, row) {

    if (row) {
      req.session.user = row;
      res.redirect("/doacoes_doar");
    } else {
      res.render("pages/login", { título: "Login", req, erro: "CPF ou senha inválidos" });
    }
  });
});

// Logout
app.get("/logout", function(req, res) {
  console.log("/Logout GET");
  req.session.destroy(function() {
    res.redirect("/");
  });
});

// ─────────────────────── CRUD de Usuários ───────────────────────

// Listar usuários
app.get("/usuarios", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  db.all("SELECT * FROM users", (err, users) => {
    res.render("pages/usuarios", { título: "Usuários", req, users });
  });
});

// Criar usuário
app.post("/usuarios/criar", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  const { cpf, password } = req.body;
  db.run("INSERT INTO users (cpf, password) VALUES (?, ?)", [cpf, password], function(err) {
    res.redirect("/usuarios");
  });
});

// Editar usuário
app.post("/usuarios/editar/:id", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  const { cpf, password } = req.body;
  db.run("UPDATE users SET cpf = ?, password = ? WHERE id = ?", [cpf, password, req.params.id], function(err) {
    res.redirect("/usuarios");
  });
});

// Deletar usuário
app.post("/usuarios/deletar/:id", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  db.run("DELETE FROM users WHERE id = ?", [req.params.id], function(err) {
    res.redirect("/usuarios");
  });
});

// ─────────────────────── Doações ───────────────────────
app.get("/doacoes_doar", function(req, res) {
  console.log("/Doacoes_Doar GET");
  res.render("pages/doacoes_doar", { título: "Doações", req });
});

// Página para realizar uma doação
app.get("/realizardoacao", function(req, res) {
  console.log("/Realizardoacao GET");
  if (!req.session.user) return res.redirect("/login");
  dbRoupas.all("SELECT * FROM roupa", function(err, roupas) {
    dbTurmas.all("SELECT * FROM turma", function(err, turmas) {
      res.render("pages/realizardoacao", { título: "Realizar Doação", req, roupas, turmas });
    });
  });
});

// Rota POST para processar a doação
app.post("/realizardoacao", function(req, res) {
  console.log("/Realizardoacao POST");
  if (!req.session.user) return res.redirect("/login");
  const { turma, item, quantidade } = req.body;
  const qtd = parseInt(quantidade);
  const mapaPontos = {
    "Roupas comuns usadas": 1,
    "Roupas de frio usadas": 2,
    "Roupas novas embaladas com etiqueta": 3,
    "Roupas de cama de inverno usadas": 10,
    "Roupas de cama de inverno novas": 20
  };
  const pontos = (mapaPontos[item] || 0) * qtd;
  const data = new Date().toISOString().split('T')[0];

  dbArrecadacao.run("INSERT INTO ARRECADACAO (turma, item, quantidade, pontos, data) VALUES (?, ?, ?, ?, ?)",
    [turma, item, qtd, pontos, data], function(err) {
      res.redirect("/tabela");
    });
});

// ─────────────────────── Ranking e Tabela ───────────────────────
app.get("/ranking", function(req, res) {
  console.log("/Ranking GET");
  dbArrecadacao.all(`
    SELECT turma, SUM(pontos) AS totalPontos, COUNT(*) AS totalDoacoes
    FROM ARRECADACAO
    GROUP BY turma
    ORDER BY totalPontos DESC
  `, function(err, ranking) {
    res.render("pages/ranking", { título: "Ranking de Doações", req, ranking });
  });
});

app.get("/tabela", (req, res) => {
  console.log("/Tabela GET");
  const pagina = parseInt(req.query.pagina) || 1;
  const porPagina = 10;
  const offset = (pagina - 1) * porPagina;
  const turmaSelecionada = req.query.turma || "";

  let query = "SELECT * FROM ARRECADACAO";
  let countQuery = "SELECT COUNT(*) as total FROM ARRECADACAO";
  const params = [];

  if (turmaSelecionada) {
    query += " WHERE turma = ?";
    countQuery += " WHERE turma = ?";
    params.push(turmaSelecionada);
  }

  query += " LIMIT ? OFFSET ?";
  params.push(porPagina, offset);

  dbArrecadacao.all(query, params, function(err, rows) {
    dbArrecadacao.get(countQuery, turmaSelecionada ? [turmaSelecionada] : [], function(err, result) {
      const totalRegistros = result.total;
      const totalPaginas = Math.ceil(totalRegistros / porPagina);

      dbTurmas.all("SELECT * FROM turma", (err, turmas) => {
        res.render("pages/tabela", {
          título: "Tabela de Doações",
          req,
          doacoes: rows,
          paginaAtual: pagina,
          totalPaginas,
          turmas,
          turmaSelecionada
        });
      });
    });
  });
});

// ─────────────────────── Página de erro 404 ───────────────────────
app.use('/{*erro}', (req, res) => {
  res.status(404).render('pages/fail', { título: "HTTP ERROR 404 - PAGE NOT FOUND", req: req, msg: "404" });
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta: ${PORT}`);
});
