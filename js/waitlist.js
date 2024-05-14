const thisForm = document.getElementById('email-form');
thisForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const formData = new FormData(thisForm).entries()
    const response = await fetch('https://api.getaska.com/api/public/waiting-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData))
    });
    const result = await response.json();
    if (response.ok){
      document.getElementById("email-message").innerHTML = "<span style='color: green;'>Thank you! Your submission has been received!</span>";
      }
    else if (result.errors[0].msg === "E-mail already in use"){
      document.getElementById("email-message").innerHTML = "<span style='color: orange;'>Email already registered</span>"; 
    }
      else
      {
        document.getElementById("email-message").innerHTML = "<span style='color: red;'>Oops! Something went wrong, please try again </span>";
      }
});
