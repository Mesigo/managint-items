const express = require('express')
const swaggerUi = require('swagger-ui-express')
const YAML = require('yamljs')
const mongoose = require('mongoose');
const { validate } = require('./models/Item');
require('dotenv').config(); // Load environment variables


const app = express()
app.use(express.json())


//load swagger yaml file
const swaggerDocument = YAML.load('./swagger.yaml')

//serve swagger ui
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

// Connect to MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_URI; // Get the connection string from .env
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('Failed to connect to MongoDB Atlas:', err));

// Define the Item schema and model
const itemSchema = new mongoose.Schema({
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


//Routes

//get all items
app.get('/items', async (req,res) => {
 try{
  const items = await Item.find()
  res.json(items)
} catch (err){
  res.status(500).json({ message: 'server error'})
}
})

//create new item
app.post('/items', async (req, res) =>{
  try{
    const newItem= new Item({
      name: req.body.name,
      email: req.body.email
  })
    const savedItem = await newItem.save()
    res.status(201).json(savedItem)
  } catch(err){
    res.status(500).json({ message: 'Server error' });
  }
 
})

//get an item by id
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

//update an item by id
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

//delet an item by id
app.delete('/items/:id', async (req, res)=>{
  try{
    // Check if the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }
    const deletedItem = Item.findByIdAndDelete(req.params.id)
  if(deletedItem){
    res.json({message: 'item deleted'})
  } else{
    res.status(404).json({ message: 'Item not found' });
  }
}catch(err){
  res.status(500).json({ message: 'server error'})
}
})


// Start the server
const PORT = 1000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});