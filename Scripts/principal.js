let savedGrades = [];
let currentAverage = null;
let editingIndex = -1;

const ALERT_CONFIG = {
    types: {
        success: { icon: 'bi-check-circle-fill', color: '#16a34a' },
        error: { icon: 'bi-x-circle-fill', color: '#dc2626' },
        warning: { icon: 'bi-exclamation-triangle-fill', color: '#f59e0b' },
        info: { icon: 'bi-info-circle-fill', color: '#2563eb' }
    },
    durations: {
        success: 4000,
        error: 5000,
        warning: 4500,
        info: 4000
    }
};

const STYLES = {
    alertContainer: `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        pointer-events: none;
    `,
    alertBase: `
        background: white;
        border-radius: 10px;
        box-shadow: 0 10px 24px -8px rgba(11,31,58,0.2);
        margin-bottom: 10px;
        max-width: 350px;
        opacity: 0;
        pointer-events: auto;
        transform: translateX(100%);
        transition: all 0.3s ease;
    `,
    modalOverlay: `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(11,31,58,0.55);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
    `,
    modalContent: `
        background: white;
        border-radius: 16px;
        box-shadow: 0 20px 36px -12px rgba(11,31,58,0.35);
        max-width: 400px;
        width: 90%;
        transform: scale(0.8);
        transition: transform 0.3s ease;
    `
};

class CustomAlert {
    constructor() {
        this.container = this.createContainer();
    }

    createContainer() {
        const container = document.createElement('div');
        container.id = 'custom-alerts-container';
        container.style.cssText = STYLES.alertContainer;
        document.body.appendChild(container);
        return container;
    }

    createAlertElement(message, type) {
        const alert = document.createElement('div');
        const config = ALERT_CONFIG.types[type] || ALERT_CONFIG.types.info;

        alert.className = `custom-alert custom-alert-${type}`;
        alert.innerHTML = `
            <div class="alert-content">
                <div class="alert-icon"><i class="bi ${config.icon}"></i></div>
                <div class="alert-message">${message}</div>
                <button class="alert-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="bi bi-x"></i>
                </button>
            </div>
        `;

        this.applyAlertStyles(alert, config.color);
        return alert;
    }

