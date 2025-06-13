const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3');

const app = express();
const PORT = 8000;

// Conexão com banco de usuários
const db = new sqlite3.Database("adm.db");
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT)");

  db.get("SELECT * FROM users WHERE username = ?", ['admin'], (err, row) => {
    if (err) {
      console.error("Erro ao verificar admin:", err);
    } else if (!row) {
      db.run("INSERT INTO users (username, password) VALUES (?, ?)", ['admin', 'adm123'], (err) => {
        if (err) {
          console.error("Erro ao inserir admin:", err);
        } else {
          console.log("Usuário admin criado com sucesso!");
        }
      });
    } else {
      console.log("Usuário admin já autorizado");
    }
  });
});

// Conexão com banco de pontuação
const dbpontuacao = new sqlite3.Database("pontuacaoroupas.db");
dbpontuacao.serialize(() => {
  dbpontuacao.run("CREATE TABLE IF NOT EXISTS roupa (id INTEGER PRIMARY KEY AUTOINCREMENT, descricao TEXT, pontos INTEGER)", (err) => {
    if (err) {
      console.error("Erro ao criar tabela de pontuação:", err);
      return;
    }

    console.log("Tabela de pontuação criada ou já existe.");

    dbpontuacao.get("SELECT COUNT(*) as total FROM roupa", (err, row) => {
      if (err) {
        console.error("Erro ao contar registros:", err);
        return;
      }

      if (row.total === 0) {
        const roupas = [
          { descricao: "Roupas comuns usadas", pontos: 1 },
          { descricao: "Roupas de frio usadas", pontos: 2 },
          { descricao: "Roupas novas embaladas com etiqueta", pontos: 3 },
          { descricao: "Roupas de cama de inverno usadas", pontos: 10 },
          { descricao: "Roupas de cama de inverno novas", pontos: 20 },
        ];

        const stmt = dbpontuacao.prepare("INSERT INTO roupa (descricao, pontos) VALUES (?, ?)");
        roupas.forEach((item) => {
          stmt.run(item.descricao, item.pontos, (err) => {
            if (err) {
              console.error(`Erro ao inserir "${item.descricao}":`, err);
            }
          });
        });
        stmt.finalize();
      } else {
        console.log("Dados já existentes na tabela. Nenhuma inserção feita.");
      }
    });
  });
});

// Conexão com banco de turmas
const dbturmas = new sqlite3.Database("turmas.db");
dbturmas.serialize(() => {
  dbturmas.run(`CREATE TABLE IF NOT EXISTS turma (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sigla TEXT NOT NULL,
    docente TEXT NOT NULL
  )`, (err) => {
    if (err) {
      console.error("Erro ao criar tabela de turmas:", err);
    } else {
      console.log("Tabela de turmas criada ou já existe.");

      // Inserir turmas se estiver vazio
      dbturmas.get("SELECT COUNT(*) as total FROM turma", (err, row) => {
        if (err) {
          console.error("Erro ao contar turmas:", err);
          return;
        }

        if (row.total === 0) {
          const turmas = [
            { sigla: "INF1A", docente: "Profa. Ana" },
            { sigla: "ADM2B", docente: "Prof. João" },
            { sigla: "TST3C", docente: "Profa. Carla" }
          ];

          const stmt = dbturmas.prepare("INSERT INTO turma (sigla, docente) VALUES (?, ?)");
          turmas.forEach((turma) => {
            stmt.run(turma.sigla, turma.docente, (err) => {
              if (err) {
                console.error(`Erro ao inserir turma ${turma.sigla}:`, err);
              }
            });
          });
          stmt.finalize(() => {
            console.log("Turmas adicionadas ao banco.");
          });
        } else {
          console.log("Turmas já existentes no banco.");
        }
      });
    }
  });
});

// Sessão
app.use(session({
  secret: "banguela",
  resave: false,
  saveUninitialized: true,
}));

// Arquivos estáticos
app.use("/static", express.static(__dirname + '/static'));

// Parser
app.use(express.urlencoded({ extended: true }));

// Motor de visualização
app.set('view engine', 'ejs');

// Rotas
app.get("/", (req, res) => {
  res.render("pages/index", { título: "Index", req: req });
});

app.get("/sobre", (req, res) => {
  res.render("pages/sobre", { título: "Sobre", req: req });
});

app.get("/localizacao", (req, res) => {
  res.render("pages/localizacao", { título: "Localização", req: req });
});

app.get("/realizardoacao", (req, res) => {
  dbpontuacao.all("SELECT * FROM roupa", (err, roupas) => {
    if (err) {
      console.error("Erro ao buscar roupas:", err);
      return res.send("Erro ao carregar roupas.");
    }

    dbturmas.all("SELECT * FROM turma", (err, turmas) => {
      if (err) {
        console.error("Erro ao buscar turmas:", err);
        return res.send("Erro ao carregar turmas.");
      }

      res.render("pages/realizardoacao", {
        título: "Realizar Doação",
        req: req,
        roupas: roupas,
        turmas: turmas
      });
    });
  });
});

app.get("/equipe", (req, res) => {
  res.render("pages/equipe", { título: "Equipe", req: req });
});

app.get("/login", (req, res) => {
  res.render("pages/login", { título: "Login", req: req, erro: null });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
    if (err) {
      return res.send("Erro no banco de dados.");
    }

    if (row) {
      req.session.user = row;
      console.log("Login bem-sucedido:", row.username);
      return res.redirect("/doacoes_doar");
    } else {
      return res.render("pages/login", {
        título: "Login",
        req: req,
        erro: "Usuário ou senha inválidos"
      });
    }
  });
});

app.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error("Erro ao fazer logout:", err);
      return res.send("Erro ao sair");
    }
    res.redirect("/");
  });
});

// Rota protegida
app.get("/doacoes_doar", (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.render("pages/doacoes_doar", { título: "Doações", req: req });
});

// Rota 404
app.use((req, res) => {
  res.status(404).render('pages/fail', { título: "HTTP ERROR 404 - PAGE NOT FOUND", req: req, msg: "404" });
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta: ${PORT}`);
});
