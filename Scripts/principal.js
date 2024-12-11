(function (i, s, o, g, r, a, m) {
    i['GoogleAnalyticsObject'] = r; i[r] = i[r] || function () {
        (i[r].q = i[r].q || []).push(arguments)
    }, i[r].l = 1 * new Date(); a = s.createElement(o),
        m = s.getElementsByTagName(o)[0]; a.async = 1; a.src = g; m.parentNode.insertBefore(a, m)
})(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');
ga('create', 'UA-91051721-1', 'auto');
ga('send', 'pageview');

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('evaluate').addEventListener('click', function () {
        var inputScores = document.getElementById('input_scores').value.trim();

        if (inputScores === '') {
            swal("Error", "Por favor, ingresa la tabla de notas antes de evaluar.", "error");
        }
    });
});

(function () {
    if (typeof console !== "undefined") {
        console.log = function () { };
    }
})();

document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
});

document.addEventListener('keydown', function (e) {
    if (e.key === "F12" || (e.ctrlKey && e.shiftKey && e.key === "I")) {
        e.preventDefault();
    }
});