const express = require('express');

const {handleAddRecurringExpense,handleGetAllRecurringExpenses,handleDeleteRecurringExpense,handleUpdateRecurringExpense} = require('../Controllers/recurringExpenses');
const { restrictToAuthenticatedUserOnly } = require('../Middlewares/auth');
const recurringExpensesRouter = express.Router();

recurringExpensesRouter.use(restrictToAuthenticatedUserOnly);

recurringExpensesRouter.post('/addRecurringExpense',handleAddRecurringExpense);
recurringExpensesRouter.get('/getAllRecurringExpenses',handleGetAllRecurringExpenses);
recurringExpensesRouter.delete('/deleteRecurringExpense/:id',handleDeleteRecurringExpense,);
recurringExpensesRouter.put('/updateRecurringExpense/:id',handleUpdateRecurringExpense);

module.exports = {
   recurringExpensesRouter
};