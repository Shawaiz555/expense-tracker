const express = require('express');

const {handleAddBudget,handleGetAllBudgets,handleDeleteBudgets,handleUpdateBudgets} = require('../Controllers/budget');
const { restrictToAuthenticatedUserOnly } = require('../Middlewares/auth');
const budgetRouter = express.Router();

budgetRouter.use(restrictToAuthenticatedUserOnly);

budgetRouter.post('/addBudget',handleAddBudget);
budgetRouter.get('/getAllBudgets',handleGetAllBudgets);
budgetRouter.delete('/deleteBudget/:id',handleDeleteBudgets);
budgetRouter.put('/updateBudget/:id',handleUpdateBudgets);

module.exports = {
   budgetRouter
};