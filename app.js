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
    }

    setupDays() {
        const container = document.querySelector('.days-container');
        const template = document.getElementById('dayTemplate');
        
        const today = new Date().getDay();
        const todayIndex = today === 0 ? 6 : today - 1;
        
        const reorderedDays = [
            ...this.days.slice(todayIndex),
            ...this.days.slice(0, todayIndex)
        ];

        container.innerHTML = '';

        reorderedDays.forEach(day => {
            const dayElement = template.content.cloneNode(true);
            const dayCard = dayElement.querySelector('.day-card');
            dayElement.querySelector('.day-title').textContent = day;
            
            if (day === this.days[todayIndex]) {
                dayCard.classList.add('current-day');
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
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        document.body.appendChild(overlay);

        const completedContainer = document.getElementById('completedTasks');
        const closeButton = document.createElement('button');
        closeButton.className = 'close-popup';
        closeButton.innerHTML = '×';
        closeButton.addEventListener('click', () => {
            overlay.classList.remove('active');
            completedContainer.classList.add('hidden');
        });
        
        if (!completedContainer.querySelector('.close-popup')) {
             completedContainer.insertBefore(closeButton, completedContainer.firstChild);
        }

        document.getElementById('showCompleted').addEventListener('click', () => {
            overlay.classList.add('active');
            completedContainer.classList.remove('hidden');
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
                completedContainer.classList.add('hidden');
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
                animation: 150,
                easing: 'cubic-bezier(1, 0, 0, 1)',
                draggable: '.task',
                handle: '.task-text',
                onMove: function (evt) {
                    if (evt.to.classList.contains('priority-tasks')) {
                         const priorityTasks = evt.to.querySelectorAll('.task:not(.sortable-ghost)');
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
                         this.setupTaskEventListeners(taskElement);
                     }

                    taskElement.classList.remove('priority-task', 'other-task');
                    if (evt.to.classList.contains('priority-tasks')) {
                        taskElement.classList.add('priority-task');
                    } else {
                        taskElement.classList.add('other-task');
                    }

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
        
        if (isCompleted) {
            task.classList.add('completed');
            taskCheckbox.checked = true;
        } else {
             taskCheckbox.checked = false;
             task.classList.remove('completed');
        }
        
        this.setupTaskEventListeners(task);
        
        return task;
    }

    setupTaskEventListeners(task) {
        const oldTaskText = task.querySelector('.task-text');
        if (oldTaskText) {
            oldTaskText.replaceWith(oldTaskText.cloneNode(true));
        }

        const oldMenuButton = task.querySelector('.task-menu');
         if (oldMenuButton) {
            oldMenuButton.replaceWith(oldMenuButton.cloneNode(true));
        }
        const oldEditButton = task.querySelector('.edit-task');
         if (oldEditButton) {
            oldEditButton.replaceWith(oldEditButton.cloneNode(true));
        }
        const oldDuplicateButton = task.querySelector('.duplicate-task');
         if (oldDuplicateButton) {
            oldDuplicateButton.replaceWith(oldDuplicateButton.cloneNode(true));
        }
        const oldDeleteButton = task.querySelector('.delete-task');
         if (oldDeleteButton) {
            oldDeleteButton.replaceWith(oldDeleteButton.cloneNode(true));
        }
        const oldCheckbox = task.querySelector('.task-check');
         if (oldCheckbox) {
            oldCheckbox.replaceWith(oldCheckbox.cloneNode(true));
        }

        const taskText = task.querySelector('.task-text');
        const menuButton = task.querySelector('.task-menu');
        const menuPopup = task.querySelector('.task-menu-popup');
        const editButton = task.querySelector('.edit-task');
        const duplicateButton = task.querySelector('.duplicate-task');
        const deleteButton = task.querySelector('.delete-task');
        const taskCheck = task.querySelector('.task-check');

        taskText.addEventListener('dblclick', () => {
            const input = document.createElement('input');
            input.type = 'text';
            input.value = taskText.textContent.trim();
            input.classList.add('task-text-edit');
            input.setAttribute('placeholder', 'Editar tarea');

            const saveEdit = () => {
                 taskText.textContent = input.value.trim() || taskText.textContent;
                 input.replaceWith(taskText);
                 this.setupTaskEventListeners(task);
                 this.saveToLocalStorage();
            };

            input.addEventListener('blur', saveEdit);

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                     e.preventDefault();
                     saveEdit();
                } else if (e.key === 'Escape') {
                    input.replaceWith(taskText);
                    this.setupTaskEventListeners(task);
                }
            });

            taskText.replaceWith(input);
            input.focus();
        });

        menuButton.addEventListener('click', (e) => {
             e.stopPropagation();
             document.querySelectorAll('.task-menu-popup:not(.hidden)').forEach(popup => {
                 if (popup !== menuPopup) {
                     popup.classList.add('hidden');
                 }
             });
             menuPopup.classList.toggle('hidden');
        });

        editButton.addEventListener('click', () => {
            const dblclickEvent = new MouseEvent('dblclick', {
                 bubbles: true,
                 cancelable: true,
                 view: window
            });
            taskText.dispatchEvent(dblclickEvent);
            menuPopup.classList.add('hidden');
        });

        duplicateButton.addEventListener('click', () => {
            this.duplicateTask(task);
            menuPopup.classList.add('hidden');
        });

        deleteButton.addEventListener('click', () => {
            task.remove();
            menuPopup.classList.add('hidden');
            this.saveToLocalStorage();
        });

        taskCheck.addEventListener('change', (e) => {
            task.classList.toggle('completed', e.target.checked);
            this.saveToLocalStorage();
        });

        document.addEventListener('click', (e) => {
            if (!menuButton.contains(e.target) && !menuPopup.contains(e.target)) {
                menuPopup.classList.add('hidden');
            }
        });

         menuPopup.addEventListener('click', (e) => {
             e.stopPropagation();
         });
    }

    duplicateTask(task) {
        const newTask = task.cloneNode(true);
        newTask.classList.remove('completed');
        newTask.querySelector('.task-check').checked = false;
        
        const newMenuPopup = newTask.querySelector('.task-menu-popup');
        if (newMenuPopup) {
            newMenuPopup.classList.add('hidden');
        }

        this.setupTaskEventListeners(newTask);
        
        task.parentNode.insertBefore(newTask, task.nextSibling);
        this.saveToLocalStorage();
    }

    moveCompletedTasks() {
        const completedTasksList = document.querySelector('.completed-tasks-list');
        
        completedTasksList.innerHTML = '';
        
        document.querySelectorAll('.task.completed').forEach(task => {
            const taskText = task.querySelector('.task-text').textContent;
            const originalDay = task.closest('.day-card').querySelector('.day-title').textContent;

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
                <button class="completed-restore-btn" data-original-day="${originalDay}">Restaurar</button>
            </div>
            `;

        div.querySelector('.completed-restore-btn').addEventListener('click', () => {
            this.restoreTask(div, originalDay);
        });

        return div;
    }

    restoreTask(taskElement, originalDay) {
        let targetDayCard = Array.from(document.querySelectorAll('.day-card'))
            .find(card => card.querySelector('.day-title').textContent === originalDay);
        
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
        const data = {
            tasks: {},
            completedTasks: []
        };

        document.querySelectorAll('.day-card').forEach(dayCard => {
            const dayTitle = dayCard.querySelector('.day-title').textContent;
            data.tasks[dayTitle] = {
                priority: Array.from(dayCard.querySelector('.priority-tasks')?.children || []).map(task => ({
                    text: task.querySelector('.task-text')?.textContent || '',
                    completed: task.classList.contains('completed')
                })),
                other: Array.from(dayCard.querySelector('.other-tasks')?.children || []).map(task => ({
                    text: task.querySelector('.task-text')?.textContent || '',
                    completed: task.classList.contains('completed')
                }))
            };
        });

        const completedTasksList = document.querySelector('.completed-tasks-list');
         if (completedTasksList) {
             data.completedTasks = Array.from(completedTasksList.children).map(task => ({
                 text: task.querySelector('.task-text').textContent,
                 completed: true,
                 originalDay: task.querySelector('.completed-restore-btn')?.dataset.originalDay || null
             }));
         }

        localStorage.setItem('taskManagerData', JSON.stringify(data));
    }

    loadFromLocalStorage() {
        const savedData = localStorage.getItem('taskManagerData');
        if (!savedData) return;

        const data = JSON.parse(savedData);

        Object.entries(data.tasks).forEach(([dayTitle, dayData]) => {
            const dayCard = Array.from(document.querySelectorAll('.day-card'))
                .find(card => card.querySelector('.day-title').textContent === dayTitle);
            
            if (dayCard) {
                const priorityList = dayCard.querySelector('.priority-tasks');
                const otherList = dayCard.querySelector('.other-tasks');

                priorityList.innerHTML = '';
                otherList.innerHTML = '';

                dayData.priority.forEach(taskData => {
                    const task = this.createTaskElement(taskData.text, taskData.completed);
                    priorityList.appendChild(task);
                });

                dayData.other.forEach(taskData => {
                    const task = this.createTaskElement(taskData.text, taskData.completed);
                    otherList.appendChild(task);
                });
            }
        });

        const completedTasksList = document.querySelector('.completed-tasks-list');
        completedTasksList.innerHTML = '';
        if (data.completedTasks) {
            data.completedTasks.forEach(taskData => {
                const task = this.createTaskElement(taskData.text, taskData.completed);
                if (taskData.originalDay) {
                    task.dataset.originalDay = taskData.originalDay;
                }
                this.setupTaskEventListeners(task);
                completedTasksList.appendChild(task);
            });
        }
    }

    setupImportExport() {
        document.getElementById('exportData').addEventListener('click', () => this.exportData());
        document.getElementById('importData').addEventListener('click', () => this.importData());
    }

    exportData() {
        const data = localStorage.getItem('taskManagerData');
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tareas.json';
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
            const reader = new FileReader();
            reader.onload = event => {
                try {
                    const data = JSON.parse(event.target.result);
                    localStorage.setItem('taskManagerData', JSON.stringify(data));
                    this.loadFromLocalStorage();
                } catch (error) {
                    alert('Error al importar el archivo');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }
}

new TaskManager();