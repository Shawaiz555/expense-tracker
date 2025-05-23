const express = require('express');
const { handleUserSignup, handleUserLogin, handleLogoutUser } = require('../Controllers/user');

const userRouter = express.Router();

userRouter.post('/signup',handleUserSignup);
userRouter.post('/login',handleUserLogin);
userRouter.post('/logout',handleLogoutUser);

module.exports = {
   userRouter
};