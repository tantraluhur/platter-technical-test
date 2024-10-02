const express = require('express');
const { connect } = require('amqplib');
const WebSocket = require('ws');

const app = express();
app.use(express.json());
const ws = new WebSocket('ws://user:9303');

// Connect to RabbitMQ and listen for messages from Payment service
(async () => {
    try {
      // Connect to RabbitMQ
      const connection = await connect('amqp://rabbitmq');
      
      // Create a channel
      const channel = await connection.createChannel();
  
      // Assert the queue (make sure it exists)
      await channel.assertQueue('E!SEND_SOCKET', { durable: true });
  
      // Consume messages from the queue
      channel.consume('E!SEND_SOCKET', (msg) => {
        
        const notificationData = JSON.parse(msg.content.toString());
    
        // Send notification to User service via WebSocket
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(notificationData));
            console.log('Notification sent to User service:', notificationData);
        } else {
            console.log('WebSocket not open. Message not sent:', notificationData);
        }

      }, { noAck: true });
      
    } catch (error) {
      console.error('Error connecting to RabbitMQ:', error);
    }
  })();

app.listen(9304, () => {
  console.log('Notification service running on port 9304');
});
