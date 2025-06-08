// DOM Elements
const itemInput = document.getElementById('itemInput');
const addBtn = document.getElementById('addItemBtn');
const shoppingList = document.getElementById('shoppingList');
const filterBtns = document.querySelectorAll('.filter-btn');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const totalItemsSpan = document.getElementById('totalItems');
const completedItemsSpan = document.getElementById('completedItems');
const activeItemsSpan = document.getElementById('activeItems');
const userNameSpan = document.getElementById('displayedUserName');
const nameInput = document.getElementById('userNameInput');
const saveNameBtn = document.getElementById('saveUserName');
const nameEditSection = document.getElementById('nameEditSection');

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const itemsRef = database.ref('shoppingItems');

// App State
let items = []; // Items will now be loaded from Firebase
let currentFilter = 'all'; // Default filter

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadUserName();
    // renderItems(); // Will be called by Firebase listeners
    // updateItemCount(); // Will be called by Firebase listeners

    // Ensure the 'all' filter button is active by default if no other is
    const activeFilterButton = document.querySelector('.filter-btn.active');
    if (!activeFilterButton) {
        document.querySelector('.filter-btn[data-filter="all"]').classList.add('active');
    }

    // Listen for Firebase data changes
    itemsRef.on('child_added', snapshot => {
        const newItem = snapshot.val();
        newItem.id = snapshot.key; // Use Firebase key as ID
        const existingItemIndex = items.findIndex(item => item.id === newItem.id);
        if (existingItemIndex === -1) { // Avoid duplicates on initial load or re-connect
            items.push(newItem);
        }
        renderItems();
        updateItemCount();
    });

    itemsRef.on('child_changed', snapshot => {
        const changedItem = snapshot.val();
        changedItem.id = snapshot.key;
        items = items.map(item => item.id === changedItem.id ? changedItem : item);
        renderItems();
        updateItemCount();
    });

    itemsRef.on('child_removed', snapshot => {
        const removedItemId = snapshot.key;
        items = items.filter(item => item.id !== removedItemId);
        renderItems();
        updateItemCount();
    });

    // Initial load (in case there's already data and child_added doesn't fire for all initially for some reason)
    // itemsRef.once('value', snapshot => {
    //     items = []; // Clear local items before initial load from Firebase
    //     snapshot.forEach(childSnapshot => {
    //         const item = childSnapshot.val();
    //         item.id = childSnapshot.key;
    //         items.push(item);
    //     });
    //     renderItems();
    //     updateItemCount();
    // });
});

// User Name Functions
function loadUserName() {
    const savedName = localStorage.getItem('shoppingListUserName_v2');
    if (savedName) {
        userNameSpan.textContent = savedName;
        nameEditSection.classList.add('hidden');
    } else {
        userNameSpan.textContent = 'ユーザー名を設定';
        nameEditSection.classList.remove('hidden');
    }
}

saveNameBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    if (name) {
        userNameSpan.textContent = name;
        localStorage.setItem('shoppingListUserName_v2', name);
        nameEditSection.classList.add('hidden');
        // Update addedBy for existing items if user was '匿名'
        items.forEach(item => {
            if (item.addedBy === '匿名') {
                // This change won't persist unless items are re-saved, 
                // but good for newly added items by this user.
            }
        });
    } else {
        alert('名前を入力してください。');
    }
});

// Add Item Functions
addBtn.addEventListener('click', addItem);
itemInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addItem();
    }
});

function addItem() {
    const text = itemInput.value.trim();
    if (text === '') {
        alert('アイテム名を入力してください。');
        return;
    }

    const userName = localStorage.getItem('shoppingListUserName_v2') || '匿名';

    const newItem = {
        // id: Date.now(), // Firebase will generate a unique key (ID)
        text,
        completed: false,
        addedBy: userName,
        timestamp: new Date().toISOString()
    };

    itemsRef.push(newItem); // Add to Firebase
    // items.push(newItem); // No longer needed, Firebase listener will update local 'items' array
    // saveItems(); // No longer needed
    // renderItems(); // No longer needed, Firebase listener will trigger re-render
    // updateItemCount(); // No longer needed, Firebase listener will trigger update
    itemInput.value = '';
    itemInput.focus();
}

