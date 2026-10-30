// State
let todos = [];
let currentFilter = 'all';
let editingId = null;
const STORAGE_KEY = 'todos';

// 키워드 기반 카테고리 자동 분류
const CATEGORY_KEYWORDS = {
  work: ['회의', '프로젝트', '업무', '보고', '발표', '클라이언트', '팀', '회사', '마감', '계획', '회의록', '이메일', '제출'],
  study: ['공부', '숙제', '시험', '학습', '강의', '코딩', '프로그래밍', '개발', '알고리즘', '복습', '예습', '문제']
};

// Storage
function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch (error) {
    console.error('저장 실패:', error);
  }
}

function load() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    todos = data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('로드 실패:', error);
    todos = [];
  }
}

// UI Rendering
function updateProgress() {
  const filtered = currentFilter === 'all'
    ? todos
    : todos.filter(t => t.category === currentFilter);

  const total = filtered.length;
  const completed = filtered.filter(t => t.done).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  document.querySelector('.progress-fill').style.width = percent + '%';
  document.querySelector('.progress-count').textContent = `${completed}/${total}`;
  document.querySelector('.progress-percent').textContent = `${percent}%`;
}

function render() {
  const listEl = document.getElementById('todoList');
  const filtered = currentFilter === 'all'
    ? todos
    : todos.filter(t => t.category === currentFilter);

  listEl.innerHTML = '';

  if (filtered.length === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'empty-message';
    emptyMsg.textContent = '할 일을 추가해보세요';
    listEl.appendChild(emptyMsg);
    updateProgress();
    return;
  }

  filtered.forEach(todo => {
    const li = document.createElement('li');
    li.dataset.id = todo.id;
    if (todo.done) li.classList.add('done');

    if (editingId === todo.id) {
      li.classList.add('editing');

      const textInput = document.createElement('input');
      textInput.type = 'text';
      textInput.className = 'edit-input';
      textInput.value = todo.text;
      textInput.maxLength = 100;

      const categorySelect = document.createElement('select');
      categorySelect.className = 'edit-category';
      ['personal', 'work', 'study'].forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = getCategoryLabel(cat);
        if (cat === todo.category) opt.selected = true;
        categorySelect.appendChild(opt);
      });

      const saveBtn = document.createElement('button');
      saveBtn.className = 'edit-save';
      saveBtn.textContent = '저장';
      saveBtn.setAttribute('aria-label', '수정 내용 저장');

      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'edit-cancel';
      cancelBtn.textContent = '취소';
      cancelBtn.setAttribute('aria-label', '수정 취소');

      li.appendChild(textInput);
      li.appendChild(categorySelect);
      li.appendChild(saveBtn);
      li.appendChild(cancelBtn);

      setTimeout(() => textInput.focus(), 0);

      const handleSave = () => {
        const newText = textInput.value.trim();
        if (newText && newText.length <= 100) {
          todo.text = newText;
          todo.category = categorySelect.value;
          editingId = null;
          save();
          render();
        }
      };

      saveBtn.addEventListener('click', handleSave);
      textInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') {
          editingId = null;
          render();
        }
      });

      cancelBtn.addEventListener('click', () => {
        editingId = null;
        render();
      });
    } else {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'todo-check';
      checkbox.checked = todo.done;
      checkbox.setAttribute('aria-label', `할 일 완료 여부: ${todo.text}`);

      const span = document.createElement('span');
      span.className = 'todo-text';
      span.textContent = todo.text;
      span.addEventListener('dblclick', () => {
        editingId = todo.id;
        render();
      });

      const category = document.createElement('span');
      category.className = `todo-category ${todo.category}`;
      category.textContent = getCategoryLabel(todo.category);

      const editBtn = document.createElement('button');
      editBtn.className = 'todo-edit';
      editBtn.textContent = '수정';
      editBtn.setAttribute('aria-label', `수정: ${todo.text}`);
      editBtn.addEventListener('click', () => {
        editingId = todo.id;
        render();
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'todo-delete';
      deleteBtn.textContent = '삭제';
      deleteBtn.setAttribute('aria-label', `삭제: ${todo.text}`);

      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(category);
      li.appendChild(editBtn);
      li.appendChild(deleteBtn);
    }

    listEl.appendChild(li);
  });

  updateProgress();
}


// Todo Operations
function addTodo() {
  const input = document.getElementById('todoInput');
  const category = document.getElementById('categorySelect').value;
  const text = input.value.trim();

  if (!text || text.length > 100) return;

  const todo = {
    id: String(Date.now()),
    text: text,
    category: category,
    done: false,
    createdAt: new Date().toISOString()
  };

  todos.unshift(todo);
  save();
  render();

  input.value = '';
  input.focus();
}

function clearCompleted() {
  todos = todos.filter(t => !t.done);
  save();
  render();
}

function getCategoryLabel(category) {
  const labels = {
    work: '업무',
    personal: '개인',
    study: '공부'
  };
  return labels[category] || category;
}

function autoDetectCategory(text) {
  const lowerText = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return category;
    }
  }
  return 'personal';
}

// Event Handlers
document.addEventListener('DOMContentLoaded', () => {
  load();
  render();

  // Input & Add button
  const todoInput = document.getElementById('todoInput');
  const categorySelect = document.getElementById('categorySelect');

  document.getElementById('addBtn').addEventListener('click', addTodo);

  todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTodo();
  });

  // 자동 카테고리 분류
  todoInput.addEventListener('input', (e) => {
    const text = e.target.value.trim();
    if (text) {
      const detectedCategory = autoDetectCategory(text);
      categorySelect.value = detectedCategory;
    }
  });

  // List events (delegation)
  document.getElementById('todoList').addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li) return;

    const id = li.dataset.id;
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    if (e.target.matches('.todo-check')) {
      todo.done = !todo.done;
      save();
      render();
    }

    if (e.target.matches('.todo-delete')) {
      todos = todos.filter(t => t.id !== id);
      save();
      render();
    }
  });

  // Filter tabs
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      currentFilter = tab.dataset.filter;
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      render();
    });
  });

  // Clear completed
  document.getElementById('clearCompletedBtn').addEventListener('click', clearCompleted);
});
