const { getUser } = require("../Services/auth");

function restrictToAuthenticatedUserOnly(req, res, next) {
   try 
   {
      // Check both cookie and Authorization header
      const token = req.cookies?.Token || req.headers.authorization?.split(' ')[1];

      if (!token) 
      {
         return res.status(401).json({ msg: 'Unauthenticated User...!' });
      }

      const user = getUser(token);
      if(!user)
      {
         return res.status(401).json({ msg: 'Invalid Token, Authentication Required...!' });
      }

      req.user = user;
      next();
   }
   catch (err) 
   {
      console.error("Authentication Error:", err);
      return res.status(401).json({ msg: 'Authentication Failed...!' });
   }
}

module.exports = {
   restrictToAuthenticatedUserOnly
};