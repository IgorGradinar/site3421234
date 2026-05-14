// JavaScript для интерактивных тестов в уроках и управления вкладками

// Система управления прогрессом
const ProgressManager = {
    // Получить прогресс урока
    getLessonProgress: function(lessonId) {
        const progress = localStorage.getItem('courseProgress');
        return progress ? JSON.parse(progress)[lessonId] : null;
    },
    
    // Сохранить прогресс урока
    saveLessonProgress: function(lessonId, score, total) {
        let progress = localStorage.getItem('courseProgress');
        progress = progress ? JSON.parse(progress) : {};
        progress[lessonId] = {
            score: score,
            total: total,
            percentage: Math.round((score / total) * 100),
            completed: (score === total),
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('courseProgress', JSON.stringify(progress));
    },
    
    // Проверить, доступен ли урок
    isLessonAvailable: function(lessonId) {
        // Первый урок всегда доступен
        if (lessonId === 'lesson1-1') return true;
        
        // Определяем предыдущий урок
        const prevLessonId = this.getPreviousLessonId(lessonId);
        if (!prevLessonId) return true;
        
        const prevProgress = this.getLessonProgress(prevLessonId);
        return prevProgress && prevProgress.completed;
    },
    
    // Получить ID предыдущего урока
    getPreviousLessonId: function(lessonId) {
        const match = lessonId.match(/lesson(\d+)-(\d+)/);
        if (!match) return null;
        
        const module = parseInt(match[1]);
        const lesson = parseInt(match[2]);
        
        if (lesson > 1) {
            return `lesson${module}-${lesson - 1}`;
        } else if (module > 1) {
            // Нужно найти последний урок предыдущего модуля
            const moduleLessons = {
                1: 5, 2: 8, 3: 4, 4: 5, 5: 4, 6: 5, 7: 3
            };
            const prevModule = module - 1;
            const prevLesson = moduleLessons[prevModule] || 1;
            return `lesson${prevModule}-${prevLesson}`;
        }
        return null;
    },
    
    // Получить ID следующего урока
    getNextLessonId: function(lessonId) {
        const match = lessonId.match(/lesson(\d+)-(\d+)/);
        if (!match) return null;
        
        const module = parseInt(match[1]);
        const lesson = parseInt(match[2]);
        
        const moduleLessons = {
            1: 5, 2: 8, 3: 4, 4: 5, 5: 4, 6: 5, 7: 3
        };
        
        if (lesson < moduleLessons[module]) {
            return `lesson${module}-${lesson + 1}`;
        } else if (module < 7) {
            return `lesson${module + 1}-1`;
        }
        return null;
    }
};

document.addEventListener('DOMContentLoaded', function() {
    // Инициализация вкладок
    initTabs();
    
    // Получаем ID текущего урока из URL
    const currentPath = window.location.pathname;
    const lessonMatch = currentPath.match(/lesson(\d+)-(\d+)\.html/);
    const currentLessonId = lessonMatch ? `lesson${lessonMatch[1]}-${lessonMatch[2]}` : null;
    
    // Блокируем навигацию если урок не завершен
    if (currentLessonId) {
        const progress = ProgressManager.getLessonProgress(currentLessonId);
        if (!progress || !progress.completed) {
            blockNextLessonNavigation();
        }
    }
    
    // Инициализация тестов
    const testSections = document.querySelectorAll('.test-section');
    
    testSections.forEach((testSection, testIndex) => {
        const questions = testSection.querySelectorAll('.question');
        let totalScore = 0;
        let answeredQuestions = 0;
        let correctAnswers = 0;
        
        questions.forEach((question, questionIndex) => {
            const options = question.querySelectorAll('.answer-option');
            const checkBtn = question.querySelector('.check-answer-btn');
            const feedback = question.querySelector('.feedback');
            const correctAnswer = parseInt(question.dataset.correct);
            
            // Обработка выбора ответа
            options.forEach((option, optionIndex) => {
                option.addEventListener('click', function() {
                    // Убрать выделение с других вариантов
                    options.forEach(opt => opt.classList.remove('selected'));
                    // Выделить выбранный вариант
                    this.classList.add('selected');
                    // Включить кнопку проверки
                    if (checkBtn) {
                        checkBtn.disabled = false;
                    }
                });
            });
            
            // Проверка ответа
            if (checkBtn) {
                checkBtn.addEventListener('click', function() {
                    const selectedOption = question.querySelector('.answer-option.selected');
                    
                    if (!selectedOption) {
                        alert('Пожалуйста, выберите ответ!');
                        return;
                    }
                    
                    const selectedIndex = Array.from(options).indexOf(selectedOption);
                    const isCorrect = selectedIndex === correctAnswer;
                    
                    // Отключить все варианты
                    options.forEach(opt => {
                        opt.style.pointerEvents = 'none';
                    });
                    
                    // Всегда показывать правильный ответ
                    options[correctAnswer].classList.add('correct');
                    
                    if (isCorrect) {
                        selectedOption.classList.add('correct');
                        feedback.classList.add('correct');
                        feedback.innerHTML = '✓ <strong>Правильно!</strong> Отличная работа!';
                        totalScore++;
                        correctAnswers++;
                    } else {
                        selectedOption.classList.add('incorrect');
                        feedback.classList.add('incorrect');
                        const correctText = options[correctAnswer].textContent.trim();
                        feedback.innerHTML = `✗ <strong>Неправильно.</strong> Правильный ответ: <strong>${correctText}</strong>`;
                    }
                    
                    feedback.classList.add('show');
                    checkBtn.disabled = true;
                    answeredQuestions++;
                    
                    // Обновить общий результат
                    updateTestResults(testSection, correctAnswers, questions.length, currentLessonId);
                });
            }
        });
        
        // Функция обновления результатов теста
        function updateTestResults(section, score, total, lessonId) {
            let resultsDiv = section.querySelector('.test-results');
            if (!resultsDiv) {
                resultsDiv = document.createElement('div');
                resultsDiv.className = 'test-results';
                section.appendChild(resultsDiv);
            }
            
            const percentage = Math.round((score / total) * 100);
            let scoreClass = 'low';
            let message = 'Попробуйте еще раз!';
            let canProceed = false;
            
            if (percentage === 100) {
                scoreClass = 'high';
                message = '🎉 Отлично! Вы ответили на все вопросы правильно! Теперь вы можете перейти к следующему уроку.';
                canProceed = true;
                
                // Сохраняем прогресс
                if (lessonId) {
                    ProgressManager.saveLessonProgress(lessonId, score, total);
                }
                
                // Разблокируем навигацию
                unblockNextLessonNavigation();
            } else if (percentage >= 80) {
                scoreClass = 'medium';
                message = `Хорошо, но для перехода к следующему уроку нужно ответить правильно на все вопросы (${score}/${total}). Попробуйте еще раз!`;
            } else {
                message = `Для перехода к следующему уроку нужно ответить правильно на все вопросы (${score}/${total}). Попробуйте еще раз!`;
            }
            
            resultsDiv.innerHTML = `
                <div class="test-score ${scoreClass}">
                    Результат: ${score} из ${total} (${percentage}%)
                </div>
                <p>${message}</p>
            `;
            
            // Показать результаты только когда все вопросы отвечены
            const allAnswered = section.querySelectorAll('.question').length === 
                               section.querySelectorAll('.feedback.show').length;
            if (allAnswered) {
                resultsDiv.classList.add('show');
            }
        }
    });
});

// Блокировка навигации к следующему уроку
function blockNextLessonNavigation() {
    const nextLessonLink = document.querySelector('.navigation .nav-btn:not(.secondary)');
    if (nextLessonLink) {
        nextLessonLink.classList.add('disabled');
        nextLessonLink.style.pointerEvents = 'none';
        nextLessonLink.style.opacity = '0.5';
        nextLessonLink.style.cursor = 'not-allowed';
        nextLessonLink.title = 'Завершите тест на 100%, чтобы перейти к следующему уроку';
        
        // Добавляем предупреждение
        const warning = document.createElement('div');
        warning.className = 'navigation-warning';
        warning.innerHTML = '⚠️ Для перехода к следующему уроку необходимо ответить правильно на все вопросы теста (100%)';
        const navigation = document.querySelector('.navigation');
        if (navigation) {
            navigation.insertBefore(warning, navigation.firstChild);
        }
    }
}

// Разблокировка навигации к следующему уроку
function unblockNextLessonNavigation() {
    const nextLessonLink = document.querySelector('.navigation .nav-btn:not(.secondary)');
    if (nextLessonLink) {
        nextLessonLink.classList.remove('disabled');
        nextLessonLink.style.pointerEvents = 'auto';
        nextLessonLink.style.opacity = '1';
        nextLessonLink.style.cursor = 'pointer';
        nextLessonLink.title = '';
        
        // Убираем предупреждение
        const warning = document.querySelector('.navigation-warning');
        if (warning) {
            warning.remove();
        }
    }
}

// Функция инициализации вкладок
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    if (tabButtons.length === 0 || tabContents.length === 0) {
        return;
    }
    
    tabButtons.forEach((button) => {
        button.addEventListener('click', () => {
            // Убрать активный класс со всех кнопок и контента
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Добавить активный класс к выбранной кнопке и контенту
            button.classList.add('active');
            const targetTab = button.dataset.tab;
            const targetContent = document.querySelector(`.tab-content[data-tab="${targetTab}"]`);
            
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
    
    // Активировать первую вкладку по умолчанию
    if (tabButtons.length > 0) {
        const activeButton = document.querySelector('.tab-button.active');
        if (!activeButton) {
            tabButtons[0].click();
        }
    }
}

