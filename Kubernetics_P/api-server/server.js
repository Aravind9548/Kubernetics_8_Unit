const express = require('express');
const mongoose = require('mongoose');
const { Kafka } = require('kafkajs');
const cors = require('cors');

const app = express();
app.use(cors()); // Allow requests from our frontend
app.use(express.json());

// --- Database Connection (MongoDB) ---
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_URL = `mongodb://${DB_HOST}:27017/converter_db`; // <-- Make sure this line is here

// Define the database model
const Conversion = mongoose.model('Conversion', new mongoose.Schema({
    inputValue: Number,
    unitFrom: String,
    unitTo: String,
    status: { type: String, default: 'PENDING' },
    result: { type: Number, nullable: true },
    createdAt: { type: Date, default: Date.now }
}));

// --- ADD THIS RETRY FUNCTION ---
const connectToMongo = async () => {
    while (true) {
        try {
            await mongoose.connect(DB_URL);
            console.log("API Server connected to MongoDB!");
            break; // Exit the loop on success
        } catch (err) {
            console.error(`API MongoDB connection error: ${err}. Retrying in 5s...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
};
// --- END OF NEW FUNCTION ---

// --- Kafka Connection ---
const KAFKA_HOST = process.env.KAFKA_HOST || 'localhost:9092';
const CONVERSION_TOPIC = 'conversions';

const kafka = new Kafka({
    clientId: 'api-server',
    brokers: [KAFKA_HOST]
});
const producer = kafka.producer();

const runProducer = async () => {
    while (true) {
        try {
            await producer.connect();
            console.log("Kafka Producer connected!");
            break;
        } catch (e) {
            console.error(`Kafka Producer connection error: ${e}. Retrying in 5s...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
};

// --- API Route ---
app.post('/api/convert', async (req, res) => {
    try {
        const { form_id, input_value, unit_from, unit_to } = req.body;

        // 1. Save to MongoDB
        const newTask = new Conversion({
            inputValue: input_value,
            unitFrom: unit_from,
            unitTo: unit_to,
            status: 'PENDING'
        });
        await newTask.save();

        // 2. Send task to Kafka
        await producer.send({
            topic: CONVERSION_TOPIC,
            messages: [
                {
                    key: form_id,
                    value: JSON.stringify({
                        taskId: newTask._id, // Send the new MongoDB ID
                        form_id,
                        input_value,
                        unit_from,
                        unit_to
                    })
                }
            ],
        });

        // 3. Respond to frontend
        res.status(202).json({ message: `Conversion task ${newTask._id} accepted.` });

    } catch (e) {
        console.error("Error handling conversion:", e);
        res.status(500).json({ error: e.message });
    }
});

// --- Start Server ---
const PORT = 5000;
app.listen(PORT, '0.0.0.0', async () => { // Make this async
    console.log(`API server listening on port ${PORT}`);

    // --- CALL THE NEW FUNCTIONS HERE ---
    await connectToMongo(); // Wait for Mongo to connect
    await runProducer();    // Then connect to Kafka
});