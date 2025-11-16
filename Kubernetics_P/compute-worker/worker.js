const mongoose = require('mongoose');
const { Kafka } = require('kafkajs');

// --- Database Connection (MongoDB) ---
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_URL = `mongodb://${DB_HOST}:27017/converter_db`;
mongoose.connect(`mongodb://${DB_HOST}:27017/converter_db`)
    .then(() => console.log("Worker connected to MongoDB!"))
    .catch(err => {
        console.error("Worker MongoDB connection error:", err);
        process.exit(1);
    });

// Get the same DB model
const Conversion = mongoose.model('Conversion', new mongoose.Schema({
    inputValue: Number,
    unitFrom: String,
    unitTo: String,
    status: String,
    result: Number,
    createdAt: Date
}));
const connectToMongo = async () => {
    while (true) {
        try {
            await mongoose.connect(DB_URL);
            console.log("Worker connected to MongoDB!");
            break;
        } catch (err) {
            console.error(`Worker MongoDB connection error: ${err}. Retrying in 5s...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
};
// --- Kafka Connection ---
const KAFKA_HOST = process.env.KAFKA_HOST || 'localhost:9092';
const CONVERSION_TOPIC = 'conversions';

const kafka = new Kafka({
    clientId: 'compute-worker',
    brokers: [KAFKA_HOST]
});
const consumer = kafka.consumer({ groupId: 'conversion-workers' });

// --- Conversion Logic (Same as before) ---
const LENGTH_FACTORS = { 'millimeter': 0.001, 'centimeter': 0.01, 'meter': 1.0, 'kilometer': 1000.0, 'inch': 0.0254, 'foot': 0.3048, 'yard': 0.9144, 'mile': 1609.34 };
const WEIGHT_FACTORS = { 'milligram': 1e-6, 'gram': 0.001, 'kilogram': 1.0, 'ounce': 0.0283495, 'pound': 0.453592 };

function convert_unit(v, from, to, factors) {
    if (!factors[from] || !factors[to]) return null;
    let base = v * factors[from];
    return (base / factors[to]).toFixed(6);
}
function convert_temp(v, from, to) {
    let c;
    if (from === 'Fahrenheit') c = (v - 32) * (5 / 9);
    else if (from === 'Kelvin') c = v - 273.15;
    else c = v;
    if (to === 'Fahrenheit') return ((c * (9 / 5)) + 32).toFixed(6);
    else if (to === 'Kelvin') return (c + 273.15).toFixed(6);
    else return c.toFixed(6);
}

// --- Run the Worker ---
const runWorker = async () => {
    await connectToMongo();
    while (true) {
        try {
            await consumer.connect();
            await consumer.subscribe({ topic: CONVERSION_TOPIC, fromBeginning: true });
            console.log("Kafka Consumer connected! Waiting for messages...");
            break;
        } catch (e) {
            console.error(`Kafka Consumer connection error: ${e}. Retrying in 5s...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }

    // This runs forever
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            try {
                const data = JSON.parse(message.value.toString());
                console.log(`[WORKER] Received task: ${data.taskId}`);

                let result = null;
                if (data.form_id === 'length_form') {
                    result = convert_unit(data.input_value, data.unit_from, data.unit_to, LENGTH_FACTORS);
                } else if (data.form_id === 'weight_form') {
                    result = convert_unit(data.input_value, data.unit_from, data.unit_to, WEIGHT_FACTORS);
                } else if (data.form_id === 'temp_form') {
                    result = convert_temp(data.input_value, data.unit_from, data.unit_to);
                }

                // Update the task in MongoDB
                if (result) {
                    await Conversion.updateOne(
                        { _id: data.taskId },
                        { $set: { status: 'COMPLETED', result: result } }
                    );
                    console.log(`[WORKER] Processed Task ${data.taskId}: ${result}`);
                } else {
                    await Conversion.updateOne({ _id: data.taskId }, { $set: { status: 'FAILED' } });
                    console.log(`[WORKER] Failed Task ${data.taskId}`);
                }

            } catch (e) {
                console.error(`[WORKER] Error processing message: ${e}`);
            }
        },
    });
};

runWorker();