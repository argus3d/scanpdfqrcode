const fs = require('fs');
const fsImg = require('fs');
const axios = require('axios');
const axiosRetry = require('axios-retry').default;
const http = require('http');
const https = require('https');


const puppeteer = require('puppeteer');
const readline = require('readline');
const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');



var output;
var nomePDF;
var nomePDF_elementos = [];
var lines = [];
var caminho = "";
var outputPathHtml;
var i_img = 0;

axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
});

// Import the functions you need from the SDKs you need

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
/*
const admin = require('firebase-admin');
const serviceAccount = require("./pdfscan.json");

admin.initializeApp({

  credential: admin.credential.cert(serviceAccount),

  databaseURL: "https://pdfscan-11aa5-default-rtdb.firebaseio.com"

});
const db = admin.database();


function saveData(name, year, description) {
  const ref = db.ref('information');
  const newData = ref.push();
  newData.set({
    name: name,
    year: year,
    description: description
  }, (error) => {
    if (error) {
      console.log('Data could not be saved.' + error);
    } else {
      console.log('Data saved successfully.');
    }
  });
}
*/



let mainWindow;
function createWindow() {

  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    icon: path.join(__dirname, 'assets', 'qr.ico'),
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

const isDev = process.env.NODE_ENV === 'development';




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

  await page.goto(url, { 'waitUntil': 'networkidle0' });
  // Adjust viewport
  await page.setViewport({ width: 1280, height: 720 });
  /*
  if (url.includes("OD1") || url.includes("OD2") || url.includes("OD3")) {
    await iframe.waitForSelector('.css-ln3ne7', { hidden: true });
    await page.screenshot({ path: filename, fullPage: false });
    await browser.close();
  } else {
    await page.screenshot({ path: filename, fullPage: false });
    await browser.close();
  }
  */
  await page.screenshot({ path: filename, fullPage: false });
  await browser.close();
  console.log('Page rendered to image successfully!');

}
ipcMain.on('mandaEnv', async (event) => {
  console.log("process.env.NODE_ENV ", isDev);
  event.sender.send("voltaEnv", isDev);

});

ipcMain.on('save-image', async (event, [dataURL, _pagina, _url]) => {

  const base64Data = dataURL.split(',')[1];
  const buffer = Buffer.from(base64Data, 'base64');

  const filePath = "OUTPUT/" + nomePDF + '/IMG/' + nomePDF + '_' + i_img + '.jpg';

  fs.mkdir("OUTPUT/" + nomePDF + '/IMG/', { recursive: true }, (err) => {
    fs.writeFile(filePath, buffer, (err) => {
      if (err) {
        console.error('Error saving image:', err);
        return;
      }
      //console.log('Image saved successfully at:', filePath,_url);
      const imgTag = `<li>
      <a href="${'IMG/' + nomePDF + '_' + i_img + '.jpg'}" target="_blank">
          <img src="${'IMG/' + nomePDF + '_' + i_img + '.jpg'}"
             alt="Página: ${_pagina}"> 
      </a>
      <h2>Pagina: ${_pagina}</h2>
      <a href="${_url}" target="_blank">${_url}</a>
      </li>`;

      i_img++;
      fs.appendFile(outputPathHtml, imgTag, (err) => {
        if (err) console.error('Error updating HTML file:', err);
      });
    });
  });
});

