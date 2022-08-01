/* eslint-disable max-len */
export default class Chat {
  constructor(server, ws) {
    this.server = server;
    this.ws = ws;
    this.container = document.querySelector('#container');
    this.nickname = document.querySelector('.nickname');
    this.chat = document.querySelector('.chat');
    this.inputNickname = document.querySelector('.input-nickname');
    this.btnNickname = document.querySelector('.btn-nickname');
    this.nicknamesInChat = document.querySelector('.nicknames-in-chat');
    this.inputMessage = document.querySelector('.input-chat-message');
    this.chatMessage = document.querySelector('.chat-message');
    this.usedNickname = document.querySelector('.used-nickname');
    this.btnUsedNickname = document.querySelector('.btn-used-nickname');
    this.closeChat = document.querySelector('.close-chat');
    this.users = null;
    this.inputNameText = null;
    this.inputTextMessage = null;
    this.messageTime = null;
    this.id = null;
  }

  events() {
    this.inputName();
    this.keyNameEnter();
    this.btnNameClick();
    this.inputText();
    this.btnUsedNameCloseClick();
    this.inputMessageToChat();
    this.webSocket();
    this.close();
    window.onbeforeunload = () => this.outBrowser();
  }

  outBrowser() {
    this.server.remove(this.id);
    this.ws.send(JSON.stringify({
      nickname: this.inputNameText,
      id: this.id,
      status: 'remove',
    }));
  }

  webSocket() {
    this.ws.addEventListener('open', () => {
      const data = JSON.stringify(this.id);
      this.ws.send(data);
    });

    this.ws.addEventListener('message', (evt) => {
      const data = JSON.parse(evt.data);
      if (data !== null && this.users !== null) {
        this.users.forEach((elem) => {
          if (elem.id === data.id && this.id !== data.id && data.text) {
            this.addMessages(data.text, elem.nickname);
          }
        });
        if (data.status !== null && data.status === 'add' && data.nickname !== this.inputNameText) {
          this.addUser(data);
        } else if (data.status === 'remove') {
          this.removeUser(data);
        }
      }
    });

    this.ws.addEventListener('close', (evt) => {
      console.log('connection closed', evt);
    });

    this.ws.addEventListener('error', () => {
      console.log('error web socket');
    });
  }

  inputName() {
    this.inputNickname.addEventListener('input', (ev) => {
      this.inputNameText = ev.target.value;
    });
  }

  inputText() {
    this.inputMessage.addEventListener('input', (ev) => {
      this.inputTextMessage = ev.target.value;
    });
  }

  inputMessageToChat() {
    this.inputMessage.addEventListener('keyup', (ev) => {
      if (ev.key === 'Enter') {
        this.addMessages(this.inputTextMessage);
        this.sendMessage(this.inputTextMessage);
        this.inputTextMessage = null;
        this.inputMessage.value = null;
        this.inputMessage.blur();
      }
    });
  }

  addMessages(message, nick = 'You') {
    if (message && message !== '') {
      const span = document.createElement('span');
      const titleDate = document.createElement('h6');
      const text = document.createElement('p');
      titleDate.textContent = `${nick}, ${Chat.messageDate()}`;
      text.textContent = message;
      span.appendChild(titleDate);
      span.appendChild(text);
      if (nick === 'You') {
        titleDate.style.color = 'red';
        span.classList.add('message');
      }
      this.chatMessage.appendChild(span);
      this.chatMessage.scrollTop = this.chatMessage.scrollHeight;
    }
  }

  sendMessage(message) {
    const data = {
      id: this.id,
      text: message.trim(),
    };
    this.ws.send(JSON.stringify(data));
  }

  static messageDate() {
    const year = new Date().getFullYear();
    let month = new Date().getMonth() + 1;
    let day = new Date().getDate();
    let hours = new Date().getHours();
    let minute = new Date().getMinutes();

    if (String(month).length === 1) {
      month = `0${month}`;
    }
    if (String(day).length === 1) {
      day = `0${day}`;
    }
    if (String(minute).length === 1) {
      minute = `0${minute}`;
    }
    if (String(hours).length === 1) {
      hours = `0${hours}`;
    }
    return `${hours}:${minute} ${day}.${month}.${String(year).slice(2)}`;
  }

  async connectToChat(nick) {
    if (nick !== null) {
      const user = await this.server.add(nick);
      if (user !== 'ошибка') {
        this.users = await this.server.load();
        this.users.forEach((elem) => {
          if (elem.nickname === nick) {
            this.id = elem.id;
            this.ws.send(JSON.stringify({
              nickname: nick,
              id: this.id,
              status: 'add',
            }));
          }
        });
        this.renderChat(this.users);
      } else {
        this.nickname.classList.add('none');
        this.usedNickname.classList.remove('none');
        this.inputNameText = null;
        this.inputNickname.value = null;
      }
    }
  }

  renderChat(users) {
    this.nickname.classList.add('none');
    this.chat.classList.remove('none');
    this.inputNickname.value = null;
    users.forEach((elem) => {
      const span = document.createElement('span');
      const img = document.createElement('img');
      const p = document.createElement('p');
      if (elem.nickname === this.inputNameText) {
        p.textContent = 'You';
        p.style.color = 'red';
      } else {
        p.textContent = elem.nickname;
      }
      span.appendChild(img);
      span.appendChild(p);
      this.nicknamesInChat.appendChild(span);
    });
  }

  async addUser(user) {
    this.users = await this.server.load();
    const span = document.createElement('span');
    const img = document.createElement('img');
    const p = document.createElement('p');
    p.textContent = user.nickname;
    span.appendChild(img);
    span.appendChild(p);
    this.nicknamesInChat.insertBefore(span, this.nicknamesInChat.children[this.nicknamesInChat.children.length - 1]);
  }

  async removeUser(user) {
    this.users = await this.server.load();
    for (const elem of this.nicknamesInChat.children) {
      if (elem.querySelector('p').textContent === user.nickname) {
        elem.remove();
      }
    }
  }

  closeChatRoom() {
    this.nickname.classList.remove('none');
    this.chat.classList.add('none');
    this.server.remove(this.id);
    this.ws.send(JSON.stringify({
      nickname: this.inputNameText,
      id: this.id,
      status: 'remove',
    }));
    this.nicknamesInChat.textContent = null;
    this.chatMessage.textContent = null;
    this.inputNameText = null;
    this.id = null;
    this.users = null;
  }

  btnNameClick() {
    this.btnNickname.addEventListener('click', () => {
      this.connectToChat(this.inputNameText);
    });
  }

  keyNameEnter() {
    this.inputNickname.addEventListener('keyup', (ev) => {
      if (ev.key === 'Enter') {
        this.connectToChat(this.inputNameText);
      }
    });
  }

  btnUsedNameCloseClick() {
    this.btnUsedNickname.addEventListener('click', () => {
      this.nickname.classList.remove('none');
      this.usedNickname.classList.add('none');
    });
  }

  close() {
    this.closeChat.addEventListener('click', () => {
      this.closeChatRoom();
    });
  }
}
