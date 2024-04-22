const fs = require('fs');
const net = require('net');


const server = net.createServer();


const clients = [];

server.on('connection', (socket) => {
    const clientIP = getClientIP(socket);
 
        clients.push(socket);


    const connectedMessage = `[${clientIP}] Connected!\n`;
    sendToAllClientsAndConsole(connectedMessage);


    console.log(connectedMessage);


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
        console.error(`Connect err with ${clientIP} :`, error.message);
    });


    socket.on('end', () => {
        const index = clients.indexOf(socket);
        if (index !== -1) {
            clients.splice(index, 1);
            const disconnectedMessage = `[${clientIP}] have quit\n`;
            sendToAllClientsAndConsole(disconnectedMessage);
        }
    });
});


function getClientIP(socket) {
    let ip = socket.remoteAddress;
    if (typeof ip === 'string') {
        if (ip.includes('::ffff:')) {
            ip = ip.split(':').pop();
        }
    }
    return ip;
}



function sendToAllClientsAndConsole(message) {
    console.log(message);
    clients.forEach((client) => {
        client.write(message);
    });
}


function getStatusMessage() {
    const memoryUsage = formatBytes(process.memoryUsage().rss);
    const cpuTemperature = getCPUTemperature();

    const onlineCount = clients.length;
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

function printOnlineIPv4Addresses() {
    const onlineIPv4Addresses = getOnlineIPv4Addresses();
    if (onlineIPv4Addresses.length === 0) {
        sendToAllClientsAndConsole('No online user\n');
    } else {
        let addressList = 'Now online: \n';
        onlineIPv4Addresses.forEach((address, index) => {
            addressList += `${index + 1}. ${address}\n`;
        });
        sendToAllClientsAndConsole(addressList);
    }
}



function formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}


function getCPUTemperature() {
    try {
        const temperature = fs.readFileSync('/sys/class/thermal/thermal_zone0/temp', 'utf-8');
        return `${parseFloat(temperature) / 1000} °C`;
    } catch (error) {
        console.error('Error reading CPU temperature:', error);
        return 'N/A';
    }
}


function banClientByIP(ip) {
    const bannedClients = clients.filter((client) => client.remoteAddress === ip);
    bannedClients.forEach((client) => {
        client.write('Server has just kicked u :( \n');
        client.end();
    });
}


const port = 3000;
server.listen(port, () => {
    console.log(`Server listening at ${port}`);
});
