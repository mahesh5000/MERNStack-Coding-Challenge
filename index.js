const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const transactionRoutes = require('./routes/transactionRoutes').default;

const app = express();

// Enable CORS for all routes
app.use(cors());

// Middleware for parsing JSON
app.use(bodyParser.json());

// Routes
app.use('/api', transactionRoutes);

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/transactions', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
