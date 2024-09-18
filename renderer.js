const versao = 0.4;
document.title = "Scanner de QRcodes Hub Curitiba V" + versao + " alpha";
document.querySelector("#txtVersao").innerText = "V" + versao + " alpha";
const folderInput = document.getElementById('folderInput');



import QrScanner from "./qr-scanner.min.js";
//modal fim
const tutorialElements = document.querySelectorAll('.tuto');
const telaAbertura = document.querySelector('#telaAbertura');
const telaTutorial = document.querySelector('#telaTutorial');
const telaEscolhaModo = document.querySelector('#telaEscolhaModo');
const telaCarregando = document.querySelector('#telaCarregando');
const telaHelp = document.querySelector('#telaHelp');
const telaFim = document.querySelector('#telaFim');
const fillBar = document.querySelector('#fillBar');
const btIniciaTutorial = document.querySelector('#btIniciaTutorial');
const btPulaTutorial = document.querySelector('#btPulaTutorial');
const btHelp = document.querySelector('#btHelp');
const btFechaFim = document.querySelector('#btFechaFim');
const btEscolha1 = document.querySelector('#btEscolha1');
const btEscolha2 = document.querySelector('#btEscolha2');
const btEscolha3 = document.querySelector('#btEscolha3');
//
//configuracoes
const scanMethodDropdown = document.querySelector('#scanMethodDropdown');
const qrcodeDropdown = document.querySelector('#qrcodeDropdown');
const inputEscala = document.querySelector('#inputEscala');
const btFechaConfig = document.querySelector('#btFechaConfig');
const configuracoesUI = document.querySelector('.configuracoesUI');
const btAbreConfig = document.querySelector('#btAbreConfig');
const menuconfiguracoesUI = document.querySelector('.menuconfiguracoesUI');
const checkboxImagens = document.getElementById('checkboxImagens');
const checkboxLista = document.getElementById('checkboxLista');
const checkboxSalvaImagens = document.getElementById('checkboxSalvaImagens');
const checkboxMulti = document.getElementById('checkboxMulti');
//
const btProcessar = document.querySelector('#btProcessar');
const btProcessarCancela = document.querySelector('#btProcessarCancela');
const tabela = document.querySelector('.tabela');
const fileInputPdf = document.getElementById('fileInputPdf');
const fileInputTxt = document.getElementById('fileInputTxt');
let currentIndex = 0;
var imagensPaginas = document.getElementById('imagensPaginas');
var nPag = document.getElementById('nPag');
var nQr = document.getElementById('nQr');
var pageNumber = 1;
var i_qrcodes = 0;
var i_qrcodesTested = 0;
var id_count = 0;
var pdf_count = 0;
var totalPages;
var data = [];
var batchpdf = false;
var qrcodesDuplicados = [];
var podeEscanear = true;
var escolhaQrcode = "10qrcodes";
var files;
var pdfFiles;
var tamanhoViewPdf={width:0,height:0};
//------------------>quando for fazer a build "npm run package":
//var caminho = "../../";
//------------------>pra dev:
var caminho = "./";
var url = '';
//aqui verificamos se esta sendo rodado em DEV
electron.ipcRenderer.send('mandaEnv');
electron.ipcRenderer.on('voltaEnv', (e, data) => {
    console.log("recebeu env", data);
    if (data) {
        caminho = "./";
    } else {
        caminho = "../../";
    }
})

var PDFJS = window['pdfjs-dist/build/pdf'];

PDFJS.GlobalWorkerOptions.workerSrc = 'pdf.worker.js';


electron.ipcRenderer.on('QRCodeProcessado', (e, data) => {
    //console.log("recebeu http", data);
    const divstatus = document.getElementById('stat' + data[1]);
    const divfind = document.getElementById('find' + data[1]);
    divstatus.innerText = data[0];
    divfind.innerText = data[2];
    i_qrcodesTested++;

})


