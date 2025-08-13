import React, { useState, useEffect, useCallback } from 'react';

// --- HELPER COMPONENTS ---

// A simple modal to replace the native Alert
const Modal = ({ message, onClose }) => {
  if (!message) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center">
        <p className="mb-4 text-lg text-gray-700">{message}</p>
        <button
          onClick={onClose}
          className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
        >
          Close
        </button>
      </div>
    </div>
  );
};


// A simple Pie Chart component using divs and Tailwind for web
const PieChart = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.total, 0);
  if (total === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 flex justify-center items-center h-56">
        <p className="text-gray-500">No expense data yet. Add a transaction!</p>
      </div>
    );
  }

  // Create a conic-gradient string for the pie chart
  let cumulativePercent = 0;
  const gradientParts = data.map(item => {
    const percent = (item.total / total) * 100;
    const part = `${item.color} ${cumulativePercent}% ${cumulativePercent + percent}%`;
    cumulativePercent += percent;
    return part;
  });
  const conicGradient = `conic-gradient(${gradientParts.join(', ')})`;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">Expenses by Category</h3>
      <div className="flex flex-col md:flex-row items-center justify-around gap-6">
        <div 
          className="w-36 h-36 rounded-full" 
          style={{ background: conicGradient }}
          aria-label="Pie chart of expenses"
        ></div>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center">
              <div style={{ backgroundColor: item.color }} className="w-3 h-3 rounded-full mr-2"></div>
              <span className="text-gray-600 text-sm">{item.name} ({((item.total / total) * 100).toFixed(0)}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


// --- INITIAL DATA ---
const initialChores = [
  { id: '1', name: 'Clean bathroom seats', frequency: 'daily' },
  { id: '2', name: 'Wipe bathroom counters', frequency: 'daily' },
  { id: '3', name: 'Quick mop bathroom floor', frequency: 'daily' },
  { id: '4', name: 'Vacuum main areas', frequency: 'alternate' }, // e.g., Mon, Wed, Fri
  { id: '5', name: 'Wipe kitchen cabinets', frequency: 'alternate' }, // e.g., Tue, Thu, Sat
  { id: '6', name: 'Clean mirrors & windows', frequency: 'weekly', day: 6 }, // Saturday
  { id: '7', name: 'Change bed sheets', frequency: 'weekly', day: 0 }, // Sunday
  { id: '8', name: 'Clean out fridge', frequency: 'weekly', day: 5 }, // Friday
];

const expenseCategories = [
    { name: 'Food', color: '#4CAF50' },
    { name: 'Transport', color: '#2196F3' },
    { name: 'Housing', color: '#FFC107' },
    { name: 'Bills', color: '#F44336' },
    { name: 'Entertainment', color: '#9C27B0' },
    { name: 'Other', color: '#795548' }
];

// --- CHORES SCREEN ---
const ChoresScreen = () => {
  const [allChores, setAllChores] = useState(initialChores);
  const [todaysChores, setTodaysChores] = useState([]);
  const [completedChores, setCompletedChores] = useState([]);
  const [newChore, setNewChore] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const today = new Date();
  const dayOfWeek = today.getDay(); // Sunday = 0, Monday = 1, etc.
  const todayDateString = today.toISOString().split('T')[0];

  // Load chores from localStorage
  useEffect(() => {
    try {
      const storedChores = localStorage.getItem('chores');
      if (storedChores) setAllChores(JSON.parse(storedChores));
      
      const storedCompleted = localStorage.getItem(`completed_${todayDateString}`);
      if (storedCompleted) setCompletedChores(JSON.parse(storedCompleted));
    } catch (error) {
      console.error("Failed to load chores from localStorage", error);
      setAlertMessage("Could not load saved data.");
    }
  }, [todayDateString]);

  // Filter chores for today
  useEffect(() => {
    const getTodaysChores = () => {
      return allChores.filter(chore => {
        if (chore.frequency === 'daily') return true;
        if (chore.frequency === 'weekly' && chore.day === dayOfWeek) return true;
        // Odd days: Mon, Wed, Fri
        if (chore.frequency === 'alternate' && [1, 3, 5].includes(dayOfWeek)) return true;
        // Even days: Tue, Thu
        if (chore.frequency === 'alternate' && [2, 4].includes(dayOfWeek)) return true;
        return false;
      });
    };
    setTodaysChores(getTodaysChores());
  }, [allChores, dayOfWeek]);

  const saveAllChores = (choresToSave) => {
    try {
      localStorage.setItem('chores', JSON.stringify(choresToSave));
    } catch (error) {
      console.error("Failed to save chores", error);
      setAlertMessage("Could not save your new chore.");
    }
  };

  const handleAddChore = () => {
    if (newChore.trim() === '') return;
    const newChoreObject = {
      id: Date.now().toString(),
      name: newChore.trim(),
      frequency: 'daily', // Custom chores are added as daily
    };
    const updatedChores = [...allChores, newChoreObject];
    setAllChores(updatedChores);
    saveAllChores(updatedChores);
    setNewChore('');
  };

  const handleRemoveChore = (id) => {
    const updatedChores = allChores.filter(chore => chore.id !== id);
    setAllChores(updatedChores);
    saveAllChores(updatedChores);
  };

  const toggleChoreCompletion = (id) => {
    let updatedCompleted;
    if (completedChores.includes(id)) {
      updatedCompleted = completedChores.filter(choreId => choreId !== id);
    } else {
      updatedCompleted = [...completedChores, id];
    }
    setCompletedChores(updatedCompleted);
    try {
      localStorage.setItem(`completed_${todayDateString}`, JSON.stringify(updatedCompleted));
    } catch (error) {
      console.error("Failed to save completion status", error);
      setAlertMessage("Could not save your progress.");
    }
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <Modal message={alertMessage} onClose={() => setAlertMessage('')} />
      <h1 className="text-3xl font-bold text-gray-800">Today's 30-Min Chores</h1>
      <p className="text-md text-gray-500 mb-6">{today.toDateString()}</p>
      
      <div className="flex-grow overflow-y-auto pr-2">
        {todaysChores.length > 0 ? (
          todaysChores.map(item => (
            <div key={item.id} className="flex items-center bg-white p-4 rounded-lg mb-3 shadow-sm hover:shadow-md transition-shadow">
              <button onClick={() => toggleChoreCompletion(item.id)} className="mr-4 text-2xl">
                {completedChores.includes(item.id) ? '✅' : '⬜️'}
              </button>
              <p className={`flex-grow text-gray-700 ${completedChores.includes(item.id) ? 'line-through text-gray-400' : ''}`}>
                {item.name}
              </p>
              <button onClick={() => handleRemoveChore(item.id)} className="text-xl text-gray-400 hover:text-red-500 transition-colors">
                🗑️
              </button>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 mt-8">No chores for today. Enjoy your day!</p>
        )}
      </div>

      <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
        <input
          type="text"
          className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          placeholder="Add a new daily chore..."
          value={newChore}
          onChange={(e) => setNewChore(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddChore()}
        />
        <button className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors" onClick={handleAddChore}>
          Add
        </button>
      </div>
    </div>
  );
};

// --- BUDGET SCREEN ---
const BudgetScreen = () => {
    const [transactions, setTransactions] = useState([]);
    const [income, setIncome] = useState(0);
    const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: 'Other' });
    const [alertMessage, setAlertMessage] = useState('');

    // Load data from localStorage
    useEffect(() => {
        try {
            const storedTransactions = localStorage.getItem('transactions');
            if (storedTransactions) setTransactions(JSON.parse(storedTransactions));
            const storedIncome = localStorage.getItem('income');
            if (storedIncome) setIncome(parseFloat(storedIncome));
        } catch (error) {
            console.error("Failed to load budget data", error);
            setAlertMessage("Could not load budget data.");
        }
    }, []);

    const saveData = (key, data) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error(`Failed to save ${key}`, error);
            setAlertMessage(`Could not save your ${key}.`);
        }
    };

    const handleAddTransaction = () => {
        const { description, amount, category } = newExpense;
        if (!description || !amount || isNaN(parseFloat(amount))) {
            setAlertMessage("Please enter a valid description and amount.");
            return;
        }
        const newTransaction = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            description,
            amount: parseFloat(amount),
            category
        };
        const updatedTransactions = [...transactions, newTransaction];
        setTransactions(updatedTransactions);
        saveData('transactions', updatedTransactions);
        setNewExpense({ description: '', amount: '', category: 'Other' });
    };

    const handleSetIncome = (text) => {
        const newIncome = parseFloat(text) || 0;
        setIncome(newIncome);
        saveData('income', newIncome);
    };
    
    const getSummary = () => {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const weeklyExpenses = transactions
            .filter(t => new Date(t.date) >= startOfWeek)
            .reduce((sum, t) => sum + t.amount, 0);

        const monthlyExpenses = transactions
            .filter(t => new Date(t.date) >= startOfMonth)
            .reduce((sum, t) => sum + t.amount, 0);
        
        const totalExpenses = transactions.reduce((sum, t) => sum + t.amount, 0);
        const netBalance = income - totalExpenses;

        return { weeklyExpenses, monthlyExpenses, netBalance };
    };

    const getChartData = () => {
        const categoryTotals = expenseCategories.map(cat => ({
            name: cat.name,
            total: 0,
            color: cat.color,
        }));

        transactions.forEach(t => {
            const category = categoryTotals.find(c => c.name === t.category);
            if (category) category.total += t.amount;
        });

        return categoryTotals.filter(c => c.total > 0);
    };

    const { weeklyExpenses, monthlyExpenses, netBalance } = getSummary();
    const chartData = getChartData();

    return (
        <div className="p-4 md:p-6 overflow-y-auto h-full">
            <Modal message={alertMessage} onClose={() => setAlertMessage('')} />
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Budget Dashboard</h1>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow"><p className="text-sm text-gray-500">This Week's Spend</p><p className="text-2xl font-bold text-gray-800">${weeklyExpenses.toFixed(2)}</p></div>
                <div className="bg-white p-4 rounded-lg shadow"><p className="text-sm text-gray-500">This Month's Spend</p><p className="text-2xl font-bold text-gray-800">${monthlyExpenses.toFixed(2)}</p></div>
                <div className="bg-white p-4 rounded-lg shadow"><p className="text-sm text-gray-500">Monthly Income</p><p className="text-2xl font-bold text-green-600">${income.toFixed(2)}</p></div>
                <div className={`p-4 rounded-lg shadow ${netBalance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}><p className="text-sm text-gray-600">Net Balance</p><p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-700' : 'text-red-700'}`}>${netBalance.toFixed(2)}</p></div>
            </div>

            <div className="mb-6">
                <PieChart data={chartData} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="font-bold text-lg mb-4">Manage Finances</h3>
                    <input type="number" placeholder="Enter Total Monthly Income" onChange={(e) => handleSetIncome(e.target.value)} defaultValue={income > 0 ? income : ''} className="w-full p-2 border rounded-lg mb-4" />
                    <input type="text" placeholder="Expense Description" value={newExpense.description} onChange={(e) => setNewExpense({...newExpense, description: e.target.value})} className="w-full p-2 border rounded-lg mb-4" />
                    <input type="number" placeholder="Amount" value={newExpense.amount} onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})} className="w-full p-2 border rounded-lg mb-4" />
                    <p className="text-sm text-gray-600 mb-2">Category:</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {expenseCategories.map(cat => (
                            <button key={cat.name} onClick={() => setNewExpense({...newExpense, category: cat.name})} className={`px-3 py-1 text-sm rounded-full transition-colors ${newExpense.category === cat.name ? 'text-white' : 'bg-gray-200 text-gray-700'}`} style={{backgroundColor: newExpense.category === cat.name ? cat.color : undefined}}>{cat.name}</button>
                        ))}
                    </div>
                    <button onClick={handleAddTransaction} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700">Add Expense</button>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="font-bold text-lg mb-4">Recent Transactions</h3>
                    <div className="space-y-3 h-64 overflow-y-auto pr-2">
                        {transactions.length > 0 ? (
                            transactions.slice().reverse().map(t => (
                                <div key={t.id} className="flex justify-between items-center border-b pb-2">
                                    <div>
                                        <p className="font-semibold text-gray-800">{t.description}</p>
                                        <p className="text-xs text-gray-500">{t.category} - {new Date(t.date).toLocaleDateString()}</p>
                                    </div>
                                    <p className="font-semibold text-red-600">-${t.amount.toFixed(2)}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 mt-8">No transactions yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- MAIN APP CONTAINER ---
export default function App() {
  const [activeTab, setActiveTab] = useState('Chores');

  return (
    <div className="h-screen w-screen bg-gray-100 font-sans flex flex-col">
      <main className="flex-grow overflow-hidden">
        {activeTab === 'Chores' ? <ChoresScreen /> : <BudgetScreen />}
      </main>
      <nav className="flex-shrink-0 bg-white shadow-md border-t">
        <div className="flex justify-around">
          <button
            onClick={() => setActiveTab('Chores')}
            className={`flex-1 py-3 text-center font-semibold transition-colors ${activeTab === 'Chores' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            🧹 Chores
          </button>
          <button
            onClick={() => setActiveTab('Budget')}
            className={`flex-1 py-3 text-center font-semibold transition-colors ${activeTab === 'Budget' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            💰 Budget
          </button>
        </div>
      </nav>
    </div>
  );
}
