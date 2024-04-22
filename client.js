const readline = require('readline');
const net = require('net');

function scanLocalNetwork() {
  const subnet = '192.168.0'; //change it to your local network
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
    console.log('Connected to the server');
  });

  socket.on('data', (data) => {
    let text = data.toString();
    console.log(text);
  });

  let userInput = '';

  const handleUserInput = (line) => {
    const input = line.trim();
  
    if (line === '\u0008') {
      if (userInput.length > 0) {
        userInput = userInput.slice(0, -1);
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(rl.prompt + userInput);
      }
    } else if (line) {
      socket.write(input);
      userInput = '';
    }
  };
  rl.on('line', handleUserInput);


  socket.on('end', () => {
    console.log('End connection');
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
        rl.question('plz input the index of ip u want to connect to：', (answer) => {
          const selectedIndex = parseInt(answer);
          if (!isNaN(selectedIndex) && selectedIndex >= 1 && selectedIndex <= openHostsIPs.length) {
            const selectedIP = openHostsIPs[selectedIndex - 1];
            console.log('You select：', selectedIP);
            connectToServer(selectedIP);
            rl.close();
          } else {
            console.log('plz select again');
            getValidIndex();
          }
        });
      };

      getValidIndex();
    } else {
      console.log('Find no host');
    }
  })
  .catch((error) => {
    console.error('Err with net-scan', error);
  });
