import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const projectRoot = new URL("../", import.meta.url);
const transcriptSource = "/private/tmp/python_tutorial_qwAFL1597eM.en.vtt";
const transcriptDir = new URL("transcripts/", projectRoot);
const chapterMaterialsDir = new URL("learningMaterials/chapterMaterials/", projectRoot);
const learningIndex = new URL("learningMaterials/index.html", projectRoot);

const source = {
  title: "Python Tutorial for Beginners (with mini-projects)",
  channel: "freeCodeCamp.org",
  url: "https://www.youtube.com/watch?v=qwAFL1597eM",
};

const chapters = [
  { title: "Intro", start: 0, end: 83 },
  { title: "Chapter 1 - Getting Started", start: 83, end: 890 },
  { title: "Chapter 2 - Python Basics", start: 890, end: 1798 },
  { title: "Chapter 3 - Operators", start: 1798, end: 2778 },
  { title: "Chapter 4 - Data Types", start: 2778, end: 5005 },
  { title: "Chapter 5 - User Input", start: 5005, end: 6331 },
  { title: "Chapter 6 - Lists & Tuples", start: 6331, end: 8220 },
  { title: "Chapter 7 - Dictionaries & Sets", start: 8220, end: 9983 },
  { title: "Chapter 8 - Loops", start: 9983, end: 11343 },
  { title: "Chapter 9 - Functions", start: 11343, end: 12228 },
  { title: "Chapter 10 - Recursion", start: 12228, end: 13271 },
  { title: "Chapter 11 - Scope", start: 13271, end: 14430 },
  { title: "Chapter 12 - Closures", start: 14430, end: 15572 },
  { title: "Chapter 13 - f-Strings", start: 15572, end: 16935 },
  { title: "Chapter 14 - Modules", start: 16935, end: 17987 },
  { title: "Chapter 15 - Command Line Arguments", start: 17987, end: 19239 },
  { title: "Chapter 16 - Challenges", start: 19239, end: 20159 },
  { title: "Chapter 17 - Lambda & Higher Order Functions", start: 20159, end: 21405 },
  { title: "Chapter 18 - Classes & Objects", start: 21405, end: 22544 },
  { title: "Chapter 19 - Exceptions & Errors", start: 22544, end: 23249 },
  { title: "Chapter 20 - OOP Project", start: 23249, end: 25035 },
  { title: "Chapter 21 - Virtual Environments & PIP", start: 25035, end: 26843 },
  { title: "Chapter 22 - File Operations", start: 26843, end: 28172 },
  { title: "Chapter 23 - Final Project", start: 28172, end: 31313 },
];

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

function parseTime(value) {
  const [h, m, rest] = value.split(":");
  return Number(h) * 3600 + Number(m) * 60 + Number.parseFloat(rest);
}

function parseVtt(vtt) {
  const cues = [];
  for (const block of vtt.split(/\n\n+/)) {
    const lines = block.trim().split("\n");
    const timeLineIndex = lines.findIndex((line) => line.includes("-->"));
    if (timeLineIndex < 0) continue;

    const [startRaw, endRaw] = lines[timeLineIndex].split("-->").map((part) => part.trim().split(/\s+/)[0]);
    const text = lines
      .slice(timeLineIndex + 1)
      .join(" ")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (text) {
      cues.push({ start: parseTime(startRaw), end: parseTime(endRaw), text });
    }
  }
  return cues;
}

function cuesForChapter(cues, chapter) {
  return cues.filter((cue) => cue.start >= chapter.start && cue.start < chapter.end);
}

function transcriptMarkdown(chapter, index, cues) {
  const paragraphs = cues.map((cue) => `- [${formatTime(cue.start)}] ${cue.text}`).join("\n");
  return `# ${chapter.title}

Source: ${source.title} by ${source.channel}
URL: ${source.url}
Time range: ${formatTime(chapter.start)}-${formatTime(chapter.end)}

## Transcript

${paragraphs}
`;
}