checkboxImagens.addEventListener('change', function () {
    if (checkboxImagens.checked) {
        imagensPaginas.style.display = "flex"
    } else {
        imagensPaginas.style.display = "none"
    }
});
checkboxLista.addEventListener('change', function () {
    if (checkboxLista.checked) {
        document.querySelector('#seletorLista').style.display = "flex"
    } else {
        document.querySelector('#seletorLista').style.display = "none"
    }
});
fileInputTxt.addEventListener('change', event => {
    const filesTxt = event.target.files;
    const fileTxt = filesTxt[0];
    electron.ipcRenderer.send('abrearquivoTxt', fileTxt.name);
});

fileInputPdf.addEventListener('change', event => {
    telaEscolhaModo.classList.remove("esconde");
    files = event.target.files;
    pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf');
    if (event.target.files.length === 0) {
        alert("No PDF files found in the selected folder.");
        return;
    }
    batchpdf = false;
    resetCurrentState();

});

folderInput.addEventListener('change', event => {
    telaEscolhaModo.classList.remove("esconde");
    pdf_count = 0;
    files = event.target.files;
    pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf');
    if (pdfFiles.length === 0) {
        alert("No PDF files found in the selected folder.");
        return;
    }
    batchpdf = true;
    resetCurrentState();



});
// reseta tudo antes de começar outro pdf
function resetCurrentState() {
    pageNumber = 1;
    i_qrcodes = 0;
    i_qrcodesTested = 0;
    id_count = 0;

    data = [];
    nQr.innerText = i_qrcodes + " qrcodes";
    imagensPaginas.innerHTML = "";
    tabela.innerHTML = "";

}

async function processPdfFiles() {
    var file;

    file = pdfFiles[pdf_count];
    url = file.name;
    console.log(`pdf_count: ${pdf_count}`);
    console.log(`filename: ${file.name}`);
    console.log(`file size: ${file.size} bytes`);
    console.log(`file type: ${file.type}`);
    await processPdfFile(file);


    //chama fim
    if (batchpdf) {
        if (pdf_count < pdfFiles.length - 1) {
            pdf_count++;
            processPdfFiles();
        } else {
            fim();
        }
    } else {
        fim();
    }

}

function processPdfFile(file) {
    return new Promise((resolve, reject) => {
        var loadingTask = PDFJS.getDocument(caminho + "PDF/" + file.name);
        loadingTask.promise.then((pdf) => {
            totalPages = pdf.numPages;
            nPag.innerText = totalPages + " paginas";
            console.log('abrearquivo', file.name)
            electron.ipcRenderer.send('abrearquivo', file.name);
            renderPage(pdf).then(() => {
                resolve();
            });
        }, (reason) => {
            console.error(reason);
            reject(reason);
        });
    });
}
/*
BOTOES
--------------------------------------------------------------
*/
qrcodeDropdown.addEventListener('change', event => {
    if (qrcodeDropdown.value == 1) {
        escolhaQrcode = "1qrcode";
    } else if (qrcodeDropdown.value == 2) {
        escolhaQrcode = "4qrcodes";
    } else if (qrcodeDropdown.value == 3) {
        escolhaQrcode = "10qrcodes";
    }
    console.log("escolhaQrcode", escolhaQrcode);
})
btEscolha1.addEventListener('click', () => {
    telaEscolhaModo.classList.add("esconde");
    escolhaQrcode = "4qrcodes";
})
btEscolha2.addEventListener('click', () => {
    telaEscolhaModo.classList.add("esconde");
    escolhaQrcode = "10qrcodes";
})
btEscolha3.addEventListener('click', () => {
    telaEscolhaModo.classList.add("esconde");
    escolhaQrcode = "1qrcode";

})
btIniciaTutorial.addEventListener('click', () => {
    telaAbertura.classList.add("esconde");
    telaTutorial.classList.remove("esconde");
});
btPulaTutorial.addEventListener('click', () => {
    telaAbertura.classList.add("esconde");
    telaTutorial.classList.add("esconde");
});
telaTutorial.addEventListener('click', () => {
    if (currentIndex < tutorialElements.length - 1) {
        tutorialElements[currentIndex].style.display = "none";
        currentIndex++;
        tutorialElements[currentIndex].style.display = "flex";
    } else {
        tutorialElements[currentIndex].style.display = "none";
        telaTutorial.style.display = 'none'; // Assuming the parent div has a class 'parentDiv'
    }
});
btHelp.addEventListener('click', () => {
    currentIndex = 0;
    tutorialElements[0].style.display = "flex";
    telaTutorial.style.display = "flex";
});
btFechaFim.addEventListener('click', () => {
    telaFim.style.display = "none";
});
btProcessar.addEventListener('click', () => {

    resetCurrentState();

    podeEscanear = true;
    telaCarregando.style.display = "flex";
    btProcessar.style.display = "none";
    btProcessarCancela.style.display = "block";
    if (batchpdf) {
        processPdfFiles(true);
    } else {
        processPdfFiles(false);
    }

});
btProcessarCancela.addEventListener('click', () => {
    podeEscanear = false;
    btProcessar.style.display = "block";
    btProcessarCancela.style.display = "none";
    QrScanner.stop();
})
btAbreConfig.addEventListener('click', () => {
    abreConfiguracoes();
});
btFechaConfig.addEventListener('click', () => {
    fechaConfiguracoes();

});
function abreConfiguracoes() {
    menuconfiguracoesUI.style.display = "none";
    configuracoesUI.style.display = "flex";
}
function fechaConfiguracoes() {
    menuconfiguracoesUI.style.display = "flex";
    configuracoesUI.style.display = "none";
}

