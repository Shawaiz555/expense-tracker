const express = require('express');

const {handleAddRegularExpense, handleGetAllRegularExpenses, handleDeleteRegularExpenses, handleUpdateRegularExpenses} = require('../Controllers/regularExpenses');
const { restrictToAuthenticatedUserOnly } = require('../Middlewares/auth');
const regularExpenseRouter = express.Router();

regularExpenseRouter.use(restrictToAuthenticatedUserOnly);

regularExpenseRouter.post('/addRegularExpense', handleAddRegularExpense);
regularExpenseRouter.get('/getAllRegularExpenses', handleGetAllRegularExpenses);
regularExpenseRouter.delete('/deleteRegularExpense/:id', handleDeleteRegularExpenses);
regularExpenseRouter.put('/updateRegularExpense/:id', handleUpdateRegularExpenses);

module.exports = {
   regularExpenseRouter
};