const os = require('os');
const fs = require('fs');
const net = require('net');

// 创建一个服务器并监听指定端口
const server = net.createServer();

// 存储连接到服务器的客户端
const clients = [];

server.on('connection', (socket) => {
    const clientIP = getClientIP(socket);

    // 检查是否已经存在该 IP 地址
    if (isClientExists(clientIP)) {
        console.log(`客户端 ${clientIP} 已经存在，但仍允许连接。`);
    } else {
        // 将新连接的客户端添加到 clients 数组中
        clients.push(socket);
    }

    // 发送连接提示消息给客户端和控制台
    const connectedMessage = `[${clientIP}] 已连接到服务器！\n`;
    sendToAllClientsAndConsole(connectedMessage);

    // 发送连接提示消息给控制台
    console.log(connectedMessage);

    // 当收到客户端发送的数据时，广播给所有连接的客户端
    socket.on('data', (data) => {
        const message = `[${clientIP}] ${data}`;
        if (data.toString().trim() === '/stat') {
            const statusMessage = getStatusMessage();
            socket.write(statusMessage);
        } else if (data.toString().startsWith('/ban ')) {
            const ipToBan = '::ffff:' + data.toString().substring(5).trim();
            banClientByIP(ipToBan);
        } else if (data.toString().trim() === '/online') {
            printOnlineIPv4Addresses();

        } else {
            sendToAllClientsAndConsole(message, socket);
        }
    });

    socket.on('error', (error) => {
        console.error(`与客户端 ${clientIP} 的连接发生错误:`, error.message);
    });

    // 当客户端断开连接时，从 clients 数组中移除并发送退出提示消息
    socket.on('end', () => {
        const index = clients.indexOf(socket);
        if (index !== -1) {
            clients.splice(index, 1);
            const disconnectedMessage = `[${clientIP}] 已退出连接\n`;
            sendToAllClientsAndConsole(disconnectedMessage);
        }
    });
});

// 检查指定 IP 地址是否已经存在于 clients 数组中
function isClientExists(ip) {
    return clients.some((client) => getClientIP(client) === ip);
}


// 检查指定 IP 地址是否已经存在于 clients 数组中
function isClientExists(ip) {
    return clients.some((client) => getClientIP(client) === ip);
}

// 获取客户端的 IP 地址
function getClientIP(socket) {
    let ip = socket.remoteAddress;
    // 检查 remoteAddress 是否存在且为字符串
    if (typeof ip === 'string') {
        // 判断是否为 IPv6 映射的 IPv4 地址，如果是，则提取出 IPv4 部分
        if (ip.includes('::ffff:')) {
            ip = ip.split(':').pop();
        }
    }
    return ip;
}


// 发送消息给所有连接的客户端和控制台
function sendToAllClientsAndConsole(message) {
    console.log(message);
    clients.forEach((client) => {
        client.write(message);
    });
}

// 获取服务器当前状态信息
function getStatusMessage() {
    const memoryUsage = formatBytes(process.memoryUsage().rss);
    const cpuTemperature = getCPUTemperature();

    const onlineCount = clients.length - 1;
    const statusMessage = `Server Status:\nMemory Usage: ${memoryUsage}\nCPU Temperature: ${cpuTemperature}\nOnline Count: ${onlineCount}\n`;

    return statusMessage;
}

function getOnlineIPv4Addresses() {
    return clients.map((client) => {
        let ip = client.remoteAddress;
        // 检查 remoteAddress 是否存在且为字符串
        if (typeof ip === 'string') {
            // 判断是否为 IPv6 映射的 IPv4 地址，如果是，则提取出 IPv4 部分
            if (ip.includes('::ffff:')) {
                ip = ip.split(':').pop();
            }
            // 检查 ip 是否为有效的 IPv4 地址
            if (net.isIPv4(ip)) {
                return ip;
            }
        }
        // 返回 null 表示无效地址
        return null;
    }).filter((ip) => ip !== null); // 过滤掉空地址
}

// 在需要将消息发送到所有连接的客户端时，调用 sendToAllClients 函数
function printOnlineIPv4Addresses() {
    const onlineIPv4Addresses = getOnlineIPv4Addresses();
    if (onlineIPv4Addresses.length === 0) {
        sendToAllClientsAndConsole('当前没有在线客户端。\n');
    } else {
        let addressList = '当前在线客户端的IPv4地址列表：\n';
        onlineIPv4Addresses.forEach((address, index) => {
            addressList += `${index + 1}. ${address}\n`;
        });
        sendToAllClientsAndConsole(addressList);
    }
}


// 格式化字节数，转换为可读的格式
function formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}

// 获取CPU温度
function getCPUTemperature() {
    try {
        const temperature = fs.readFileSync('/sys/class/thermal/thermal_zone0/temp', 'utf-8');
        return `${parseFloat(temperature) / 1000} °C`;
    } catch (error) {
        console.error('Error reading CPU temperature:', error);
        return 'N/A';
    }
}

// 根据指定的IP断开与客户端的连接
function banClientByIP(ip) {
    const bannedClients = clients.filter((client) => client.remoteAddress === ip);
    bannedClients.forEach((client) => {
        client.write('服务器已将你踢出\n');
        client.end();
    });
}

// 启动服务器并监听指定端口
const port = 3000;
server.listen(port, () => {
    console.log(`服务器已启动，监听端口 ${port}`);
});
