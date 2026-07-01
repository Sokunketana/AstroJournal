import { Router } from 'express';
import { getPlanets, updatePlanetPosition } from '../controllers/planetController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getPlanets);
router.put('/:id/position', updatePlanetPosition);

export default router;
