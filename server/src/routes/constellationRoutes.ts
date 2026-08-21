import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  createConstellation,
  deleteConstellation,
  getConstellations,
  updateConstellation,
} from '../controllers/constellationController.js';

const router = Router();
router.use(authenticateToken);

router.get('/', getConstellations);
router.post('/', createConstellation);
router.put('/:id', updateConstellation);
router.delete('/:id', deleteConstellation);

export default router;
