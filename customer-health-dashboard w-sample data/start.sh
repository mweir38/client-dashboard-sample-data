#!/bin/bash

# Start the server
cd server
npm install
npm start &

# Start the client
cd ../client
npm install
npm start &

echo "Both server and client are starting..."
