import { Router } from 'express';
import { createJournal, getJournals, deleteJournal, updateJournalPosition } from '../controllers/journalController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.post('/', createJournal);
router.get('/', getJournals);
router.delete('/:id', deleteJournal);
router.put('/:id/position', updateJournalPosition);

export default router;
