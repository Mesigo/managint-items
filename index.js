const express = require('express')
const swaggerUi = require('swagger-ui-express')
const YAML = require('yamljs')
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

require('dotenv').config(); 


const app = express()
app.use(express.json())



const swaggerDocument = YAML.load('./swagger.yaml')


app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

// Connect to MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_URI; // Get the connection string from .env
mongoose.connect(MONGODB_URI,)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('Failed to connect to MongoDB Atlas:', err));

// Define the Item schema and model
const itemSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,  // ✅ Use ObjectId type
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
 },
});

const Item = mongoose.model('Item', itemSchema);

const userSchema = new mongoose.Schema({
  username: {type: String, required: true, unique: true},
  password: {type: String, required: true}
})
const User = mongoose.model('User', userSchema)


//Routes

app.post('/register', async (req, res) =>{
  try {
    const { username, password} = req.body
    // Check if the username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
       // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)
     
    const user = new User({ username, password: hashedPassword})
    await user.save()
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
  })


  app.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      console.log('Login attempt:', username, password);
  
      const user = await User.findOne({ username });
      if (!user) {
        console.log('User not found');
        return res.status(401).json({ message: 'Invalid username or password' });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.log('Password mismatch');
        return res.status(401).json({ message: 'Invalid username or password' });
      }
  
      const token = jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.json({ token });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });


app.get('/items', async (req,res) => {
 try{
   // Get page and limit from query parameters (default to page 1 and limit 10)
  const page = parseInt(req.query.page) || 1 // default to page 1
  const limit = parseInt(req.query.limit) || 10 //default to 10 items per page
  const skip = (page - 1) * limit // Number of items to skip

  const items = await Item.find()
  res.json(items)
} catch (err){
  res.status(500).json({ message: 'server error'})
}
})


app.post('/items', async (req, res) =>{
  try{
    const newItem= new Item({
      _id: new mongoose.Types.ObjectId(),
      name: req.body.name,
      email: req.body.email
  })
    const savedItem = await newItem.save()
    res.status(201).json(savedItem)
  } catch(err){
    // If the error is related to validation (e.g., invalid email)
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
 
})


app.get('/items/:id', async (req, res) =>{
  try{
    // Check if the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }
    const item = await Item.findById((req.params.id))
  if (item) {
    res.json(item);
  } else {
    res.status(404).json({ message: 'Item not found' });
  }
  } catch (err){
    res.status(500).json({ message: 'server error'})
  }

})


app.put('/items/:id', async (req, res) =>{
  try{ 
    // Check if the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }
    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        email: req.body.email,
      },
      { new: true } // Return the updated document
    );
    if (updatedItem) {
      res.json(updatedItem);
    } else {
      res.status(404).json({ message: 'Item not found' });
    }
  } catch (err){
      res.status(500).json({message: 'server error'})
  }
});


app.delete('/items/:id', async (req, res)=>{
  try{
    // Check if the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }
    const deletedItem = await Item.findByIdAndDelete(req.params.id)
  if(deletedItem){
    res.json({message: 'item deleted'})
  } else{
    res.status(404).json({ message: 'Item not found' });
  }
}catch(err){
  res.status(500).json({ message: 'server error'})
}
})



const PORT = 1000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});