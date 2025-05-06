document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('evaluate').addEventListener('click', () => {
        if (!document.getElementById('input_scores').value.trim()) {
            swal("Error", "Por favor, ingresa la tabla de notas antes de evaluar.", "error");
        }
    });

    const backToTopButton = document.getElementById('backToTop');
    window.addEventListener('scroll', function () {
        backToTopButton.classList.toggle('visible', window.pageYOffset > 300);
    });
    backToTopButton.addEventListener('click', function (e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    const evaluateBtn = document.getElementById('evaluate');
    const clearBtn = document.getElementById('clear');
    const spinner = document.querySelector('.spinner');

    if (evaluateBtn && spinner) {
        evaluateBtn.addEventListener('click', function () {
            spinner.style.display = 'inline-block';
            setTimeout(() => {
                spinner.style.display = 'none';

                document.getElementById('result').style.display = 'block';
            }, 800);
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            document.getElementById('input_scores').value = '';
            document.getElementById('result').style.display = 'none';
        });
    }
});

(() => { if (typeof console !== "undefined") console.log = () => { }; })();

document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', e => {
    if (e.key === "F12" || (e.ctrlKey && e.shiftKey && e.key === "I")) e.preventDefault();
});
