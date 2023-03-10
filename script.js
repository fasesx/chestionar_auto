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
const invalidCodeError = document.getElementById('invalid-code');

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
        await fetchQuestions(testData.question_nb)
        beginQuiz();
    } else {
        invalidCodeError.classList.add('BeginOverlay__Error--Visible')
        setTimeout(() => {
            invalidCodeError.classList.remove('BeginOverlay__Error--Visible')
        }, 2000)
    }
}

async function fetchQuestions(count) {
    const resp = await fetch(`${API_URL}/test/generate?value=${count}`)
    shuffledQuestions = await resp.json()
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
        fetch(`${API_URL}/test/right-answer/${test.id}`, {
            method: 'PUT'
        })
        correctAnswers++
        updateInterface()
        nextQuestion()
    } else {
        fetch(`${API_URL}/test/wrong-answer/${test.id}`, {
            method: 'PUT'
        })
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
        endTest(true)
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
        imgElement.src = currentQuestion.image
        imgElement.alt = 'Quiz image'
        imgContainer.append(imgElement)
    }
}

function endTest(isOOT = false) {
    if(isOOT) {
        fetch(`${API_URL}/test/oot/${test.id}`, {
            method: 'PUT'
        })
    } else {
        fetch(`${API_URL}/test/finished/${test.id}`, {
            method: 'PUT'
        })
    }
    
    blockOverlay.style.display = 'block'
    resultsOverlay.style.display = 'flex'
    clearInterval(intervalId)
}

const questions = [
  {
    question: 'Cum ve??i proceda dac?? inten??iona??i s?? schimba??i direc??ia de mers spre dreapta?',
    answers: {
      A: 'semnaliza??i schimbarea direc??iei de mers; pietonii v?? vor acorda prioritate;',
      B: 'semnaliza??i schimbarea direc??iei de mers; acorda??i prioritate vehiculelor care circul?? din partea st??ng??;',
      C: 'semnaliza??i schimbarea direc??iei de mers ??i acorda??i prioritate de trecere pietonilor;',
    },
    correctAnswer: 'C',
    image: 1,
  },
  {
    question: 'Ce tendin???? prezint?? un autoturism cu trac??iune pe spate, dac?? accelera??i prea puternic ??n curb???',
    answers: {
      A: 'autoturismul urmeaz??, f??r?? deviere, cursa volanului;',
      B: 'autoturismul tinde s?? derapeze cu spatele spre exteriorul curbei;',
      C: 'ro??ile din fa???? se ??nv??rtesc ??n gol;',
    },
    correctAnswer: 'B',
  },
  {
    question: 'Ce obliga??ii are conduc??torul de autovehicule c??nd circul?? pe un drum public?',
    answers: {
      A: 's?? circule numai dac?? verificarea medical?? lunar?? este efectuat??;',
      B: 's?? circule numai pe sectoarele de drum pe care ??i este permis accesul ??i s?? respecte normele referitoare la masele totale maxime autorizate admise de autoritatea competent??;',
      C: 's?? se informeze din timp, la administratorii de drum, ??n leg??tur?? cu eventualele limite maxime ??i minime de vitez??;',
    },
    correctAnswer: 'B',
  },
  {
    question: 'Camionul execut?? corect dep????irea autoturismului?',
    answers: {
      A: 'da, deoarece conduc??torul autoturismului a semnalizat inten??ia de a vira la st??nga, iar spa??iul r??mas liber permite trecerea camionului prin partea dreapt??;',
      B: 'nu, deoarece ??n intersec??ii dep????irea este interzis??;',
      C: 'nu, deoarece dep????irea se execut?? numai pe partea st??ng??;',
    },
    correctAnswer: 'A',
    image: 2,
  },
  {
    question: 'Ce se ??n??elege prin conducere ecologic?? a unui autovehicul?',
    answers: {
      A: 'obliga??ia de a folosi ??n permanen???? carburant biodegradabil;',
      B: 'deplas??ri urbane cu bicicleta, pe jos sau cu alte mijloace care nu polueaz?? atmosfera;',
      C: 'un ansamblu de m??suri comportamentale, de control sau de verificare a vehiculului, prin care se realizeaz?? o important?? economie de energie ??i protec??ia mediului;',
    },
    correctAnswer: 'C',
  },
  {
    question: 'Ce semnifica??ie are indicatorul din imagine?',
    answers: {
      A: 'urmeaz?? un sector de drum ??ngustat temporar;',
      B: 'este interzis?? schimbarea direc??iei de mers la dreapta ??n prima intersec??ie;',
      C: 'urmeaz?? o intersec??ie cu un drum f??r?? prioritate;',
    },
    correctAnswer: 'C',
    image: 3,
  },
  {
    question: 'Cum ve??i semnaliza faptul c?? autovehiculul cu care circula??i a r??mas ??n pan?? pe partea carosabil???',
    answers: {
      A: 'prin folosirea luminilor de pozi??ie;',
      B: 'prin instalarea triunghiurilor reflectorizante ??i prin folosirea luminilor de avarie;',
      C: 'prin purtarea vestei reflectorizante;',
    },
    correctAnswer: 'AB',
  },
  {
    question: '??n care dintre situa??ii consumul de carburant al unui motor cre??te?',
    answers: {
      A: 'atunci c??nd motorul nu atinge temperatura de func??ionare;',
      B: 'atunci c??nd fumul de e??apament este de culoare neagr??;',
      C: 'atunci c??nd motorul func??ioneaz?? cu ??ntreruperi;',
    },
    correctAnswer: 'ABC',
  },
  {
    question: 'Nu se poate circula cu un autoturism dac??:',
    answers: {
      A: 'se dep????e??te masa maxim?? admis??, ??nscris?? ??n certificatul de ??nmatriculare;',
      B: 'anvelopele sunt de m??rimi ??i caracteristici diferite fa???? de cele ??nscrise ??n certificatul de ??nmatriculare;',
      C: 'autovehiculul dep????e??te ??n??l??imea ??nscris?? ??n certificatul de ??nmatriculare;',
    },
    correctAnswer: 'AB',
  },
  {
    question: 'Neeliberarea complet?? a fr??nei de sta??ionare determin??:',
    answers: {
      A: 'zgomote ??n zona manetei fr??nei de m??n??;',
      B: 'un consum suplimentar de carburant;',
      C: '??nc??lzirea excesiv?? a butucilor ro??ilor din spate;',
    },
    correctAnswer: 'BC',
  },
]