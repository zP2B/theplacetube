function errorMessage(message) {
  $('#alert')
      .addClass('alert-danger')
      .find('> .alert-heading').text('Error!');
  displayMessage(message);
}

function successMessage(message) {
  $('#alert')
      .addClass('alert-success')
      .find('> .alert-heading').text('Success!');
  displayMessage(message);
}

function warningMessage(message) {
  $('#alert')
      .addClass('alert-warning')
      .find('> .alert-heading').text('Success!');
  displayMessage(message);
}

function displayMessage(message) {
  $('#alert')
      .slideDown(500)
      .find('> .alert-message').text(message);
  setTimeout(hideAlert, 5000);
}

function hideAlert() {
  $('#alert').slideUp(500, function() {
    $('#alert')
        .removeClass('alert-danger')
        .removeClass('alert-success')
        .removeClass('alert-warning');
  });
}