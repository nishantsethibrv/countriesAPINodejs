const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const app = express();
const cors = require('cors');

const PORT = 8080;
app.use(express.json());
app.use(cors());
app.use('/images', express.static(path.join(__dirname, 'images')));

app.get('/countries', (req, res) => {
    fs.readFile('./data.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Error reading data file' });
        }
        
        const jsonData = JSON.parse(data);
        
        const countries = jsonData.countries.map((country, index) => ({
            id: index + 1,        // Generate a dynamic ID starting from 1
            name: country.name,
            continent: country.continent,
            flag: country.flag,
            rank: country.rank,
        }));
        // console.log(countries)
        res.json(countries);
    });
});

app.get('/country/:id', (req, res) => {
    const countryId = parseInt(req.params.id); // Get the country ID from the URL
    fs.readFile('./data.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Error reading data file' });
        }

        const jsonData = JSON.parse(data);
        
        const country = jsonData.countries[countryId - 1];

        if (country) {
            res.json(country);
        } else {
            res.status(404).json({ message: 'Country not found' });
        }
    });
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './images'); 
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 4 * 1024 * 1024 }, // Limit file size to 4MB
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
      } else {
        cb(new Error('Only .jpg and .png files are allowed'), false);
      }
    },
  });
  let countriesData = require('./data.json');



app.post('/country', upload.single('image'), (req, res) => {
    const { name, continent, rank } = req.body;
  
    if (!name || name.length < 3 || name.length > 20) {
      return res.status(400).json({ message: 'Country name must be between 3 and 20 characters.' });
    }
  
    if (!continent) {
      return res.status(400).json({ message: 'Continent is required.' });
    }
    if (!rank || isNaN(rank)) {
      return res.status(400).json({ message: 'Rank must be a numeric value.' });
    }
  
    let flag = req.file ? `images/${req.file.filename}` : '';
  
    const newCountry = {
      id: Date.now(),
      name,
      continent,
      rank: Number(rank),
      flag,
    };
    console.log(newCountry, "newCountry")
    const countries = JSON.parse(data).countries;
    
    const nameExists = countries.some(country => country.name.toLowerCase() === newCountry.name.toLowerCase());
    const rankExists = countries.some(country => country.rank === newCountry.rank);

    if (nameExists) {
      return res.status(400).json({ error: 'Country name must be unique.' });
    }
    if (rankExists) {
      return res.status(400).json({ error: 'Country rank must be unique.' });
    }
    countriesData.countries.push(newCountry);
  
    fs.writeFile(path.join(__dirname, 'data.json'), JSON.stringify(countriesData, null, 2), (err) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to save country data.' });
      }
      res.status(201).json({ message: 'Country added successfully!', country: newCountry });
    });
  });
  

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});



