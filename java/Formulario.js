// ...existing code...

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const nombre = document.getElementById('nombre');
  const email = document.getElementById('email');
  const password = document.getElementById('password');
  const confirmPassword = document.getElementById('confirmPassword');

  const nombreError = document.getElementById('nombreError');
  const emailError = document.getElementById('emailError');
  const pwdError = document.getElementById('pwdError');
  const confirmError = document.getElementById('confirmError');
  const recaptchaError = document.getElementById('recaptchaError');
  const success = document.getElementById('success');
  const serverError = document.getElementById('serverError');
  const toggleBtn = document.getElementById('togglePwd');
  const submitBtn = document.getElementById('submitBtn');

  // Mostrar/ocultar contraseñas
  toggleBtn.addEventListener('click', () => {
    const shown = password.type === 'text';
    password.type = shown ? 'password' : 'text';
    confirmPassword.type = shown ? 'password' : 'text';
    toggleBtn.textContent = shown ? 'Mostrar' : 'Ocultar';
    toggleBtn.setAttribute('aria-pressed', String(!shown));
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    [nombreError, emailError, pwdError, confirmError, recaptchaError, success, serverError].forEach(el => el.style.display = 'none');

    let valid = true;
    if (!nombre.checkValidity()) { nombreError.style.display = 'block'; valid = false; }
    if (!email.checkValidity()) { emailError.style.display = 'block'; valid = false; }
    if (!password.checkValidity()) { pwdError.style.display = 'block'; valid = false; }
    if (password.value !== confirmPassword.value) { confirmError.style.display = 'block'; valid = false; }

    // reCAPTCHA v2: comprobar respuesta
    let recaptchaResponse = '';
    if (typeof grecaptcha !== 'undefined' && grecaptcha.getResponse) {
      recaptchaResponse = grecaptcha.getResponse();
    }
    if (!recaptchaResponse) {
      recaptchaError.style.display = 'block';
      valid = false;
    }

    if (!valid) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';

    // Envía JSON al backend para verificar reCAPTCHA y crear usuario
    fetch('../php/Formulario.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recaptcha: recaptchaResponse,
        nombre: nombre.value,
        email: email.value,
        password: password.value,
        action: 'register'
      })
    }).then(r => r.json()).then(data => {
      if (data && data.success === true) {
        success.textContent = 'Registro correcto.';
        success.style.display = 'block';
        form.reset();
        if (typeof grecaptcha !== 'undefined' && grecaptcha.reset) grecaptcha.reset();
      } else {
        const err = (data && data.error) ? data.error : 'error-servidor';
        serverError.textContent = 'Error: ' + err;
        serverError.style.display = 'block';
        if (typeof grecaptcha !== 'undefined' && grecaptcha.reset) grecaptcha.reset();
      }
    }).catch(err => {
      serverError.textContent = 'Error de conexión al servidor.';
      serverError.style.display = 'block';
      console.error(err);
      if (typeof grecaptcha !== 'undefined' && grecaptcha.reset) grecaptcha.reset();
    }).finally(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Registrarse';
    });
  });
});
// ...existing code...