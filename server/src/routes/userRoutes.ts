import { Router } from 'express';
import { craftPlanet, getUserData } from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/me', getUserData);
router.post('/craft', craftPlanet);

export default router;
