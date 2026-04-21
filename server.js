const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the 'public' directory
app.use(express.static('public'));

let students = {};

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Student joins the class
    socket.on('join', (name) => {
        students[socket.id] = { name: name, bet: null, betType: null };
        io.emit('update_teacher', students);
    });

    // Student places a bet (Ereignis)
    socket.on('place_bet', (data) => {
        if (students[socket.id]) {
            students[socket.id].bet = data.bet;
            students[socket.id].betType = data.type; // 'number', 'color', 'parity'
            io.emit('update_teacher', students);
        }
    });

    // Teacher spins the wheel
    socket.on('spin_wheel', () => {
        // Ergebnis (Outcome): Random number between 0 and 12
        const result = Math.floor(Math.random() * 13); 
        
        // Broadcast the result to everyone
        io.emit('spin_result', result);
        
        // Clear bets after 10 seconds for the next round
        setTimeout(() => {
            for (let id in students) {
                students[id].bet = null;
                students[id].betType = null;
            }
            io.emit('update_teacher', students);
            io.emit('new_round');
        }, 10000);
    });

    socket.on('disconnect', () => {
        delete students[socket.id];
        io.emit('update_teacher', students);
    });
});

// Listen on all network interfaces (0.0.0.0) so devices on the local network can connect
const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`\nServer is running!`);
    console.log(`Teacher Dashboard: http://localhost:${PORT}/teacher.html`);
    console.log(`Students should connect to: http://<YOUR_COMPUTERS_LOCAL_IP>:${PORT}/student.html\n`);
});