// Render Functions
function renderItems() {
    const filteredItems = items.filter(item => {
        if (currentFilter === 'active') return !item.completed;
        if (currentFilter === 'completed') return item.completed;
        return true; // 'all'
    });

    shoppingList.innerHTML = ''; // Clear existing items

    if (filteredItems.length === 0) {
        const message = currentFilter === 'completed' 
            ? '完了したアイテムはありません。'
            : currentFilter === 'active'
            ? '買うべきアイテムはすべて購入済みです！'
            : 'リストは空です。アイテムを追加しましょう！';
        shoppingList.innerHTML = `<li class="empty-message body-text text-center" style="color: var(--color-mono-3); padding: 20px 0;">${message}</li>`;
        return;
    }

    filteredItems.forEach(item => {
        const li = document.createElement('li');
        li.className = `item ${item.completed ? 'completed' : ''}`;
        li.dataset.id = item.id;

        const itemDate = new Date(item.timestamp);
        const formattedDate = `${('0' + (itemDate.getMonth() + 1)).slice(-2)}/${('0' + itemDate.getDate()).slice(-2)} ${('0' + itemDate.getHours()).slice(-2)}:${('0' + itemDate.getMinutes()).slice(-2)}`;

        li.innerHTML = `
            <div class="item-content">
                <input type="checkbox" class="checkbox" ${item.completed ? 'checked' : ''}>
                <div class="item-details">
                    <span class="item-text" title="${item.text}">${item.text}</span>
                    <span class="item-metadata">${formattedDate} by ${item.addedBy}</span>
                </div>
            </div>
            <button class="delete-btn" aria-label="削除">
                <i class="fas fa-trash-alt fa-fw"></i>
            </button>
        `;

        li.querySelector('.checkbox').addEventListener('change', () => toggleComplete(item.id));
        li.querySelector('.delete-btn').addEventListener('click', () => deleteItem(item.id));
        
        shoppingList.appendChild(li);
    });
}

// Item Manipulation Functions
function toggleComplete(id) {
    const item = items.find(item => item.id === id);
    if (item) {
        itemsRef.child(id).update({ completed: !item.completed });
    }
    // saveItems(); // No longer needed
    // renderItems(); // No longer needed, Firebase listener will trigger re-render
    // updateItemCount(); // No longer needed, Firebase listener will trigger update
}

function deleteItem(id) {
    if (confirm('このアイテムを削除してもよろしいですか？')) {
        itemsRef.child(id).remove();
        // items = items.filter(item => item.id !== id); // No longer needed
        // saveItems(); // No longer needed
        // renderItems(); // No longer needed, Firebase listener will trigger re-render
        // updateItemCount(); // No longer needed, Firebase listener will trigger update
    }
}

clearCompletedBtn.addEventListener('click', () => {
    const completedItems = items.filter(item => item.completed);
    if (completedItems.length === 0) {
        alert('削除する完了済みアイテムがありません。');
        return;
    }
    if (confirm('完了したアイテムをすべて削除してもよろしいですか？')) {
        completedItems.forEach(item => {
            itemsRef.child(item.id).remove();
        });
        // items = items.filter(item => !item.completed); // No longer needed
        // saveItems(); // No longer needed
        // renderItems(); // No longer needed, Firebase listener will trigger re-render
        // updateItemCount(); // No longer needed, Firebase listener will trigger update
    }
});

// Filter Functions
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderItems();
    });
});

// Utility Functions
function updateItemCount() {
    const total = items.length;
    const completed = items.filter(item => item.completed).length;
    const active = total - completed;

    if (totalItemsSpan) totalItemsSpan.textContent = total;
    if (completedItemsSpan) completedItemsSpan.textContent = completed;
    if (activeItemsSpan) activeItemsSpan.textContent = active;
}

// function saveItems() {
//     localStorage.setItem('shoppingItems_v2', JSON.stringify(items));
// } // No longer needed with Firebase

// Debug: Reset data
// function resetAllData() {
//     if (confirm('本当にすべてのデータをリセットしますか？（ユーザー名とアイテムリスト）')) {
//         localStorage.removeItem('shoppingItems_v2');
//         localStorage.removeItem('shoppingListUserName_v2');
//         items = [];
//         loadUserName();
//         renderItems();
//         updateItemCount();
//         alert('データがリセットされました。');
//     }
// }
// document.getElementById('userName').addEventListener('dblclick', resetAllData); // Example: Double click title to reset
