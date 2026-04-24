// Run this in browser DevTools Console (F12)
localStorage.removeItem('productCalculations');
localStorage.removeItem('expenses');
console.log('Finance localStorage cleared!');
console.log('Remaining:', Object.keys(localStorage));