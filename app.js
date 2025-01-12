class BookTracker {
    constructor() {
        this.books = JSON.parse(localStorage.getItem('books')) || [];
        this.form = document.getElementById('book-form');
        this.booksContainer = document.getElementById('books-container');
        this.totalPagesElement = document.getElementById('total-pages');
        this.chart = null;
        this.booksGoal = parseInt(localStorage.getItem('booksGoal')) || 0;
        this.editGoalBtn = document.getElementById('edit-goal-btn');
        this.booksCountElement = document.getElementById('books-count');
        this.booksGoalElement = document.getElementById('books-goal');
        this.goalPercentageElement = document.getElementById('goal-percentage');
        this.goalProgressBar = document.getElementById('goal-progress-bar');

        // Wait for Chart.js to load
        window.addEventListener('load', () => {
            this.createGraph();
            this.updateGraph();
        });

        this.setDefaultDate();
        this.initializeEventListeners();
        this.renderBooks();
        this.updateStatistics();
        this.initializeGoalUI();
        this.setupGoalEditing();
    }

    setDefaultDate() {
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        document.getElementById('read-date').value = formattedDate;
    }

    initializeEventListeners() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addBook();
        });

        // Event delegation for Delete button and keyboard events
        this.booksContainer.addEventListener('click', (e) => {
            const target = e.target;
            if (target.classList.contains('btn--danger')) {
                const bookId = parseInt(target.closest('.book-item').getAttribute('data-book-id'));
                this.deleteBook(bookId);
            }
        });

        // Add keyboard event listener for the entire container
        document.addEventListener('keydown', (e) => {
            const editingBook = document.querySelector('.book-item.editing');
            if (!editingBook) return;

            const bookId = parseInt(editingBook.getAttribute('data-book-id'));

            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.saveBook(bookId);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.cancelEdit(bookId);
            }
        });
    }

    addBook() {
        const title = document.getElementById('book-title').value;
        const date = document.getElementById('read-date').value;
        const pages = parseInt(document.getElementById('page-count').value);

        const book = {
            id: Date.now(),
            title,
            date,
            pages
        };

        this.books.push(book);
        this.saveToLocalStorage();
        this.renderBooks();
        this.updateStatistics();
        this.form.reset();
        this.setDefaultDate();
    }

    deleteBook(id) {
        this.books = this.books.filter(book => book.id !== id);
        this.saveToLocalStorage();
        this.renderBooks();
        this.updateStatistics();
    }

    saveToLocalStorage() {
        localStorage.setItem('books', JSON.stringify(this.books));
    }

    renderBooks() {
        this.booksContainer.innerHTML = '';
        this.books.forEach(book => {
            const bookElement = document.createElement('div');
            bookElement.className = 'book-item';
            bookElement.setAttribute('data-book-id', book.id);
            bookElement.innerHTML = `
                <div class="book-item__info">
                    <h3>${book.title}</h3>
                    <p>Date: ${new Date(book.date).toLocaleDateString()}</p>
                    <p>Pages: ${book.pages}</p>
                </div>
                <div class="book-item__actions">
                    <button class="btn btn--danger" onclick="bookTracker.deleteBook(${book.id})">Delete</button>
                </div>
            `;
            this.booksContainer.appendChild(bookElement);
        });
    }

    updateStatistics() {
        const totalPages = this.books.reduce((sum, book) => sum + book.pages, 0);
        this.totalPagesElement.textContent = totalPages;
        this.updateGoalDisplay();
        this.updateGraph();
    }

    createGraph() {
        const canvas = document.getElementById('reading-graph');
        if (!canvas) {
            console.error("Canvas element for the graph not found.");
            return;
        }
    
        const ctx = canvas.getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Pages Read',
                    data: new Array(12).fill(0),
                    backgroundColor: '#3498db'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }    

    updateGraph() {
        if (!this.chart) {
            console.error("Chart not initialized.");
            return;
        }
    
        const monthlyPages = new Array(12).fill(0);
    
        this.books.forEach(book => {
            const month = new Date(book.date).getMonth();
            monthlyPages[month] += book.pages;
        });
    
        this.chart.data.datasets[0].data = monthlyPages;
        this.chart.update();
    }

    initializeGoalUI() {
        this.updateGoalDisplay();
        this.createGoalEditModal();
    }

    createGoalEditModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'goal-modal';
        modal.innerHTML = `
            <div class="modal__content">
                <div class="modal__header">
                    <h3>Set Reading Goal</h3>
                </div>
                <div class="form-group">
                    <label for="goal-input">Number of Books</label>
                    <input type="number" id="goal-input" min="1" value="${this.booksGoal}">
                </div>
                <div class="modal__actions">
                    <button class="btn" id="cancel-goal">Cancel</button>
                    <button class="btn btn--primary" id="save-goal">Save</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    setupGoalEditing() {
        this.editGoalBtn.addEventListener('click', () => {
            const modal = document.getElementById('goal-modal');
            const goalInput = document.getElementById('goal-input');
            goalInput.value = this.booksGoal;
            modal.style.display = 'block';

            // Add keyboard event listener for the modal
            document.addEventListener('keydown', (e) => {
                if (modal.style.display === 'block') {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        const newGoal = parseInt(goalInput.value);
                        if (newGoal > 0) {
                            this.booksGoal = newGoal;
                            localStorage.setItem('booksGoal', newGoal);
                            this.updateGoalDisplay();
                            modal.style.display = 'none';
                        }
                    } else if (e.key === 'Escape') {
                        e.preventDefault();
                        modal.style.display = 'none';
                    }
                }
            });
        })

        document.getElementById('cancel-goal').addEventListener('click', () => {
            document.getElementById('goal-modal').style.display = 'none';
        });

        document.getElementById('save-goal').addEventListener('click', () => {
            const newGoal = parseInt(document.getElementById('goal-input').value);
            if (newGoal > 0) {
                this.booksGoal = newGoal;
                localStorage.setItem('booksGoal', newGoal);
                this.updateGoalDisplay();
                document.getElementById('goal-modal').style.display = 'none';
            }
        });

        // Close modal when clicking outside
        document.getElementById('goal-modal').addEventListener('click', (e) => {
            if (e.target.className === 'modal') {
                e.target.style.display = 'none';
            }
        });
    }

    updateGoalDisplay() {
        const booksCount = this.books.length;
        const percentage = this.booksGoal > 0 
            ? Math.round((booksCount / this.booksGoal) * 100) 
            : 0;
        
        this.booksCountElement.textContent = booksCount;
        this.booksGoalElement.textContent = this.booksGoal;
        this.goalPercentageElement.textContent = `${percentage}%`;
        this.goalProgressBar.style.width = `${Math.min(percentage, 100)}%`;

        // Trigger celebration animation if goal is reached
        if (booksCount >= this.booksGoal && percentage === 100) {
            this.goalProgressBar.classList.add('celebrate');

            // Trigger confetti
            this.triggerConfetti();

            // Remove the class after the animation ends to allow re-triggering
            setTimeout(() => {
                this.goalProgressBar.classList.remove('celebrate');
            }, 500); // Match the duration of the animation
        }
    }

    triggerConfetti() {
        const duration = 3 * 1000; // Duration in milliseconds
        const animationEnd = Date.now() + duration;
        const defaults = {
            startVelocity: 30,
            spread: 360,
            ticks: 60,
            gravity: 1,
            colors: ['#bb0000', '#ffffff']
        };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        (function frame() {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return;

            const particleCount = 50 * (timeLeft / duration);
            confetti(Object.assign({}, defaults, {
                particleCount,
                origin: {
                    x: Math.random(),
                    y: Math.random() - 0.2
                }
            }));

            requestAnimationFrame(frame);
        })();
    }

    saveBook(id) {
        const bookElement = document.querySelector(`[data-book-id="${id}"]`);
        if (!bookElement) return;

        const newTitle = bookElement.querySelector('.edit-title').value;
        const newDate = bookElement.querySelector('.edit-date').value;
        const newPages = parseInt(bookElement.querySelector('.edit-pages').value);

        if (newTitle && newPages && newDate) {
            const book = this.books.find(book => book.id === id);
            if (book) {
                book.title = newTitle;
                book.pages = newPages;
                book.date = newDate;
                this.saveToLocalStorage();
                this.renderBooks();
                this.updateStatistics();
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const bookTracker = new BookTracker();
    window.bookTracker = bookTracker;
});
