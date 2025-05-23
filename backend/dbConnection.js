const mongoose = require("mongoose");

mongoose.set('strictQuery',true);

async function connectMongoDb(url) {
   try
   {
      if(url)
      {
         return await mongoose.connect(url);
      }
   }
   catch(err)
   {
      console.log(err);
   }
}

module.exports = {
   connectMongoDb
};