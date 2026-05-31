import express from 'express';
import cors from 'cors';
import { config } from './configs';
import { connectDB } from './database/connection';
import authRoutes from './modules/auth/auth.routes';
import enrollmentRoutes from './modules/enrollments/enrollment.routes';
import paymentRoutes from './modules/payments/payment.routes';
import adminRoutes from './modules/admin/admin.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import contentRoutes from './modules/content/content.routes';
import uploadRoutes from './modules/uploads/upload.routes';
import { errorMiddleware } from './middlewares/error.middleware';

const app = express();

app.use(cors({
  origin: [config.frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Trung tam ngon ngu Apex API', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/uploads', uploadRoutes);
app.use(errorMiddleware);

const startServer = async () => {
  await connectDB();
  app.listen(config.port, () => {
    console.log(`Apex API running at http://localhost:${config.port}`);
    console.log(`MongoDB: ${config.mongodbUri.replace(/:([^@]+)@/, ':****@')}`);
  });
};

if (process.env.NODE_ENV !== 'test') {
  startServer().catch(console.error);
}

export default app;
