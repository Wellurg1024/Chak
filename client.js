const net = require('net');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '', // 禁用默认提示符
});

rl.question('ip> ', (hostIP) => {
  console.log(`try connecting ${hostIP}!`);
  connectToServer(hostIP);
});

function connectToServer(ip) {
  const socket = net.connect({ host: ip, port: 3000 }, () => {
    console.log('已连接到服务器！');
  });

  socket.on('data', (data) => {
    let text = data.toString();
    console.log(text);
  });

  let userInput = ''; // 存储用户输入的变量

  const handleUserInput = (line) => {
    const input = line.trim();

    if (input === '\u0003') { // 检测到 Ctrl+C 输入，结束程序
      process.exit();
    }

    if (line === '\u0008') { // 检测到 Backspace 输入，删除输入信息的最后一个字符
      if (userInput.length > 0) {
        userInput = userInput.slice(0, -1);
        readline.clearLine(process.stdout, 0); // 清除终端上当前行的内容
        readline.cursorTo(process.stdout, 0); // 将光标移动到行首
        process.stdout.write(rl.prompt + userInput); // 重新显示输入信息
      }
    } else if (input) { // 发送用户输入的信息
      socket.write(input);
      userInput = ''; // 清空用户输入
    }
  };

  rl.on('line', handleUserInput);

  // 当与服务器断开连接时显示提示消息
  socket.on('end', () => {
    console.log('与服务器断开连接');
    rl.close();
  });
}