import React, { useState, useEffect } from 'react';

// --- IMPORTANT: Add your Gemini API Key here ---
// Get your key from Google AI Studio: https://aistudio.google.com/
const API_KEY = "AIzaSyDEla-iBacWMHuTXBVof3YFFazF7IPk4MM"; 

// --- HELPER COMPONENTS ---

// A simple modal for showing alerts and analysis
const Modal = ({ message, onClose }) => {
  if (!message) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center mx-4">
        <p className="mb-4 text-lg text-gray-700 whitespace-pre-wrap">{message}</p>
        <button
          onClick={onClose}
          className="bg-indigo-600 text-white font-bold py-2 px-8 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
        >
          Close
        </button>
      </div>
    </div>
  );
};

// A confirmation modal for deleting transactions
const ConfirmationModal = ({ message, onConfirm, onCancel }) => {
    if (!message) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center mx-4">
                <p className="mb-6 text-lg text-gray-700">{message}</p>
                <div className="flex justify-center gap-4">
                    <button onClick={onCancel} className="bg-gray-300 text-gray-800 font-bold py-2 px-8 rounded-lg hover:bg-gray-400">
                        Cancel
                    </button>
                    <button onClick={onConfirm} className="bg-red-600 text-white font-bold py-2 px-8 rounded-lg hover:bg-red-700">
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

// SVG Icon for the trash can
const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-red-500 transition-colors">
        <path d="M3 6h18"></path>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
);

