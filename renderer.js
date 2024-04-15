

const mergeBtn = document.querySelector('#mergeBtn');
const outputBtn = document.querySelector('#outputBtn');
const _telaLoader = document.querySelector('#telaLoader');
const textoModal = document.querySelector('#textoModal');
const modal = document.querySelector('.modal');
const fileInput1 = document.getElementById('fileInput1');


outputBtn.addEventListener('click', () => {
    electron.ipcRenderer.send('output-pdfs', "teste");
});
mergeBtn.addEventListener('click', () => {

    const file1 = fileInput1.files[0];
    //const file2 = fileInput2.files[0];
    
    if (file1) {
        _telaLoader.style.display = "flex";
        console.log("merge-pdfs",file1.path);
        electron.ipcRenderer.send('merge-pdfs', [file1.path]);
    } else {
        console.log("selecione os pdfs");
        textoModal.innerHTML = "Selecione pelo menos um PDF principal e um para merge.";
        openModal();
        //alert('Selecione pelo menos um PDF principal e um para merge.');
    }
});

electron.ipcRenderer.on('merge-pdfs-done', (e, data) => {
    console.log("recebeu a pagina", data);
    _telaLoader.style.display = "none";
})

document.addEventListener('alpine:init', () => {
    Alpine.data('dropdown', () => ({
        open: false,
        totalinputs: [],
        init() {
            console.log("itit");
        },
        addRemoveSubmit() {
            this.totalinputs = [].concat({
                id: randId()
            }, this.totalinputs);
        }
    }))
})

function randId() {
    return (Math.random() * 100).toFixed(0);
}




function openModal() {
    modal.classList.add('is-active');
}

function closeModal() {
    modal.classList.remove('is-active');
}

function closeAllModals() {
    (document.querySelectorAll('.modal') || []).forEach(($modal) => {
        closeModal($modal);
    });
}

// Add a click event on buttons to open a specific modal
(document.querySelectorAll('.js-modal-trigger') || []).forEach(($trigger) => {
    const modal = $trigger.dataset.target;
    const $target = document.getElementById(modal);

    $trigger.addEventListener('click', () => {
        openModal($target);
    });
});

// Add a click event on various child elements to close the parent modal
(document.querySelectorAll('.modal-background, .modal-close, .modal-card-head .delete, .modal-card-foot .button') || []).forEach(($close) => {
    const $target = $close.closest('.modal');

    $close.addEventListener('click', () => {
        closeModal();
    });
});



