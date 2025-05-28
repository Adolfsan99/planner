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
        this.setupMoveTaskPopup(); // Setup the move task popup elements and listeners
    }

    setupDays() {
        const container = document.querySelector('.days-container');
        const template = document.getElementById('dayTemplate');

        const today = new Date().getDay();
        // Adjust getDay(): Sunday is 0, Monday is 1... Saturday is 6
        // We want Lunes to be index 0, Martes 1... Domingo 6
        // So, Monday (1) -> 0, Tuesday (2) -> 1, ..., Saturday (6) -> 5, Sunday (0) -> 6
        const todayIndex = today === 0 ? 6 : today - 1;

        // Reorder days to start from today
        const reorderedDays = [
            ...this.days.slice(todayIndex),
            ...this.days.slice(0, todayIndex)
        ];

        container.innerHTML = ''; // Clear existing days

        reorderedDays.forEach(day => {
            const dayElement = template.content.cloneNode(true);
            const dayCard = dayElement.querySelector('.day-card');
            dayElement.querySelector('.day-title').textContent = day;

            if (day === this.days[todayIndex]) { // Check against original day list to find "today"
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
        // Reuse the main overlay for all popups
        const overlay = document.getElementById('moveTaskPopupOverlay'); // Use the existing overlay element
        if (!overlay) {
            console.error("Overlay element not found.");
            return;
        }
        overlay.classList.add('generic-overlay'); // Add a class for general styling if needed

        const completedContainer = document.getElementById('completedTasks');
        // Prevent adding close button multiple times
        if (!completedContainer.querySelector('.close-popup')) {
            const closeButton = document.createElement('button');
            closeButton.className = 'close-popup';
            closeButton.innerHTML = '×';
             closeButton.addEventListener('click', this.closeAllPopups.bind(this)); // Bind close to instance method
            completedContainer.insertBefore(closeButton, completedContainer.firstChild);
        }


        document.getElementById('showCompleted').addEventListener('click', () => {
            this.closeAllPopups(); // Close any other popups first
            overlay.classList.add('active');
            completedContainer.classList.remove('hidden');
        });

        // Add listener to overlay to close popups when clicking outside specific popups
        overlay.addEventListener('click', (e) => {
            // Check if the click was on the overlay itself, not inside any specific popup
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

        // Populate popup content from template
        const content = template.content.cloneNode(true);
        popup.appendChild(content);

        const daySelect = popup.querySelector('.move-day-select');
        // Populate the dropdown with days
        this.days.forEach(day => {
            const option = document.createElement('option');
            option.value = day;
            option.textContent = day;
            daySelect.appendChild(option);
        });

        // Add event listeners for popup buttons
        popup.querySelector('.move-accept-btn').addEventListener('click', () => this.handleMoveTaskAccept());
        popup.querySelector('.move-cancel-btn').addEventListener('click', () => this.closeAllPopups());

        // Prevent clicks inside the popup from closing the overlay
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

        // Also ensure any task menus are closed
         document.querySelectorAll('.task-menu-popup:not(.hidden)').forEach(popup => {
             popup.classList.add('hidden');
             popup.closest('.task')?.classList.remove('menu-open');
         });
    }


    initializeSortable() {
        document.querySelectorAll('.tasks-list').forEach(list => {
            if (list.sortable) {
                list.sortable.destroy();
            }

            list.sortable = new Sortable(list, {
                group: 'tasks',
                animation: 150, // Keep a subtle animation
                draggable: '.task',
                handle: '.task-text',
                onMove: function (evt) {
                    // Prevent moving into priority list if it already has 3 tasks and the source is not priority
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

                    // Ensure any active input is converted back to span upon dropping
                    const activeInput = taskElement.querySelector('.task-text-edit');
                     if(activeInput) {
                         const taskTextSpan = document.createElement('span');
                         taskTextSpan.classList.add('task-text');
                         taskTextSpan.textContent = activeInput.value.trim() || 'Nueva tarea';
                         activeInput.replaceWith(taskTextSpan);
                     }
                    this.setupTaskEventListeners(taskElement); // Re-setup listeners for the moved/added task


                    // Update the class based on the list it was dropped into
                    taskElement.classList.remove('priority-task', 'other-task');
                    if (evt.to.classList.contains('priority-tasks')) {
                        taskElement.classList.add('priority-task');
                    } else { // Default to other-tasks if not priority
                        taskElement.classList.add('other-task');
                    }

                    // Ensure completed class is preserved if it existed
                    const isCompleted = taskElement.querySelector('.task-check')?.checked;
                    taskElement.classList.toggle('completed', isCompleted);


                    this.saveToLocalStorage();
                },
                 onRemove: () => {
                    // Save state when a task is removed (e.g., moved to completed or deleted via button)
                    this.saveToLocalStorage();
                 },
                 onUpdate: () => {
                     // Save state when tasks are reordered within a list
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

        // Set initial completed state and class
        taskCheckbox.checked = isCompleted;
        task.classList.toggle('completed', isCompleted);


        this.setupTaskEventListeners(task);

        return task;
    }

    setupTaskEventListeners(task) {
        // Clone and replace elements to remove previous event listeners before attaching new ones
        const elementsToReattach = [
            '.task-text',
            '.task-menu',
            '.edit-task',
            '.move-task', // Update selector
            '.delete-task',
            '.task-check'
        ];

        elementsToReattach.forEach(selector => {
             const oldEl = task.querySelector(selector);
             if (oldEl) {
                 const newEl = oldEl.cloneNode(true);
                 // If it's the menu button, ensure the new one has the same event listener for the popup
                 if (selector === '.task-menu') {
                      // The popup logic will be reattached below
                 }
                 oldEl.replaceWith(newEl);
             }
        });

        const newTaskText = task.querySelector('.task-text');
        const newMenuButton = task.querySelector('.task-menu');
        const newMenuPopup = task.querySelector('.task-menu-popup');
        const newEditButton = task.querySelector('.edit-task');
        const newMoveButton = task.querySelector('.move-task'); // Get the new move button
        const newDeleteButton = task.querySelector('.delete-task');
        const newTaskCheck = task.querySelector('.task-check');

        // Re-add listeners
        newTaskText.addEventListener('dblclick', () => {
             // Ensure any open menu is closed before editing
             this.closeAllMenus(task); // Pass the current task to keep its menu open if needed

            const input = document.createElement('input');
            input.type = 'text';
            input.value = newTaskText.textContent.trim();
            input.classList.add('task-text-edit');
            input.setAttribute('placeholder', 'Editar tarea');

            const saveEdit = () => {
                 const newText = input.value.trim();
                 // Only save and export if text has changed or input is not empty after editing
                 // Check if the input element is still in the DOM before replacing
                 if (input.parentNode) { // Prevent error if blur happens after replaceWith elsewhere
                     newTaskText.textContent = newText || 'Nueva tarea'; // Set default if empty
                     input.replaceWith(newTaskText);
                     task.classList.remove('editing'); // Remove editing class
                     // Save and export only if the text was actually modified and not empty
                      if (newText !== input.value.trim() || newText !== '') { // This check needs refinement, better: compare saved text to original text
                          // A simpler approach: save whenever editing finishes with non-empty text
                           this.saveToLocalStorage();
                           if (newText !== '') { // Only export if a name was actually entered
                                this.exportData(); // Auto-export after editing
                           }
                      }
                 }
            };

            // Save on blur (clicking outside)
            input.addEventListener('blur', saveEdit);

            // Save on Enter key, Cancel on Escape key
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                     e.preventDefault(); // Prevent newline in input
                     saveEdit();
                } else if (e.key === 'Escape') {
                     // Check if the input element is still in the DOM before replacing
                     if (input.parentNode) {
                         input.replaceWith(newTaskText); // Revert without saving
                         task.classList.remove('editing'); // Remove editing class on escape
                     }
                     // No save or export on escape
                }
            });

            newTaskText.replaceWith(input);
            input.focus();
            input.select(); // Select existing text
            task.classList.add('editing'); // Add editing class
        });

        const closeAllMenus = (exceptTask = null) => {
             document.querySelectorAll('.task-menu-popup:not(.hidden)').forEach(popup => {
                 const taskElement = popup.closest('.task');
                 if (taskElement !== exceptTask) { // Only close if it's not the current task's menu
                     popup.classList.add('hidden');
                     taskElement?.classList.remove('menu-open'); // Remove class when closing
                 }
             });
        };
        this.closeAllMenus = closeAllMenus; // Make it accessible from outside

        newMenuButton.addEventListener('click', (e) => {
             e.stopPropagation(); // Prevent document click listener from closing immediately
             const isHidden = newMenuPopup.classList.contains('hidden');
             closeAllMenus(task); // Close any other open menus first, keep this one if it's already open

             if (isHidden) {
                newMenuPopup.classList.remove('hidden');
                task.classList.add('menu-open'); // Add class when opening
             } else {
                newMenuPopup.classList.add('hidden');
                task.classList.remove('menu-open'); // Remove class when closing
             }
        });

        newEditButton.addEventListener('click', () => {
            const currentTaskTextElement = task.querySelector('.task-text'); // Ensure we get the span
             if (currentTaskTextElement) {
                 // Simulate a dblclick on the text element to trigger edit mode
                 const dblclickEvent = new MouseEvent('dblclick', {
                     bubbles: true,
                     cancelable: true,
                     view: window
                 });
                 currentTaskTextElement.dispatchEvent(dblclickEvent);
             }
            newMenuPopup.classList.add('hidden'); // Close the menu popup
            task.classList.remove('menu-open'); // Remove class when closing
        });

        newMoveButton.addEventListener('click', () => { // Event listener for the new move button
            this.openMoveTaskPopup(task); // Open the move popup
            newMenuPopup.classList.add('hidden'); // Close the task menu popup
            task.classList.remove('menu-open'); // Remove class when closing
        });

        newDeleteButton.addEventListener('click', () => {
            task.remove();
            newMenuPopup.classList.add('hidden'); // Close the task menu popup
            task.classList.remove('menu-open'); // Remove class when closing
            this.saveToLocalStorage(); // Save after deleting
        });

        newTaskCheck.addEventListener('change', (e) => {
            task.classList.toggle('completed', e.target.checked);
            this.saveToLocalStorage(); // Save after checking/unchecking
        });

        // Close task menus when clicking anywhere on the document, unless it's inside a menu or an active input
        document.addEventListener('click', (e) => {
             if (!e.target.closest('.task-menu-popup') && !e.target.closest('.task-menu') && !e.target.classList.contains('task-text-edit') && !e.target.closest('.move-task-popup')) {
                  closeAllMenus();
             }
        });

         // Prevent clicks inside the menu popup from bubbling up and closing immediately
         if (newMenuPopup) {
             newMenuPopup.addEventListener('click', (e) => {
                 e.stopPropagation();
             });
         }
    }

    // Removed duplicateTask method as it's replaced by moveTask

    openMoveTaskPopup(taskElement) {
         const overlay = document.getElementById('moveTaskPopupOverlay');
         const popup = document.getElementById('moveTaskPopup');
         const daySelect = popup.querySelector('.move-day-select');

         if (!overlay || !popup || !daySelect) {
              console.error("Move task popup elements not found.");
              return;
         }

         // Store the task element we intend to move
         this.taskToMove = taskElement;

         // Set the default selected day in the dropdown to the current day
         const currentDayTitle = taskElement.closest('.day-card').querySelector('.day-title')?.textContent;
         if (currentDayTitle) {
             daySelect.value = currentDayTitle;
         } else {
             // Default to the first day if the current day cannot be determined
             daySelect.selectedIndex = 0;
         }


         this.closeAllPopups(); // Close any other popups (like completed tasks)
         overlay.classList.add('active');
         popup.classList.remove('hidden');
    }

    handleMoveTaskAccept() {
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

         // Get the 'other-tasks' list in the target day card
         const targetOtherTasksList = targetDayCard.querySelector('.other-tasks');
         if (!targetOtherTasksList) {
              console.error(`'Other tasks' list not found in target day card for day: ${targetDayTitle}`);
              this.closeAllPopups();
              return;
         }

         // Clone the task element
         const clonedTask = this.taskToMove.cloneNode(true);

         // Ensure it's no longer in editing or menu-open state
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
              menuPopup.classList.add('hidden'); // Ensure duplicated menu is hidden
         }


         // Remove the original task from its current position
         this.taskToMove.remove();

         // Append the cloned task to the target 'other-tasks' list
         targetOtherTasksList.appendChild(clonedTask);

         // Ensure the moved task is in the 'other-task' category visually and logically
         clonedTask.classList.remove('priority-task');
         clonedTask.classList.add('other-task');


         // Re-setup event listeners for the new task element
         this.setupTaskEventListeners(clonedTask);

         // Clear the stored task reference
         this.taskToMove = null;

         // Close the popup and save the state
         this.closeAllPopups();
         this.saveToLocalStorage();
    }


    moveCompletedTasks() {
        const completedTasksList = document.querySelector('.completed-tasks-list');

        // Clear existing list and remove menu-open class from all tasks in the day view
        completedTasksList.innerHTML = '';
        document.querySelectorAll('.task.menu-open').forEach(task => task.classList.remove('menu-open'));
        document.querySelectorAll('.task-menu-popup').forEach(popup => popup.classList.add('hidden'));


        document.querySelectorAll('.task.completed').forEach(task => {
            const taskText = task.querySelector('.task-text')?.textContent || '';
            const originalDay = task.closest('.day-card').querySelector('.day-title')?.textContent || null;

            const completedTaskElement = this.createCompletedTaskElement(taskText, originalDay);

            completedTasksList.appendChild(completedTaskElement);

            task.remove(); // Remove the task from the day view
        });

        this.saveToLocalStorage(); // Save state after moving completed tasks
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
             console.warn(`Original day "${originalDay}" not found. Restoring to the first day card.`);
        }

        // Create a new task element, ensuring it's not marked completed initially
        const newTask = this.createTaskElement(taskElement.querySelector('.task-text').textContent, false);

        // Restore to 'other-tasks' list by default
        const otherTasksList = targetDayCard.querySelector('.other-tasks');
         if (otherTasksList) {
             otherTasksList.appendChild(newTask);
             newTask.classList.add('other-task'); // Ensure it's in the correct category visually
         } else {
             console.error("Could not find '.other-tasks' list in the target day card.");
             return;
         }

        taskElement.remove(); // Remove the task from the completed list

        this.saveToLocalStorage(); // Save state after restoring
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
                         // Get text from input if editing, otherwise from span
                         const textElement = task.querySelector('.task-text-edit') || task.querySelector('.task-text');
                         return {
                             text: textElement?.value.trim() || textElement?.textContent.trim() || '',
                             completed: task.classList.contains('completed')
                         };
                     }),
                     other: Array.from(dayCard.querySelector('.other-tasks')?.children || []).map(task => {
                          // Get text from input if editing, otherwise from span
                          const textElement = task.querySelector('.task-text-edit') || task.querySelector('.task-text');
                          return {
                              text: textElement?.value.trim() || textElement?.textContent.trim() || '',
                              completed: task.classList.contains('completed')
                          };
                     })
                 };
            }
        });

        const completedTasksList = document.querySelector('.completed-tasks-list');
         if (completedTasksList) {
             data.completedTasks = Array.from(completedTasksList.children).map(task => ({
                 text: task.querySelector('.task-text')?.textContent.trim() || '',
                 completed: true, // Completed tasks are always completed
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

            // Re-render days based on the current day first, then populate from loaded data
            // This ensures the day structure is always correct relative to today
            this.setupDays();

            if (data.tasks) {
                 Object.entries(data.tasks).forEach(([dayTitle, dayData]) => {
                     const dayCard = Array.from(document.querySelectorAll('.day-card'))
                         .find(card => card.querySelector('.day-title')?.textContent === dayTitle);

                     if (dayCard) {
                         const priorityList = dayCard.querySelector('.priority-tasks');
                         const otherList = dayCard.querySelector('.other-tasks');

                         if (priorityList && otherList) {
                             priorityList.innerHTML = ''; // Clear before loading
                             otherList.innerHTML = ''; // Clear before loading

                             if (dayData.priority && Array.isArray(dayData.priority)) {
                                 dayData.priority.forEach(taskData => {
                                     // Basic validation and creation
                                     if (taskData && typeof taskData.text === 'string') {
                                         const task = this.createTaskElement(taskData.text, taskData.completed);
                                         task.classList.add('priority-task'); // Add correct class
                                         priorityList.appendChild(task);
                                     }
                                 });
                             }

                             if (dayData.other && Array.isArray(dayData.other)) {
                                 dayData.other.forEach(taskData => {
                                      // Basic validation and creation
                                      if (taskData && typeof taskData.text === 'string') {
                                         const task = this.createTaskElement(taskData.text, taskData.completed);
                                         task.classList.add('other-task'); // Add correct class
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
                completedTasksList.innerHTML = ''; // Clear before loading
                 if (data.completedTasks && Array.isArray(data.completedTasks)) {
                    data.completedTasks.forEach(taskData => {
                         // Basic validation and creation
                         if (taskData && typeof taskData.text === 'string') {
                            const completedTaskElement = this.createCompletedTaskElement(taskData.text, taskData.originalDay);
                             completedTasksList.appendChild(completedTaskElement);
                         }
                     });
                 }
            } else {
                console.warn("Completed tasks list element not found during load.");
            }

            // Re-initialize sortable after loading tasks into the DOM
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
            if (!file) return;

            const reader = new FileReader();
            reader.onload = event => {
                try {
                    const data = JSON.parse(event.target.result);
                    // Basic validation for imported data structure
                    if (data && typeof data === 'object' && data.tasks && data.completedTasks) {
                         localStorage.setItem('taskManagerData', JSON.stringify(data));
                         this.loadFromLocalStorage(); // Reload UI with imported data
                         alert('Datos importados correctamente.');
                    } else {
                        alert('El archivo seleccionado no parece contener datos válidos del planificador.');
                    }
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