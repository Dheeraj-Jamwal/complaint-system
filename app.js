const form = document.getElementById('signup-form');

form.addEventListener('submit', (event) => {
  // Simple validation example
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  if (!username || !password) {
    alert('Please fill in all fields');
    event.preventDefault(); // Prevent form submission if validation fails
    return;
  }

  // You can add more complex validation logic here (e.g., email format)
});
