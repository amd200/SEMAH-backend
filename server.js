// Server Packages
import dotenv from 'dotenv';
import 'express-async-errors';
import http from 'http';
import { initializeWebSocket } from './configs/websocketConfig.js';

dotenv.config();
import express from 'express';
const app = express();
const httpServer = http.createServer(app);

// Initialize WebSocket
const io = initializeWebSocket(httpServer);
app.set('io', io);

// Rest Of Packages
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import fileUpload from 'express-fileupload';
import cors from 'cors';

// SwaggerUI
import swaggerUI from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerDocument = YAML.load(path.join(__dirname, './swagger.yaml'));

// Middlewares
import notFoundMiddleware from './middleware/not-found.js';
import errorHandlerMiddleware from './middleware/error-handler.js';

// Routes
import authRoutes from './routes/clients/auth.routes.js';
import clientsRoutes from './routes/clients/user.routes.js';
import commissionerRoutes from './routes/clients/comissioner.routes.js';
import adminAuthRoutes from './routes/admins/auth.routes.js';
import adminUsersRoutes from './routes/admins/user.routes.js';
import employeeAuthRoutes from './routes/employees/auth.routes.js';
import employeeUsersRoutes from './routes/employees/user.routes.js';
import companyRoutes from './routes/companies/company.routes.js';
import serviceRoutes from './routes/services/service.routes.js';
import serviceItemRoutes from './routes/services/service.item.routes.js';
import paymentRoutes from './routes/payments/payment.routes.js';
import chatRoutes from './routes/chats/chat.routes.js';

app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser(process.env.JWT_SECRET));
app.use(
  cors({
    origin: 'https://semah-one.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  })
);
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp',
  })
);
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));

app.get('/', (req, res) => {
  res.send('<h1>SEMAH Homepage</h1>');
});

// Clients Routes
app.use('/api/v1/auth/', authRoutes);
app.use('/api/v1/clients/', clientsRoutes);
app.use('/api/v1/commissioner', commissionerRoutes);

// Admin Routes
app.use('/api/v1/auth/', adminAuthRoutes);
app.use('/api/v1/admins/', adminUsersRoutes);

// Employee Routes
app.use('/api/v1/auth/', employeeAuthRoutes);
app.use('/api/v1/employees/', employeeUsersRoutes);

// Company Routes
app.use('/api/v1/companies/', companyRoutes);

// Service && ServiceItems Routes
app.use('/api/v1/service/', serviceRoutes);
app.use('/api/v1/service-item/', serviceItemRoutes);

// Payments && Orders
app.use('/api/v1/payments/', paymentRoutes);

// Chats
app.use('/api/v1/chats/', chatRoutes);

app.get('/api/v1/debug-cookies', (req, res) => {
  console.log('Cookies:', req.cookies);
  res.status(200).json({ cookies: req.cookies });
});

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}...`);
});

export default httpServer;
