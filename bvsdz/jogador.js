// Servidor completo com Express e WebSocket
const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const path = require('path');
const QRCode = require('qrcode');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Servir arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Armazena conexões dos jogadores
const jogadores = {};
const estadoJogadores = {};

wss.on('connection', (ws) => {
  let id;

  ws.on('message', (msg) => {
    const data = JSON.parse(msg);

    if (data.type === 'registro') {
      id = data.jogador;
      jogadores[id] = ws;
      estadoJogadores[id] = {
        dinheiro: 1500,
        propriedades: [],
        posicao: 0
      };
      console.log(`Jogador ${id} conectado.`);

      // Envia estado inicial
      ws.send(JSON.stringify({
        type: 'estado',
        ...estadoJogadores[id]
      }));
    }

    if (data.type === 'acao') {
      console.log(`Ação de ${id}:`, data);

      // Exemplo: rolar dado e mover jogador
      if (data.acao === 'rolar-dado') {
        const dado1 = Math.floor(Math.random() * 6) + 1;
        const dado2 = Math.floor(Math.random() * 6) + 1;
        const resultado = dado1 + dado2;
        estadoJogadores[id].posicao = (estadoJogadores[id].posicao + resultado) % 40;

        // Atualiza jogador
        ws.send(JSON.stringify({
          type: 'movimento',
          resultado,
          novaPosicao: estadoJogadores[id].posicao
        }));

        // Envia atualização para o tabuleiro (poderia ser broadcast)
        for (const jogadorWs of Object.values(jogadores)) {
          jogadorWs.send(JSON.stringify({
            type: 'atualizacao',
            jogador: id,
            posicao: estadoJogadores[id].posicao
          }));
        }
      }
    }
  });

  ws.on('close', () => {
    if (id && jogadores[id]) {
      delete jogadores[id];
      delete estadoJogadores[id];
      console.log(`Jogador ${id} desconectado.`);
    }
  });
});

// Página auxiliar para gerar QR codes
app.get('/qrcodes', async (req, res) => {
  const numJogadores = 4;
  const links = [];
  for (let i = 1; i <= numJogadores; i++) {
    const url = `http://localhost:3000/jogador.html?id=jogador${i}`;
    const qr = await QRCode.toDataURL(url);
    links.push({ jogador: `Jogador ${i}`, qr });
  }

  res.send(`
    <html><body><h1>QR Codes</h1>
    ${links.map(link => `<div><h2>${link.jogador}</h2><img src="${link.qr}" /></div>`).join('')}
    </body></html>
  `);
});

server.listen(3000, () => {
  console.log('Servidor ouvindo em http://localhost:3000');
});
