import sendMail from '../config/nodemailer.js';

const sendMailToRecoveryPassword = (userMail, token) => {

    return sendMail(
        userMail,
        "Recupera tu contraseña",
        `
            <h1>RENT CAR</h1>
            <p>Has solicitado restablecer tu contraseña.</p>
            <a href="${process.env.URL_BACKEND}recuperarpassword/${token}">
            Clic para restablecer tu contraseña
            </a>
            <hr>
            <footer>RENT CAR 2026. Todos los derechos reservados.</footer>
        `
        )
}

const sendMailToNewClient = (userMail, nombre, email, password) => {

    return sendMail(
        userMail,
        "Credenciales de acceso - RENT CAR",
        `
            <h1>RENT CAR</h1>
            <p>¡Bienvenido ${nombre}!</p>
            <p>Tu cuenta ha sido creada exitosamente. Aquí están tus credenciales para acceder al sistema:</p>
            <hr>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Contraseña:</strong> ${password}</p>
            <hr>
            <p>Por favor, guarda estas credenciales en un lugar seguro.</p>
            <footer>RENT CAR 2026. Todos los derechos reservados.</footer>
        `
        )
}

export {
    sendMailToRecoveryPassword,
    sendMailToNewClient
}
