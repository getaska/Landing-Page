// Replace the number below with your actual WhatsApp business number (no + or spaces)
var GETASKA_WHATSAPP = '2349168357737';

var bookingForm = document.getElementById('booking-form');
if (bookingForm) {
    bookingForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var data = new FormData(bookingForm);
        var name = data.get('name') || '';
        var phone = data.get('phone') || '';
        var service = data.get('service') || '';
        var vehicle = data.get('vehicle') || '';
        var pickup = data.get('pickup') || '';
        var destination = data.get('destination') || '';
        var datetime = data.get('datetime') || '';

        var message =
            'Hello Getaska! I want to book a ride.\n\n' +
            'Name: ' + name + '\n' +
            'Phone: ' + phone + '\n' +
            'Service: ' + service + '\n' +
            'Vehicle: ' + vehicle + '\n' +
            'Pickup: ' + pickup + '\n' +
            'Destination: ' + destination + '\n' +
            'Date & Time: ' + datetime;

        var url = 'https://wa.me/' + GETASKA_WHATSAPP + '?text=' + encodeURIComponent(message);
        window.open(url, '_blank');

        document.getElementById('booking-message').innerHTML =
            "<span style='color:green;font-weight:600;'>Redirecting to WhatsApp... We'll confirm your booking shortly!</span>";
        bookingForm.reset();
    });
}
