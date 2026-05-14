// JavaScript для управления доступом к урокам в модулях

// Система управления прогрессом (та же, что в lesson-quiz.js)
const ProgressManager = {
    getLessonProgress: function(lessonId) {
        const progress = localStorage.getItem('courseProgress');
        return progress ? JSON.parse(progress)[lessonId] : null;
    },
    
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
    
    isLessonAvailable: function(lessonId) {
        // Все уроки доступны без ограничений
        return true;
    },
    
    getPreviousLessonId: function(lessonId) {
        const match = lessonId.match(/lesson(\d+)-(\d+)/);
        if (!match) return null;
        
        const module = parseInt(match[1]);
        const lesson = parseInt(match[2]);
        
        if (lesson > 1) {
            return `lesson${module}-${lesson - 1}`;
        } else if (module > 1) {
            const moduleLessons = {
                1: 5, 2: 8, 3: 4, 4: 5, 5: 4, 6: 5, 7: 3
            };
            const prevModule = module - 1;
            const prevLesson = moduleLessons[prevModule] || 1;
            return `lesson${prevModule}-${prevLesson}`;
        }
        return null;
    }
};

document.addEventListener('DOMContentLoaded', function() {
    // Обработка уроков в модулях
    const lessonItems = document.querySelectorAll('.lesson-item');
    
    lessonItems.forEach(item => {
        const link = item.querySelector('a');
        if (!link) return;
        
        const href = link.getAttribute('href');
        const lessonMatch = href.match(/lesson(\d+)-(\d+)\.html/);
        if (!lessonMatch) return;
        
        const lessonId = `lesson${lessonMatch[1]}-${lessonMatch[2]}`;
        const progress = ProgressManager.getLessonProgress(lessonId);
        const isAvailable = ProgressManager.isLessonAvailable(lessonId);
        
        if (progress && progress.completed) {
            // Урок завершен
            item.classList.add('completed');
            item.classList.add('available');
        } else {
            // Урок доступен
            item.classList.add('available');
            item.classList.remove('locked');
        }
    });
    
    // Все модули доступны - блокировка отключена
    // Модули можно проходить в любом порядке
});

