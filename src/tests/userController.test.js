require('dotenv').config();

const mongoose = require('mongoose');
// const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const express = require('express');
const userRoutes = require('../api/routes/userRoutes');
const User = require('../models/userModel');
const mongoUri = process.env.MONGO_URI;


const app = express();
app.use(express.json());
app.use('/api', userRoutes);

let mongoServer;

beforeAll(async () => {
    // mongoServer = await MongoMemoryServer.create();
    // const uri = mongoServer.getUri();
    await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
});

afterEach(async () => {
    // await User.deleteMany({});
});

afterAll(async () => {
    // await mongoose.connection.dropDatabase();
    // await mongoose.connection.close();
    // await mongoServer.stop();
});

describe('User Controller', () => {
    it('should register a new user', async () => {
        const response = await request(app)
            .post('/api/users/register')
            .send({
                username: 'meng5',
                password: '1234560980',
                email: 'meng5@163.com'
            });

        expect(response.status).toBe(200);
        expect(response.text).toBe('User registered successfully');

        const user = await User.findOne({ email: 'meng5@163.com' });
        expect(user).toBeTruthy();
        expect(user.username).toBe('meng5');
    });

    it('should find a user by email', async () => {
        const user = new User({
            username: 'meng5',
            password: '1234560980',
            email: 'meng5@163.com'
        });
        await user.save();

        const response = await request(app)
            .get('/api/users/email/meng5@163.com');

        expect(response.status).toBe(200);
        expect(response.body.email).toBe('meng5@163.com');
    });

    it.skip('should return 404 if user is not found', async () => {
        const response = await request(app)
            .get('/api/users/email/nonexistent@example.com');

        expect(response.status).toBe(404);
        expect(response.text).toBe('User not found');
    });
});