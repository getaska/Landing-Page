const contactForm = document.getElementById('wf-form-Contact');
  contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const cformData = new FormData(contactForm).entries()
      const response = await fetch('https://api.getaska.com/api/public/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.fromEntries(cformData))
      });
      if (response.ok){
        document.getElementById("feedback-message").innerHTML = "<span style='color: green;'>Thank you! Your submission has been received!</span>";
      }
      else
      {
        document.getElementById("feedback-message").innerHTML = "<span style='color: red;'>Oops! Something went wrong, please try again </span>";
      }
      document.getElementById("wf-form-Contact").reset();
  });