const css = `
:root {
  --ink: #18202a;
  --muted: #586575;
  --line: #d9e0e8;
  --panel: #ffffff;
  --soft: #f5f7fa;
  --accent: #176f7a;
  --wrong: #a24118;
  --right: #0d6b3f;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  line-height: 1.55;
  color: var(--ink);
  background: #eef2f5;
}
header {
  padding: 32px clamp(18px, 4vw, 56px);
  background: #17212b;
  color: #fff;
}
header a { color: #aee4ef; }
main {
  width: min(1120px, calc(100% - 32px));
  margin: 28px auto 56px;
}
h1, h2, h3 { line-height: 1.2; }
h1 { margin: 0 0 10px; font-size: clamp(2rem, 5vw, 3.25rem); }
h2 { margin-top: 36px; padding-bottom: 8px; border-bottom: 1px solid var(--line); }
nav { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 18px; }
nav a {
  color: #fff;
  text-decoration: none;
  border: 1px solid rgba(255,255,255,.28);
  border-radius: 6px;
  padding: 7px 10px;
}
.meta { color: #d9e7ed; max-width: 850px; }
.grid, .note-pages {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}
.card, .page, .question, .challenge {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 18px;
}
.card a { color: var(--accent); font-weight: 800; text-decoration: none; }
.pill {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 3px 9px;
  border-radius: 999px;
  background: #e8f3f5;
  color: #125965;
  font-size: 0.88rem;
  font-weight: 800;
}
.options { list-style: none; padding: 0; margin: 12px 0; }
.options li { padding: 7px 0; border-top: 1px solid #edf0f3; }
.options label { display: flex; gap: 9px; align-items: flex-start; cursor: pointer; }
.options input { margin-top: 5px; }
button {
  appearance: none;
  border: 0;
  border-radius: 6px;
  padding: 9px 13px;
  background: var(--accent);
  color: #fff;
  font-weight: 800;
  cursor: pointer;
}
button:hover { background: #125965; }
.feedback { min-height: 24px; font-weight: 800; }
.feedback.correct { color: var(--right); }
.feedback.wrong { color: var(--wrong); }
.reason {
  background: var(--soft);
  border-left: 4px solid var(--accent);
  padding: 10px 14px;
  margin-top: 10px;
}
.reason[hidden], .solution[hidden] { display: none; }
.code-entry {
  width: 100%;
  min-height: 170px;
  margin-top: 10px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  resize: vertical;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--ink);
  background: #fbfcfd;
}
pre {
  overflow-x: auto;
  padding: 14px;
  border-radius: 8px;
  background: #101820;
  color: #eaf4f7;
}
code { font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace; }
`;

const js = `
document.addEventListener("click", (event) => {
  const checkButton = event.target.closest("[data-check-question]");
  if (checkButton) {
    const question = checkButton.closest(".question");
    const selected = question.querySelector("input[type='radio']:checked");
    const feedback = question.querySelector(".feedback");
    const reason = question.querySelector(".reason");
    if (!selected) {
      feedback.textContent = "Choose an answer first.";
      feedback.className = "feedback wrong";
      reason.hidden = true;
      reason.textContent = "";
      return;
    }
    const correct = selected.dataset.correct === "true";
    feedback.textContent = correct ? "Right" : "Wrong";
    feedback.className = correct ? "feedback correct" : "feedback wrong";
    reason.textContent = selected.dataset.reason;
    reason.hidden = false;
  }

  const revealButton = event.target.closest("[data-reveal-solution]");
  if (revealButton) {
    const challenge = revealButton.closest(".challenge");
    const solution = challenge.querySelector(".solution");
    const hidden = solution.hidden;
    solution.hidden = !hidden;
    revealButton.textContent = hidden ? "Hide reference implementation" : "Reveal reference implementation";
  }
});
`;

