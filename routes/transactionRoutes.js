import { Router } from 'express';
import { initializeDB, getTransactions, getStatistics, getBarChart, getPieChart, getCombinedData } from '../controllers/transactionController';

const router = Router();

router.get('/initialize-db', initializeDB);
router.get('/transactions', getTransactions);
router.get('/statistics', getStatistics);
router.get('/bar-chart', getBarChart);
router.get('/pie-chart', getPieChart);
router.get('/combined-data', getCombinedData);

export default router;
