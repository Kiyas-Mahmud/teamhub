import 'dotenv/config';
import http from 'node:http';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initSocket } from './sockets/index.js';

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);
app.use(errorHandler);

const httpServer = http.createServer(app);
initSocket(httpServer);

const port = process.env.PORT || 4000;

httpServer.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
