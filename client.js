const net = require('net');

// 连接到服务器
function connectToServer() {
    const socket = net.connect({ host: '192.168.0.103', port: 3000 }, () => {
        console.log('已连接到服务器！');
    });

    // 当接收到服务器发送的数据时，打印到终端
    socket.on('data', (data) => {
        let text = data.toString();
        console.log(text);
    });

    // 从终端读取用户输入，并发送给服务器
    process.stdin.on('data', (data) => {
        const input = data.toString().trim();
        socket.write(data);
    });

    // 当与服务器断开连接时显示提示消息    socket.on('end', () => {
        console.log('与服务器断开连接');
    };
    
connectToServer()