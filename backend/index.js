const cookieParser = require('cookie-parser');
const express = require('express');
const cors = require("cors"); 
const { connectMongoDb } = require('./dbConnection');
const { userRouter } = require('./Routes/user');
const { regularExpenseRouter } = require('./Routes/regularExpenses');
const { budgetRouter } = require('./Routes/budget');
const { recurringExpensesRouter } = require('./Routes/recurringExpenses');
const { cardsRouter } = require('./Routes/cards');
const app = express();
const port = 5000;

app.use(cors({
   origin: 'http://localhost:3000',
   credentials: true
}));

connectMongoDb('mongodb://localhost:27017/expense-tracker')
.then(()=> console.log("Connected to MongoDb..."))
.then((err)=>{
   if(err) console.log("Error connecting to MongoDb: ", err);
})

app.use(express.json());
app.use(cookieParser());

app.use('/user',userRouter);
app.use('/regularExpense',regularExpenseRouter);
app.use('/budget',budgetRouter);
app.use('/recurringExpense',recurringExpensesRouter);
app.use('/card',cardsRouter);


app.listen(port,()=> console.log(`Connected to Server at port: ${port}`));