import { Router } from 'express';
import { health } from './health.route.js';
import { uploads } from './uploads.route.js';
import { auth } from './auth.route.js';
import { admin } from './admin.route.js';

export const api = Router();
api.use('/health', health);
api.use('/uploads', uploads);
api.use('/auth', auth);
api.use('/admin', admin);