    applyAlertStyles(alert, color) {
        // Curva con un leve "overshoot" (igual lógica de tecla presionable: entra
        // con energía y se asienta) en vez del ease lineal anterior.
        alert.style.cssText = STYLES.alertBase + `border-left: 4px solid ${color}; transition: opacity 0.35s ease, transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);`;

        const content = alert.querySelector('.alert-content');
        content.style.cssText = `
            display: flex;
            align-items: center;
            padding: 12px 16px;
            gap: 12px;
        `;

        const icon = alert.querySelector('.alert-icon');
        icon.style.cssText = `color: ${color}; font-size: 18px; flex-shrink: 0;`;

        const message = alert.querySelector('.alert-message');
        message.style.cssText = `flex: 1; font-size: 14px; line-height: 1.4; color: #0f172a;`;

        const closeBtn = alert.querySelector('.alert-close');
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: #94a3b8;
            cursor: pointer;
            font-size: 16px;
            padding: 4px;
            transition: color 0.2s ease;
        `;

        closeBtn.addEventListener('mouseenter', () => closeBtn.style.color = '#0f172a');
        closeBtn.addEventListener('mouseleave', () => closeBtn.style.color = '#94a3b8');
    }

    show(message, type = 'info', duration = null) {
        const alert = this.createAlertElement(message, type);
        const alertDuration = duration || ALERT_CONFIG.durations[type] || ALERT_CONFIG.durations.info;

        this.container.appendChild(alert);

        // rAF doble en vez de setTimeout(10) para garantizar que el navegador
        // ya pintó el estado inicial antes de animar al estado final.
        requestAnimationFrame(() => requestAnimationFrame(() => {
            alert.style.opacity = '1';
            alert.style.transform = 'translateX(0)';
        }));

        setTimeout(() => this.dismiss(alert), alertDuration);
        return alert;
    }

    dismiss(alert) {
        alert.style.transition = 'opacity 0.25s ease, transform 0.3s cubic-bezier(0.4, 0, 1, 1)';
        alert.style.opacity = '0';
        alert.style.transform = 'translateX(100%)';
        setTimeout(() => alert.parentElement?.removeChild(alert), 300);
    }

    success(message, duration) { return this.show(message, 'success', duration); }
    error(message, duration) { return this.show(message, 'error', duration); }
    warning(message, duration) { return this.show(message, 'warning', duration); }
    info(message, duration) { return this.show(message, 'info', duration); }
}

class ConfirmationModal {
    static show(title, message, onConfirm, onCancel = null) {
        const overlay = document.createElement('div');
        overlay.style.cssText = STYLES.modalOverlay;

        const modal = document.createElement('div');
        // Easing tipo "tecla": sale con un pequeño rebote en vez de un scale lineal.
        modal.style.cssText = STYLES.modalContent + ' transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);';
        modal.innerHTML = this.getModalHTML(title, message);

        const [btnCancel, btnConfirm] = this.setupButtons(modal, onConfirm, onCancel);
        const closeModal = this.createCloseHandler(overlay, modal);

        btnCancel.addEventListener('click', () => {
            closeModal();
            onCancel?.();
        });

        btnConfirm.addEventListener('click', () => {
            closeModal();
            onConfirm();
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal();
                onCancel?.();
            }
        });

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        requestAnimationFrame(() => requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            modal.style.transform = 'scale(1)';
        }));
    }

    static getModalHTML(title, message) {
        return `
            <div class="modal-header" style="padding: 20px 24px 16px; border-bottom: 1px solid #e1ecfe;">
                <h5 style="margin: 0; color: #0b1f3a; font-weight: 700; font-family: 'Space Grotesk', sans-serif;">${title}</h5>
            </div>
            <div class="modal-body" style="padding: 20px 24px;">
                <p style="margin: 0; color: #475569; line-height: 1.5;">${message}</p>
            </div>
            <div class="modal-footer" style="padding: 16px 24px 20px; display: flex; gap: 12px; justify-content: flex-end;">
                <button class="btn-cancel" style="
                    background: #64748b;
                    border: none;
                    border-radius: 8px;
                    color: white;
                    cursor: pointer;
                    padding: 8px 16px;
                    box-shadow: 0 3px 0 #44546b;
                    transition: all 0.15s ease;
                ">Cancelar</button>
                <button class="btn-confirm" style="
                    background: #dc2626;
                    border: none;
                    border-radius: 8px;
                    color: white;
                    cursor: pointer;
                    padding: 8px 16px;
                    box-shadow: 0 3px 0 #b91c1c;
                    transition: all 0.15s ease;
                ">Confirmar</button>
            </div>
        `;
    }

    static setupButtons(modal, onConfirm, onCancel) {
        const btnCancel = modal.querySelector('.btn-cancel');
        const btnConfirm = modal.querySelector('.btn-confirm');

        btnCancel.addEventListener('mouseenter', () => btnCancel.style.filter = 'brightness(1.08)');
        btnCancel.addEventListener('mouseleave', () => btnCancel.style.filter = 'brightness(1)');
        btnConfirm.addEventListener('mouseenter', () => btnConfirm.style.filter = 'brightness(1.08)');
        btnConfirm.addEventListener('mouseleave', () => btnConfirm.style.filter = 'brightness(1)');

        return [btnCancel, btnConfirm];
    }

    static createCloseHandler(overlay, modal) {
        return () => {
            overlay.style.transition = 'opacity 0.25s ease';
            modal.style.transition = 'transform 0.25s cubic-bezier(0.4, 0, 1, 1)';
            overlay.style.opacity = '0';
            modal.style.transform = 'scale(0.8)';
            setTimeout(() => document.body.removeChild(overlay), 300);
        };
    }
}

class GradeManager {
    constructor() {
        this.customAlert = new CustomAlert();
    }

    customRound(number) {
        const decimal = number - Math.floor(number);
        if (decimal >= 0.5) {
            return Math.ceil(number);
        } else {
            return Math.floor(number);
        }
    }

    getCurrentAverage() {
        const selectors = [
            '#resultScore',
            '#chart tr.average td.nota',
            '#chart tr td.nombre:contains("PROMEDIO") + td.nota'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                return parseFloat(element.textContent);
            }
        }

        const chartRows = document.querySelectorAll('#chart tr');
        for (const row of chartRows) {
            const nameCell = row.querySelector('td.nombre');
            if (nameCell?.textContent.includes('PROMEDIO')) {
                const scoreCell = row.querySelector('td.nota');
                if (scoreCell) return parseFloat(scoreCell.textContent);
            }
        }

        return null;
    }

    validateCourseInput(courseName, courseCredits) {
        if (!courseName) {
            this.customAlert.error("Por favor, ingresa el nombre del curso.");
            return false;
        }

        if (!courseCredits || courseCredits < 1) {
            this.customAlert.error("Por favor, ingresa un número válido de créditos.");
            return false;
        }

        return true;
    }

    findExistingCourse(courseName, excludeIndex = -1) {
        return savedGrades.findIndex((grade, i) =>
            i !== excludeIndex && grade.courseName.toLowerCase() === courseName.toLowerCase()
        );
    }

    saveGrade() {
        const courseName = document.getElementById('courseName').value.trim();
        const courseCredits = parseInt(document.getElementById('courseCredits').value);
        const average = this.getCurrentAverage();

        if (!this.validateCourseInput(courseName, courseCredits)) return;

        if (average === null) {
            this.customAlert.error("No se pudo obtener el promedio calculado. Asegúrate de haber evaluado las notas primero.");
            return;
        }

        if (editingIndex === -1) {
            this.handleNewGrade(courseName, courseCredits, average);
        } else {
            this.handleEditGrade(courseName, courseCredits, average);
        }
    }

    handleNewGrade(courseName, courseCredits, average) {
        const existingIndex = this.findExistingCourse(courseName);

        if (existingIndex !== -1) {
            ConfirmationModal.show(
                "Curso existente",
                "Este curso ya está guardado. ¿Deseas actualizar el promedio?",
                () => {
                    savedGrades[existingIndex] = { courseName, average, credits: courseCredits };
                    this.updateUI("El promedio del curso ha sido actualizado.");
                }
            );
        } else {
            savedGrades.push({ courseName, average, credits: courseCredits });
            // Esta es la entrada de un curso nuevo: la próxima fila pintada en
            // displaySavedGrades() debe entrar marcada para animarse.
            this.lastAddedIndex = savedGrades.length - 1;
            this.updateUI("El promedio del curso ha sido guardado exitosamente.");
        }
    }

    handleEditGrade(courseName, courseCredits, average) {
        savedGrades[editingIndex] = { courseName, average, credits: courseCredits };
        editingIndex = -1;
        this.updateUI("El curso ha sido actualizado exitosamente.");
    }

    updateUI(message) {
        this.saveSavedGrades();
        this.displaySavedGrades();
        this.clearSaveForm();
        this.customAlert.success(message);
    }

    calculateWeightedAverage() {
        if (savedGrades.length === 0) {
            this.customAlert.error("No hay promedios guardados para calcular.");
            return;
        }

        const { totalWeightedSum, totalCredits } = savedGrades.reduce(
            (acc, grade) => {
                const roundedGrade = this.customRound(grade.average);
                return {
                    totalWeightedSum: acc.totalWeightedSum + (roundedGrade * grade.credits),
                    totalCredits: acc.totalCredits + grade.credits
                };
            },
            { totalWeightedSum: 0, totalCredits: 0 }
        );

        const weightedAverage = totalWeightedSum / totalCredits;

        const finalRoundedAverage = this.customRound(weightedAverage);

        document.getElementById('weightedAverageValue').innerHTML = `
            <small class="text-primary">${weightedAverage.toFixed(2)}</small>
            <small class="text-muted ms-2">(${totalCredits} créditos)</small>
        `;

        // En vez de mostrar el bloque de golpe, se reaprovecha la misma
        // animación de "tick" que usan resultScore/neededScore en el
        // simulador, para que la pantalla LCD del ponderado se sienta
        // consistente con la del promedio individual.
        const resultBlock = document.getElementById('weightedAverageResult');
        resultBlock.style.display = 'block';
        resultBlock.classList.remove('lcd-tick');
        void resultBlock.offsetWidth;
        resultBlock.classList.add('lcd-tick');

        this.customAlert.success(`El promedio ponderado del ciclo es ${weightedAverage.toFixed(2)}`);
    }

    clearAllGrades() {
        ConfirmationModal.show(
            "¿Estás seguro?",
            "Se eliminarán todos los promedios guardados. Esta acción no se puede deshacer.",
            () => {
                savedGrades = [];
                editingIndex = -1;
                this.updateUI("Todos los promedios han sido eliminados.");
            }
        );
    }

    displaySavedGrades() {
        const tableBody = document.getElementById('savedGradesTable');
        const savedGradesCard = document.getElementById('savedGrades');
        const calculateButton = document.getElementById('calculateWeightedAverage');
        const weightedResult = document.getElementById('weightedAverageResult');

        if (savedGrades.length === 0) {
            savedGradesCard.style.display = 'none';
            return;
        }

        savedGradesCard.style.display = 'block';
        calculateButton.disabled = false;
        weightedResult.style.display = 'none';
        tableBody.innerHTML = '';

        savedGrades.forEach((grade, index) => {
            const row = this.createGradeRow(grade, index);
            // Stagger de entrada: cada fila se anima un poco después de la
            // anterior, igual que las filas de #chart en main.js.
            row.classList.add('grade-row-enter');
            row.style.animationDelay = `${index * 45}ms`;
            tableBody.appendChild(row);
        });

        this.lastAddedIndex = -1;
        this.addDoubleClickListeners();
    }

    createGradeRow(grade, index) {
        const row = document.createElement('tr');

        // Aplicar redondeo personalizado para mostrar en la tabla
        const roundedGrade = this.customRound(grade.average);

        row.innerHTML = `
            <td>
                <span class="course-name-display" id="display-name-${index}">${grade.courseName}</span>
                <input type="text" class="form-control form-control-sm course-name-edit" 
                       id="edit-name-${index}" value="${grade.courseName}" style="display: none;">
            </td>
            <td>
                <span class="grade-display">${roundedGrade}</span>
                <small class="text-muted ms-1">(${grade.average.toFixed(2)})</small>
            </td>
            <td>
                <span class="course-credits-display" id="display-credits-${index}">${grade.credits}</span>
                <input type="number" class="form-control form-control-sm course-credits-edit" 
                       id="edit-credits-${index}" value="${grade.credits}" min="1" max="10" style="display: none;">
            </td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-primary edit-btn" onclick="gradeManager.editGrade(${index})" 
                            id="edit-btn-${index}" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-success save-btn" onclick="gradeManager.saveEditGrade(${index})" 
                            id="save-btn-${index}" style="display: none;" title="Guardar">
                        <i class="bi bi-check"></i>
                    </button>
                    <button class="btn btn-sm btn-secondary cancel-btn" onclick="gradeManager.cancelEditGrade(${index})" 
                            id="cancel-btn-${index}" style="display: none;" title="Cancelar">
                        <i class="bi bi-x"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-btn" onclick="gradeManager.deleteGrade(${index})" 
                            id="delete-btn-${index}" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        return row;
    }

