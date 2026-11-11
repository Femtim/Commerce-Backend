const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
require('dotenv').config();
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');

const app = express();
const server = http.createServer(app);

connectDB();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH'],
    credentials: true
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('register_session', ({ userId, role }) => {
    if (userId) {
      socket.join(`user_${userId}`);
    }
    if (role === 'seller') {
      socket.join('sellers');
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

app.get('/', (req, res) => {
  res.status(200).json({ status: true, message: 'VortexMart API + WebSockets Active' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders', orderRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server & Socket.io running on port ${PORT}`));