import Sortable from 'sortablejs';

class TaskManager {
    constructor() {
        this.days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        this.init();
        this.loadFromLocalStorage();
    }

    init() {
        this.setupDays();
        this.setupEventListeners();
        this.initializeSortable();
        this.setupCompletedTasksPopup();
        this.setupImportExport();
        this.setupMoveTaskPopup();
    }

    setupDays() {
        const container = document.querySelector('.days-container');
        const template = document.getElementById('dayTemplate');

        const today = new Date().getDay(); // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
        const todayIndex = today === 0 ? 6 : today - 1; // Convert to 0 for Monday, ..., 6 for Sunday

        // Calculate the index for the next day, wrapping around
        const nextDayIndex = (todayIndex + 1) % 7;


        const reorderedDays = [
            ...this.days.slice(todayIndex),
            ...this.days.slice(0, todayIndex)
        ];

        container.innerHTML = '';

        reorderedDays.forEach(day => {
            const dayElement = template.content.cloneNode(true);
            const dayCard = dayElement.querySelector('.day-card');
            const dayTitleElement = dayElement.querySelector('.day-title');
            dayTitleElement.textContent = day;

            // Find the original index of the day to compare with today and nextDay indices
            const originalDayIndex = this.days.indexOf(day);


            if (originalDayIndex === todayIndex) {
                dayCard.classList.add('current-day');
            } else if (originalDayIndex === nextDayIndex) { // Check if it's the next day
                 dayCard.classList.add('next-day');
            }


            container.appendChild(dayElement);
        });
    }

    setupEventListeners() {
        document.querySelector('.days-container').addEventListener('click', (e) => {
            if (e.target && e.target.classList.contains('add-task')) {
                this.handleAddTask(e);
            }
        });

        document.getElementById('moveCompleted').addEventListener('click', () => {
            this.moveCompletedTasks();
        });
    }

