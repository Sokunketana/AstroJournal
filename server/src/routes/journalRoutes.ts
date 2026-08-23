import { Router } from 'express';
import { createJournal, getJournals, deleteAllJournals, deleteJournal, updateJournalPosition, updateJournalContent } from '../controllers/journalController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.post('/', createJournal);
router.get('/', getJournals);
router.delete('/', deleteAllJournals);
router.delete('/:id', deleteJournal);
router.put('/:id/position', updateJournalPosition);
router.put('/:id', updateJournalContent);

export default router;