function layout(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <style>${css}</style>
  <script>${js}</script>
</head>
<body>
  <header>
    <h1>${esc(title)}</h1>
    <p class="meta">Chapter-specific materials generated from the transcript for <a href="${source.url}">${source.title}</a>.</p>
    <nav>
      <a href="../index.html">Main Python Materials</a>
      <a href="./index.html">Chapter Materials</a>
      <a href="../../index.html">Course Catalog</a>
    </nav>
  </header>
  <main>${body}</main>
</body>
</html>`;
}

function rotateOptions(question, index, chapterIndex) {
  const correct = { text: question.correct, correct: true, reason: question.rightReason };
  const wrong = question.wrong.map((text, i) => ({ text, correct: false, reason: question.wrongReasons[i] }));
  const options = [...wrong];
  options.splice((index * 3 + chapterIndex) % 4, 0, correct);
  return options;
}

function questionHtml(question, index, chapterIndex) {
  const labels = ["A", "B", "C", "D"];
  const options = rotateOptions(question, index, chapterIndex);
  const name = `q-${chapterIndex}-${index}`;
  return `<section class="question">
  <h3>${index + 1}. ${esc(question.prompt)}</h3>
  <ul class="options">
    ${options.map((option, optionIndex) => `<li><label><input type="radio" name="${name}" data-correct="${option.correct}" data-reason="${esc(option.reason)}"><span><strong>${labels[optionIndex]}.</strong> ${esc(option.text)}</span></label></li>`).join("")}
  </ul>
  <button type="button" data-check-question>Check</button>
  <span class="feedback" aria-live="polite"></span>
  <p class="reason" hidden></p>
</section>`;
}

function challengeHtml(challenge, index) {
  return `<section class="challenge">
  <h3>${index + 1}. ${esc(challenge.title)}</h3>
  <p>${esc(challenge.task)}</p>
  <label>
    <strong>Your code:</strong>
    <textarea class="code-entry" spellcheck="false" autocapitalize="off" autocomplete="off" placeholder="Write your Python solution here..."></textarea>
  </label>
  <p><button type="button" data-reveal-solution>Reveal reference implementation</button></p>
  <div class="solution" hidden>
    <p><strong>Reference implementation:</strong></p>
    <pre><code>${esc(challenge.solution)}</code></pre>
  </div>
</section>`;
}

function chapterPage(material, chapterIndex) {
  return layout(material.title, `
<p><span class="pill">${esc(material.timeRange)}</span></p>
<p>Transcript file: <a href="../../transcripts/${material.transcriptFile}">${esc(material.transcriptFile)}</a></p>

<h2>Notes</h2>
<section class="note-pages">
  <article class="page"><h3>Page 1</h3>${material.notes[0].map((p) => `<p>${esc(p)}</p>`).join("")}</article>
  <article class="page"><h3>Page 2</h3>${material.notes[1].map((p) => `<p>${esc(p)}</p>`).join("")}</article>
</section>

<h2>Quiz</h2>
${material.quiz.map((question, index) => questionHtml(question, index, chapterIndex)).join("\n")}

<h2>Code Challenges</h2>
${material.challenges.map(challengeHtml).join("\n")}
`);
}

const wrongReasons = [
  "Wrong: this is not what the chapter transcript says or demonstrates.",
  "Wrong: this confuses the chapter topic with a different Python concept.",
  "Wrong: this skips an important detail emphasized in the chapter.",
];

function q(prompt, correct, wrong, rightReason, customWrong = wrongReasons) {
  return { prompt, correct, wrong, rightReason, wrongReasons: customWrong };
}

const firstThreeMaterials = [
  {
    sourceChapter: "Intro",
    title: "Intro - Course Orientation",
    notes: [
      [
        "The intro frames the course as a nearly nine-hour beginner Python path taught by Dave Gray and shared through freeCodeCamp. It is designed for learners who are starting Python from scratch as well as learners who may already know another language and want to add Python.",
        "The transcript emphasizes that the course is organized like a video textbook. Instead of being one continuous unsorted lesson, it is split into clearly defined chapters that build on one another. That structure matters because a learner can review one chapter at a time and connect each new topic to earlier chapters.",
        "A key promise of the course is practice through mini-projects. The intro says those small projects help learners grasp Python features instead of only hearing explanations. This matters for study planning: notes should capture concepts, but practice should turn them into habits.",
      ],
      [
        "The intro also points learners to a GitHub resource containing links mentioned throughout the lessons. That detail matters because professional learning often includes official downloads, editor extensions, documentation, and external references rather than only video watching.",
        "The course is positioned as beginner-friendly, but not passive. The learner should expect to install tools, follow along, build projects, and revisit chapters. The intro is not a syntax lesson; it is a map for how to use the rest of the course.",
        "For this chapter, the most important takeaway is how to study the course: work chapter by chapter, keep the linked resources nearby, and treat the projects as required practice rather than optional extras.",
      ],
    ],
    quiz: [
      q("Who is introduced as the instructor for the Python tutorials?", "Dave Gray", ["Beau Carnes", "Guido van Rossum", "A Microsoft extension author"], "Right: the intro names Dave Gray as the creator/instructor."),
      q("How is the course structure described?", "Like chapters of a book or video textbook", ["As one short coding demo", "As an advanced-only reference", "As a collection of unrelated livestreams"], "Right: the transcript says the tutorials build on each other like book chapters."),
      q("What makes the course stand out according to the intro?", "It includes small projects along the way", ["It avoids all practice", "It only teaches theory", "It requires paid software"], "Right: mini-projects are named as a key strength."),
      q("What resource does the instructor mention for lesson links?", "A GitHub resource in the description", ["A printed textbook only", "A private chat room", "A browser bookmark folder"], "Right: the intro says links are compiled into one GitHub resource."),
      q("What kind of learner is the course aimed at?", "Beginners who want to learn Python", ["Only senior Python maintainers", "Only database administrators", "Only graphic designers"], "Right: the intro repeatedly calls it a beginner Python course."),
      q("What should a learner expect to do throughout the course?", "Build small projects while learning concepts", ["Only watch without coding", "Skip the chapters", "Memorize every keyword before starting"], "Right: the intro highlights building projects along the way."),
      q("Which organization shares the video?", "freeCodeCamp", ["The Python Software Foundation only", "GitHub Education only", "Stack Overflow only"], "Right: the intro thanks freeCodeCamp for sharing the video."),
      q("What is the intro's role in the course?", "It orients the learner to the course plan", ["It teaches recursion in depth", "It installs every package", "It replaces all later chapters"], "Right: the intro sets expectations and points to resources."),
      q("Why are clear chapters useful?", "They make review and progression easier", ["They remove the need to practice", "They make Python run faster", "They hide the learning path"], "Right: chapter structure helps learners navigate and review."),
      q("What is the best study action after the intro?", "Start Chapter 1 and follow along actively", ["Close the editor forever", "Skip directly to the final project", "Ignore the GitHub resources"], "Right: the intro leads directly into Chapter 1 and active learning."),
      q("How long does the instructor describe the course as being?", "Nearly nine hours", ["About ten minutes", "Exactly one hour", "Several days of live meetings"], "Right: the intro describes nearly nine hours of Python instruction."),
      q("What does the intro say the tutorials do?", "Build upon each other", ["Repeat the same example only", "Avoid sequence or structure", "Focus only on installation"], "Right: the transcript says the tutorials build upon each other."),
      q("What does the intro imply about the mini-projects?", "They help learners grasp key features", ["They are unrelated decorations", "They replace all explanation", "They are only for experts"], "Right: the intro says projects help learners grasp Python features."),
      q("Why is freeCodeCamp thanked in the intro?", "For sharing the video and helping people learn to code for free", ["For creating Python itself", "For selling the required editor", "For hosting a paid exam"], "Right: the transcript thanks freeCodeCamp as a free learning resource."),
      q("What does the instructor say about links mentioned in lessons?", "They are compiled into one GitHub resource", ["They are intentionally hidden", "They are only available in a printed book", "They are unrelated to the course"], "Right: the intro explicitly says lesson links are compiled into a GitHub resource."),
      q("What learning pattern best matches the intro?", "Watch, follow along, build, and review by chapter", ["Watch once with no practice", "Skip setup and start at the end", "Only memorize the instructor's name"], "Right: the intro presents a structured, project-supported learning path."),
      q("What does the phrase video textbook suggest?", "Structured chapters that can be studied in order", ["A random playlist with no sequence", "A silent code recording", "A written-only PDF"], "Right: video textbook implies organized chapters."),
      q("What is one reason the course is positioned as beginner-friendly?", "It has clear teaching and clearly defined chapters", ["It assumes professional Python experience", "It avoids explaining setup", "It requires prior AI expertise"], "Right: the intro emphasizes clear instruction and chapter structure."),
      q("What should learners keep nearby while studying?", "The GitHub resource links", ["Only a calculator", "A CSS framework", "A database password"], "Right: links mentioned in the lessons are gathered in GitHub."),
      q("Which statement best matches the intro transcript?", "The course combines instruction, chapters, and projects", ["The course is only a quiz", "The course has no practice", "The course is not about Python"], "Right: all three elements are emphasized in the intro."),
    ],
    challenges: [
      { title: "Course Welcome", task: "Write a function that returns a welcome message for a Python beginner course.", solution: "def welcome_message():\n    return \"Welcome to the Python beginner course!\"" },
      { title: "Chapter Label", task: "Write a function that formats a chapter number and title.", solution: "def chapter_label(number, title):\n    return f\"Chapter {number}: {title}\"" },
      { title: "Resource Reminder", task: "Write a function that returns a reminder to check course resources.", solution: "def resource_reminder():\n    return \"Check the GitHub resource links while studying.\"" },
      { title: "Study Plan Item", task: "Represent a study task as a dictionary with title and completed fields.", solution: "def make_study_task(title):\n    return {\"title\": title, \"completed\": False}" },
      { title: "Mark Complete", task: "Mark a study task dictionary as completed.", solution: "def mark_complete(task):\n    task[\"completed\"] = True\n    return task" },
    ],
  },
  {
    sourceChapter: "Chapter 1 - Getting Started",
    title: "Chapter 1 - Getting Started",
    notes: [
      [
        "Chapter 1 explains why Python is worth learning. The transcript lists beginner-friendly syntax, versatility, a large community, rapid prototyping, and job opportunities. This chapter is less about Python syntax and more about setting up the environment and understanding why the language is practical.",
        "The first setup step is downloading Python from python.org. The instructor points out that the site should detect the operating system and show an appropriate download. He also notes that older operating systems may need older Python versions, which is an important compatibility detail.",
        "The second setup step is installing a code editor. The course uses Visual Studio Code, so following along is easiest with VS Code installed. The instructor then installs the Microsoft Python extension, which provides Python support such as IntelliSense, linting, debugging, and editor integration.",
      ],
      [
        "After Python and VS Code are installed, the chapter creates a project folder and a first Python file named hello.py. This teaches a basic habit: keep course code in an organized folder instead of scattering files around the machine.",
        "The chapter introduces the Python REPL, which is an interactive prompt for quick experiments. On Windows the instructor uses py; on Mac and Linux he notes python3. The REPL is useful for quick checks, while .py files are better for saved programs.",
        "The first script prints a greeting. The chapter also shows that Python files can be run from the terminal with py hello.py or python3 hello.py depending on platform. That gives the learner the core edit-run loop needed for the rest of the course.",
      ],
    ],
    quiz: [
      q("What is the main practical goal of Chapter 1?", "Set up Python, VS Code, and a first runnable script", ["Teach object-oriented programming", "Build the final project", "Explain every Python data type"], "Right: the chapter focuses on environment setup and first execution."),
      q("Where does the instructor direct learners to download Python?", "python.org", ["npmjs.com", "code.visualstudio.com only", "A private file share"], "Right: Python is downloaded from python.org."),
      q("Which editor does the instructor use in the course?", "Visual Studio Code", ["Vim only", "Notepad only", "Xcode only"], "Right: the transcript recommends VS Code for following along."),
      q("Which VS Code extension is installed?", "Python from Microsoft", ["Prettier only", "Docker only", "ESLint only"], "Right: the instructor searches for and installs the Microsoft Python extension."),
      q("What is the first project folder named in the chapter?", "Lesson01", ["FinalProject", "venv", "Downloads"], "Right: the transcript creates a Lesson01 folder for the first lesson."),
      q("What is the first Python file named?", "hello.py", ["index.html", "main.js", "style.css"], "Right: the first saved Python script is hello.py."),
      q("What does REPL stand for conceptually in this chapter?", "An interactive Python prompt for quick commands", ["A package installer", "A graphics library", "A web server"], "Right: the chapter uses the REPL to type Python interactively."),
      q("Which command does the instructor use on Windows to start Python?", "py", ["python3 only", "npm start", "gcc"], "Right: he uses py on Windows and notes python3 for Mac/Linux."),
      q("Why create an organized lesson folder?", "To keep course files easy to find and run", ["To make Python syntax optional", "To install VS Code", "To avoid using the terminal"], "Right: organized folders keep project files manageable."),
      q("What does the first script demonstrate?", "Printing a greeting from a Python file", ["Connecting to a database", "Training an AI model", "Creating a class hierarchy"], "Right: the first file uses print to display a greeting."),
      q("How does the chapter suggest running hello.py on Windows?", "py hello.py", ["node hello.py", "pip hello.py", "open hello.py"], "Right: the transcript uses py hello.py from the terminal."),
      q("What is one reason the chapter gives for learning Python?", "It is versatile and has strong job demand", ["It only works for one task", "It has no community", "It cannot prototype quickly"], "Right: versatility, community, prototyping, and jobs are all mentioned."),
      q("What does IntelliSense help with in an editor?", "Code assistance while writing", ["Buying Python", "Deleting files", "Running a web browser"], "Right: the Python extension includes IntelliSense support."),
      q("What should Mac/Linux users commonly type instead of py?", "python3", ["python.exe only", "visualstudio", "pipx run vscode"], "Right: the instructor notes python3 for Mac and Linux."),
      q("What is the safest interpretation of Chapter 1's setup advice?", "Use the right installer and commands for your operating system", ["All computers use identical commands", "Windows 7 always uses the newest Python", "No extension is useful"], "Right: the transcript calls out OS differences and compatibility."),
      q("What does the instructor recommend after installing VS Code?", "Open VS Code and install the Python extension", ["Uninstall Python", "Create a JavaScript-only project", "Disable the terminal"], "Right: the chapter moves from VS Code install to the Python extension."),
      q("What does the chapter say Python's community provides?", "Resources and support", ["No documentation", "Only paid answers", "A ban on beginners"], "Right: the transcript mentions a large active community with resources and support."),
      q("Why is Python good for rapid prototyping according to the chapter?", "Its simplicity and ease of use", ["It cannot run files", "It has no syntax", "It only works in browsers"], "Right: the transcript names simplicity and ease of use."),
      q("What visual area in VS Code is used to find extensions?", "The activity bar extension icon", ["The operating system dock only", "The browser address bar", "The Python website footer"], "Right: the instructor clicks the extensions icon in the activity bar."),
      q("What should the learner do after downloading and installing each tool?", "Return to the video and continue following along", ["Skip all remaining setup", "Delete the downloaded tool", "Start Chapter 23 immediately"], "Right: the transcript repeatedly says to install the tool and come back."),
    ],
    challenges: [
      { title: "Hello File Output", task: "Write code that prints the first greeting from a Python script.", solution: "print(\"Hello, world!\")" },
      { title: "Platform Command Hint", task: "Return the command to start Python for windows, mac, or linux.", solution: "def python_command(platform):\n    if platform.lower() == \"windows\":\n        return \"py\"\n    return \"python3\"" },
      { title: "Lesson File Name", task: "Return a Python file name for a lesson number, such as lesson_1.py.", solution: "def lesson_file(number):\n    return f\"lesson_{number}.py\"" },
      { title: "Tool Checklist", task: "Return True only if Python, VS Code, and the Python extension are installed.", solution: "def ready_to_code(has_python, has_vscode, has_extension):\n    return has_python and has_vscode and has_extension" },
      { title: "Run Command", task: "Build a terminal command from an interpreter command and file name.", solution: "def run_command(interpreter, filename):\n    return f\"{interpreter} {filename}\"" },
    ],
  },
  {
    sourceChapter: "Chapter 2 - Python Basics",
    title: "Chapter 2 - Python Basics",
    notes: [
      [
        "Chapter 2 begins in the VS Code terminal and returns to the Python REPL. The instructor reviews how to start the REPL with py on Windows or python3 on Mac/Linux. This matters because the REPL is used to experiment with variables and expressions before saving code in files.",
        "The chapter's first major topic is variables. A variable is a name assigned to a value, such as name = 'Dave'. Typing the name in the REPL returns the stored value. The transcript demonstrates that assignment itself does not print output; it binds a name for later use.",
        "The chapter gives concrete variable naming rules. Names may contain letters, numbers, and underscores, but cannot start with a number. They cannot contain characters such as exclamation marks or hyphens, and they cannot be reserved keywords such as if or for.",
      ],
      [
        "The transcript introduces string values by assigning a name to text. It also shows syntax errors when invalid names are used. Those errors are part of learning: Python points near the problematic characters or assignment when a name breaks the rules.",
        "A key lesson is that Python has reserved words for language features. The learner does not need to memorize all of them immediately, but should understand that words like if and for already have a purpose in Python syntax.",
        "The practical takeaway is to use clear, valid names such as name, first_name, or user_age. Good names make later lessons easier because operators, data types, functions, and projects all rely on readable variables.",
      ],
    ],
    quiz: [
      q("What is the first major Python concept discussed in Chapter 2?", "Variables", ["Classes", "File uploads", "Virtual environments"], "Right: the chapter starts the basics lesson with variables."),
      q("What happens when name = 'Dave' is entered in the REPL?", "The name is assigned but nothing is printed automatically", ["Python prints Dave automatically", "The file is deleted", "A package is installed"], "Right: assignment binds the value without display."),
      q("How can you see the value of a variable in the REPL?", "Type the variable name and press Enter", ["Restart VS Code", "Install the extension again", "Rename the folder"], "Right: evaluating the name returns its value in the REPL."),
      q("Which variable name is valid?", "name_0001", ["name!", "name-first", "1name"], "Right: letters, numbers, and underscores are allowed when the name does not start with a number."),
      q("Why is name! invalid?", "Exclamation marks are not allowed in variable names", ["Python dislikes the word name", "Strings cannot be assigned", "The REPL cannot use variables"], "Right: special punctuation like ! cannot appear in names."),
      q("Why is name-first invalid as a variable name?", "The hyphen is interpreted as an operator, not part of a name", ["Python requires all names to start with hyphen", "It is a reserved keyword", "It is too long"], "Right: hyphen is not valid inside identifiers."),
      q("Why is 1name invalid?", "Variable names cannot start with a number", ["Names cannot contain letters", "Numbers are never allowed anywhere", "It is a string"], "Right: digits are allowed after the first character, not at the start."),
      q("Why can't if be used as a variable name?", "if is a reserved Python keyword", ["if is too short", "if contains punctuation", "if is a number"], "Right: if already belongs to Python's control-flow syntax."),
      q("Which command opens the terminal in VS Code according to the chapter?", "Terminal > New Terminal or the keyboard shortcut", ["File > Save As only", "Extensions > Disable", "GitHub > Fork"], "Right: the chapter opens a new terminal from VS Code."),
      q("What does the chapter say about memorizing all keywords?", "You do not need to memorize them immediately", ["You must memorize all before coding", "Python has no keywords", "Keywords only exist in JavaScript"], "Right: Python will signal syntax errors when a reserved word is misused."),
      q("Which value type is 'Dave' in name = 'Dave'?", "String", ["Integer", "Boolean", "Dictionary"], "Right: quoted text is a string."),
      q("What does a SyntaxError indicate in the invalid-name examples?", "Python cannot parse the code as valid syntax", ["The computer is offline", "The editor theme is wrong", "The file is too large"], "Right: invalid identifiers break Python syntax."),
      q("Which name style is most readable for a first name variable?", "first_name", ["first-name", "1first", "first name"], "Right: underscores are valid and readable in Python names."),
      q("What is the REPL useful for in this chapter?", "Trying small Python commands interactively", ["Publishing GitHub Pages", "Editing images", "Managing DNS"], "Right: the chapter uses it for quick variable experiments."),
      q("What should a learner do when Python points to invalid syntax?", "Read the error and inspect the highlighted part", ["Ignore every error", "Delete Python", "Assume variables are impossible"], "Right: the transcript shows Python pointing near the invalid syntax."),
      q("Which characters does the chapter allow in variable names?", "Letters, numbers, and underscores", ["Spaces, hyphens, and exclamation marks", "Only emojis", "Only punctuation"], "Right: the transcript demonstrates letters, numbers, and underscores as valid ingredients."),
      q("Where are numbers allowed in a variable name?", "After the first character", ["Only as the first character", "Never anywhere", "Only after a hyphen"], "Right: numbers can be used, but the name cannot start with a number."),
      q("What does the equal sign do in name = 'Dave'?", "Assigns the value to the variable name", ["Tests equality in this example", "Starts a loop", "Imports a module"], "Right: Chapter 2 uses = as the assignment operator."),
      q("What does typing name after assignment return in the REPL?", "The string value assigned to name", ["A new Python file", "A package list", "A terminal shortcut"], "Right: the transcript shows name returning Dave."),
      q("Why does Python reject for as a variable name?", "for is a reserved keyword", ["for contains a number", "for has a hyphen", "for is too long"], "Right: for is reserved for Python syntax."),
    ],
    challenges: [
      { title: "Assign a Name", task: "Create a variable named name with your name and print it.", solution: "name = \"Dave\"\nprint(name)" },
      { title: "Valid Username", task: "Write a function that returns True when a username starts with a letter or underscore and contains only letters, numbers, or underscores.", solution: "def is_simple_identifier(username):\n    if not username:\n        return False\n    if not (username[0].isalpha() or username[0] == \"_\"):\n        return False\n    for char in username:\n        if not (char.isalnum() or char == \"_\"):\n            return False\n    return True" },
      { title: "Reserved Word Guard", task: "Reject the reserved words if and for as variable names.", solution: "def is_allowed_name(name):\n    return name not in {\"if\", \"for\"}" },
      { title: "Make Snake Case", task: "Convert a first and last label into a snake_case-style variable name.", solution: "def make_variable_name(first, second):\n    return f\"{first.lower()}_{second.lower()}\"" },
      { title: "Assignment Summary", task: "Return a sentence describing what variable assignment does.", solution: "def assignment_summary(name, value):\n    return f\"{name} now refers to {value!r}\"" },
    ],
  },
];

async function writeTranscripts(cues) {
  await mkdir(transcriptDir, { recursive: true });
  for (let index = 0; index < chapters.length; index += 1) {
    const chapter = chapters[index];
    const fileName = `${String(index).padStart(2, "0")}-${slug(chapter.title)}.md`;
    await writeFile(new URL(fileName, transcriptDir), transcriptMarkdown(chapter, index, cuesForChapter(cues, chapter)));
  }
}

async function writeFirstThreeMaterials() {
  await mkdir(chapterMaterialsDir, { recursive: true });

  const indexCards = [];
  for (let index = 0; index < firstThreeMaterials.length; index += 1) {
    const material = firstThreeMaterials[index];
    const chapterIndex = chapters.findIndex((chapter) => chapter.title === material.sourceChapter);
    const chapter = chapters[chapterIndex];
    const transcriptFile = `${String(chapterIndex).padStart(2, "0")}-${slug(chapter.title)}.md`;
    const fileName = `${String(index).padStart(2, "0")}-${slug(material.title)}.html`;
    const page = chapterPage(
      {
        ...material,
        transcriptFile,
        timeRange: `${formatTime(chapter.start)}-${formatTime(chapter.end)}`,
      },
      index,
    );
    await writeFile(new URL(fileName, chapterMaterialsDir), page);
    indexCards.push(`<article class="card"><h2>${esc(material.title)}</h2><p>${esc(material.sourceChapter)}</p><p><a href="./${fileName}">Open chapter materials</a></p><p><a href="../../transcripts/${transcriptFile}">Open transcript</a></p></article>`);
  }

  await writeFile(
    new URL("index.html", chapterMaterialsDir),
    layout(
      "Chapter-Specific Python Materials",
      `<section class="page"><p>These pages regenerate notes, quizzes, and code challenges for the first three video chapters directly against the split transcript files.</p></section><section class="grid">${indexCards.join("")}</section>`,
    ),
  );

  if (existsSync(learningIndex)) {
    const indexHtml = await readFile(learningIndex, "utf8");
    if (!indexHtml.includes("chapterMaterials/index.html")) {
      const insert = `<section class="page">
  <h2>Chapter-Specific Materials</h2>
  <p>Review transcript-matched notes, quizzes, and code challenges for the first three chapters.</p>
  <p><a href="./chapterMaterials/index.html">Open chapter-specific materials</a></p>
</section>`;
      await writeFile(learningIndex, indexHtml.replace("</main>", `${insert}\n</main>`));
    }
  }
}

const vtt = await readFile(transcriptSource, "utf8");
const cues = parseVtt(vtt);
await writeTranscripts(cues);
await writeFirstThreeMaterials();

console.log(`Wrote ${chapters.length} transcript files and ${firstThreeMaterials.length} chapter material pages.`);