    addDoubleClickListeners() {
        const tableBody = document.getElementById('savedGradesTable');
        const rows = tableBody.querySelectorAll('tr');

        rows.forEach((row, index) => {
            row.removeEventListener('dblclick', this.handleDoubleClick);
            row.addEventListener('dblclick', (e) => this.handleDoubleClick(e, index));

            row.style.cursor = 'pointer';
            row.addEventListener('mouseenter', () => {
                if (!row.querySelector('.course-name-edit[style*="block"]')) {
                    row.style.backgroundColor = '#eef4ff';
                }
            });
            row.addEventListener('mouseleave', () => {
                if (!row.querySelector('.course-name-edit[style*="block"]')) {
                    row.style.backgroundColor = '';
                }
            });
        });
    }

    handleDoubleClick(e, index) {
        const row = e.currentTarget;

        if (row.querySelector('.course-name-edit[style*="block"]') || e.target.closest('.btn-group')) {
            return;
        }

        this.editGrade(index);
    }

    toggleEditMode(index, isEditing) {
        const elements = {
            display: [`display-name-${index}`, `display-credits-${index}`],
            edit: [`edit-name-${index}`, `edit-credits-${index}`],
            buttons: {
                show: isEditing ? [`save-btn-${index}`, `cancel-btn-${index}`] : [`edit-btn-${index}`, `delete-btn-${index}`],
                hide: isEditing ? [`edit-btn-${index}`, `delete-btn-${index}`] : [`save-btn-${index}`, `cancel-btn-${index}`]
            }
        };

        // En vez de un display:none/block instantáneo, se usa una breve
        // transición de opacidad+escala (clase .field-swap, definida en
        // styles.css) antes de intercambiar qué elemento es visible. El
        // intercambio real de display sigue siendo el mismo mecanismo de
        // siempre, solo que ahora se siente como un crossfade.
        const row = document.getElementById(`display-name-${index}`)?.closest('tr');

        elements.display.forEach(id => {
            const el = document.getElementById(id);
            el.style.display = isEditing ? 'none' : 'block';
            if (!isEditing) {
                el.classList.remove('field-swap');
                void el.offsetWidth;
                el.classList.add('field-swap');
            }
        });

        elements.edit.forEach(id => {
            const el = document.getElementById(id);
            el.style.display = isEditing ? 'block' : 'none';
            if (isEditing) {
                el.classList.remove('field-swap');
                void el.offsetWidth;
                el.classList.add('field-swap');
            }
        });

        elements.buttons.show.forEach(id => {
            document.getElementById(id).style.display = isEditing ? 'inline-block' : 'inline-block';
        });

        elements.buttons.hide.forEach(id => {
            document.getElementById(id).style.display = 'none';
        });

        if (row) {
            row.classList.toggle('row-editing', isEditing);
        }

        if (isEditing) {
            document.getElementById(`edit-name-${index}`).focus();
        }
    }

