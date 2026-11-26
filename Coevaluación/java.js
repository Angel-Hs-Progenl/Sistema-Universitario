
const defaultSubjects = [
  "Desarrollo de Software",
  "Bases de Datos",
  "Aplicaciones Web",
  "Redes",
  "Inglés"
];

const defaultQuestions = [
  {
    title: "Responsabilidad y cumplimiento",
    desc: "Cumple sus tareas y los acuerdos del equipo."
  },
  {
    title: "Comunicación",
    desc: "Expresa sus ideas y escucha a sus compañeros."
  },
  {
    title: "Colaboración",
    desc: "Participa y apoya al equipo."
  },
  {
    title: "Calidad del trabajo",
    desc: "Realiza sus actividades con cuidado."
  },
  {
    title: "Iniciativa y solución de problemas",
    desc: "Propone ideas y busca soluciones."
  },
  {
    title: "Respeto y actitud profesional",
    desc: "Respeta opiniones y acepta sugerencias."
  }
];

const valuationLabels = {
  1: "Necesita mejorar",
  2: "En desarrollo",
  3: "Adecuado",
  4: "Muy bien",
  5: "Excelente"
};

function load(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

let subjects = load("utSubjects", defaultSubjects);
let questions = load("utQuestions", defaultQuestions);
let completed = load("utCompleted", []);

const $ = id => document.getElementById(id);
let selectedScores = {};

function save() {
  localStorage.setItem("utSubjects", JSON.stringify(subjects));
  localStorage.setItem("utQuestions", JSON.stringify(questions));
  localStorage.setItem("utCompleted", JSON.stringify(completed));
}

function getValuation(average) {
  if (average >= 4.5) return "Excelente";
  if (average >= 3.5) return "Muy bien";
  if (average >= 2.5) return "Adecuado";
  if (average >= 1.5) return "En desarrollo";
  return "Necesita mejorar";
}

function renderSubjects() {
  $("subject").replaceChildren();

  subjects.forEach(subject => {
    $("subject").add(new Option(subject, subject));
  });
}

function renderQuestions() {
  $("questions").replaceChildren();
  $("questionEditor").replaceChildren();

  questions.forEach((question, index) => {
    // Pregunta para el estudiante
    const item = document.createElement("div");
    item.className = "question";

    const title = document.createElement("strong");
    title.textContent = `${index + 1}. ${question.title}`;

    const description = document.createElement("p");
    description.textContent = question.desc;

    const select = document.createElement("select");
    select.dataset.question = index;
    select.add(new Option("Selecciona una calificación", ""));

    for (let score = 1; score <= 5; score++) {
      select.add(new Option(`${score} de 5`, String(score)));
    }

    select.value = selectedScores[index] || "";

    const feedback = document.createElement("p");
    feedback.className = "valuation-feedback";

    if (selectedScores[index]) {
      const score = selectedScores[index];
      feedback.textContent =
        `Valoración: ${valuationLabels[score]} · ${score * 20}%`;
    } else {
      feedback.textContent = "Valoración: pendiente";
    }

    select.addEventListener("change", () => {
      const score = Number(select.value);

      if (score) {
        selectedScores[index] = score;
        feedback.textContent =
          `Valoración: ${valuationLabels[score]} · ${score * 20}%`;
      } else {
        delete selectedScores[index];
        feedback.textContent = "Valoración: pendiente";
      }

      updateScore();
    });

    item.append(title, description, select, feedback);
    $("questions").append(item);

    // Editor de preguntas para el administrador
    const editor = document.createElement("div");
    editor.className = "question";

    const titleInput = document.createElement("input");
    titleInput.value = question.title;
    titleInput.placeholder = "Título del criterio";
    titleInput.dataset.title = index;

    const descInput = document.createElement("input");
    descInput.value = question.desc;
    descInput.placeholder = "Descripción para calificar";
    descInput.dataset.desc = index;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Eliminar";

    remove.addEventListener("click", () => {
      questions.splice(index, 1);
      selectedScores = {};
      save();
      renderQuestions();
      updateScore();
    });

    editor.append(titleInput, descInput, remove);
    $("questionEditor").append(editor);
  });

  updateScore();
}

function updateScore() {
  const scores = Object.values(selectedScores);
  const count = scores.length;

  const total = scores.reduce((sum, score) => sum + score, 0);
  const average = count ? total / count : 0;
  const percentage = count
    ? Math.round((average / 5) * 100)
    : 0;

  $("average").textContent = `${average.toFixed(2)} de 5`;
  $("percentage").textContent = `${percentage}%`;
  $("valuation").textContent = count
    ? getValuation(average)
    : "Pendiente";
}

function showPanel(panel) {
  ["studentPanel", "adminPanel", "evaluationPanel"].forEach(id => {
    $(id).classList.toggle("hidden", id !== panel);
  });
}

$("studentTab").addEventListener("click", () => {
  showPanel("studentPanel");
});

$("adminTab").addEventListener("click", () => {
  showPanel("adminPanel");
});

$("addSubject").addEventListener("click", () => {
  const name = $("newSubject").value.trim();

  if (!name) {
    alert("Escribe el nombre de la materia.");
    return;
  }

  if (subjects.some(s => s.toLowerCase() === name.toLowerCase())) {
    alert("Esa materia ya existe.");
    return;
  }

  subjects.push(name);
  $("newSubject").value = "";

  save();
  renderSubjects();
  $("subject").value = name;
});

$("addQuestion").addEventListener("click", () => {
  const title = $("newQuestion").value.trim();

  if (!title) {
    alert("Escribe una pregunta.");
    return;
  }

  questions.push({
    title,
    desc: "Califica este criterio de acuerdo con el desempeño."
  });

  $("newQuestion").value = "";
  save();
  renderQuestions();
});

$("saveQuestions").addEventListener("click", () => {
  document.querySelectorAll("[data-title]").forEach(input => {
    const index = Number(input.dataset.title);
    questions[index].title =
      input.value.trim() || questions[index].title;
  });

  document.querySelectorAll("[data-desc]").forEach(input => {
    const index = Number(input.dataset.desc);
    questions[index].desc =
      input.value.trim() || questions[index].desc;
  });

  save();
  renderQuestions();

  alert("Las preguntas se guardaron y actualizaron.");
});

$("restoreQuestions").addEventListener("click", () => {
  if (!confirm("¿Restaurar las preguntas iniciales?")) return;

  questions = defaultQuestions.map(question => ({ ...question }));
  selectedScores = {};

  save();
  renderQuestions();
});

$("startEvaluation").addEventListener("click", () => {
  const subject = $("subject").value;

  if (!subject) {
    alert("Primero selecciona una materia.");
    return;
  }

  selectedScores = {};

  $("evaluationSubject").textContent = `Materia: ${subject}`;
  $("evaluator").value = "";
  $("peer").value = "";
  $("strength").value = "";
  $("improvement").value = "";
  $("result").textContent = "";

  renderQuestions();
  showPanel("evaluationPanel");

  $("evaluationPanel").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
});

$("finish").addEventListener("click", () => {
  const evaluator = $("evaluator").value.trim();
  const peer = $("peer").value.trim();

  if (!evaluator || !peer) {
    alert("Escribe tu nombre y el del compañero evaluado.");
    return;
  }

  if (
    questions.length === 0 ||
    Object.keys(selectedScores).length !== questions.length
  ) {
    alert("Contesta todas las preguntas antes de terminar.");
    return;
  }

  const scores = Object.values(selectedScores);
  const average =
    scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const percentage = Math.round((average / 5) * 100);
  const valuation = getValuation(average);

  completed.push({
    evaluator,
    peer,
    subject: $("subject").value,
    average: Number(average.toFixed(2)),
    percentage,
    valuation,
    date: new Date().toLocaleDateString("es-MX")
  });

  save();

  $("result").textContent =
    `Coevaluación terminada. ` +
    `Materia: ${$("subject").value}. ` +
    `Promedio: ${average.toFixed(2)} de 5. ` +
    `Porcentaje: ${percentage}%. ` +
    `Valoración final: ${valuation}.`;

  $("adminSummary").textContent =
    `Evaluaciones terminadas: ${completed.length}. ` +
    `Último resultado: ${percentage}% (${valuation}).`;
});

renderSubjects();
renderQuestions();

$("adminSummary").textContent = completed.length
  ? `Evaluaciones terminadas: ${completed.length}.`
  : "Todavía no hay evaluaciones terminadas.";

showPanel("studentPanel");
