const redis = require('redis');

const client = redis.createClient();
client.connect();

client.on('error', err => console.log('Redis Client Error', err));

// await client.connect();
// await client.set('key', 'prakash');
// const value = await client.get('key');
// await client.disconnect();

client.on('connect', function() {
  console.log('Connected!');
  //const p =async ()=>await client.set('application', 'view360');
  //p();
});


client.set('key', '123');
const value = (async ()=>await client.get('key'))();
value.then((v)=> {
    console.log("value:" + v)
})

client.quit();