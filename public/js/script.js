
(() => {
  'use strict'

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  const forms = document.querySelectorAll('.needs-validation')

  // Loop over them and prevent submission
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault()
        event.stopPropagation()
      }

      form.classList.add('was-validated')
    }, false)
  })
})()
// Amenity chips toggle
document.querySelectorAll('.amenity-chip').forEach(function(chip) {
    chip.addEventListener('click', function() {
        this.classList.toggle('selected');
        var cb = this.querySelector('input[type=checkbox]');
        cb.checked = !cb.checked;
    });
});