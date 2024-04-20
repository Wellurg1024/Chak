const net = require('net');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('ip > ', (hostIP) => {
  console.log(`try connecting ${hostIP}!`);
  connectToServer(hostIP);
});

function connectToServer(ip) {
  const socket = net.connect({ host: ip, port: 3000 }, () => {
    console.log('已连接到服务器！');
  });

  // 当接收到服务器发送的数据时，打印到终端
  socket.on('data', (data) => {
    let text = data.toString();
    console.log(text);
  });

  let userInput = ''; // 存储用户输入的变量

  const stdinListener = (data) => {
    userInput += data.toString();
  };

  process.stdin.on('data', stdinListener);

  rl.on('line', () => {
    socket.write(userInput.trim()); // 发送存储的用户输入
    userInput = ''; // 重置用户输入
    process.stdin.removeListener('data', stdinListener);
    process.stdin.on('data', stdinListener); // 重新注册监听器，等待下一次用户输入
  });

  // 当与服务器断开连接时显示提示消息
  socket.on('end', () => {
    console.log('与服务器断开连接');
    process.stdin.removeListener('data', stdinListener);
    rl.close();
  });
}
