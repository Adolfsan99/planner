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
        const closePopup = () => {
             overlay.classList.remove('active');
             completedContainer.classList.add('hidden');
        };
        closeButton.addEventListener('click', closePopup);

        if (!completedContainer.querySelector('.close-popup')) {
             completedContainer.insertBefore(closeButton, completedContainer.firstChild);
        }

        document.getElementById('showCompleted').addEventListener('click', () => {
            overlay.classList.add('active');
            completedContainer.classList.remove('hidden');
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closePopup();
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
                     }
                    this.setupTaskEventListeners(taskElement);


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
        task.classList.add('other-task'); // Ensure it's added as other-task by default
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
        // Clone and replace elements to remove previous event listeners
        const elementsToReattach = [
            { selector: '.task-text', handler: 'dblclick' },
            { selector: '.task-menu', handler: 'click' },
            { selector: '.edit-task', handler: 'click' },
            { selector: '.duplicate-task', handler: 'click' },
            { selector: '.delete-task', handler: 'click' },
            { selector: '.task-check', handler: 'change' }
        ];

        elementsToReattach.forEach(({ selector }) => {
             const oldEl = task.querySelector(selector);
             if (oldEl) {
                 const newEl = oldEl.cloneNode(true);
                 oldEl.replaceWith(newEl);
             }
        });

        const newTaskText = task.querySelector('.task-text');
        const newMenuButton = task.querySelector('.task-menu');
        const newMenuPopup = task.querySelector('.task-menu-popup');
        const newEditButton = task.querySelector('.edit-task');
        const newDuplicateButton = task.querySelector('.duplicate-task');
        const newDeleteButton = task.querySelector('.delete-task');
        const newTaskCheck = task.querySelector('.task-check');

        // Re-add listeners
        newTaskText.addEventListener('dblclick', () => {
            const input = document.createElement('input');
            input.type = 'text';
            input.value = newTaskText.textContent.trim();
            input.classList.add('task-text-edit');
            input.setAttribute('placeholder', 'Editar tarea');

            const saveEdit = () => {
                 const newText = input.value.trim();
                 // Only save and export if text has changed or input is not empty after editing
                 if (newText !== newTaskText.textContent.trim() || newText !== '') {
                     newTaskText.textContent = newText || 'Nueva tarea'; // Set default if empty
                     this.saveToLocalStorage();
                     if (newText !== '') { // Only export if a name was actually entered
                        this.exportData(); // Auto-export after editing
                     }
                 }
                 input.replaceWith(newTaskText);
                 task.classList.remove('editing'); // Remove editing class
            };

            input.addEventListener('blur', saveEdit);

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                     e.preventDefault();
                     saveEdit();
                } else if (e.key === 'Escape') {
                    input.replaceWith(newTaskText);
                    task.classList.remove('editing'); // Remove editing class on escape
                }
            });

            newTaskText.replaceWith(input);
            input.focus();
            input.select(); // Select existing text
            task.classList.add('editing'); // Add editing class
        });

        const closeAllMenus = () => {
             document.querySelectorAll('.task-menu-popup:not(.hidden)').forEach(popup => {
                 popup.classList.add('hidden');
                 popup.closest('.task')?.classList.remove('menu-open'); // Remove class when closing
             });
        };

        newMenuButton.addEventListener('click', (e) => {
             e.stopPropagation(); // Prevent document click listener from closing immediately
             const isHidden = newMenuPopup.classList.contains('hidden');
             closeAllMenus(); // Close any other open menus first

             if (isHidden) {
                newMenuPopup.classList.remove('hidden');
                task.classList.add('menu-open'); // Add class when opening
             } else {
                newMenuPopup.classList.add('hidden');
                task.classList.remove('menu-open'); // Remove class when closing
             }
        });

        newEditButton.addEventListener('click', () => {
            const currentTaskText = task.querySelector('.task-text');
             if (currentTaskText) {
                 const dblclickEvent = new MouseEvent('dblclick', {
                     bubbles: true,
                     cancelable: true,
                     view: window
                 });
                 currentTaskText.dispatchEvent(dblclickEvent);
             }
            newMenuPopup.classList.add('hidden');
            task.classList.remove('menu-open'); // Remove class when closing
        });

        newDuplicateButton.addEventListener('click', () => {
            this.duplicateTask(task);
            newMenuPopup.classList.add('hidden');
            task.classList.remove('menu-open'); // Remove class when closing
        });

        newDeleteButton.addEventListener('click', () => {
            task.remove();
            newMenuPopup.classList.add('hidden');
            task.classList.remove('menu-open'); // Remove class when closing
            this.saveToLocalStorage();
        });

        newTaskCheck.addEventListener('change', (e) => {
            task.classList.toggle('completed', e.target.checked);
            this.saveToLocalStorage();
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            // Check if the click was outside *any* menu or menu button
            // Also check if it's not inside an active input for editing
            if (!e.target.closest('.task-menu-popup') && !e.target.closest('.task-menu') && !e.target.classList.contains('task-text-edit')) {
                 closeAllMenus();
            }
        });


         if (newMenuPopup) {
             newMenuPopup.addEventListener('click', (e) => {
                 e.stopPropagation(); // Prevent document click listener from closing when clicking inside the popup
             });
         }
    }

    duplicateTask(task) {
        const newTask = task.cloneNode(true);
        newTask.classList.remove('completed', 'menu-open', 'editing'); // Remove completed, menu-open, and editing classes
        newTask.querySelector('.task-check').checked = false;

        // Ensure task text is a span, not an input
        const currentTaskTextElement = newTask.querySelector('.task-text-edit') || newTask.querySelector('.task-text');
        if (currentTaskTextElement.tagName === 'INPUT') {
             const span = document.createElement('span');
             span.classList.add('task-text');
             span.textContent = currentTaskTextElement.value.trim() || 'Nueva tarea';
             currentTaskTextElement.replaceWith(span);
        }


        const newMenuPopup = newTask.querySelector('.task-menu-popup');
        if (newMenuPopup) {
            newMenuPopup.classList.add('hidden'); // Ensure duplicated menu is hidden
        }

        this.setupTaskEventListeners(newTask); // Setup listeners for the new task

        // Append or insert based on original task's parent
        const parentList = task.parentNode;
        if (parentList) {
             parentList.insertBefore(newTask, task.nextSibling);
             // Re-apply priority/other class based on the list it's in
             if (parentList.classList.contains('priority-tasks')) {
                 newTask.classList.add('priority-task');
             } else {
                 newTask.classList.add('other-task');
             }
        } else {
             console.error("Could not find parent node to duplicate task.");
        }

        this.saveToLocalStorage();
    }

    moveCompletedTasks() {
        const completedTasksList = document.querySelector('.completed-tasks-list');

        // Clear existing list and remove menu-open class from all tasks
        completedTasksList.innerHTML = '';
        document.querySelectorAll('.task.menu-open').forEach(task => task.classList.remove('menu-open'));

        document.querySelectorAll('.task.completed').forEach(task => {
            const taskText = task.querySelector('.task-text')?.textContent || '';
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
                 this.saveToLocalStorage(); // Save state after deletion
            }
        });

        return div;
    }

    restoreTask(taskElement, originalDay) {
        let targetDayCard = Array.from(document.querySelectorAll('.day-card'))
            .find(card => card.querySelector('.day-title')?.textContent === originalDay);

        if (!targetDayCard) {
            // Fallback to the first day card if the original day is not found
            targetDayCard = document.querySelector('.day-card');
             if (!targetDayCard) {
                 console.error("Could not find any day card to restore the task.");
                 return;
             }
             console.warn(`Original day "${originalDay}" not found or no day cards available. Restoring to the first day card.`);
        }

        const newTask = this.createTaskElement(taskElement.querySelector('.task-text').textContent, false);

        // Restore to 'other-tasks' list by default
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
            const dayTitle = dayCard.querySelector('.day-title')?.textContent;
            if (dayTitle) {
                 data.tasks[dayTitle] = {
                     priority: Array.from(dayCard.querySelector('.priority-tasks')?.children || []).map(task => {
                         const textElement = task.querySelector('.task-text-edit') || task.querySelector('.task-text');
                         return {
                             text: textElement?.value || textElement?.textContent || '',
                             completed: task.classList.contains('completed')
                         };
                     }),
                     other: Array.from(dayCard.querySelector('.other-tasks')?.children || []).map(task => {
                          const textElement = task.querySelector('.task-text-edit') || task.querySelector('.task-text');
                          return {
                              text: textElement?.value || textElement?.textContent || '',
                              completed: task.classList.contains('completed')
                          };
                     })
                 };
            }
        });

        const completedTasksList = document.querySelector('.completed-tasks-list');
         if (completedTasksList) {
             data.completedTasks = Array.from(completedTasksList.children).map(task => ({
                 text: task.querySelector('.task-text')?.textContent || '',
                 completed: true,
                 originalDay: task.querySelector('.completed-restore-btn')?.dataset.originalDay || null
             }));
         }

        localStorage.setItem('taskManagerData', JSON.stringify(data));
    }

    loadFromLocalStorage() {
        const savedData = localStorage.getItem('taskManagerData');
        if (!savedData) return;

        try {
            const data = JSON.parse(savedData);

            if (data.tasks) {
                 // Re-render days based on the current day first, then populate from loaded data
                 this.setupDays(); // Ensure days are set up before loading data into them

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
                                     if (taskData && typeof taskData.text === 'string') { // Basic validation
                                         const task = this.createTaskElement(taskData.text, taskData.completed);
                                         priorityList.appendChild(task);
                                     }
                                 });
                             }

                             if (dayData.other && Array.isArray(dayData.other)) {
                                 dayData.other.forEach(taskData => {
                                      if (taskData && typeof taskData.text === 'string') { // Basic validation
                                         const task = this.createTaskElement(taskData.text, taskData.completed);
                                         otherList.appendChild(task);
                                      }
                                 });
                             }
                         } else {
                             console.warn(`Priority or Other tasks list not found for day: ${dayTitle}`);
                         }
                     } else {
                         // This case happens if a day title was saved but doesn't match current days (e.g., changing language or logic)
                         console.warn(`Day card not found for day title from loaded data: ${dayTitle}`);
                         // Decide how to handle orphaned tasks - currently discards them.
                         // Could potentially add them to the first day as a fallback.
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
                         if (taskData && typeof taskData.text === 'string') { // Basic validation
                            const completedTaskElement = this.createCompletedTaskElement(taskData.text, taskData.originalDay);
                             completedTasksList.appendChild(completedTaskElement);
                         }
                     });
                 }
            } else {
                console.warn("Completed tasks list element not found.");
            }

            // Re-initialize sortable after loading tasks
            this.initializeSortable();

        } catch (error) {
            console.error("Failed to parse or load data from localStorage:", error);
            // Optionally clear broken data or show an error message
            // localStorage.removeItem('taskManagerData');
            // alert("Error al cargar los datos guardados.");
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
        const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
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