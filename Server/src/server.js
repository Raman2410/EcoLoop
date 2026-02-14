import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import ConnectDB from './config/db.js';
dotenv.config();

const app = express();
app.use(express.json(
  {limit: '50kb',
  extended: true,
}
));
app.use(express.urlencoded({limit: '50kb', extended: true}));
app.use(express.static('public'));
app.use(cors({
  origin: '*',
  credentials: true,

}));
ConnectDB();


const PORT = process.env.PORT||5000 ;

app.get('/', (req, res) => {
  res.send('Hello World!');
})
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});