    editGrade(index) {
        this.toggleEditMode(index, true);
    }

    saveEditGrade(index) {
        const newName = document.getElementById(`edit-name-${index}`).value.trim();
        const newCredits = parseInt(document.getElementById(`edit-credits-${index}`).value);

        if (!this.validateEditInput(newName, newCredits, index)) return;

        savedGrades[index] = { ...savedGrades[index], courseName: newName, credits: newCredits };

        this.saveSavedGrades();
        this.displaySavedGrades();
        document.getElementById('weightedAverageResult').style.display = 'none';
        this.customAlert.success("El curso ha sido actualizado exitosamente.");
    }

    validateEditInput(newName, newCredits, index) {
        if (!newName) {
            this.customAlert.error("El nombre del curso no puede estar vacío.");
            return false;
        }

        if (!newCredits || newCredits < 1 || newCredits > 10) {
            this.customAlert.error("Por favor, ingresa un número válido de créditos (1-10).");
            return false;
        }

        const existingIndex = this.findExistingCourse(newName, index);
        if (existingIndex !== -1) {
            this.customAlert.error("Ya existe un curso con ese nombre.");
            return false;
        }

        return true;
    }

    cancelEditGrade(index) {
        document.getElementById(`edit-name-${index}`).value = savedGrades[index].courseName;
        document.getElementById(`edit-credits-${index}`).value = savedGrades[index].credits;
        this.toggleEditMode(index, false);
    }

