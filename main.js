const fs = require('fs');
const fsImg = require('fs');
const axios = require('axios');
const puppeteer = require('puppeteer');
const readline = require('readline');
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

var output;
var nomePDF;
var lines = [];

let mainWindow;
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 900,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
    },
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (err) {
    return false;
  }
}
async function renderPageToImage(url, filename) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(url);

  // Adjust viewport
  await page.setViewport({ width: 800, height: 600 });
  
  await page.screenshot({ path: filename, fullPage: true });

  await browser.close();
  console.log('Page rendered to image successfully!');


}
ipcMain.on('processaLink', async (event, [url, _id,_pagina]) => {
  var temlinha=lines.indexOf(url.trim())
  console.log("temlinha", temlinha);
  //console.log(url, 'SCREENSHOTS/' +nomePDF+ _pagina + ".jpg");

  axios.get(url)
    .then(response => {
      /*
      fs.writeFile('SCREENSHOTS/'+_id+".png", response.data, (err) => {
        if (err) throw err;
        console.log('Image downloaded successfully!');
      });
      */
      // Check if the response status code indicates a successful request
      if (response.status === 200) {
        // Response contains the HTML content
        const html = response.data;

        // You can save the HTML source code to a file if needed
        //fs.writeFileSync('webpage.html', html);

        console.log('Web page loaded successfully!');
        console.log('HTML content:');
        console.log(html.length);
        if (html.length > 10) {
          event.sender.send('QRCodeProcessado', ["url ok!", _id,temlinha]);
          output.write(url + ";" + _id + ";" + "url ok!\n");

        } else {
          event.sender.send('QRCodeProcessado', ["link vazio...", _id,temlinha]);
          output.write(url + ";" + _id + ";" + "link vazio...\n");
        }
      } else {
        console.log('Failed to load the web page. Status code: ' + response.status);
        event.sender.send('QRCodeProcessado', ["url com erro...", _id,temlinha]);
        output.write(url + ";" + _id + ";" + "url com erro..\n");
      }
    })
    .catch(error => {
      event.sender.send('QRCodeProcessado', [error, _id,temlinha]);
      output.write(url + ";" + _id + ";" + "talvez nao seja QRCODE...\n");
    })

    if(isValidUrl(url)){
      renderPageToImage(url, 'SCREENSHOTS/'+nomePDF+'_pagina_' + _pagina + ".jpg")
      .catch(error => console.error('Error rendering page to image:', error));
    }

})
ipcMain.on('abrearquivoTxt', async (event, nome) => {

  readFileToArray("TXT/"+nome)
  .then(lines => {
    //console.log('Array of lines:', lines);
  })
  .catch(err => {
    //console.error('Error reading file:', err);
  });
});
ipcMain.on('abrearquivo', async (event, nome) => {
  nomePDF=nome.substring(0, nome.lastIndexOf("."));
  output = fs.createWriteStream("PDF/" + nomePDF + ".txt");
  output.once('open', function (fd) {
    output.write("URL;ID;Resultado:\n");
  });
});
ipcMain.on('fim', async (event, oque) => {
  console.log("fim")
  output.end();
});


function readFileToArray(filePath) {
  return new Promise((resolve, reject) => {
    
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      crlfDelay: Infinity
    });

    rl.on('line', (line) => {
      lines.push(line.trim());
    });

    rl.on('close', () => {
      resolve(lines);
    });

    rl.on('error', (err) => {
      reject(err);
    });
  });
}

