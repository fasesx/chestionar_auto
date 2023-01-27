const nextButton = document.getElementById('next-btn')
const startButton = document.getElementById('start-btn')
const answerButtons = document.querySelectorAll('.Answer')
const beginOverlay = document.getElementById('begin-overlay')
const questionText = document.querySelector('.QuestionText p')
const imgContainer = document.querySelector('.ImageContainer')
const correctAnswersElements = document.querySelectorAll('.QuestionStatus--Correct')
const wrongAnswersElement = document.querySelector('.QuestionStatus--Wrong')
const answersOverlay = document.getElementById('answers-overlay')
const blockOverlay = document.getElementById('block-overlay')
const correctAnswersOverlayText = document.querySelector('.AnswersOverlay__CorrectAnswers')
const closeOverlayElement = document.querySelector('.AnswersOverlay__Close')
const resultsOverlay = document.getElementById('results-overlay')
const startOverButton = document.getElementById('startover-btn')
const reminaingQuestions = document.getElementById('remaining-questions')
const initialQuestions = document.getElementById('initial-questions')
const timerMinutes = document.getElementById('timer-minutes')
const timerSeconds = document.getElementById('timer-seconds')
const testCodeInput = document.getElementById('test-code');

const API_URL = "http://localhost/chestionar/api/v1"

testCodeInput.addEventListener('input', event => {
  if(event.target.value !== '' && event.target.value.length === 8) {
    startButton.classList.remove('Button--Disabled');
    startButton.classList.add('Button--Confirm');
    startButton.disabled = false;
  } else {
    startButton.classList.add('Button--Disabled');
    startButton.classList.remove('Button--Confirm');
    startButton.disabled = true;
  }
})

let currentQuestionIndex, wrongAnswers, correctAnswers, selectedAnswers, remainingQuestionsNb, minutesRemaining, secondsRemaining, intervalId
const answersOrder = ['A', 'B', 'C']

let test = {};
let shuffledQuestions;

answerButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (button.classList.contains('Answer--Selected')) {
            selectAnswer(button, false)
        } else {
            selectAnswer(button, true)
        }
        button.classList.toggle('Answer--Selected')
    })
})
blockOverlay.addEventListener('click', closeAnswersOverlay)
closeOverlayElement.addEventListener('click', closeAnswersOverlay)
startButton.addEventListener('click', () => validateTest(testCodeInput.value))
startOverButton.addEventListener('click', startOver)
nextButton.addEventListener('click', checkAnswer)

async function validateTest(code) {
    const resp = await fetch(`${API_URL}/test/validate?value=${code}`);
    const testData = await resp.json()
    
    if (testData) {
        test = testData;
        await fetchQuestions(testData.question_nb);
        beginQuiz();
    }
}

async function fetchQuestions(count) {
    const resp = await fetch(`${API_URL}/test/generate?value=${count}`)
    shuffledQuestions = await resp.json()
    fetch(`${API_URL}/test/right-answer/1`, {
        method: 'PUT'
    })
}

function startOver() {
    testCodeInput.value = ""
    startButton.classList.add('Button--Disabled');
    startButton.classList.remove('Button--Confirm');
    beginOverlay.style.display = 'flex'
    blockOverlay.style.display = 'none'
    resultsOverlay.style.display = 'none'
}

function nextQuestion() {
    currentQuestionIndex++
    showQuestion()
}

function selectAnswer(answer, toggle) {
    const selectedAnswer = answer.querySelector('.Answer__Variant').dataset.variant
    if (toggle) {
        selectedAnswers += selectedAnswer
    } else {
        selectedAnswers = selectedAnswers.replace(selectedAnswer, '')
    }
    selectedAnswers = selectedAnswers.split('').sort().join('')
}

function checkAnswer() {
    if (shuffledQuestions[currentQuestionIndex].correctAnswer === selectedAnswers) {
        correctAnswers++
        updateInterface()
        nextQuestion()
    } else {
        wrongAnswers++
        updateInterface(true)
    }
}

function closeAnswersOverlay() {
    answersOverlay.style.display = 'none'
    blockOverlay.style.display = 'none'
    nextQuestion()
}

function updateInterface(showCorrectAnswer = false) {
    if (showCorrectAnswer) {
        answersOverlay.style.display = 'block'
        blockOverlay.style.display = 'block'
        correctAnswersOverlayText.innerText = shuffledQuestions[currentQuestionIndex].correctAnswer.split('').join(', ')
    }
    answerButtons.forEach(button => {
        button.classList.remove('Answer--Selected')
    })
    selectedAnswers = ''
    initialQuestions.innerText = shuffledQuestions.length
    reminaingQuestions.innerText = remainingQuestionsNb
    remainingQuestionsNb--
    correctAnswersElements.forEach(element => {
        element.innerText = correctAnswers
    })
    wrongAnswersElement.innerText = wrongAnswers
}

function beginQuiz() {
    beginOverlay.style.display = 'none'
    blockOverlay.style.display = 'none'
    resultsOverlay.style.display = 'none'
    // shuffledQuestions = questions.sort(() => Math.random() - .5)
    // shuffledQuestions.length = 5
    currentQuestionIndex = 0
    wrongAnswers = 0
    correctAnswers = 0
    remainingQuestionsNb = shuffledQuestions.length
    secondsRemaining = 0
    minutesRemaining = test.time;
    selectedAnswers = ''
    clearInterval(intervalId)
    intervalId = setInterval(handleTimer, 1000)
    updateInterface()
    showQuestion()
}