    setupCompletedTasksPopup() {
        const overlay = document.getElementById('moveTaskPopupOverlay');
        if (!overlay) {
            console.error("Overlay element not found.");
            return;
        }
        overlay.classList.add('generic-overlay');

        const completedContainer = document.getElementById('completedTasks');
        if (!completedContainer.querySelector('.close-popup')) {
            const closeButton = document.createElement('button');
            closeButton.className = 'close-popup';
            closeButton.innerHTML = '×';
            closeButton.addEventListener('click', this.closeAllPopups.bind(this));
            completedContainer.insertBefore(closeButton, completedContainer.firstChild);
        }


        document.getElementById('showCompleted').addEventListener('click', () => {
            this.closeAllPopups();
            overlay.classList.add('active');
            completedContainer.classList.remove('hidden');
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeAllPopups();
            }
        });
    }

    setupMoveTaskPopup() {
        const popup = document.getElementById('moveTaskPopup');
        const overlay = document.getElementById('moveTaskPopupOverlay');
        const template = document.getElementById('moveTaskPopupTemplate');

        if (!popup || !overlay || !template) {
            console.error("Move task popup elements or template not found.");
            return;
        }

        const content = template.content.cloneNode(true);
        popup.appendChild(content);

        const daySelect = popup.querySelector('.move-day-select');
        this.days.forEach(day => {
            const option = document.createElement('option');
            option.value = day;
            option.textContent = day;
            daySelect.appendChild(option);
        });

        popup.querySelector('.move-accept-btn').addEventListener('click', () => this.handleMoveTaskAccept());
        popup.querySelector('.move-cancel-btn').addEventListener('click', () => this.closeAllPopups());

        popup.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    closeAllPopups() {
        const overlay = document.getElementById('moveTaskPopupOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }

        const completedContainer = document.getElementById('completedTasks');
        if (completedContainer) {
            completedContainer.classList.add('hidden');
        }

        const movePopup = document.getElementById('moveTaskPopup');
        if (movePopup) {
            movePopup.classList.add('hidden');
        }

        this.closeAllMenus(); 
    }

    closeAllMenus(exceptTask = null) {
        document.querySelectorAll('.task-menu-popup:not(.hidden)').forEach(popup => {
            const taskElement = popup.closest('.task');
            if (taskElement !== exceptTask) {
                popup.classList.add('hidden');
                taskElement?.classList.remove('menu-open');
            }
        });
         document.querySelectorAll('.task.editing').forEach(task => {
            const input = task.querySelector('.task-text-edit');
            const span = task.querySelector('.task-text');
            if (input && span) {
                input.replaceWith(span);
                task.classList.remove('editing');
            }
        });
    }


    initializeSortable() {
        document.querySelectorAll('.tasks-list').forEach(list => {
            if (list.sortable) {
                list.sortable.destroy();
            }

            list.sortable = new Sortable(list, {
                group: 'tasks',
                animation: 0,
                draggable: '.task',
                handle: '.task-text',
                onMove: function (evt) {
                    if (evt.to.classList.contains('priority-tasks')) {
                        const priorityTasks = evt.to.querySelectorAll('.task:not(.sortable-ghost):not(.sortable-drag)');
                        if (priorityTasks.length >= 3 && !evt.from.classList.contains('priority-tasks')) {
                            return false;
                        }
                    }
                    return true;
                },
                onAdd: (evt) => {
                    const taskElement = evt.item;

                    const activeInput = taskElement.querySelector('.task-text-edit');
                    if(activeInput) {
                        const taskTextSpan = document.createElement('span');
                        taskTextSpan.classList.add('task-text');
                        taskTextSpan.textContent = activeInput.value.trim() || 'Nueva tarea';
                        activeInput.replaceWith(taskTextSpan);
                        taskElement.classList.remove('editing');
                    }
                    this.setupTaskEventListeners(taskElement);


                    taskElement.classList.remove('priority-task', 'other-task');
                    if (evt.to.classList.contains('priority-tasks')) {
                        taskElement.classList.add('priority-task');
                    } else {
                        taskElement.classList.add('other-task');
                    }

                    const isCompleted = taskElement.querySelector('.task-check')?.checked;
                    taskElement.classList.toggle('completed', isCompleted);


                    this.saveToLocalStorage();
                },
                onRemove: () => {
                    this.saveToLocalStorage();
                },
                onUpdate: () => {
                    this.saveToLocalStorage();
                },
            });
        });
    }

    handleAddTask(e) {
        const dayCard = e.target.closest('.day-card');
        const otherTasksList = dayCard.querySelector('.other-tasks');
        const task = this.createTaskElement('Nueva tarea');
        otherTasksList.appendChild(task);
        task.classList.add('other-task');
        this.saveToLocalStorage();
    }

    createTaskElement(text, isCompleted = false) {
        const template = document.getElementById('taskTemplate');
        const taskElement = template.content.cloneNode(true);

        const task = taskElement.querySelector('.task');
        const taskTextSpan = task.querySelector('.task-text');
        const taskCheckbox = task.querySelector('.task-check');

        taskTextSpan.textContent = text;

        taskCheckbox.checked = isCompleted;
        task.classList.toggle('completed', isCompleted);

        this.setupTaskEventListeners(task);

        return task;
    }

    setupTaskEventListeners(task) {
        const taskText = task.querySelector('.task-text');
        const menuButton = task.querySelector('.task-menu');
        const menuPopup = task.querySelector('.task-menu-popup');
        const editButton = task.querySelector('.edit-task');
        const moveButton = task.querySelector('.move-task');
        const deleteButton = task.querySelector('.delete-task');
        const taskCheck = task.querySelector('.task-check');

        taskText.addEventListener('dblclick', () => { 
            this.closeAllMenus(task); 

            const input = document.createElement('input');
            input.type = 'text';
            input.value = taskText.textContent.trim();
            input.classList.add('task-text-edit');
            input.setAttribute('placeholder', 'Editar tarea');

            const saveEdit = () => {
                const newText = input.value.trim();
                if (input.parentNode) {
                    taskText.textContent = newText || 'Nueva tarea';
                    input.replaceWith(taskText);
                    task.classList.remove('editing');
                    // Save only if text actually changed or was cleared
                    if (newText !== taskText.textContent.trim() || newText === '') {
                         this.saveToLocalStorage();
                    }
                }
            };

            input.addEventListener('blur', saveEdit);

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    saveEdit();
                } else if (e.key === 'Escape') {
                    if (input.parentNode) {
                        input.replaceWith(taskText);
                        task.classList.remove('editing');
                    }
                }
            });

            taskText.replaceWith(input);
            input.focus();
            input.select();
            task.classList.add('editing');
        });


        menuButton.addEventListener('click', (e) => { 
            e.stopPropagation();
            const isHidden = menuPopup.classList.contains('hidden');
            this.closeAllMenus(task); 

            if (isHidden) {
                menuPopup.classList.remove('hidden');
                task.classList.add('menu-open');
            } else {
                menuPopup.classList.add('hidden');
                task.classList.remove('menu-open');
            }
        });

        editButton.addEventListener('click', () => {
            const currentTaskTextElement = task.querySelector('.task-text');
            if (currentTaskTextElement) {
                const dblclickEvent = new MouseEvent('dblclick', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                });
                currentTaskTextElement.dispatchEvent(dblclickEvent);
            }
            menuPopup.classList.add('hidden');
            task.classList.remove('menu-open');
        });

        moveButton.addEventListener('click', () => { 
            this.openMoveTaskPopup(task); 
            menuPopup.classList.add('hidden');
            task.classList.remove('menu-open');
        });

        deleteButton.addEventListener('click', () => { 
            task.remove();
            menuPopup.classList.add('hidden');
            task.classList.remove('menu-open');
            this.saveToLocalStorage(); 
        });

        taskCheck.addEventListener('change', (e) => { 
            task.classList.toggle('completed', e.target.checked);
            this.saveToLocalStorage(); 
        });

        document.addEventListener('click', (e) => { 
            if (!e.target.closest('.task-menu-popup') && !e.target.closest('.task-menu') && !e.target.closest('.task') && !e.target.closest('.move-task-popup') && !e.target.classList.contains('task-text-edit')) {
                 this.closeAllMenus(); 
            }
        });


        if (menuPopup) {
            menuPopup.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
    }

    openMoveTaskPopup(taskElement) {
        const overlay = document.getElementById('moveTaskPopupOverlay');
        const popup = document.getElementById('moveTaskPopup');
        const daySelect = popup.querySelector('.move-day-select');

        if (!overlay || !popup || !daySelect) {
            console.error("Move task popup elements not found.");
            return;
        }

        this.taskToMove = taskElement;

        const currentDayTitle = taskElement.closest('.day-card').querySelector('.day-title')?.textContent;
        if (currentDayTitle) {
            daySelect.value = currentDayTitle;
        } else {
            daySelect.selectedIndex = 0;
        }

        this.closeAllPopups();
        overlay.classList.add('active');
        popup.classList.remove('hidden');
    }

    handleMoveTaskAccept() {
        console.log('Move task accept triggered');
        if (!this.taskToMove) {
            console.error("No task selected to move.");
            this.closeAllPopups();
            return;
        }

        const popup = document.getElementById('moveTaskPopup');
        const daySelect = popup.querySelector('.move-day-select');
        const targetDayTitle = daySelect.value;

        if (!targetDayTitle) {
            console.warn("No target day selected.");
            this.closeAllPopups();
            return;
        }

        const targetDayCard = Array.from(document.querySelectorAll('.day-card'))
            .find(card => card.querySelector('.day-title')?.textContent === targetDayTitle);

        if (!targetDayCard) {
            console.error(`Target day card not found for day: ${targetDayTitle}`);
            this.closeAllPopups();
            return;
        }

        const targetOtherTasksList = targetDayCard.querySelector('.other-tasks');
        if (!targetOtherTasksList) {
            console.error(`'Other tasks' list not found in target day card for day: ${targetDayTitle}`);
            this.closeAllPopups();
            return;
        }

        const clonedTask = this.taskToMove.cloneNode(true);

        clonedTask.classList.remove('editing', 'menu-open');
        const activeInput = clonedTask.querySelector('.task-text-edit');
        if(activeInput) {
            const taskTextSpan = document.createElement('span');
            taskTextSpan.classList.add('task-text');
            taskTextSpan.textContent = activeInput.value.trim() || 'Nueva tarea';
            activeInput.replaceWith(taskTextSpan);
        }
        const menuPopup = clonedTask.querySelector('.task-menu-popup');
        if(menuPopup) {
            menuPopup.classList.add('hidden');
        }

        const clonedTaskCheck = clonedTask.querySelector('.task-check');
        if (clonedTaskCheck) {
            clonedTaskCheck.checked = false;
            clonedTask.classList.remove('completed');
        }

        this.taskToMove.remove();

        targetOtherTasksList.appendChild(clonedTask);

        clonedTask.classList.remove('priority-task');
        clonedTask.classList.add('other-task');

        this.setupTaskEventListeners(clonedTask);

        this.taskToMove = null;

        this.closeAllPopups();
        this.saveToLocalStorage();
    }

    moveCompletedTasks() {
        console.log('Move completed tasks triggered');
        const completedTasksList = document.querySelector('.completed-tasks-list');

        completedTasksList.innerHTML = '';
        document.querySelectorAll('.task.menu-open').forEach(task => task.classList.remove('menu-open'));
        document.querySelectorAll('.task-menu-popup').forEach(popup => popup.classList.add('hidden'));

        document.querySelectorAll('.task.completed')
            .forEach(task => {
            const taskText = task.querySelector('.task-text')?.textContent || task.querySelector('.task-text-edit')?.value || '';
            const originalDay = task.closest('.day-card').querySelector('.day-title')?.textContent || null;

            const completedTaskElement = this.createCompletedTaskElement(taskText, originalDay);

            completedTasksList.appendChild(completedTaskElement);

            task.remove();
        });

        this.saveToLocalStorage();
    }

    createCompletedTaskElement(text, originalDay) {
        const div = document.createElement('div');
        div.className = 'completed-task';
        div.innerHTML = `
            <span class="task-text">${text}</span>
            <div class="completed-actions">
                <button class="completed-restore-btn" data-original-day="${originalDay || ''}">Restaurar</button>
                <button class="completed-delete-btn">Eliminar</button>
            </div>
            `;

        div.querySelector('.completed-restore-btn').addEventListener('click', () => {
            this.restoreTask(div, originalDay);
        });

        div.querySelector('.completed-delete-btn').addEventListener('click', () => {
            if (confirm('¿Está seguro de que desea eliminar esta tarea completada de forma permanente?')) {
                div.remove();
                this.saveToLocalStorage();
            }
        });

        return div;
    }

    restoreTask(taskElement, originalDay) {
        console.log('Restore task triggered');
        let targetDayCard = Array.from(document.querySelectorAll('.day-card'))
            .find(card => card.querySelector('.day-title')?.textContent === originalDay);

        if (!targetDayCard) {
            targetDayCard = document.querySelector('.day-card');
            if (!targetDayCard) {
                console.error("Could not find any day card to restore the task.");
                return;
            }
            console.warn(`Original day "${originalDay}" not found. Restoring to the first day card.`);
        }

        const newTask = this.createTaskElement(taskElement.querySelector('.task-text').textContent, false);

        const otherTasksList = targetDayCard.querySelector('.other-tasks');
        if (otherTasksList) {
            otherTasksList.appendChild(newTask);
            newTask.classList.add('other-task');
        } else {
            console.error("Could not find '.other-tasks' list in the target day card.");
            return;
        }

        taskElement.remove();

        this.saveToLocalStorage();
    }

    saveToLocalStorage() {
        console.log('Saving to localStorage...');
        const data = {
            tasks: {},
            completedTasks: []
        };

        document.querySelectorAll('.day-card').forEach(dayCard => {
            const dayTitle = dayCard.querySelector('.day-title')?.textContent;
            if (dayTitle) {
                data.tasks[dayTitle] = {
                    priority: Array.from(dayCard.querySelector('.priority-tasks')?.children || [])
                        .filter(task => task.classList.contains('task') && !task.classList.contains('sortable-ghost') && !task.classList.contains('sortable-drag'))
                        .map(task => {
                        const textElement = task.querySelector('.task-text-edit') || task.querySelector('.task-text');
                        const taskText = textElement ? (textElement.value?.trim() || textElement.textContent?.trim() || '') : '';
                         const isCompleted = task.classList.contains('completed') || task.querySelector('.task-check')?.checked || false;
                        return {
                            text: taskText,
                            completed: isCompleted
                        };
                    }),
                    other: Array.from(dayCard.querySelector('.other-tasks')?.children || [])
                        .filter(task => task.classList.contains('task') && !task.classList.contains('sortable-ghost') && !task.classList.contains('sortable-drag'))
                        .map(task => {
                        const textElement = task.querySelector('.task-text-edit') || task.querySelector('.task-text');
                        const taskText = textElement ? (textElement.value?.trim() || textElement.textContent?.trim() || '') : '';
                         const isCompleted = task.classList.contains('completed') || task.querySelector('.task-check')?.checked || false;
                        return {
                            text: taskText,
                            completed: isCompleted
                        };
                    })
                };
            }
        });

        const completedTasksList = document.querySelector('.completed-tasks-list');
        if (completedTasksList) {
            data.completedTasks = Array.from(completedTasksList.children)
                .filter(task => task.classList.contains('completed-task'))
                .map(task => ({
                text: task.querySelector('.task-text')?.textContent.trim() || '',
                completed: true, // Completed tasks are always completed
                originalDay: task.querySelector('.completed-restore-btn')?.dataset.originalDay || null
            }));
        }
        console.log('Data being saved:', JSON.parse(JSON.stringify(data)));
        localStorage.setItem('taskManagerData', JSON.stringify(data));
    }

    loadFromLocalStorage() {
        const savedData = localStorage.getItem('taskManagerData');
        if (!savedData) {
            console.log('No saved data found in localStorage.');
            return;
        }

        try {
            const data = JSON.parse(savedData);
            console.log('Loading from localStorage. Data:', data);

            this.setupDays();

            if (data.tasks) {
                Object.entries(data.tasks).forEach(([dayTitle, dayData]) => {
                    const dayCard = Array.from(document.querySelectorAll('.day-card'))
                        .find(card => card.querySelector('.day-title')?.textContent === dayTitle);

                    if (dayCard) {
                        const priorityList = dayCard.querySelector('.priority-tasks');
                        const otherList = dayCard.querySelector('.other-tasks');

                        if (priorityList && otherList) {
                            priorityList.innerHTML = '';
                            otherList.innerHTML = '';

                            if (dayData.priority && Array.isArray(dayData.priority)) {
                                dayData.priority.forEach(taskData => {
                                    if (taskData && typeof taskData.text === 'string') {
                                        const task = this.createTaskElement(taskData.text, taskData.completed);
                                        task.classList.add('priority-task');
                                        priorityList.appendChild(task);
                                    }
                                });
                            }

                            if (dayData.other && Array.isArray(dayData.other)) {
                                dayData.other.forEach(taskData => {
                                    if (taskData && typeof taskData.text === 'string') {
                                        const task = this.createTaskElement(taskData.text, taskData.completed);
                                        task.classList.add('other-task');
                                        otherList.appendChild(task);
                                    }
                                });
                            }
                        } else {
                            console.warn(`Priority or Other tasks list not found for day: ${dayTitle} during load.`);
                        }
                    } else {
                        console.warn(`Day card not found for day title "${dayTitle}" from loaded data. Tasks for this day are discarded.`);
                    }
                });
            } else {
                console.warn("No 'tasks' data found in localStorage.");
            }

            const completedTasksList = document.querySelector('.completed-tasks-list');
            if (completedTasksList) {
                completedTasksList.innerHTML = '';
                if (data.completedTasks && Array.isArray(data.completedTasks)) {
                    data.completedTasks.forEach(taskData => {
                        if (taskData && typeof taskData.text === 'string') {
                            const completedTaskElement = this.createCompletedTaskElement(taskData.text, taskData.originalDay);
                            completedTasksList.appendChild(completedTaskElement);
                        }
                    });
                }
            } else {
                console.warn("Completed tasks list element not found during load.");
            }

            this.initializeSortable();

        } catch (error) {
            console.error("Failed to parse or load data from localStorage:", error);
        }
    }

    setupImportExport() {
        document.getElementById('exportData').addEventListener('click', () => this.exportData());
        document.getElementById('importData').addEventListener('click', () => this.importData());
    }

    exportData() {
        const data = localStorage.getItem('taskManagerData');
        if (!data) {
            alert("No hay datos para exportar.");
            return;
        }

        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        const filename = `Planner-${day}-${month}-${year}-${hours}${minutes}${seconds}.json`;

        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = event => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (data && typeof data === 'object' && data.tasks && data.completedTasks) {
                        localStorage.setItem('taskManagerData', JSON.stringify(data));
                        this.loadFromLocalStorage();
                        alert('Datos importados correctamente.');
                    } else {
                        alert('El archivo seleccionado no parece contener datos válidos del planificador.');
                    }
                } catch (error) {
                    alert('Error al importar el archivo')
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }
}

new TaskManager();