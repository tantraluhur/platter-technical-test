const express = require('express');
const { Client } = require('pg');
const { connect } = require('amqplib');


const app = express();
app.use(express.json());

// PostgreSQL connection
const paymentClient = new Client({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    port: 5432, // default PostgreSQL port
});

paymentClient.connect();

// Connect to RabbitMQ and listen for messages from Product service
(async () => {
    try {
        const connection = await connect('amqp://rabbitmq');
        const channel = await connection.createChannel();
  
        await channel.assertQueue('M!PAYMENT', { durable: true });
      
        // Consume messages from the 'M!PAYMENT' queue
        channel.consume('M!PAYMENT', async (msg) => {
        if (msg !== null) {
          const { productId, userId, qty, totalPrice, productPrice } = JSON.parse(msg.content.toString());
  
          // Save payment record in the database
          await paymentClient.query('INSERT INTO payment (productId, userId, qty, price, bill) VALUES ($1, $2, $3, $4, $5)', 
            [userId, productId, qty, productPrice, totalPrice]);
  
          // Send notification message
          const notificationMessage = JSON.stringify({ productId, userId, qty });

          const notificationConnection = await connect('amqp://rabbitmq');

          const notificationChannel = await notificationConnection.createChannel();
          await notificationChannel.assertQueue('E!SEND_SOCKET', { durable: true });
          await notificationChannel.sendToQueue('E!SEND_SOCKET', Buffer.from(notificationMessage));

          console.log("Payment success, send notification")
          await paymentClient.query('COMMIT');
          
          // Acknowledge the message after processing
          channel.ack(msg);

        }
      }, { noAck: false }); // Set noAck to false to acknowledge messages after processing
    } catch (error) {
        await paymentClient.query('ROLLBACK');
        console.error('Error in RabbitMQ connection or processing:', error);
    }
})();

app.listen(9302, () => {
  console.log('Payment service running on port 9302');
});
