import { Router } from 'express';
import { getUserData } from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/me', getUserData);

export default router;
