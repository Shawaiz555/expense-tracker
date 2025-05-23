const User = require("../Models/user");
const { setUser } = require("../Services/auth");

async function handleUserSignup(req, res) {
   try {
      const { name, email, password, confirmPassword } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) 
      {
         return res.status(400).json({ message: 'User Already Exists...!' });
      }

      await User.create({ name, email, password, confirmPassword });

      return res.status(201).json({ status: "Success" });
   } catch (err) 
   {
      console.error(err);
      return res.status(500).json({ message: 'Internal Server Error' });
   }
}


async function handleUserLogin(req, res) {
   try {
      const { email, password } = req.body;
      const user = await User.findOne({ email, password });

      if (!user) {
         return res.status(404).json({ message: 'User Not Found...!' });
      }

      const userToken = setUser(user);
      
      // Set cookie with proper options
      res.cookie('Token', userToken, {
         httpOnly: false, // Allow JavaScript access
         secure: process.env.NODE_ENV === 'production', // true in production
         sameSite: 'lax', // Less strict for development
         path: '/',
         maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      return res.status(200).json({
         status: 'Success',
         token: userToken // Send token in response for Authorization header
      });
   }
   catch (err) {
      console.error("Login error:", err);
      return res.status(500).json({ message: 'Login failed' });
   }
}

function handleLogoutUser(req, res) {
   try {
      // Clear cookie with matching options
      res.clearCookie("Token", {
         httpOnly: false,
         secure: process.env.NODE_ENV === 'production',
         sameSite: 'lax',
         path: "/"
      });

      return res.status(200).json({ message: "Logged out successfully" });
   } catch (error) {
      console.error("Logout error:", error);
      return res.status(500).json({ message: "Logout failed" });
   }
}

module.exports = {
   handleUserSignup,
   handleUserLogin,
   handleLogoutUser
};