const readline = require('readline');
const net = require('net');

function scanLocalNetwork() {
  const subnet = '192.168.0'; // 更换为您的局域网子网
  const port = 3000;
  const timeout = 200;

  const openHosts = [];
  const openHostsIPs = [];

  const promises = [];

  for (let i = 1; i <= 255; i++) {
    const host = subnet + '.' + i;
    const promise = new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(timeout);

      socket.on('connect', () => {
        openHosts.push(host);
        openHostsIPs.push(host);
        socket.destroy();
        resolve();
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve();
      });

      socket.on('error', (error) => {
        resolve();
      });

      socket.connect(port, host);
    });

    promises.push(promise);
  }

  return Promise.all(promises)
    .then(() => {
      return openHostsIPs;
    });
}

function connectToServer(ip) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const socket = net.connect({ host: ip, port: 3000 }, () => {
    console.log('Connection success!');
  });

  socket.on('data', (data) => {
    let text = data.toString();
    console.log(text);
  });

  let userInput = ''; // 存储用户输入的变量

  const handleUserInput = (line) => {
    const input = line.trim();
  
    if (line === '\u0008') { // 检测到 Backspace 输入，删除输入信息的最后一个字符
      if (userInput.length > 0) {
        userInput = userInput.slice(0, -1);
        readline.clearLine(process.stdout, 0); // 清除终端上当前行的内容
        readline.cursorTo(process.stdout, 0); // 将光标移动到行首
        process.stdout.write(rl.prompt + userInput); // 重新显示输入信息
      }
    } else if (line) { // 发送用户输入的信息
      socket.write(input);
      userInput = ''; // 清空用户输入
    }
  };
  rl.on('line', handleUserInput);

  // 当与服务器断开连接时显示提示消息
  socket.on('end', () => {
    console.log('lost connection');
    rl.close();
  });
}

scanLocalNetwork()
  .then((openHostsIPs) => {
    console.log('Open hosts:');
    if (openHostsIPs.length > 0) {
      openHostsIPs.forEach((host, index) => {
        const coloredHost = `\x1b[32m${host.substring(host.lastIndexOf('.') + 1)}\x1b[0m`;
        console.log(`${index + 1}. ${host.replace(/(\d+)$/, coloredHost)}`);
      });

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const getValidIndex = () => {
        rl.question('plz input the index', (answer) => {
          const selectedIndex = parseInt(answer);
          if (!isNaN(selectedIndex) && selectedIndex >= 1 && selectedIndex <= openHostsIPs.length) {
            const selectedIP = openHostsIPs[selectedIndex - 1];
            console.log('You select: ', selectedIP);
            connectToServer(selectedIP);
            rl.close();
          } else {
            console.log('无效的索引，请重新输入有效的数字索引。');
            getValidIndex(); // 递归调用重新获取有效的索引
          }
        });
      };

      getValidIndex();
    } else {
      console.log('No avaliable');
    }
  })
  .catch((error) => {
    console.error('err with net-scanning', error);
  });
