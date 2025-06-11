const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3');

const app = express();
const PORT = 8000;

// Conexão com o banco de dados
const db = new sqlite3.Database("adm.db");
db.serialize(() => {
  db.run(
    "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT)"
  );

  // Verifica se o usuário admin já existe, se não cria
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
      console.log("Usuário admin já existe.");
    }
  });
});

// Configuração da sessão
app.use(session({
  secret: "banguela",
  resave: false,
  saveUninitialized: true,
}));

// Pasta para arquivos estáticos
app.use("/static", express.static(__dirname + '/static'));

// Parser para receber dados de formulários POST
app.use(express.urlencoded({ extended: true }));

// Motor de visualização
app.set('view engine', 'ejs');

// Rotas públicas
app.get("/", (req, res) => {
  res.render("pages/index", { título: "Index", req: req });
});

app.get("/sobre", (req, res) => {
  res.render("pages/sobre", { título: "Sobre", req: req });
});

app.get("/localizacao", (req, res) => {
  res.render("pages/localizacao", { título: "Localização", req: req });
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
      req.session.user = row; // salva usuário na sessão
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

// Rota protegida - só acessa se logado
app.get("/doacoes_doar", (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.render("pages/doacoes_doar", { título: "Doações", req: req });
});

// Rota 404 para qualquer outra
app.use((req, res) => {
  res.status(404).render('pages/fail', { título: "HTTP ERROR 404 - PAGE NOT FOUND", req: req, msg: "404" });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta: ${PORT}`);
});