    deleteGrade(index) {
        ConfirmationModal.show(
            "¿Estás seguro?",
            "Se eliminará este promedio guardado.",
            () => {
                // Animar la salida de la fila específica antes de redibujar
                // toda la tabla, en vez de que desaparezca de golpe.
                const row = document.getElementById(`display-name-${index}`)?.closest('tr');
                const finishDelete = () => {
                    savedGrades.splice(index, 1);
                    this.saveSavedGrades();
                    this.displaySavedGrades();
                    document.getElementById('weightedAverageResult').style.display = 'none';
                    this.customAlert.success("El promedio ha sido eliminado.");
                };

                if (row) {
                    row.classList.add('grade-row-exit');
                    row.addEventListener('animationend', finishDelete, { once: true });
                    // Salvaguarda por si animationend no dispara (ej. reduced motion).
                    setTimeout(finishDelete, 260);
                } else {
                    finishDelete();
                }
            }
        );
    }

    clearSaveForm() {
        document.getElementById('courseName').value = '';
        document.getElementById('courseCredits').value = '';
        editingIndex = -1;
    }

    saveSavedGrades() {
    }

    loadSavedGrades() {
        this.displaySavedGrades();
    }
}

class ScrollManager {
    constructor() {
        this.backToTopButton = document.getElementById('backToTop');
        this.isScrolling = false;
        this.scrollTimeout = null;
        this.init();
    }

