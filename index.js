const express = require('express')
const mongoose = require('mongoose')
const swaggerUi = require('swagger-ui-express')
const YAML = require('yamljs')

const app = express()
app.use(express.json())


//load swagger yaml file
const swaggerDocument = YAML.load('./swagger.yaml')

//serve swagger ui
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

//in-memory data store
let items = []

//Routes
app.get('/items', (req,res) => {
  res.json(items)
})

app.post('/items', (req, res) =>{
  const newItem={
    id: items.length +1,
    name: req.body.name,
    email: req.body.email
  }
  items.push(newItem)
  res.status(201).json(newItem)
})

app.get('/items/:id', (req, res) =>{
  const item = items.find((i) => i.id === parseInt(req.params.id))
  if (item) {
    res.json(item);
  } else {
    res.status(404).json({ message: 'Item not found' });
  }
})

app.put('/items/:id', (req, res) =>{
  const index = items.findIndex(i => i.id === parseInt(req.params.id))
    if (index !== -1) {
      items[index] = { ...items[index], ...req.body };
      res.json(items[index]);
    } else {
      res.status(404).json({ message: 'Item not found' });
    }
});

app.delete('/items/:id', (req, res)=>{
  const index = items.findIndex(i => i.id === parseInt(req.params.id))
  if(index !== -1){
    items.splice(index, 1)
    res.json({message: 'item deleted'})
  } else{
    res.status(404).json({ message: 'Item not found' });
  }
})


// Start the server
const PORT = 1000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});