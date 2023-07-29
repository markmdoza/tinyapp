const express = require('express');
const app = express();
const PORT = 8080; // default port 8080

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

function generateRandomString() {
  // Set length to 6.
  const length = 6;
  // Display characters to work with.
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  // Hold the result in a variable.
  let urlID = ' ';
  // Loop through the characters variable.
  for (let i = 0; i < length; i++) {
    // Add result and characters together.
    urlID += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  // Return a string of 6 random alphanumeric characters.
  return urlID;
}

// console.log(generateRandomString(5));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xk": "http://www.google.com"
};

app.get('/', (req,res) => {
  res.send('Hello!');
});

app.get('/urls', (req, res) => {
  const urlData = { urls: urlDatabase};
  res.render('urls_index', urlData);
});

app.get('/urls/new', (req, res) => {
  res.render('urls_new');
});

app.post('/urls', (req, res) => {
  const { longURL } = req.body;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { 
    id: req.params.id, 
    longURL: urlDatabase[req.params.id]
};
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];
  
  if(longURL) {
    res.redirect(longURL);
  } else {
    res.status(404).send('Short URL not found');
  }
});


app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});