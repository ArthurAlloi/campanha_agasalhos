const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3');
const path = require('path');

const app = express();
const PORT = 8000;

// Configurações básicas
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'banguela', resave: false, saveUninitialized: true }));
app.use("/static", express.static(path.join(__dirname, "static")));
app.set('view engine', 'ejs');

// ─────────────────────── Banco de Usuários ───────────────────────
const db = new sqlite3.Database("adm.db");
db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT)");
db.get("SELECT * FROM users WHERE username = 'admin'", function(err, row) {
  if (!row) {
    db.run("INSERT INTO users (username, password) VALUES ('admin', 'adm123')");
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
    // Adicione as demais manualmente se quiser
  }
});

// ─────────────────────── Banco de Arrecadação ───────────────────────
const dbArrecadacao = new sqlite3.Database("arrecadacao.db");
dbArrecadacao.run("CREATE TABLE IF NOT EXISTS ARRECADACAO (id INTEGER PRIMARY KEY AUTOINCREMENT, turma TEXT, item TEXT, quantidade INTEGER, pontos INTEGER, data TEXT)");

// ─────────────────────── Roteamento ───────────────────────

// Página inicial
app.get("/", function(req, res) {
  res.render("pages/index", { título: "Index", req });
});

app.get("/sobre", function(req, res) {
  res.render("pages/sobre", { título: "Sobre", req });
});

app.get("/localizacao", function(req, res) {
  res.render("pages/localizacao", { título: "Localizacao", req });
});

app.get("/equipe", function(req, res) {
  res.render("pages/equipe", { título: "Equipe", req });
});

// Login
app.get("/login", function(req, res) {
  res.render("pages/login", { título: "Login", req, erro: null });
});

app.post("/login", function(req, res) {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], function(err, row) {
    if (row) {
      req.session.user = row;
      res.redirect("/doacoes_doar");
    } else {
      res.render("pages/login", { título: "Login", req, erro: "Usuário ou senha inválidos" });
    }
  });
});

app.get("/logout", function(req, res) {
  req.session.destroy(function() {
    res.redirect("/");
  });
});

// Página de doações
app.get("/doacoes_doar", function(req, res) {
//GENIAL, se não estiver logado voltar para pag login
  res.render("pages/doacoes_doar", { título: "Doações", req });
});

// Página do formulário de doação
app.get("/realizardoacao", function(req, res) {
  if (!req.session.user) return res.redirect("/login");
  dbRoupas.all("SELECT * FROM roupa", function(err, roupas) {
    dbTurmas.all("SELECT * FROM turma", function(err, turmas) {
      res.render("pages/realizardoacao", { título: "Realizar Doação", req, roupas, turmas });
    });
  });
});

// Processar doação
app.post("/realizardoacao", function(req, res) {
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

// Exibir tabela de doações
app.get("/tabela", function(req, res) {
  dbArrecadacao.all("SELECT * FROM ARRECADACAO", function(err, rows) {
    const mapaPontos = {
      "Roupas comuns usadas": 1,
      "Roupas de frio usadas": 2,
      "Roupas novas embaladas com etiqueta": 3,
      "Roupas de cama de inverno usadas": 10,
      "Roupas de cama de inverno novas": 20
    };
    const doacoes = rows.map(row => {
      return {
        ...row,
        pontosUnitarios: mapaPontos[row.item] || 0
      };
    });
    res.render("pages/tabela", { título: "Tabela de Doações", req, doacoes });
  });
});

//ERROR Página Não Encontrada
app.use('/{*erro}', (req, res) => {
  console.log("GET /fail")
  res.status(404).render('pages/fail', { título: "HTTP ERROR 404 - PAGE NOT FOUND", req: req, msg: "404" });
});

//Inicia o Servidor
app.listen(PORT, () => {
  console.log(`Servidor Sendo Executado na Porta: ${PORT}`);
  console.log(__dirname + '//static');
});