ipcMain.on('processaLink', async (event, [url, _id, _pagina, _salva]) => {
  var voltaLine;
  let urlLowerCase = url.trim().toLowerCase();
  try {
    const foundLine = lines.find(line => line.toLowerCase().includes(urlLowerCase));

    if (foundLine) {
      voltaLine = "URL encontrada! " + foundLine;
    } else {
      voltaLine = "URL não encontrada.";
    }
  } catch (err) {
    console.error('Error reading file:', err);
    voltaLine = "Erro ao ler o arquivo.";
  }
  console.log("temlinha?", voltaLine);



  if (isValidUrl(url)) {
    // axios retry aqui?


    axios.get(url, { timeout: 30000 })
      .then(response => {
        if (response.status === 200) {
          const html = response.data;
          if (html.length > 10) {
            let respostaTexto = "url ok!";
            //saveData(url, ano, componente);



            if (url.includes(".mp4")) {
              respostaTexto = "video";
            }
            if (url.includes("OD1")) {
              respostaTexto = "objeto digital";
            }
            if (url.includes("OD2")) {
              respostaTexto = "objeto digital";
            }
            if (url.includes("OD3")) {
              respostaTexto = "objeto digital";
            }
            if (url.includes("youtube")) {
              respostaTexto = "vídeo youtube";
            }
            if (response.data.includes("vimeo")) {
              respostaTexto = "vídeo vimeo";
            }
            if (response.data.includes("<title>Player</title>")) {
              respostaTexto = "player de video";
            }
            if (url.includes(".pdf")) {
              respostaTexto = "pdf";
            }
            if (response.data.includes("subscribers")) {
              respostaTexto = "vídeo no youtube";
            }
            if (response.data.includes("sae-digital-home")) {
              respostaTexto = "link não cadastrado";
            }
            if (response.data.includes("S3")) {
              respostaTexto = "objeto não cadastrado";
            }
            if (_salva) {
              fs.mkdir(caminho + 'SCREENSHOTS/', { recursive: true }, (err) => {
                renderPageToImage(url, caminho + 'SCREENSHOTS/' + nomePDF + '_pagina_' + _pagina + ".jpg")
                  .catch(error => console.error('Error rendering page to image:', error));
              });
            }

            event.sender.send('QRCodeProcessado', [respostaTexto, _id, voltaLine]);
            output.write(url + ";" + _pagina + ";" + respostaTexto + ";" + voltaLine + "\n");
          } else {
            event.sender.send('QRCodeProcessado', ["link vazio...", _id, voltaLine]);
            output.write(url + ";" + _pagina + ";" + "link vazio..." + ";" + voltaLine + "\n");
          }
        } else {
          console.log('Failed to load the web page. Status code: ' + response.status);
          event.sender.send('QRCodeProcessado', ["url com erro...", _id, voltaLine]);
          output.write(url + ";" + _pagina + ";" + "url com erro.." + ";" + voltaLine + "\n");
        }
      })
      .catch(error => {
        event.sender.send('QRCodeProcessado', ["erro no software", _id, voltaLine]);
        output.write(url + ";" + _pagina + ";" + "erro no software" + ";" + voltaLine + "\n");
      })
  } else {
    event.sender.send('QRCodeProcessado', ["Link invalido", _id, voltaLine]);
    output.write(url + ";" + _pagina + ";" + "link invalido" + ";" + voltaLine + "\n");
  }

})
ipcMain.on('abrearquivoTxt', async (event, nome) => {
  try {
    i_img = 0;
    const lines = await readFileToArray(caminho + "TXT/" + nome);
    const lowerCaseLines = lines.map(line => line.toLowerCase());
    console.log('Array of lines in lowercase:', lowerCaseLines);
    // You can also choose to do something else with lowerCaseLines here
  } catch (err) {
    console.error('Error reading file:', err);
  }
});
ipcMain.on('abrearquivo', async (event, nome) => {
  nomePDF = nome.substring(0, nome.lastIndexOf("."));
  nomePDF_elementos = nomePDF.split("_");
  fs.mkdir("OUTPUT/" + nomePDF + '/IMG/', { recursive: true }, (err) => {
    output = fs.createWriteStream(caminho + "OUTPUT/" + nomePDF + "/" + nomePDF + ".csv");
    output.once('open', function (fd) {
      output.write("URL;PAGINA PROGRAMA;TESTE AUTOMATIZADO URL;BUSCA NA PLANILHA; \n");
    });


    let outputHtml = `
    <html>
    <head>
      <title>Relatório de Páginas</title>
      <style>
        body { font-family: Arial; margin: 20px;}
        img { max-width: 40%; height: auto;  border-style: solid;transition: max-width .25s;}
        img:hover{max-width: 80%;}
        li{display:flex;flex-direction:column;padding: 15px;width:30%}
        ul{display:flex;flex-wrap:wrap}
      </style>
    </head>
    <body>
      <h1>Relatório de ${nomePDF}:</h1>
      <ul>
  `;
    outputPathHtml = path.join("OUTPUT", nomePDF, nomePDF + ".html");
    fs.writeFile(outputPathHtml, outputHtml, (err) => {
      if (err) console.error('Error creating HTML file:', err);
    });
  });
});
ipcMain.on('fim', async (event, oque) => {
  console.log("fim")
  //output.end();
});

function encontraElemento(_tem) {
  var string = null;
  for (let i = 0; i < nomePDF_elementos.length; i++) {
    if (nomePDF_elementos[i] == _tem) {
      return nomePDF_elementos[i];
      break;
    }
  }
  return string;
}

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