function renderPage(pdf) {
    return new Promise((resolve) => {
        function renderNextPage() {
            if (!podeEscanear || pageNumber > totalPages) {
                return;
            }
            pdf.getPage(pageNumber).then(function (page) {
                //console.log("escala:", inputEscala.value)
                qrcodesDuplicados = [];
                var viewport = page.getViewport({ scale: inputEscala.value });

                var canvas = document.createElement('canvas');

                var context = canvas.getContext('2d', { willReadFrequently: true });
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                tamanhoViewPdf.width=viewport.width;
                tamanhoViewPdf.height=viewport.height;

                // console.log("tamanho:", viewport.width, viewport.height)

                var renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };

                var renderTask = page.render(renderContext);
                renderTask.promise.then(function () {
                    const imageData = canvas.toDataURL('image/png');
                    data.push(imageData);

                    var imageWidth = canvas.width;
                    var imageHeight = canvas.height;
                    var numHorizontalSections = 2;
                    var numVerticalSections = 6;

                    if (escolhaQrcode == "10qrcodes") {
                        if (scanMethodDropdown.value == 1) {
                            numHorizontalSections = 2;
                            numVerticalSections = 6;
                        } else if (scanMethodDropdown.value == 2) {
                            numHorizontalSections = 2;
                            numVerticalSections = 7;
                        } else if (scanMethodDropdown.value == 3) {
                            numHorizontalSections = 2;
                            numVerticalSections = 8;
                        } else if (scanMethodDropdown.value == 4) {
                            numHorizontalSections = 2;
                            numVerticalSections = 16;
                        }
                        //console.log("escolhaQrcode: ", escolhaQrcode);
                        //console.log("Method:", scanMethodDropdown.value, numHorizontalSections, numVerticalSections)
                    } else if (escolhaQrcode == "4qrcodes") {
                        numHorizontalSections = 3;
                        numVerticalSections = 3;
                        //console.log("escolhaQrcode: ", escolhaQrcode);

                    } else if (escolhaQrcode == "1qrcode") {
                        //console.log("escolhaQrcode: ", escolhaQrcode);

                    }
                    if (escolhaQrcode == "10qrcodes" || escolhaQrcode == "4qrcodes") {
                        var overlap = imageHeight / numVerticalSections;
                        var sections;
                        if (escolhaQrcode == "10qrcodes") {
                            //com mais de 18 qrcodes BEEEEm lento
                            //console.log("10qrcodes+ LENTO");
                            sections = divideImageIntoSectionsPlus(imageWidth, imageHeight, numHorizontalSections, numVerticalSections, overlap);
                        } else {
                            //console.log("4qrcodes");
                            sections = divideImageIntoSections(imageWidth, imageHeight, numHorizontalSections, numVerticalSections, overlap);
                        }
                        QrScanner.scanImage(imageData, { returnDetailedScanResult: true })
                            //primeiro tenta achar um qrcode simples
                            .then(result => {
                                if (qrcodesDuplicados.indexOf(result.data) > -1) {
                                    //console.log("QRCODE DUPLICADO");
                                } else {
                                    setResult(result, pageNumber, canvas, false);
                                    qrcodesDuplicados.push(result.data);
                                }
                            })
                            .catch(e => {
                                //console.log("SEM QRCODE SIMPLES");
                            })
                            .finally(e => {
                                processSections(sections, imageData, pageNumber, canvas).then(function () {
                                    pageNumber++;
                                    if (pageNumber <= totalPages) {
                                        //renderPage(pdf);
                                        renderNextPage();
                                        nPag.innerText = pageNumber + " de " + totalPages + " páginas processadas";
                                        let percentage = (pageNumber / totalPages) * 100;
                                        fillBar.style.width = percentage + '%';
                                        fillBar.innerText = percentage.toFixed(0) + '%';
                                    } else {
                                        if (batchpdf) {
                                            if (pdf_count < pdfFiles.length - 1) {
                                                pdf_count++;
                                                resetCurrentState();
                                                processPdfFiles();
                                            } else {
                                                fim();
                                            }
                                        } else {
                                            fim();
                                        }
                                    }
                                });
                            });
                    } else {

                        QrScanner.scanImage(imageData, { returnDetailedScanResult: true })
                            .then(result => {
                                setResult(result, pageNumber, canvas, false);
                            })
                            .catch(e => {
                                //console.log("SEM QRCODE SIMPLES");
                            })
                            .finally(e => {
                                pageNumber++;
                                if (pageNumber <= totalPages) {
                                    //renderPage(pdf);
                                    renderNextPage();
                                    nPag.innerText = pageNumber + " de " + totalPages + " páginas processadas";
                                    let percentage = (pageNumber / totalPages) * 100;
                                    fillBar.style.width = percentage + '%';
                                    fillBar.innerText = percentage.toFixed(0) + '%';
                                } else {
                                    if (batchpdf) {
                                        if (pdf_count < pdfFiles.length - 1) {
                                            pdf_count++;
                                            resetCurrentState();
                                            processPdfFiles();
                                        } else {
                                            fim();
                                        }
                                    } else {
                                        fim();
                                    }

                                }
                            });

                    }


                });
            });
        }

        // Start rendering the first page
        renderNextPage();
    });
}
function divideImageIntoSections(imageWidth, imageHeight, numHorizontalSections, numVerticalSections, overlap) {
    const sectionWidth = imageWidth / numHorizontalSections;
    const sectionHeight = imageHeight / numVerticalSections;
    const sections = [];

    for (let row = 0; row < numVerticalSections; row++) {
        for (let col = 0; col < numHorizontalSections; col++) {
            let x = col * sectionWidth;
            let y = row * sectionHeight;
            sections.push([x, y, sectionWidth, sectionHeight]);

            //overlay:
            x = col * sectionWidth;
            y = row * sectionHeight + overlap / 2;
            sections.push([x, y, sectionWidth, sectionHeight]);


        }
    }


    return sections;
}
function divideImageIntoSectionsPlus(imageWidth, imageHeight, numHorizontalSections, numVerticalSections, overlap) {
    const sectionWidth = imageWidth / numHorizontalSections;
    const sectionHeight = imageHeight / 18;

    const sections = [];
    var w = 0;


    for (let row = 0; row < 19; row++) {
        for (let col = 0; col < 2; col++) {
            let x = col * sectionWidth;
            let y = row * sectionHeight;
            sections.push([x, y, sectionWidth, sectionHeight]);
            x = col * sectionWidth;
            y = row * sectionHeight + w * 5;
            sections.push([x, y, sectionWidth, sectionHeight]);
            x = col * sectionWidth;
            y = row * sectionHeight + w * 10;
            sections.push([x, y, sectionWidth, sectionHeight]);
            x = col * sectionWidth;
            y = row * sectionHeight + w * 15;
            sections.push([x, y, sectionWidth, sectionHeight]);
            x = col * sectionWidth;
            y = row * sectionHeight + w * 20;
            sections.push([x, y, sectionWidth, sectionHeight]);
            x = col * sectionWidth;
            y = row * sectionHeight + w * 25;
            sections.push([x, y, sectionWidth, sectionHeight]);
            x = col * sectionWidth;
            y = row * sectionHeight + w * 30;
            sections.push([x, y, sectionWidth, sectionHeight]);
            x = col * sectionWidth;
            y = row * sectionHeight + w * 35;
            sections.push([x, y, sectionWidth, sectionHeight]);
            x = col * sectionWidth;
            y = row * sectionHeight + w * 40;
            sections.push([x, y, sectionWidth, sectionHeight]);
            x = col * sectionWidth;
            y = row * sectionHeight + w * 45;
            sections.push([x, y, sectionWidth, sectionHeight]);
            x = col * sectionWidth;
            y = row * sectionHeight + w * 50;
            sections.push([x, y, sectionWidth, sectionHeight]);
            w++;
        }
    }


    return sections;
}
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function processSections(sections, imageData, pageNumber, canvas) {
    const results = [];
    //console.log("scan " + sections.length + "sections ");
    for (let i = 0; i < sections.length; i++) {
        //console.log("Processing page:", pageNumber, "section:", sections[i][0], sections[i][1], sections[i][2], sections[i][3]);

        const _scanRegion = {
            x: sections[i][0],
            y: sections[i][1],
            width: sections[i][2],
            height: sections[i][3]
        };

        try {
            const result = await QrScanner.scanImage(imageData, { returnDetailedScanResult: true, scanRegion: _scanRegion });
            if (result.data) {
                //results.push(result);
                if (qrcodesDuplicados.indexOf(result.data) > -1) {
                    // console.log("QRCODE DUPLICADO");
                } else {
                    //console.log(result.cornerPoints );
                    setResult(result, pageNumber, canvas, false);
                    qrcodesDuplicados.push(result.data);
                }

            }
        } catch (e) {
            //console.log("No QR code found in this section:", e);
        }

        // delayzinho entre as seccoes
        await delay(5);
    }

    //console.log("All sections processed. Results:", results);
    //setResult(results, pageNumber, canvas);
}
function setResult(result, _pagina, _canvas, _atualiza) {
    console.log("setResult:", result.data);
    telaCarregando.style.display = "none";
    /*
    if (result.data.length < 12) {
        return
    }
    if (!isValidURL(result.data)) {
        return;
    }
    */

    const ctx = _canvas.getContext('2d', { willReadFrequently: true });
    ctx.beginPath();
    if (_atualiza) {
        ctx.strokeStyle = 'Violet';
    } else {
        ctx.strokeStyle = 'red';
    }

    ctx.lineWidth = 20;
    if (result.cornerPoints && result.cornerPoints.length === 4) {
        ctx.moveTo(result.cornerPoints[0].x - 20, result.cornerPoints[0].y - 20);
        ctx.lineTo(result.cornerPoints[1].x + 20, result.cornerPoints[1].y - 20);
        ctx.lineTo(result.cornerPoints[2].x + 20, result.cornerPoints[2].y + 20);
        ctx.lineTo(result.cornerPoints[3].x - 20, result.cornerPoints[3].y + 20);
        ctx.closePath();
    }
    ctx.stroke();


    if (result.data == "No QR code found" || result.data == "Scanner error: timeout") {
        _canvas = null;
        //console.log("sem resultado: ", _pagina + "/" + totalPages);
    } else {
        //console.log(result.data, _pagina);
        i_qrcodes++;
        //console.log(result.data, "pagina:", _pagina, checkboxSalvaImagens.checked);
        electron.ipcRenderer.send('processaLink', [result.data, id_count, _pagina, checkboxSalvaImagens.checked]);



        var tr = document.createElement('tr');
        var td1 = document.createElement('td');
        td1.innerHTML = _pagina;


        var td2 = document.createElement('td');
        var link = document.createElement('a');
        link.href = result.data;
        link.target = "_blank";
        link.innerHTML = result.data;
        link.addEventListener('click', function (event) {
            event.preventDefault(); // Prevent the default link click behavior

            // Open a new window with specified dimensions
            var windowFeatures = "menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes,width=1600,height=900";
            var newWindow = window.open(link.href, 'CanvasImageWindow', windowFeatures);

            // Optionally: If the popup is blocked, you might want to alert the user
            if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
                alert('Please allow popups for this website');
            }
        });

        td2.appendChild(link);

        var td3 = document.createElement('td');
        td3.innerHTML = "processando...";
        td3.id = "stat" + id_count;


        var td4 = document.createElement('td');
        td4.innerHTML = "-";
        td4.id = "find" + id_count;
        id_count++;

        var td5 = document.createElement('td');
        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        td5.appendChild(checkbox);


        tr.appendChild(td1);
        tr.appendChild(td5);
        tr.appendChild(td2);
        tr.appendChild(td3);
        tr.appendChild(td4);

        tabela.appendChild(tr);

        nQr.innerText = i_qrcodes + " qrcodes";



        var imagedata = _canvas.toDataURL("image/png");
        var img = new Image();
        img.src = imagedata;
        img.onload = function () {
            var div = document.createElement('div');
            div.style.height = "88%";
            div.style.display = "flex";
            div.style.flexDirection = "column";
            div.style.alignItems = "center";
            var label = document.createElement('label');
            label.innerText = "Página: " + _pagina;
            label.style.fontSize = "12px";
            label.style.color = "white";
            var canvas = document.createElement('canvas');
            canvas.style.height = "100%";
            var ctx2 = canvas.getContext('2d', { willReadFrequently: true });
            canvas.height = tamanhoViewPdf.height/1.5;
            canvas.width = tamanhoViewPdf.width/1.5;
            ctx2.drawImage(img, 0, 0, canvas.width, canvas.height);
            canvas.id = "pag" + _pagina;


            var dataURL = canvas.toDataURL('image/jpeg');
            electron.ipcRenderer.send('save-image', [dataURL, _pagina, result.data]);

            //caso esteja so atualizando a imagem interrompe aqui
            if (_atualiza) {
                return;
            }

            div.appendChild(canvas);
            div.appendChild(label);
            imagensPaginas.appendChild(div);

            _canvas = null;
            canvas.onclick = function () {
                var windowFeatures = "menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes,width=1280,height=720";
                var windowObjectReference = window.open('', 'CanvasImageWindow', windowFeatures);
                var newCanvas = windowObjectReference.document.createElement('canvas');
                newCanvas.width = canvas.width;
                newCanvas.height = canvas.height;
                var newContext = newCanvas.getContext('2d');
                newContext.drawImage(canvas, 0, 0);
                var newPagId = this.id.substring(3);
                let isSelectingRegion = false;
                let startX, startY, endX, endY, selectionBox;

                var btSelectRegion = windowObjectReference.document.createElement('button');
                btSelectRegion.style.position = 'fixed';
                btSelectRegion.style.width = '200px';
                btSelectRegion.style.height = '150px';
                btSelectRegion.style.top = '10px';
                btSelectRegion.style.left = '10px';
                btSelectRegion.innerText = "Habilitar seleção de busca";


                btSelectRegion.addEventListener('click', () => {
                    isSelectingRegion = !isSelectingRegion; // toggle selection mode
                    if (isSelectingRegion) {
                        btSelectRegion.innerText = "Cancelar seleção"; // change button text
                        console.log("Selection mode activated.");
                    } else {
                        btSelectRegion.innerText = "Habilitar seleção de busca"; // reset button text
                        if (selectionBox) selectionBox.remove(); // Remove selection box if exists
                    }
                });
                // funcao para selecionar regiao para escanear
                function enableSelection() {
                    newCanvas.addEventListener('mousedown', (e) => {
                        if (!isSelectingRegion) return;

                        startX = e.offsetX;
                        startY = e.offsetY;

                        selectionBox = document.createElement('div');
                        selectionBox.style.position = 'absolute';
                        selectionBox.style.border = '4px dashed red';
                        selectionBox.style.left = `${startX}px`;
                        selectionBox.style.top = `${startY}px`;
                        windowObjectReference.document.body.appendChild(selectionBox);


                        // Listen for mouse movements
                        newCanvas.addEventListener('mousemove', onMouseMove);
                        newCanvas.addEventListener('mouseup', onMouseUp);
                    });

                    function onMouseMove(e) {
                        if (!isSelectingRegion) return;

                        endX = e.offsetX;
                        endY = e.offsetY;

                        const width = endX - startX;
                        const height = endY - startY;

                        selectionBox.style.width = `${Math.abs(width)}px`;
                        selectionBox.style.height = `${Math.abs(height)}px`;
                        selectionBox.style.left = `${width < 0 ? endX : startX}px`;
                        selectionBox.style.top = `${height < 0 ? endY : startY}px`;
                    }

                    function onMouseUp() {
                        if (!isSelectingRegion) return;
                        const imageDataPop = newCanvas.toDataURL('image/png');
                        // Clear the mouse listeners
                        newCanvas.removeEventListener('mousemove', onMouseMove);
                        newCanvas.removeEventListener('mouseup', onMouseUp);

                        const region = {
                            x: Math.min(startX, endX),
                            y: Math.min(startY, endY),
                            width: Math.abs(endX - startX),
                            height: Math.abs(endY - startY)
                        };

                        const ctx = newCanvas.getContext('2d');
                        ctx.beginPath();
                        ctx.strokeStyle = 'Violet';
                        ctx.lineWidth = 20;
                        if (result.cornerPoints && result.cornerPoints.length === 4) {
                            ctx.moveTo(startX, startY);
                            ctx.lineTo(endX, startY);
                            ctx.lineTo(endX, endY);
                            ctx.lineTo(startX, endY);
                            ctx.closePath();
                        }
                        ctx.stroke();

                        //var newContext = canvas.getContext('2d');
                        //newContext.drawImage(newCanvas, 0, 0);


                        scanQRCodeInRegion(imageDataPop, region);
                        selectionBox.remove(); // Remove selection box after selection is finalized
                        isSelectingRegion = false; // Reset selection mode
                        btSelectRegion.innerText = "Selecione região a ser escaneada"; // Reset button text
                    }
                }
                enableSelection();
                // Function to scan QR code in a specific region
                async function scanQRCodeInRegion(imageDataPop, region) {

                    try {
                        const result = await QrScanner.scanImage(imageDataPop, { returnDetailedScanResult: true, scanRegion: region });
                        if (result.data) {
                            //results.push(result);
                            if (qrcodesDuplicados.indexOf(result.data) > -1) {
                                console.log("QRCODE DUPLICADO");
                            } else {
                                console.log("QR Code found in selected region:", result);
                                //console.log(result.cornerPoints );
                                setResult(result, newPagId, canvas, true);
                                qrcodesDuplicados.push(result.data);
                            }

                        }
                    } catch (e) {
                        console.log("No QR code found in this section:", e);
                    }

                }


                windowObjectReference.document.body.appendChild(btSelectRegion);
                windowObjectReference.document.body.appendChild(newCanvas);
                windowObjectReference.document.title = "Página: " + canvas.id;
            };
        }

    }
}


function isValidURL(string) {
    const regex = /^(https?:\/\/)?([\w\-]+(\.[\w\-]+)+)([\/\w\-\._~:?#[\]@!$&'()*+,;=]*)?$/;
    return regex.test(string);
}

function decodeImageFromBase64(data, callback) {
    qrcode.callback = callback;
    qrcode.decode(data)
}
function fim() {
    telaFim.style.display = "flex";
    electron.ipcRenderer.send('fim', "nada");
    podeEscanear = true;
    btProcessar.style.display = "block";
    btProcessarCancela.style.display = "none";
}