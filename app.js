const express = require('express')
const session = require('express-session')
const sqlite3 = require('sqlite3')
//const bodyparser = require('body-parser') versão 4.0
const app = express() //Armazena as chamadas e propriedades da biblioteca EXPRESS

const PORT = 8000;

//Conexão com o banco de dados 

app.use(
    session({
        secret: "banguela",
        resave: true,
        saveUninitialized: true,
    })
);

app.use("/static", express.static(__dirname + '/static'));

//configuração express para processar requisições POST com BODY PARAMETERS     
app.use(express.urlencoded({extends: true})); //versão 5.0 
//app.use(bodyparser.urlcoded({extends: true})); versão 4.0 

app.set('view engine', 'ejs');

app.get("/", (req, res) => {
    console.log("GET /");
    //res.send("<center> Hello Hello <br> Ola <br> Buenas </center>");
    //res.send("<img src='./static/banguela.jpg' />")
    res.render("pages/index", {título:"Index", req: req });
});

app.get("/sobre", (req, res) => {
    console.log("GET /sobre");
    //res.send("<center> Sobre oque? <br> Como Estas? </center>");
    res.render("pages/sobre", {título:"Sobre", req: req });
});

app.get("/localizacao", (req, res) => {
    console.log("GET /localizacao");
    res.render("pages/localizacao", {título:"Localização", req: req });
});

app.get("/equipe", (req, res) => {
    console.log("GET /equipe");
    res.render("pages/equipe", {título:"Equipe", req: req });
});

app.get("/doacoes_doar", (req, res) => {
    console.log("GET /doacoes_doar");
    res.render("pages/doacoes_doar", {título:"Doar e Doações", req: req });
});

app.get("/login", (req, res) => {
    console.log("GET /login");
    res.render("pages/login", {título:"Login", req: req });
});





app.use('/{*erro}', (req, res) => {
    //Envia uma resposta de erro 404
    console.log("GET /fail")
    res.status(404).render('pages/fail', { título: "HTTP ERROR 404 - PAGE NOT FOUND", req: req, msg: "404" });
});

app.listen(PORT, () => {
    console.log(`Servidor Sendo Executado na Porta: ${PORT}`);
    console.log(__dirname + '//static');
});