const fs = require('fs');
const axios = require('axios');
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

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
ipcMain.on('output-url', async (event, [pdfPath1, _id]) => {
  console.log("ipcMain", pdfPath1, _id);
  axios.get(pdfPath1)
    .then(response => {
      // Check if the response status code indicates a successful request
      if (response.status === 200) {
        // Response contains the HTML content
        const html = response.data;

        // You can save the HTML source code to a file if needed
        //fs.writeFileSync('webpage.html', html);

        console.log('Web page loaded successfully!');
        console.log('HTML content:');
        console.log(html.length);
        if(html.length>10){
          event.sender.send('output-done', ["url ok!", _id]);
        }else{
          event.sender.send('output-done', ["link vazio...", _id]);
        }
      } else {
        console.log('Failed to load the web page. Status code: ' + response.status);
        event.sender.send('output-done', ["url com erro...", _id]);
      }
    })
    .catch(error => {
      event.sender.send('output-done', ["talvez nao seja QRCODE...", _id]);
    })

})

ipcMain.on('merge-pdfs', async (event, [pdfPath1]) => {
  console.log("ipcMain", pdfPath1);
  try {
    console.log("pdfPath1", pdfPath1);
    //await findQRCodeInPDF(pdfPath1, 1);
    event.sender.send('merge-pdfs-done', "feito o merge...");
  } catch (error) {
    event.sender.send('merge-pdfs-error', error.message);
  }
});

