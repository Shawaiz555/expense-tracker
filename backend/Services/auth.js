const jwt = require('jsonwebtoken');
const secretKey = 'H@cker';

function setUser(user) {
   try {
      const payload = {
         _id: user._id,
         email: user.email
      };
   
      return jwt.sign(payload, secretKey);
   }
   catch(err) {
      console.log(err);
      throw err;
   }
}

function getUser(token) {
   try {
      if(!token) {
         return null;
      }

      // Remove 'Bearer ' if present
      const actualToken = token.startsWith('Bearer ') ? token.slice(7) : token;
      
      return jwt.verify(actualToken, secretKey);
   }
   catch(err) {
      console.log(err);
      return null; 
   }
}

module.exports = {
   setUser,
   getUser
};