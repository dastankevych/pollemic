let questionCount = 0;

function addQuestion() {
    const id = questionCount++;
    const div = document.createElement('div');
    div.className = 'q';
    div.draggable = true;
    div.innerHTML = `
        <div class="qt">
            <span class="drag">⋮⋮</span>
            <input class="qin" placeholder="Question">
            <select class="sel" onchange="updateType(${id})">
                <option value="text">Text</option>
                <option value="radio">Single Choice</option>
                <option value="checkbox">Multiple Choice</option>
            </select>
            <button class="btn del" onclick="deleteQuestion(${id})">✕</button>
        </div>
        <div id="options${id}"></div>
    `;
    document.getElementById('questions').appendChild(div);
}

function updateType(id) {
    const select = event.target;
    const optionsDiv = document.getElementById(`options${id}`);

    if (select.value === 'radio' || select.value === 'checkbox') {
        optionsDiv.innerHTML = `
            <div class="opt">
                <input class="qin" placeholder="Option 1">
                <button class="btn del" onclick="deleteOption(this)">✕</button>
            </div>
            <div class="opt">
                <input class="qin" placeholder="Option 2">
                <button class="btn del" onclick="deleteOption(this)">✕</button>
            </div>
            <button class="btn add" onclick="addOption(${id})">Add Option</button>
        `;
    } else {
        optionsDiv.innerHTML = '';
    }
}

function addOption(id) {
    const optionsDiv = document.getElementById(`options${id}`);
    const newOption = document.createElement('div');
    newOption.className = 'opt';
    newOption.innerHTML = `
        <input class="qin" placeholder="New Option">
        <button class="btn del" onclick="deleteOption(this)">✕</button>
    `;
    optionsDiv.insertBefore(newOption, optionsDiv.lastElementChild);
}

function deleteOption(button) {
    button.parentElement.remove();
}

function deleteQuestion(id) {
    document.getElementById('questions').children[id].remove();
}

function createSurvey() {
    // Здесь будет логика создания опроса
    console.log('Creating survey...');
}

// Drag and drop functionality
let draggedItem = null;
let questions = document.getElementById('questions');

questions.addEventListener('dragstart', (e) => {
    draggedItem = e.target;
    e.target.classList.add('dragging');
});

questions.addEventListener('dragend', (e) => {
    e.target.classList.remove('dragging');
});

questions.addEventListener('dragover', (e) => {
    e.preventDefault();
    const afterElement = getDragAfterElement(questions, e.clientY);
    const draggable = document.querySelector('.dragging');
    if (afterElement == null) {
        questions.appendChild(draggable);
    } else {
        questions.insertBefore(draggable, afterElement);
    }
});

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.q:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Add first question on load
document.addEventListener('DOMContentLoaded', function() {
    addQuestion();
});