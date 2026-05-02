import 'dotenv/config';
import http from 'node:http';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { swaggerServe, swaggerSetup } from './docs/swagger.js';
import { initSocket } from './sockets/index.js';

const app = express();

// Railway / any reverse proxy: required for `secure` cookies and req.ip.
app.set('trust proxy', 1);

const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (allowedOrigins.length === 0) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/docs', swaggerServe, swaggerSetup);
app.use('/api', routes);
app.use(errorHandler);

const httpServer = http.createServer(app);
initSocket(httpServer);

const port = process.env.PORT || 4000;

httpServer.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
