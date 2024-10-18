import { get } from 'axios';
import { deleteMany, insertMany, find, countDocuments, aggregate } from '../models/ProductTransaction';

// Initialize the database with data from the third-party API
export async function initializeDB(req, res) {
    try {
        const response = await get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
        const transactions = response.data;

        await deleteMany(); // Clear existing data
        await insertMany(transactions); // Insert new data

        res.status(200).json({ message: 'Database initialized with seed data!' });
    } catch (err) {
        res.status(500).json({ message: 'Error initializing database', error: err.message });
    }
}

// Get transactions with search and pagination
export async function getTransactions(req, res) {
    const { page = 1, perPage = 10, search = '' } = req.query;

    try {
        const query = {
            $or: [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { price: { $regex: search, $options: 'i' } }
            ]
        };

        const transactions = await find(query)
            .skip((page - 1) * perPage)
            .limit(parseInt(perPage));

        const total = await countDocuments(query);

        res.status(200).json({
            transactions,
            total,
            currentPage: parseInt(page),
            pages: Math.ceil(total / perPage)
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching transactions', error: err.message });
    }
}

// Get statistics for the selected month
export async function getStatistics(req, res) {
    const { month } = req.query;

    try {
        const start = new Date(`${month}-01`);
        const end = new Date(`${month}-31`);

        const totalSales = await aggregate([
            { $match: { dateOfSale: { $gte: start, $lte: end }, sold: true } },
            { $group: { _id: null, totalSales: { $sum: '$price' } } }
        ]);

        const soldItems = await countDocuments({ dateOfSale: { $gte: start, $lte: end }, sold: true });
        const notSoldItems = await countDocuments({ dateOfSale: { $gte: start, $lte: end }, sold: false });

        res.status(200).json({
            totalSales: totalSales[0]?.totalSales || 0,
            soldItems,
            notSoldItems
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching statistics', error: err.message });
    }
}

// Get bar chart data (price ranges)
export async function getBarChart(req, res) {
    const { month } = req.query;

    try {
        const start = new Date(`${month}-01`);
        const end = new Date(`${month}-31`);

        const priceRanges = [
            { range: '0-100', min: 0, max: 100 },
            { range: '101-200', min: 101, max: 200 },
            { range: '201-300', min: 201, max: 300 },
            { range: '301-400', min: 301, max: 400 },
            { range: '401-500', min: 401, max: 500 },
            { range: '501-600', min: 501, max: 600 },
            { range: '601-700', min: 601, max: 700 },
            { range: '701-800', min: 701, max: 800 },
            { range: '801-900', min: 801, max: 900 },
            { range: '901-above', min: 901 }
        ];

        const result = [];

        for (let range of priceRanges) {
            const count = await countDocuments({
                dateOfSale: { $gte: start, $lte: end },
                price: { $gte: range.min, $lt: range.max || Infinity }
            });

            result.push({ range: range.range, count });
        }

        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching bar chart data', error: err.message });
    }
}

// Get pie chart data (unique categories)
export async function getPieChart(req, res) {
    const { month } = req.query;

    try {
        const start = new Date(`${month}-01`);
        const end = new Date(`${month}-31`);

        const categories = await aggregate([
            { $match: { dateOfSale: { $gte: start, $lte: end } } },
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);

        res.status(200).json(categories);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching pie chart data', error: err.message });
    }
}

// Get combined data
export async function getCombinedData(req, res) {
    try {
        const stats = await getStatistics(req, res);
        const barChart = await getBarChart(req, res);
        const pieChart = await getPieChart(req, res);

        res.status(200).json({
            statistics: stats.data,
            barChart: barChart.data,
            pieChart: pieChart.data
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching combined data', error: err.message });
    }
}
