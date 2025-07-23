// 多语言错误信息
const errorMessages = {
  en: {
    emailAlreadyRegistered: 'This email is already registered. Please use a different email or login directly.',
    invalidCredentials: 'Invalid email or password. Please check and try again.',
    registrationSuccess: 'Registration successful! Welcome to Destiny Divination.',
    validationError: 'Registration information is incorrect. Please check and try again.',
    operationFailed: 'Operation failed. Please try again later.',
    emailVerificationRequired: 'Please verify your email address first.',
    passwordMismatch: 'The passwords do not match.',
    pleaseEnterName: 'Please enter your name.',
    pleaseEnterEmail: 'Please enter your email address.',
    pleaseEnterPassword: 'Please enter your password.',
    emailVerificationSuccess: 'Email verification successful.',
    verificationCodeSent: 'Verification code has been sent to your email. Please check your inbox (valid for 5 minutes).',
    passwordResetSuccess: 'Password reset successfully! You can now login with your new password.',
  },
  zh: {
    emailAlreadyRegistered: '该邮箱已被注册，请使用其他邮箱或直接登录',
    invalidCredentials: '邮箱或密码错误，请检查后重试',
    registrationSuccess: '注册成功！欢迎加入命运占卜',
    validationError: '注册信息填写有误，请检查后重试',
    operationFailed: '操作失败，请稍后重试',
    emailVerificationRequired: '请先验证邮箱地址',
    passwordMismatch: '两次输入的密码不一致',
    pleaseEnterName: '请输入姓名',
    pleaseEnterEmail: '请输入邮箱地址',
    pleaseEnterPassword: '请输入密码',
    emailVerificationSuccess: '邮箱验证成功',
    verificationCodeSent: '验证码已发送到您的邮箱，请查收（5分钟内有效）',
    passwordResetSuccess: '密码重置成功！您现在可以使用新密码登录了。',
  },
  es: {
    emailAlreadyRegistered: 'Este correo ya está registrado. Por favor usa un correo diferente o inicia sesión directamente.',
    invalidCredentials: 'Correo o contraseña inválidos. Por favor verifica e intenta de nuevo.',
    registrationSuccess: '¡Registro exitoso! Bienvenido a Destiny Divination.',
    validationError: 'La información de registro es incorrecta. Por favor verifica e intenta de nuevo.',
    operationFailed: 'Operación fallida. Por favor intenta más tarde.',
    emailVerificationRequired: 'Por favor verifica tu dirección de correo primero.',
    passwordMismatch: 'Las contraseñas no coinciden.',
    pleaseEnterName: 'Por favor ingresa tu nombre.',
    pleaseEnterEmail: 'Por favor ingresa tu dirección de correo.',
    pleaseEnterPassword: 'Por favor ingresa tu contraseña.',
    emailVerificationSuccess: 'Verificación de correo exitosa.',
    verificationCodeSent: 'El código de verificación ha sido enviado a tu correo. Por favor revisa tu bandeja de entrada (válido por 5 minutos).',
    passwordResetSuccess: '¡Contraseña restablecida exitosamente! Ahora puedes iniciar sesión con tu nueva contraseña.',
  },
  fr: {
    emailAlreadyRegistered: 'Cet email est déjà enregistré. Veuillez utiliser un email différent ou vous connecter directement.',
    invalidCredentials: 'Email ou mot de passe invalide. Veuillez vérifier et réessayer.',
    registrationSuccess: 'Inscription réussie ! Bienvenue dans Destiny Divination.',
    validationError: 'Les informations d\'inscription sont incorrectes. Veuillez vérifier et réessayer.',
    operationFailed: 'Opération échouée. Veuillez réessayer plus tard.',
    emailVerificationRequired: 'Veuillez d\'abord vérifier votre adresse email.',
    passwordMismatch: 'Les mots de passe ne correspondent pas.',
    pleaseEnterName: 'Veuillez entrer votre nom.',
    pleaseEnterEmail: 'Veuillez entrer votre adresse email.',
    pleaseEnterPassword: 'Veuillez entrer votre mot de passe.',
    emailVerificationSuccess: 'Vérification d\'email réussie.',
    verificationCodeSent: 'Le code de vérification a été envoyé à votre email. Veuillez vérifier votre boîte de réception (valide pendant 5 minutes).',
  },
  ja: {
    emailAlreadyRegistered: 'このメールアドレスは既に登録されています。別のメールアドレスを使用するか、直接ログインしてください。',
    invalidCredentials: 'メールアドレスまたはパスワードが正しくありません。確認して再試行してください。',
    registrationSuccess: '登録成功！Destiny Divinationへようこそ。',
    validationError: '登録情報に誤りがあります。確認して再試行してください。',
    operationFailed: '操作に失敗しました。後でもう一度お試しください。',
    emailVerificationRequired: '最初にメールアドレスを確認してください。',
    passwordMismatch: 'パスワードが一致しません。',
    pleaseEnterName: 'お名前を入力してください。',
    pleaseEnterEmail: 'メールアドレスを入力してください。',
    pleaseEnterPassword: 'パスワードを入力してください。',
    emailVerificationSuccess: 'メール確認が成功しました。',
    verificationCodeSent: '確認コードがメールに送信されました。受信トレイをご確認ください（5分間有効）。',
  }
};

/**
 * 获取本地化的错误信息
 * @param {string} key - 错误信息的键
 * @param {string} language - 语言代码 (en, zh, es, fr, ja)
 * @returns {string} 本地化的错误信息
 */
function getLocalizedMessage(key, language = 'en') {
  // 如果语言不存在，默认使用英文
  const lang = errorMessages[language] ? language : 'en';
  return errorMessages[lang][key] || errorMessages.en[key] || key;
}

/**
 * 从请求头中获取语言偏好
 * @param {Object} req - Express请求对象
 * @returns {string} 语言代码
 */
function getLanguageFromRequest(req) {
  // 优先从自定义头部获取
  const customLang = req.headers['x-language'] || req.headers['accept-language'];
  
  if (customLang) {
    // 解析语言代码
    const lang = customLang.toLowerCase().split(',')[0].split('-')[0];
    
    // 映射常见的语言代码
    const langMap = {
      'en': 'en',
      'zh': 'zh',
      'es': 'es',
      'fr': 'fr',
      'ja': 'ja'
    };
    
    return langMap[lang] || 'en';
  }
  
  return 'en'; // 默认英文
}

module.exports = {
  getLocalizedMessage,
  getLanguageFromRequest,
  errorMessages
};
