// API Base URL
const API_BASE = '/api';

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadBlockchain();
    loadStats();
    setupEventListeners();
    
    // Auto-refresh every 10 seconds
    setInterval(() => {
        loadStats();
    }, 10000);
});

// Set up event listeners
function setupEventListeners() {
    document.getElementById('transactionForm').addEventListener('submit', handleCreateTransaction);
    document.getElementById('mineBtn').addEventListener('click', handleMineBlock);
    document.getElementById('checkBalanceBtn').addEventListener('click', handleCheckBalance);
}

// Load and display blockchain
async function loadBlockchain() {
    try {
        const response = await fetch(`${API_BASE}/blockchain`);
        const data = await response.json();
        
        if (data.success) {
            displayBlockchain(data.chain);
        }
    } catch (error) {
        showNotification('Failed to load blockchain', 'error');
        console.error('Error loading blockchain:', error);
    }
}

// Load blockchain statistics
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/blockchain/stats`);
        const data = await response.json();
        
        if (data.success) {
            updateStats(data.stats);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Update statistics display
function updateStats(stats) {
    document.getElementById('totalBlocks').textContent = stats.totalBlocks;
    document.getElementById('totalTransactions').textContent = stats.totalTransactions;
    document.getElementById('pendingTransactions').textContent = stats.pendingTransactions;
    
    const statusElement = document.getElementById('chainStatus');
    statusElement.textContent = stats.isValid ? 'Valid' : 'Invalid';
    statusElement.className = stats.isValid ? 'stat-value status-valid' : 'stat-value status-invalid';
}

// Display blockchain in the explorer
function displayBlockchain(chain) {
    const container = document.getElementById('blockchain');
    container.innerHTML = '';
    
    // Display blocks in reverse order (newest first)
    for (let i = chain.length - 1; i >= 0; i--) {
        const block = chain[i];
        const blockElement = createBlockElement(block);
        container.appendChild(blockElement);
    }
}

// Create a block element for display
function createBlockElement(block) {
    const blockDiv = document.createElement('div');
    blockDiv.className = 'block';
    
    const timestamp = new Date(block.timestamp).toLocaleString();
    
    let transactionsHTML = '';
    if (Array.isArray(block.data)) {
        transactionsHTML = '<div class="transactions"><strong>Transactions:</strong>';
        block.data.forEach(tx => {
            const typeClass = tx.type || 'transfer';
            transactionsHTML += `
                <div class="transaction">
                    <div>
                        <strong>From:</strong> ${tx.fromAddress || 'Genesis'}<br>
                        <strong>To:</strong> ${tx.toAddress}<br>
                        <span class="transaction-amount">Amount: ${tx.amount}</span>
                        <span class="transaction-type">${typeClass}</span>
                    </div>
                </div>
            `;
        });
        transactionsHTML += '</div>';
    } else {
        transactionsHTML = `<div class="block-info"><strong>Data:</strong> ${JSON.stringify(block.data)}</div>`;
    }
    
    blockDiv.innerHTML = `
        <div class="block-header">
            <div class="block-index">Block #${block.index}</div>
            <div class="block-timestamp">${timestamp}</div>
        </div>
        <div class="block-info">
            <span class="block-info-label">Hash:</span>
            <span class="block-hash">${block.hash}</span>
        </div>
        <div class="block-info">
            <span class="block-info-label">Previous Hash:</span>
            <span class="block-hash">${block.previousHash}</span>
        </div>
        <div class="block-info">
            <span class="block-info-label">Nonce:</span> ${block.nonce}
        </div>
        ${transactionsHTML}
    `;
    
    return blockDiv;
}

// Handle transaction creation
async function handleCreateTransaction(e) {
    e.preventDefault();
    
    const fromAddress = document.getElementById('fromAddress').value;
    const toAddress = document.getElementById('toAddress').value;
    const amount = document.getElementById('amount').value;
    const type = document.getElementById('transactionType').value;
    
    try {
        const response = await fetch(`${API_BASE}/transaction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fromAddress,
                toAddress,
                amount: parseFloat(amount),
                type
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(`Transaction created! Pending transactions: ${data.pendingCount}`, 'success');
            document.getElementById('transactionForm').reset();
            loadStats();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        showNotification('Failed to create transaction', 'error');
        console.error('Error creating transaction:', error);
    }
}

// Handle mining
async function handleMineBlock() {
    const minerAddress = document.getElementById('minerAddress').value;
    
    if (!minerAddress) {
        showNotification('Please enter a miner address', 'error');
        return;
    }
    
    const btn = document.getElementById('mineBtn');
    const originalText = btn.textContent;
    btn.textContent = 'Mining...';
    btn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE}/mine`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                minerAddress
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Block mined successfully! 🎉', 'success');
            await loadBlockchain();
            await loadStats();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        showNotification('Failed to mine block', 'error');
        console.error('Error mining block:', error);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

// Handle balance check
async function handleCheckBalance() {
    const address = document.getElementById('checkAddress').value;
    
    if (!address) {
        showNotification('Please enter an address', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/balance/${address}`);
        const data = await response.json();
        
        if (data.success) {
            const resultBox = document.getElementById('balanceResult');
            resultBox.innerHTML = `
                <strong>Address:</strong> ${data.address}<br>
                <strong>Balance:</strong> <span style="color: #10b981; font-size: 1.3em;">${data.balance}</span>
            `;
            resultBox.classList.add('show');
        } else {
            showNotification('Failed to get balance', 'error');
        }
    } catch (error) {
        showNotification('Failed to check balance', 'error');
        console.error('Error checking balance:', error);
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}
