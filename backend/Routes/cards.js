const express = require('express');

const { handleAddCardData, handleGetCardData, handleUpdateCardData } = require('../Controllers/cards');
const { restrictToAuthenticatedUserOnly } = require('../Middlewares/auth');

const cardsRouter = express.Router();

cardsRouter.use(restrictToAuthenticatedUserOnly);

cardsRouter.post('/addCardData',handleAddCardData);
cardsRouter.put('/updateCardData',handleUpdateCardData);
cardsRouter.get('/getCardData',handleGetCardData);

module.exports = {
   cardsRouter
};
