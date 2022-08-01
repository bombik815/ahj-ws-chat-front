import Chat from './chat';
import Server from './server';

console.log('app started');

const ws = new WebSocket('wss://ahj-ws-chat-server.herokuapp.com/ws');
const server = new Server();
const conteiner = new Chat(server, ws);

conteiner.events();
