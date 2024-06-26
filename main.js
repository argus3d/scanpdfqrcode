const fs = require('fs');
const fsImg = require('fs');
const axios = require('axios');
const axiosRetry = require('axios-retry').default;
const http = require('http');
const https = require('https');
const puppeteer = require('puppeteer');
const readline = require('readline');
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

var output;
var nomePDF;
var nomePDF_elementos = [];
var lines = [];
var caminho = "";


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

ipcMain.on('processaLink', async (event, [url, _id, _pagina, _salva]) => {

  var temlinha = lines.indexOf(url.trim())
  console.log("temlinha", url, temlinha, _salva);
  //console.log(url, 'SCREENSHOTS/' +nomePDF+ _pagina + ".jpg");
  let voltaLine = "não encontrado na planilha";
  if (temlinha > -1) {
    voltaLine = lines[temlinha];
  }
  let base_anos = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
  let base_componentes = ["EF21", "EF22", "EF23", "EF24", "EF25"];
  let base_livros = ["L1", "L2", "L3", "L4"];
  let base_anuais = ["ING", "ESP"];

  let componente = "";
  let ano = "";
  let livro = "";
  let anual = "";
  for (let i = 0; i < base_componentes.length; i++) {
    if (nomePDF_elementos.indexOf(base_componentes[i]) > -1) {
      componente = base_componentes[i];
      break;
    }
  }
  for (let i = 0; i < base_anos.length; i++) {
    if (nomePDF_elementos.indexOf(base_anos[i]) > -1) {
      ano = base_anos[i];
      break;
    }
  }
  for (let i = 0; i < base_livros.length; i++) {
    if (nomePDF_elementos.indexOf(base_livros[i]) > -1) {
      livro = base_livros[i];
      break;
    }
  }
  for (let i = 0; i < base_anuais.length; i++) {
    if (nomePDF_elementos.indexOf(base_anuais[i]) > -1) {
      anual = base_anuais[i];
      break;
    }
  }

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

            if (url.includes(".pdf")) {
              respostaTexto = "pdf";
            }
            if (response.data.includes("subscribers")) {
              respostaTexto = "vídeo no youtube";
            }

            if (response.data.includes("sae-digital-home")) {
              respostaTexto = "link não cadastrado";
            }
            if (_salva) {
              renderPageToImage(url, caminho + 'SCREENSHOTS/' + nomePDF + '_pagina_' + _pagina + ".jpg")
                .catch(error => console.error('Error rendering page to image:', error));
            }

            event.sender.send('QRCodeProcessado', [respostaTexto, _id, voltaLine]);
            output.write(componente + ";" + ano + ";" + livro + ";" + anual + ";" + url + ";" + _pagina + ";" + respostaTexto + "\n");
          } else {
            event.sender.send('QRCodeProcessado', ["link vazio...", _id, voltaLine]);
            output.write(componente + ";" + ano + ";" + livro + ";" + anual + ";" + url + ";" + _pagina + ";" + "link vazio...\n");
          }
        } else {
          console.log('Failed to load the web page. Status code: ' + response.status);
          event.sender.send('QRCodeProcessado', ["url com erro...", _id, voltaLine]);
          output.write(componente + ";" + ano + ";" + livro + ";" + anual + ";" + url + ";" + _pagina + ";" + "url com erro..\n");
        }
      })
      .catch(error => {
        event.sender.send('QRCodeProcessado', ["erro ao buscar URL", _id, voltaLine]);
        output.write(componente + ";" + ano + ";" + livro + ";" + anual + ";" + url + ";" + _pagina + ";" + "erro\n");
      })
  } else {
    event.sender.send('QRCodeProcessado', ["Link invalido", _id, voltaLine]);
    output.write(componente + ";" + ano + ";" + livro + ";" + anual + ";" + url + ";" + _pagina + ";" + "link invalido\n");
  }

})
ipcMain.on('abrearquivoTxt', async (event, nome) => {

  readFileToArray(caminho + "TXT/" + nome)
    .then(lines => {
      //console.log('Array of lines:', lines);
    })
    .catch(err => {
      //console.error('Error reading file:', err);
    });
});
ipcMain.on('abrearquivo', async (event, nome) => {
  nomePDF = nome.substring(0, nome.lastIndexOf("."));
  nomePDF_elementos = nomePDF.split("_");
  output = fs.createWriteStream(caminho + "PDF/" + nomePDF + ".txt");
  output.once('open', function (fd) {
    output.write("URL;ID;Resultado:\n");
  });
});
ipcMain.on('fim', async (event, oque) => {
  console.log("fim")
  output.end();
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


