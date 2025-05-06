from flask import Flask, render_template
from flask_socketio import SocketIO, emit

app = Flask(__name__)
socketio = SocketIO(app)

@app.route('/')
def index():
    return render_template('index.html')

# Evento para receber mensagens e enviar para todos os clientes
@socketio.on('send_move')
def handle_move(data):
    print(f'Movimento recebido: {data}')
    emit('receive_move', data, broadcast=True)  # Envia a mensagem para todos os clientes conectados

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)
