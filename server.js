import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Setup Socket.io dengan CORS terbuka
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// In-Memory Real-Time State
let billboardCache = {
  id: 1,
  name: 'Anak Programmer Indonesia',
  brandFont: '',
  image: null,
  link: 'https://linktujuankamu',
  musicTitle: 'iphone-circles',
  musicFile: null,
  isPlayingMusic: false,
  musicVisualizerType: 'bars',
  colSpan: 5,
  rowSpan: 1,
  currentPlan: 'Basic',
  clicks: 142,
  views: 1890,
  socials: [],
  userProfile: {
    name: 'Anak Programmer Indonesia',
    avatar: 'https://cdn-icons-png.flaticon.com/512/3670/3670157.png'
  }
};

// Endpoint Health Check
app.get('/', (req, res) => {
  res.json({ status: 'Online', engine: 'ProMotion Realtime WebSocket' });
});

app.get('/api/billboard', (req, res) => {
  res.json(billboardCache);
});

// Real-Time Socket Connection
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  // Kirim state saat ini ke user yang baru buka
  socket.emit('billboard_init', billboardCache);

  // Dengar perubahan sewa slot / ubah nama / custom media
  socket.on('update_billboard', (data) => {
    billboardCache = { ...billboardCache, ...data };
    console.log(`[Update] Billboard diperbarui oleh: ${socket.id}`);
    
    // Broadcast langsung seketika ke SEMUA user tanpa delay
    io.emit('billboard_updated', billboardCache);
  });

  // Event klik banner (counter bertambah real-time)
  socket.on('click_banner', () => {
    billboardCache.clicks += 1;
    io.emit('banner_click_updated', billboardCache.clicks);
  });

  // Event play/pause audio sinkron
  socket.on('toggle_music', (isPlaying) => {
    billboardCache.isPlayingMusic = isPlaying;
    socket.broadcast.emit('music_toggled', isPlaying);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ProMotion Server Real-time aktif di http://localhost:${PORT}`);
});
