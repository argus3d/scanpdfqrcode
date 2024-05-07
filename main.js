const fs = require('fs');
const fsImg = require('fs');
const axios = require('axios');
const http = require('http');
const https = require('https');
const puppeteer = require('puppeteer');
const readline = require('readline');
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

var output;
var nomePDF;
var lines = [];
var caminho="../../";
//var caminho="";

let mainWindow;
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 900,
    icon: 'qr.ico',
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

ipcMain.on('processaLink', async (event, [url, _id, _pagina, _salva]) => {
  var temlinha = lines.indexOf(url.trim())
  console.log("temlinha", url, temlinha, _salva);
  //console.log(url, 'SCREENSHOTS/' +nomePDF+ _pagina + ".jpg");
  let voltaLine = "não encontrado na planilha";
  if (temlinha > -1) {
    voltaLine = lines[temlinha];
  }

  if (isValidUrl(url)) {
    axios.get(url)
      .then(response => {
        if (response.status === 200) {
          const html = response.data;
          if (html.length > 10) {
            event.sender.send('QRCodeProcessado', ["url ok!", _id,voltaLine]);
            output.write(url + ";" + _id + ";" + "url ok!\n");
            if (_salva) {
              renderPageToImage(url, caminho+'SCREENSHOTS/' + nomePDF + '_pagina_' + _pagina + ".jpg")
                .catch(error => console.error('Error rendering page to image:', error));
            }
          } else {
            event.sender.send('QRCodeProcessado', ["link vazio...", _id, voltaLine]);
            output.write(url + ";" + _id + ";" + "link vazio...\n");
          }
        } else {
          console.log('Failed to load the web page. Status code: ' + response.status);
          event.sender.send('QRCodeProcessado', ["url com erro...", _id, voltaLine]);
          output.write(url + ";" + _id + ";" + "url com erro..\n");
        }
      })
      .catch(error => {
        event.sender.send('QRCodeProcessado', [error, _id, voltaLine]);
        output.write(url + ";" + _id + ";" + "talvez nao seja QRCODE...\n");
      })
  } else {
    event.sender.send('QRCodeProcessado', ["Link invalido", _id, voltaLine]);
    output.write(url + ";" + _id + ";" + "link invalido\n");
  }

})
ipcMain.on('abrearquivoTxt', async (event, nome) => {

  readFileToArray(caminho+"TXT/" + nome)
    .then(lines => {
      //console.log('Array of lines:', lines);
    })
    .catch(err => {
      //console.error('Error reading file:', err);
    });
});
ipcMain.on('abrearquivo', async (event, nome) => {
  nomePDF = nome.substring(0, nome.lastIndexOf("."));
  output = fs.createWriteStream(caminho+"PDF/" + nomePDF + ".txt");
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


