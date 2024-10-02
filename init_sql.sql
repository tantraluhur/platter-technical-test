-- Create databases
CREATE DATABASE product;
CREATE DATABASE payment;
CREATE DATABASE users;

-- Connect to product database and create a table
\c product
CREATE TABLE product (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    qty INT,
    price BIGINT
);

-- Insert sample data into the product table
INSERT INTO product (name, qty, price) VALUES 
('Product A', 100, 10),
('Product B', 50, 19),
('Product C', 200, 5);

-- Connect to payment database and create a table
\c payment
CREATE TABLE payment (
    id SERIAL PRIMARY KEY,
    paymentAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    userId INT NOT NULL,
    productId INT NOT NULL,
    price BIGINT NOT NULL,
    qty INT NOT NULL,
    bill BIGINT NOT NULL
);

-- Insert sample data into the payment table
INSERT INTO payment (userId, productId, price, qty, bill) VALUES
(1, 1, 1099, 10, 10990),
(2, 2, 1999, 2, 3998),
(3, 3, 549, 5, 2745);

-- Connect to user database and create a table
\c users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    alamat TEXT NOT NULL
);

-- Insert sample data into the users table
INSERT INTO users (name, alamat) VALUES 
('Alice', '123 Wonderland Street'),
('Bob', '456 Elm Street'),
('Charlie', '789 Maple Avenue');
