const express = require('express');
const { Client } = require('pg');
const { connect } = require('amqplib');

require('dotenv').config();

// PostgreSQL connection
const productClient = new Client({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    port: 5432, // default PostgreSQL port
});


//Init config
const app = express();
app.use(express.json());
productClient.connect();

app.post('/product/check-out', async (req, res) => {
    const { productId, qty, userId } = req.body;
    try {
        await productClient.query('BEGIN');

        // Check product quantity
        const productQuery = await productClient.query('SELECT * FROM product WHERE id = $1', [productId]);
        if (productQuery.rows.length === 0 || productQuery.rows[0].qty < qty) {
            return res.status(400).json({ message: 'Insufficient product quantity' });
        }
        const product = productQuery.rows[0]
        const productPrice = product.price
        const totalPrice = productPrice * qty

        // Reduce product quantity
        await productClient.query('UPDATE product SET qty = qty - $1 WHERE id = $2', [qty, productId]);


        // Connect to RabbitMQ and send data to Payment service using RabbitMQ
        try {
            const message = JSON.stringify({
                "productId" : productId,
                "userId": userId,
                "productPrice": productPrice,
                "totalPrice": totalPrice,
                "qty": qty
            });

            const connection = await connect('amqp://rabbitmq');
            const channel = await connection.createChannel()

            // Assert the queue (create it if it doesn't exist)
            await channel.assertQueue('M!PAYMENT', { durable: true });

            // Send the message to the queue
            channel.sendToQueue('M!PAYMENT', Buffer.from(message));   

            //Commit changes in database
            await productClient.query('COMMIT');
            res.status(200).json({ message: 'Checkout successful, payment message sent' });

        } catch (error) {
            throw new Error(error);
        }   

    } catch (error) {
        console.log(error)
        await productClient.query('ROLLBACK');
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(9301, () => {
  console.log('Product service running on port 9301');
});