// A simple Pie Chart component
const PieChart = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.total, 0);
  if (total === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 flex justify-center items-center h-48">
        <p className="text-gray-500">No expense data yet!</p>
      </div>
    );
  }

  let cumulativePercent = 0;
  const gradientParts = data.map(item => {
    const percent = (item.total / total) * 100;
    const part = `${item.color} ${cumulativePercent}% ${cumulativePercent + percent}%`;
    cumulativePercent += percent;
    return part;
  });
  const conicGradient = `conic-gradient(${gradientParts.join(', ')})`;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-base font-bold text-gray-800 mb-4 text-center">Expenses by Category</h3>
      <div className="flex items-center justify-around gap-4">
        <div 
          className="w-28 h-28 rounded-full" 
          style={{ background: conicGradient }}
        ></div>
        <div className="flex flex-col gap-y-1">
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
  { id: '3', name: 'Vacuum main areas', frequency: 'alternate' },
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
const ChoresScreen = ({ onBack }) => {
  const [allChores, setAllChores] = useState(initialChores);
  const [todaysChores, setTodaysChores] = useState([]);
  const [completedChores, setCompletedChores] = useState([]);
  const [newChore, setNewChore] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [suggestionRoom, setSuggestionRoom] = useState('');
  const [suggestedChores, setSuggestedChores] = useState([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const today = new Date();
  const dayOfWeek = today.getDay();
  const todayDateString = today.toISOString().split('T')[0];

  useEffect(() => {
    try {
      const storedChores = localStorage.getItem('chores');
      if (storedChores) setAllChores(JSON.parse(storedChores));
      const storedCompleted = localStorage.getItem(`completed_${todayDateString}`);
      if (storedCompleted) setCompletedChores(JSON.parse(storedCompleted));
    } catch (e) { setAlertMessage("Could not load saved data."); }
  }, [todayDateString]);

  useEffect(() => {
    const getTodaysChores = () => allChores.filter(chore => {
      if (chore.frequency === 'daily') return true;
      if (chore.frequency === 'weekly' && chore.day === dayOfWeek) return true;
      if (chore.frequency === 'alternate' && [1, 3, 5].includes(dayOfWeek)) return true;
      return false;
    });
    setTodaysChores(getTodaysChores());
  }, [allChores, dayOfWeek]);

  const saveAllChores = (choresToSave) => {
    try {
      localStorage.setItem('chores', JSON.stringify(choresToSave));
    } catch (e) { setAlertMessage("Could not save your new chore."); }
  };

  const handleAddChore = (choreName) => {
    if (choreName.trim() === '') return;
    const newChoreObject = { id: Date.now().toString(), name: choreName.trim(), frequency: 'daily' };
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
    const updatedCompleted = completedChores.includes(id) ? completedChores.filter(c => c !== id) : [...completedChores, id];
    setCompletedChores(updatedCompleted);
    try {
      localStorage.setItem(`completed_${todayDateString}`, JSON.stringify(updatedCompleted));
    } catch (e) { setAlertMessage("Could not save your progress."); }
  };
  
  const handleSuggestChores = async () => {
    if (!suggestionRoom.trim() || !API_KEY) {
        setAlertMessage("Please enter a room name and ensure your API key is set.");
        return;
    }
    setIsSuggesting(true);
    setSuggestedChores([]);
    const prompt = `Suggest 5 common household chores for the room: "${suggestionRoom}". Return as a valid JSON array of strings. Example: ["Wipe counters", "Clean sink"]`;
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;
        const suggestions = JSON.parse(text.replace(/```json|```/g, '').trim());
        setSuggestedChores(suggestions);
    } catch (e) { setAlertMessage("Could not get suggestions from Gemini."); }
    setIsSuggesting(false);
  };

  return (
    <div className="px-4 pt-24 pb-4 h-full flex flex-col">
      <Modal message={alertMessage} onClose={() => setAlertMessage('')} />
      <header className="flex-shrink-0 flex items-center mb-4">
        <button onClick={onBack} className="mr-2 p-2 rounded-full hover:bg-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
        </button>
        <div>
            <h1 className="text-xl font-bold text-gray-800">Today's Chores</h1>
            <p className="text-sm text-gray-500">{today.toDateString()}</p>
        </div>
      </header>
      
      <main className="flex-grow overflow-y-auto pr-2 space-y-3 pb-4">
        {todaysChores.length > 0 ? (
          todaysChores.map(item => (
            <div key={item.id} className="flex items-center bg-white p-3 rounded-lg shadow-sm">
              <button onClick={() => toggleChoreCompletion(item.id)} className="mr-4 text-2xl p-2">
                {completedChores.includes(item.id) ? '✅' : '⬜️'}
              </button>
              <p className={`flex-grow text-base text-gray-700 ${completedChores.includes(item.id) ? 'line-through text-gray-400' : ''}`}>{item.name}</p>
              <button onClick={() => handleRemoveChore(item.id)} className="p-2 group"><TrashIcon /></button>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-full"><p className="text-center text-gray-500">No chores for today. Enjoy!</p></div>
        )}
      </main>

      <footer className="flex-shrink-0 mt-auto pt-4 border-t border-gray-200 space-y-4 bg-gray-100">
        <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-bold text-base mb-2">✨ Get Chore Ideas</h3>
            <div className="flex gap-3">
                 <input type="text" className="flex-grow p-3 border border-gray-300 rounded-lg text-base" placeholder="e.g., Kitchen" value={suggestionRoom} onChange={(e) => setSuggestionRoom(e.target.value)} />
                 <button onClick={handleSuggestChores} disabled={isSuggesting} className="bg-teal-500 text-white font-bold py-3 px-5 rounded-lg hover:bg-teal-600 disabled:bg-gray-400">{isSuggesting ? '...' : 'Suggest'}</button>
            </div>
            {suggestedChores.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {suggestedChores.map((chore, i) => (<button key={i} onClick={() => handleAddChore(chore)} className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-indigo-200">+ {chore}</button>))}
                </div>
            )}
        </div>
        <div className="flex gap-3">
          <input type="text" className="flex-grow p-3 border border-gray-300 rounded-lg text-base" placeholder="Add a custom chore..." value={newChore} onChange={(e) => setNewChore(e.target.value)} />
          <button className="bg-indigo-600 text-white font-bold py-3 px-5 rounded-lg hover:bg-indigo-700" onClick={() => handleAddChore(newChore)}>Add</button>
        </div>
      </footer>
    </div>
  );
};

// --- BUDGET SCREEN ---
const BudgetScreen = ({ onBack }) => {
    const [transactions, setTransactions] = useState([]);
    const [income, setIncome] = useState(0);
    const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: 'Other' });
    const [alertMessage, setAlertMessage] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState(null);

    useEffect(() => {
        try {
            const storedTransactions = localStorage.getItem('transactions');
            if (storedTransactions) setTransactions(JSON.parse(storedTransactions));
            const storedIncome = localStorage.getItem('income');
            if (storedIncome) setIncome(parseFloat(storedIncome));
        } catch (e) { setAlertMessage("Could not load budget data."); }
    }, []);

    const saveData = (key, data) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) { setAlertMessage(`Could not save your ${key}.`); }
    };

    const handleAddTransaction = () => {
        const { description, amount, category } = newExpense;
        if (!description || !amount || isNaN(parseFloat(amount))) {
            setAlertMessage("Please enter a valid description and amount.");
            return;
        }
        const newTransaction = { id: Date.now().toString(), date: new Date().toISOString(), description, amount: parseFloat(amount), category };
        const updatedTransactions = [...transactions, newTransaction];
        setTransactions(updatedTransactions);
        saveData('transactions', updatedTransactions);
        setNewExpense({ description: '', amount: '', category: 'Other' });
    };

    const handleDeleteTransaction = () => {
        if (transactionToDelete) {
            const updatedTransactions = transactions.filter(tx => tx.id !== transactionToDelete);
            setTransactions(updatedTransactions);
            saveData('transactions', updatedTransactions);
            setTransactionToDelete(null);
        }
    };

    const handleSetIncome = (text) => {
        const newIncome = parseFloat(text) || 0;
        setIncome(newIncome);
        saveData('income', newIncome);
    };
    
    const handleAnalyzeSpending = async () => {
        if (!API_KEY) {
            setAlertMessage("Please set your Gemini API key.");
            return;
        }
        setIsAnalyzing(true);
        const prompt = `My monthly income is $${income}. My expenses are: ${JSON.stringify(transactions)}. Act as a friendly financial advisor. Provide a brief, encouraging analysis and one or two simple, actionable tips.`;
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            const data = await response.json();
            const analysis = data.candidates[0].content.parts[0].text;
            setAlertMessage(analysis);
        } catch (e) { setAlertMessage("Could not get analysis from Gemini."); }
        setIsAnalyzing(false);
    };

    const getSummary = () => {
        const monthlyExpenses = transactions.reduce((s, t) => s + t.amount, 0);
        const netBalance = income - monthlyExpenses;
        return { monthlyExpenses, netBalance };
    };

    const getChartData = () => {
        const categoryTotals = expenseCategories.map(cat => ({ name: cat.name, total: 0, color: cat.color }));
        transactions.forEach(t => {
            const category = categoryTotals.find(c => c.name === t.category);
            if (category) category.total += t.amount;
        });
        return categoryTotals.filter(c => c.total > 0);
    };

    const { monthlyExpenses, netBalance } = getSummary();
    const chartData = getChartData();

    return (
        <div className="p-4 pt-24 pb-4 h-full flex flex-col">
            <Modal message={alertMessage} onClose={() => setAlertMessage('')} />
            <ConfirmationModal 
                message={transactionToDelete ? "Are you sure you want to delete this transaction?" : null}
                onConfirm={handleDeleteTransaction}
                onCancel={() => setTransactionToDelete(null)}
            />
            <header className="flex justify-between items-center mb-4 flex-shrink-0">
                <div className="flex items-center">
                    <button onClick={onBack} className="mr-2 p-2 rounded-full hover:bg-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">Budget Dashboard</h1>
                </div>
                <button onClick={handleAnalyzeSpending} disabled={isAnalyzing || transactions.length === 0} className="bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 whitespace-nowrap text-sm">
                    ✨ {isAnalyzing ? '...' : 'Analyze'}
                </button>
            </header>

            <main className="space-y-4 overflow-y-auto flex-grow pb-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-lg shadow"><p className="text-xs text-gray-500">Income</p><p className="text-lg font-bold text-green-600">${income.toFixed(2)}</p></div>
                    <div className="bg-white p-3 rounded-lg shadow"><p className="text-xs text-gray-500">Expenses</p><p className="text-lg font-bold text-red-600">${monthlyExpenses.toFixed(2)}</p></div>
                    <div className={`p-3 rounded-lg shadow col-span-2 ${netBalance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}><p className="text-sm text-center text-gray-600">Net Balance</p><p className={`text-2xl text-center font-bold ${netBalance >= 0 ? 'text-green-700' : 'text-red-700'}`}>${netBalance.toFixed(2)}</p></div>
                </div>

                <PieChart data={chartData} />

                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="font-bold text-base mb-3">Manage Finances</h3>
                    <div className="space-y-3">
                        <input type="number" placeholder="Monthly Income" onChange={(e) => handleSetIncome(e.target.value)} defaultValue={income > 0 ? income : ''} className="w-full p-3 border rounded-lg text-base" />
                        <input type="text" placeholder="Expense Description" value={newExpense.description} onChange={(e) => setNewExpense({...newExpense, description: e.target.value})} className="w-full p-3 border rounded-lg text-base" />
                        <input type="number" placeholder="Amount" value={newExpense.amount} onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})} className="w-full p-3 border rounded-lg text-base" />
                        <div>
                            <p className="text-sm text-gray-600 mb-2">Category:</p>
                            <div className="flex flex-wrap gap-2">
                                {expenseCategories.map(cat => (<button key={cat.name} onClick={() => setNewExpense({...newExpense, category: cat.name})} className={`px-3 py-1.5 text-sm rounded-full transition-colors ${newExpense.category === cat.name ? 'text-white' : 'bg-gray-200 text-gray-700'}`} style={{backgroundColor: newExpense.category === cat.name ? cat.color : undefined}}>{cat.name}</button>))}
                            </div>
                        </div>
                        <button onClick={handleAddTransaction} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700">Add Expense</button>
                    </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="font-bold text-base mb-3">Recent Transactions</h3>
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                        {transactions.length > 0 ? (
                            transactions.slice().reverse().map(t => (
                                <div key={t.id} className="flex justify-between items-center border-b pb-2">
                                    <div>
                                        <p className="font-semibold text-gray-800 text-sm">{t.description}</p>
                                        <p className="text-xs text-gray-500">{t.category} - {new Date(t.date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center">
                                        <p className="font-semibold text-red-600 text-sm mr-2">-${t.amount.toFixed(2)}</p>
                                        <button onClick={() => setTransactionToDelete(t.id)} className="p-1 group"><TrashIcon /></button>
                                    </div>
                                </div>
                            ))
                        ) : (<div className="flex items-center justify-center h-24"><p className="text-center text-gray-500">No transactions yet.</p></div>)}
                    </div>
                </div>
            </main>
        </div>
    );
};

// --- WELCOME & MAIN MENU ---
export default function App() {
  const [screen, setScreen] = useState('welcome'); // 'welcome', 'menu', 'chores', 'budget'
  const [animationState, setAnimationState] = useState('entering'); // 'entering', 'centered', 'top'
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    const welcomeTimer = setTimeout(() => setAnimationState('centered'), 100);
    const titleMoveTimer = setTimeout(() => setAnimationState('top'), 2000); 
    const menuTimer = setTimeout(() => {
        setScreen('menu');
        setShowButtons(true);
    }, 2700); // Title takes 700ms to move, so show buttons after that

    return () => {
        clearTimeout(welcomeTimer);
        clearTimeout(titleMoveTimer);
        clearTimeout(menuTimer);
    };
  }, []);

  const renderScreen = () => {
    switch (screen) {
        case 'chores':
            return <ChoresScreen onBack={() => setScreen('menu')} />;
        case 'budget':
            return <BudgetScreen onBack={() => setScreen('menu')} />;
        default:
            return null;
    }
  };

  const titleContainerStyles = {
    entering: 'opacity-0 top-1/2 -translate-y-1/2',
    centered: 'opacity-100 top-1/2 -translate-y-1/2',
    top: 'opacity-100 top-8 -translate-y-0'
  };

  return (
    <div className="h-screen w-screen bg-gray-200 flex justify-center">
      <style>{`:root { --safe-area-inset-top: env(safe-area-inset-top, 0px); --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px); }`}</style>
      <div 
        className="w-full max-w-lg h-full bg-gray-100 font-sans flex flex-col shadow-2xl relative overflow-hidden"
        style={{ paddingTop: 'var(--safe-area-inset-top)', paddingBottom: 'var(--safe-area-inset-bottom)' }}
      >
        { (screen === 'welcome' || screen === 'menu') &&
            <div className={`absolute left-0 right-0 flex justify-center transition-all duration-700 ease-in-out transform ${titleContainerStyles[animationState]}`}>
                <div className="text-center">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                        Chore & Budget App
                    </h1>
                    <p className="text-gray-500">by PG</p>
                </div>
            </div>
        }

        {screen === 'menu' && (
            <div className={`flex flex-col items-center justify-center h-full gap-6 pt-24 transition-opacity duration-500 ${showButtons ? 'opacity-100' : 'opacity-0'}`}>
                <button onClick={() => setScreen('chores')} className="bg-white text-indigo-600 font-bold py-6 px-12 rounded-lg shadow-md hover:shadow-lg w-3/4 text-xl">🧹 Chores</button>
                <button onClick={() => setScreen('budget')} className="bg-white text-purple-600 font-bold py-6 px-12 rounded-lg shadow-md hover:shadow-lg w-3/4 text-xl">💰 Budget</button>
            </div>
        )}
        
        <div className={`absolute inset-0 transition-opacity duration-300 ${screen !== 'menu' && screen !== 'welcome' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {renderScreen()}
        </div>

      </div>
    </div>
  );
}