    init() {
        window.addEventListener('scroll', () => this.handleScroll());
        this.backToTopButton.addEventListener('click', (e) => this.handleClick(e));
    }

    handleScroll() {
        if (this.scrollTimeout) clearTimeout(this.scrollTimeout);

        this.scrollTimeout = setTimeout(() => {
            if (!this.isScrolling) {
                this.toggleBackToTopButton();
            }
        }, 10);
    }

    toggleBackToTopButton() {
        const scrollPosition = window.pageYOffset;
        const shouldShow = scrollPosition > 300;
        const shouldHide = scrollPosition < 100;
        const isVisible = this.backToTopButton.classList.contains('visible');

        // El aparecer/ocultar y el hover ahora los resuelve el CSS
        // (clase .visible + :hover), así que aquí solo hace falta
        // alternar la clase — nada de transition/transform inline.
        if (shouldShow && !shouldHide && !isVisible) {
            this.backToTopButton.classList.add('visible');
        } else if ((shouldHide || !shouldShow) && isVisible) {
            this.backToTopButton.classList.remove('visible');
        }
    }

    handleClick(e) {
        e.preventDefault();
        this.smoothScrollToTop();
    }

    smoothScrollToTop() {
        this.isScrolling = true;
        const startPosition = window.pageYOffset;
        const startTime = performance.now();
        const duration = 800;

        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

        const scrollAnimation = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutCubic(progress);
            const currentPosition = startPosition * (1 - easedProgress);

            window.scrollTo(0, currentPosition);

            if (progress < 1) {
                requestAnimationFrame(scrollAnimation);
            } else {
                this.isScrolling = false;
                setTimeout(() => this.toggleBackToTopButton(), 100);
            }
        };

        requestAnimationFrame(scrollAnimation);
    }
}

let gradeManager;
let scrollManager;

document.addEventListener('DOMContentLoaded', () => {
    gradeManager = new GradeManager();
    scrollManager = new ScrollManager();

    gradeManager.loadSavedGrades();

    const originalEvaluateHandler = document.querySelector('#evaluate');
    if (originalEvaluateHandler) {
        originalEvaluateHandler.addEventListener('click', () => {
            setTimeout(() => {
                const average = gradeManager.getCurrentAverage();
                if (average !== null) {
                    currentAverage = average;
                    document.getElementById('saveSection').style.display = 'block';
                }
            }, 100);
        });
    }

    document.getElementById('saveGrade').addEventListener('click', () => gradeManager.saveGrade());
    document.getElementById('calculateWeightedAverage').addEventListener('click', () => gradeManager.calculateWeightedAverage());
    document.getElementById('clearSaved').addEventListener('click', () => gradeManager.clearAllGrades());

    const clearBtn = document.getElementById('clear');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            document.getElementById('saveSection').style.display = 'none';
            gradeManager.clearSaveForm();
            currentAverage = null;
            editingIndex = -1;
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.target.classList.contains('course-name-edit') || e.target.classList.contains('course-credits-edit')) {
            const index = parseInt(e.target.id.split('-')[2]);

            if (e.key === 'Enter') {
                e.preventDefault();
                gradeManager.saveEditGrade(index);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                gradeManager.cancelEditGrade(index);
            }
        }
    });
});

(() => { if (typeof console !== "undefined") console.log = () => { }; })();
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', e => {
    if (e.key === "F12" || (e.ctrlKey && e.shiftKey && e.key === "I")) e.preventDefault();
});