var notes;
var decks;
var tags;

async function main() {
    if (await isAnkiConnectionOpen()) {
        // set pop up to notify user that connection is not established
    }

    notes = await getNotes();
    decks = await getDecks();
    populateDropdown(notes, 'note-selector');
    populateDropdown(decks, 'deck-selector');
    initFields();

    var clearButton = document.getElementById('clear-button');
    var submitButton = document.getElementById('submit-button');
    submitButton.addEventListener('click', addNoteToDeck);
    clearButton.addEventListener('click', clearAllFieldInput);
}

async function isAnkiConnectionOpen() {
    try {
        await invoke('version', 6);
        return true;
    }
    catch {
        return false;
    }
}

async function addNoteToDeck() {
    var params = {note: {}};
    const noteOptions = {
       'allowDuplicate': false,
       'duplicateScope': 'deck'
    }
    params.note['deckName'] = getSelectedDeck();
    params.note['modelName'] = getSelectedNoteType();
    params.note['fields'] = getFieldInputs();
    params.note['options'] = noteOptions; 
    params.note['tags'] = getTags();
    
    try {
        await invoke('addNote', 6, params);
    }
    catch (error) {
        console.error(error);
    }
    
}

function populateDropdown(list, element_id) {
    const dropdown = document.getElementById(element_id);

    var docfrag = document.createDocumentFragment();

    list.forEach(name => {
        var option = document.createElement('option');
        option.text = option.value = name;
        option.setAttribute('class', `${element_id}-option`);
        docfrag.appendChild(option);
    });

    dropdown.appendChild(docfrag);
}

async function populateFields(noteName) {

    resetFields();

    const fieldSection = document.getElementById('fields');
    try {
        const params = {
            'modelName': noteName
        }
        const fields = await invoke('modelFieldNames', 6, params);

        var docfrag = document.createDocumentFragment();

        fields.forEach(field => {
            const label = document.createElement('label');
            label.setAttribute('class', 'label-input');
            const labelText = document.createTextNode(field);
            const input = document.createElement('input');
            input.setAttribute('type', 'text');
            input.setAttribute('class', 'field-input');
            label.appendChild(labelText);
            label.appendChild(input);

            docfrag.appendChild(label)
        })

        fieldSection.appendChild(docfrag);

    }
    catch (error) {
        console.error(error);
    }
}

function resetFields() {
    const fields = document.getElementById('fields');
    while (fields.firstChild) {
        fields.removeChild(fields.firstChild);
    }
}

function clearAllFieldInput() {
    var inputs = document.getElementsByClassName('field-input');
    for (var i = 0; i < inputs.length; i++) {
        if (inputs[i].type === 'text') 
            inputs[i].value = '';   
    }
}

function initFields() {
    const noteSelector = document.getElementById('note-selector');
    populateFields(getSelectedNoteType());
    noteSelector.addEventListener('change', () => {
        var selectedVal = getSelectedNoteType();
        populateFields(selectedVal);
    })
}

function getFieldInputs() {
    var inputs = document.getElementsByClassName('field-input');
    var inputObj = {};
    for (var i = 0; i < inputs.length; i++) {
        if (inputs[i].type === 'text' && inputs[i].value !== ''){
            inputObj[inputs[i].labels[0].textContent] = inputs[i].value;
        } 
    }
    console.log(inputObj);
    return inputObj;
}

async function getNotes() {
    try {
        return await invoke('modelNames', 6);
    }
    catch (error) {
        console.error(error);
    }
}

function getSelectedNoteType() {
    var noteSelector = document.getElementById('note-selector');
    return noteSelector.options[noteSelector.selectedIndex].text;
}

async function getDecks() {
    try {
        return await invoke('deckNames', 6);
    }
    catch (error) {
        console.error(error);
    }
}

function getSelectedDeck() {
    var deckSelector = document.getElementById('deck-selector');
    return deckSelector.options[deckSelector.selectedIndex].text;
}

function getTags() {
    var tagSelector = document.getElementById('tag-input-text');
    if (tagSelector.value === '') 
        return [];

    return tagSelector.value.split(' ');
}

function invoke(action, version, params = {}) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.addEventListener('error', () => reject('failed to issue request'));
        xhr.addEventListener('load', () => {
            try {
                const response = JSON.parse(xhr.responseText);
                if (Object.getOwnPropertyNames(response).length != 2) {
                    throw 'response has an unexpected number of fields';
                }
                if (!response.hasOwnProperty('error')) {
                    throw 'response is missing required error field';
                }
                if (!response.hasOwnProperty('result')) {
                    throw 'response is missing required result field';
                }
                if (response.error) {
                    throw response.error;
                }
                resolve(response.result);
            } catch (e) {
                reject(e);
            }
        });

        xhr.open('POST', 'http://127.0.0.1:8765');
        xhr.send(JSON.stringify({ action, version, params }));
    });
}

main();