function handleTimer() {
    secondsRemaining--
    if (secondsRemaining < 0) {
        secondsRemaining = 59
        minutesRemaining --
    }
    timerMinutes.innerText = minutesRemaining < 10 ? `0${minutesRemaining}` : minutesRemaining
    timerSeconds.innerText = secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining
    if (minutesRemaining === 0 && secondsRemaining < 0) {
        clearInterval(intervalId)
        endTest()
    }
}

function showQuestion() {
    if (currentQuestionIndex >= shuffledQuestions.length) {
        endTest()
        return
    }
    const currentQuestion = shuffledQuestions[currentQuestionIndex]
    questionText.innerText = currentQuestion.question
    answerButtons.forEach((button, i) => {
        button.querySelector('.Answer__Description').innerText = currentQuestion.answers[answersOrder[i]]
    })
    imgContainer.innerHTML = ''
    if (currentQuestion.image) {
        const imgElement = document.createElement('img')
        imgElement.src = `assets/${currentQuestion.image}.png`
        imgElement.alt = 'Quiz image'
        imgContainer.append(imgElement)
    }
}

function endTest() {
    blockOverlay.style.display = 'block'
    resultsOverlay.style.display = 'flex'
    clearInterval(intervalId)
}

const questions = [
  {
    question: 'Cum veţi proceda dacă intenţionaţi să schimbaţi direcţia de mers spre dreapta?',
    answers: {
      A: 'semnalizaţi schimbarea direcţiei de mers; pietonii vă vor acorda prioritate;',
      B: 'semnalizaţi schimbarea direcţiei de mers; acordaţi prioritate vehiculelor care circulă din partea stângă;',
      C: 'semnalizaţi schimbarea direcţiei de mers şi acordaţi prioritate de trecere pietonilor;',
    },
    correctAnswer: 'C',
    image: 1,
  },
  {
    question: 'Ce tendinţă prezintă un autoturism cu tracţiune pe spate, dacă acceleraţi prea puternic în curbă?',
    answers: {
      A: 'autoturismul urmează, fără deviere, cursa volanului;',
      B: 'autoturismul tinde să derapeze cu spatele spre exteriorul curbei;',
      C: 'roţile din faţă se învârtesc în gol;',
    },
    correctAnswer: 'B',
  },
  {
    question: 'Ce obligaţii are conducătorul de autovehicule când circulă pe un drum public?',
    answers: {
      A: 'să circule numai dacă verificarea medicală lunară este efectuată;',
      B: 'să circule numai pe sectoarele de drum pe care îi este permis accesul şi să respecte normele referitoare la masele totale maxime autorizate admise de autoritatea competentă;',
      C: 'să se informeze din timp, la administratorii de drum, în legătură cu eventualele limite maxime şi minime de viteză;',
    },
    correctAnswer: 'B',
  },
  {
    question: 'Camionul execută corect depăşirea autoturismului?',
    answers: {
      A: 'da, deoarece conducătorul autoturismului a semnalizat intenţia de a vira la stânga, iar spaţiul rămas liber permite trecerea camionului prin partea dreaptă;',
      B: 'nu, deoarece în intersecţii depăşirea este interzisă;',
      C: 'nu, deoarece depăşirea se execută numai pe partea stângă;',
    },
    correctAnswer: 'A',
    image: 2,
  },
  {
    question: 'Ce se înţelege prin conducere ecologică a unui autovehicul?',
    answers: {
      A: 'obligaţia de a folosi în permanenţă carburant biodegradabil;',
      B: 'deplasări urbane cu bicicleta, pe jos sau cu alte mijloace care nu poluează atmosfera;',
      C: 'un ansamblu de măsuri comportamentale, de control sau de verificare a vehiculului, prin care se realizează o importantă economie de energie şi protecţia mediului;',
    },
    correctAnswer: 'C',
  },
  {
    question: 'Ce semnificaţie are indicatorul din imagine?',
    answers: {
      A: 'urmează un sector de drum îngustat temporar;',
      B: 'este interzisă schimbarea direcţiei de mers la dreapta în prima intersecţie;',
      C: 'urmează o intersecţie cu un drum fără prioritate;',
    },
    correctAnswer: 'C',
    image: 3,
  },
  {
    question: 'Cum veţi semnaliza faptul că autovehiculul cu care circulaţi a rămas în pană pe partea carosabilă?',
    answers: {
      A: 'prin folosirea luminilor de poziţie;',
      B: 'prin instalarea triunghiurilor reflectorizante şi prin folosirea luminilor de avarie;',
      C: 'prin purtarea vestei reflectorizante;',
    },
    correctAnswer: 'AB',
  },
  {
    question: 'În care dintre situaţii consumul de carburant al unui motor creşte?',
    answers: {
      A: 'atunci când motorul nu atinge temperatura de funcţionare;',
      B: 'atunci când fumul de eşapament este de culoare neagră;',
      C: 'atunci când motorul funcţionează cu întreruperi;',
    },
    correctAnswer: 'ABC',
  },
  {
    question: 'Nu se poate circula cu un autoturism dacă:',
    answers: {
      A: 'se depăşeşte masa maximă admisă, înscrisă în certificatul de înmatriculare;',
      B: 'anvelopele sunt de mărimi şi caracteristici diferite faţă de cele înscrise în certificatul de înmatriculare;',
      C: 'autovehiculul depăşeşte înălţimea înscrisă în certificatul de înmatriculare;',
    },
    correctAnswer: 'AB',
  },
  {
    question: 'Neeliberarea completă a frânei de staţionare determină:',
    answers: {
      A: 'zgomote în zona manetei frânei de mână;',
      B: 'un consum suplimentar de carburant;',
      C: 'încălzirea excesivă a butucilor roţilor din spate;',
    },
    correctAnswer: 'BC',
  },
]