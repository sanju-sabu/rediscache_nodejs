const express = require("express");
const axios = require("axios");
const redis = require("redis");
const app = express();
const fs = require('fs');
const LocalStorage = require('node-localstorage').LocalStorage
const localStorage = new LocalStorage('./data');
const port = process.env.PORT || 3000;
//const bodyParser = require('body-parser');
const bodyParser = require('body-parser');
app.use(bodyParser.json());
const client = redis.createClient();
client.connect();
client.on('error', err => console.log('Redis Client Error', err));
client.on('connect', function() {
   console.log('Connected!');
   const p =async ()=>await client.set('application', 'view360');
   p();
 });

 //app.use(bodyParser.json());
const get =(key)=>{
    return (async ()=> await client.get(key))();
}
const set =(key,body)=>{
    client.set(key, JSON.stringify(body), {
        EX: 100,
        NX: true
      });
}
const deleteFromCache =(key)=>{
  return ( ()=>  client.del(key))();
}
const updateWithResponse =(key,res)=>{
    //console.log('send value:' + res.send);
    res.sendResponse = res.send; 
            res.send = (body) => {
                
                //cache.add(key, JSON.stringify(body),{expire: 30});
                set(key,body);
                console.log("Moved to cache!"+body);
                res.sendResponse(body);
            };
}
// Middleware for caching data in Redis Server
const cacheMiddleware = (req, res, next) => {
    var method = req.method;
    console.log("Http Method :"+method);
    const key = req.originalUrl;
    console.log("cacheMiddleware key :"+key);
    if(method=='GET')
    {
    const value = get(key);
    value.then((v)=> {
        console.log("value:" + v);
        if(v == null) {
          //  v = ""; //TODO:
           updateWithResponse(key,res);
            next();
        } else {
            console.log("From cache!")
            res.send(JSON.parse(v));
            return;
        }
    }, (err) => {
        console.log("error in get:" + err)
    })
  }
  else if(method=='POST')
  {
    
    console.log("Orginarl URl :"+req.originalUrl);
    //console.dir(req);
    const key2 =req.originalUrl+"/"+req.body.id;
    //const key2 =req.body.id;
    updateWithResponse(key2,res);
    next();
  }
  else if(method=='PUT')
  {
    console.log("Orginarl URl :"+req.originalUrl);
    //console.dir(req);
    const key3 =req.originalUrl;
     updateWithResponse(key3,res);
     console.log("PUT key :"+ key3);
    next();
  }
  else if(method== 'DELETE')
  {
    console.log("Orginarl URl :"+req.originalUrl);
    //console.dir(req);
    const key4 =req.originalUrl;
    deleteFromCache(key4,res);
    console.log("Delete key :"+ key4);
    next();
  }
  
}
app.use(cacheMiddleware);

app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

/* API for current year and date */
app.get('/currentDateTime', (req, res) => {
    const now = (new Date()).toString();
    console.log("currentDateTime:" + now);
    res.send(now);
});

/* API for finding age*/
app.get('/age/:birthYear', (req, res) => {
    const currentYear = new Date().getFullYear();
    const birthYear = req.params.birthYear;
    const age= currentYear-birthYear;
    console.log("Data generated from backend!");
    res.send(`You are ${age} years old.`);
});


//fs writer
app.post('/createFile', (req, res) => {
const filePath = req.body.filePath;
const content = req.body.content;
fs.writeFile(filePath, content, (err) => {
    if (err) {
    console.error(err);
    res.status(500).send('Failed to create file.');
    } else {
    console.log('File has been created.');
    res.send('File has been created.');
    }
});
});




// CREATE endpoint
app.post('/api/items', (req, res) => {

  const id = req.body.id;
  const value = req.body.value;
  console.log("key :"+id);
  console.log("Value :"+value)
  console.log(req.body);
  localStorage.setItem(id, value);

  res.send('Item added');

});

// READ endpoint
app.get('/api/items/:id', (req, res) => {
  const id = req.params.id;
  console.log(id);
  const value = localStorage.getItem(id);
    
  if (value === null) {
    res.status(404).send('Item not found');
  } else {
    res.send(value);
  }
});

// UPDATE endpoint
app.put('/api/items/:id', (req, res) => {
  const id = req.params.id;
  const value = req.body.value;

  if (localStorage.getItem(id) === null) {
    res.status(404).send('Item not found');
  } else {
    localStorage.setItem(id, value);
    res.send('Item updated');
  }
});

// DELETE endpoint
app.delete('/api/items/:key', (req, res) => {
  const key = req.params.key;

  if (localStorage.getItem(key) === null) {
    res.status(404).send('Item not found');
  } else {
    localStorage.removeItem(key);
    res.send('Item deleted');
  }
});

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});