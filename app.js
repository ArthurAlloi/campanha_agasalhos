// Importação de bibliotecas necessárias
const express = require('express'); // Framework para servidor web
const session = require('express-session'); // Gerenciamento de sessões
const sqlite3 = require('sqlite3'); // Banco de dados SQLite
const path = require('path'); // Manipulação de caminhos de arquivos

const app = express(); // Inicialização do aplicativo Express
const PORT = 8000; // Porta em que o servidor irá rodar

// Configurações básicas do servidor
app.use(express.urlencoded({ extended: true })); // Permite receber dados de formulários via POST
app.use(session({ secret: 'banguela', resave: false, saveUninitialized: true })); // Configuração da sessão
app.use("/static", express.static(path.join(__dirname, "static"))); // Pasta de arquivos estáticos
app.set('view engine', 'ejs'); // Define a engine de views como EJS

// ─────────────────────── Banco de Usuários ───────────────────────
const db = new sqlite3.Database("adm.db"); // Cria ou abre o banco de usuários
// Cria a tabela de usuários se não existir
db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT)");
// Insere o admin padrão, se ele não existir
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
    // Insere os tipos de roupas e seus pontos
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
    // Insere turmas padrão
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

// Login - GET exibe o formulário, POST valida o usuário
app.get("/login", function(req, res) {
  console.log("/Login GET");
  res.render("pages/login", { título: "Login", req, erro: null });
});

app.post("/login", function(req, res) {
  console.log("/Login POST");
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

// Logout - encerra sessão
app.get("/logout", function(req, res) {
  console.log("/Logout GET");
  req.session.destroy(function() {
    res.redirect("/");
  });
});

// Página de doações (acessível somente se estiver logado)
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

// Página de ranking das turmas
app.get("/ranking", function(req, res) {
  console.log("/Ranking GET");
  dbArrecadacao.all(`
    SELECT turma, SUM(pontos) AS totalPontos, COUNT(*) AS totalDoacoes
    FROM ARRECADACAO
    GROUP BY turma
    ORDER BY totalPontos DESC
  `, function(err, ranking) {
    res.render("pages/ranking", {
      título: "Ranking de Doações",
      req,
      ranking
    });
  });
});

// Página com a tabela de doações, com filtro e paginação
app.get("/tabela", (req, res) => {
  console.log("/Tabela GET");
  const pagina = parseInt(req.query.pagina) || 1;
  const porPagina = 10;
  const offset = (pagina - 1) * porPagina;
  const turmaSelecionada = req.query.turma || "";

  const mapaPontos = {
    "Roupas comuns usadas": 1,
    "Roupas de frio usadas": 2,
    "Roupas novas embaladas com etiqueta": 3,
    "Roupas de cama de inverno usadas": 10,
    "Roupas de cama de inverno novas": 20
  };

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

      const doacoes = rows.map(row => ({
        ...row,
        pontosUnitarios: mapaPontos[row.item] || 0
      }));

      dbTurmas.all("SELECT * FROM turma", (err, turmas) => {
        res.render("pages/tabela", {
          título: "Tabela de Doações",
          req,
          doacoes,
          paginaAtual: pagina,
          totalPaginas,
          turmas,
          turmaSelecionada
        });
      });
    });
  });
});

// Página de erro 404 personalizada
app.use('/{*erro}', (req, res) => {
  console.log("GET /fail")
  res.status(404).render('pages/fail', { título: "HTTP ERROR 404 - PAGE NOT FOUND", req: req, msg: "404" });
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor Sendo Executado na Porta: ${PORT}`);
  console.log(__dirname + '//static');
});
