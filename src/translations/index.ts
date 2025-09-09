export const translations = {
  hu: {
    auth: {
      login: 'Bejelentkezés',
      signup: 'Regisztráció',
      email: 'E-mail cím',
      password: 'Jelszó',
      name: 'Teljes név',
      profileType: 'Profil típus',
      house: 'Ház',
      language: 'Nyelv',
      managerPassword: 'Vezetői jelszó',
      houseLeaderPassword: 'Házvezetői jelszó',
      required: '*',
      emailPlaceholder: 'pelda@email.com',
      namePlaceholder: 'Kovács János',
      passwordPlaceholder: '••••••••',
      minPasswordLength: 'Minimum 6 karakter hosszú jelszó szükséges',
      alreadyHaveAccount: 'Már van fiókja? Jelentkezzen be',
      noAccount: 'Nincs még fiókja? Regisztráljon',
      companySystem: 'Feketerigó Alapítvány számla kezelő rendszer',
      copyright: '© 2024 Feketerigó Alapítvány számla kezelő rendszer. Minden jog fenntartva.',
      profileTypes: {
        adminisztracio: 'Adminisztráció',
        pedagogus: 'Pedagógus',
        haz_vezeto: 'Ház vezető',
        vezetoi: 'Vezetői'
      },
      houses: {
        feketerigo: 'Feketerigo',
        torocko: 'Torockó',
        level: 'Levél'
      },
      languages: {
        hu: 'Magyar',
        en: 'English'
      },
      errors: {
        emailRequired: 'E-mail cím megadása kötelező',
        passwordMinLength: 'A jelszónak legalább 6 karakter hosszúnak kell lennie',
        nameRequired: 'Név megadása kötelező',
        wrongManagerPassword: 'Hibás vezetői jelszó',
        wrongHouseLeaderPassword: 'Hibás házvezetői jelszó',
        userAlreadyExists: 'Ez az e-mail cím már regisztrálva van. Kérjük, jelentkezzen be helyette.',
        invalidEmail: 'Érvénytelen e-mail cím formátum',
        passwordRequirements: 'A jelszó nem felel meg a követelményeknek',
        signupDisabled: 'A regisztráció jelenleg nem elérhető',
        registrationFailed: 'Regisztráció sikertelen',
        loginRequired: 'Jelszó megadása kötelező',
        invalidCredentials: 'Hibás e-mail cím vagy jelszó. Kérjük, ellenőrizze az adatokat.',
        emailNotConfirmed: 'Kérjük, erősítse meg e-mail címét a regisztráció befejezéséhez.',
        tooManyRequests: 'Túl sok próbálkozás. Kérjük, várjon egy kicsit és próbálja újra.',
        loginFailed: 'Bejelentkezés sikertelen',
        unexpectedError: 'Váratlan hiba történt. Kérjük, próbálja újra.'
      }
    },
    settings: {
      title: 'Beállítások',
      subtitle: 'Alkalmazás testreszabása és konfigurálása',
      save: 'Mentés',
      saving: 'Mentés...',
      tabs: {
        general: 'Általános',
        backup: 'Biztonsági mentés'
      },
      sections: {
        appearance: 'Megjelenés',
        notifications: 'Értesítések',
        privacy: 'Adatvédelem és biztonság',
        backup: 'Biztonsági mentés és adatok',
        language: 'Nyelv és régió',
        reset: 'Beállítások visszaállítása'
      },
      theme: {
        title: 'Téma',
        light: 'Világos',
        dark: 'Sötét',
        system: 'Rendszer'
      },
      language: {
        title: 'Nyelv',
        hungarian: 'Magyar',
        english: 'Angol'
      },
      display: {
        compactMode: 'Kompakt mód',
        compactModeDesc: 'Kisebb távolságok és elemek',
        animations: 'Animációk',
        animationsDesc: 'Átmenetek és mozgások',
        highContrast: 'Nagy kontraszt',
        highContrastDesc: 'Jobb láthatóság'
      },
      notifications: {
        email: 'E-mail értesítések',
        emailDesc: 'Fontos események e-mailben',
        push: 'Push értesítések',
        pushDesc: 'Böngésző értesítések',
        invoiceProcessed: 'Számla feldolgozás',
        invoiceProcessedDesc: 'Értesítés feldolgozás után',
        systemUpdates: 'Rendszer frissítések',
        systemUpdatesDesc: 'Új funkciók és javítások'
      },
      messages: {
        settingUpdated: 'Beállítás frissítve!',
        settingsReset: 'Beállítások visszaállítva az alapértelmezett értékekre',
        settingsExported: 'Beállítások exportálva',
        settingsImported: 'Beállítások sikeresen importálva',
        invalidFile: 'Hibás beállítás fájl',
        settingsSaved: 'Beállítások sikeresen mentve!',
        settingsSaveError: 'Hiba történt a beállítások mentése során'
      }
    }
  },
  en: {
    auth: {
      login: 'Sign In',
      signup: 'Sign Up',
      email: 'Email Address',
      password: 'Password',
      name: 'Full Name',
      profileType: 'Profile Type',
      house: 'House',
      language: 'Language',
      managerPassword: 'Manager Password',
      houseLeaderPassword: 'House Leader Password',
      required: '*',
      emailPlaceholder: 'example@email.com',
      namePlaceholder: 'John Doe',
      passwordPlaceholder: '••••••••',
      minPasswordLength: 'Minimum 6 character password required',
      alreadyHaveAccount: 'Already have an account? Sign in',
      noAccount: "Don't have an account yet? Sign up",
      companySystem: 'Feketerigó Foundation Account Management System',
      copyright: '© 2024 Feketerigó Foundation Account Management System. All rights reserved.',
      profileTypes: {
        adminisztracio: 'Administration',
        pedagogus: 'Teacher',
        haz_vezeto: 'House Leader',
        vezetoi: 'Manager'
      },
      houses: {
        feketerigo: 'Feketerigo',
        torocko: 'Torockó',
        level: 'Levél'
      },
      languages: {
        hu: 'Magyar',
        en: 'English'
      },
      errors: {
        emailRequired: 'Email address is required',
        passwordMinLength: 'Password must be at least 6 characters long',
        nameRequired: 'Name is required',
        wrongManagerPassword: 'Incorrect manager password',
        wrongHouseLeaderPassword: 'Incorrect house leader password',
        userAlreadyExists: 'This email is already registered. Please sign in instead.',
        invalidEmail: 'Invalid email address format',
        passwordRequirements: 'Password does not meet requirements',
        signupDisabled: 'Registration is currently unavailable',
        registrationFailed: 'Registration failed',
        loginRequired: 'Password is required',
        invalidCredentials: 'Invalid email or password. Please check your credentials.',
        emailNotConfirmed: 'Please confirm your email address to complete registration.',
        tooManyRequests: 'Too many attempts. Please wait a moment and try again.',
        loginFailed: 'Sign in failed',
        unexpectedError: 'An unexpected error occurred. Please try again.'
      }
    },
    settings: {
      title: 'Settings',
      subtitle: 'Customize and configure the application',
      save: 'Save',
      saving: 'Saving...',
      tabs: {
        general: 'General',
        backup: 'Backup'
      },
      sections: {
        appearance: 'Appearance',
        notifications: 'Notifications',
        privacy: 'Privacy & Security',
        backup: 'Backup & Data',
        language: 'Language & Region',
        reset: 'Reset Settings'
      },
      theme: {
        title: 'Theme',
        light: 'Light',
        dark: 'Dark',
        system: 'System'
      },
      language: {
        title: 'Language',
        hungarian: 'Hungarian',
        english: 'English'
      },
      display: {
        compactMode: 'Compact Mode',
        compactModeDesc: 'Smaller spacing and elements',
        animations: 'Animations',
        animationsDesc: 'Transitions and movements',
        highContrast: 'High Contrast',
        highContrastDesc: 'Better visibility'
      },
      notifications: {
        email: 'Email Notifications',
        emailDesc: 'Important events via email',
        push: 'Push Notifications',
        pushDesc: 'Browser notifications',
        invoiceProcessed: 'Invoice Processing',
        invoiceProcessedDesc: 'Notification after processing',
        systemUpdates: 'System Updates',
        systemUpdatesDesc: 'New features and fixes'
      },
      messages: {
        settingUpdated: 'Setting updated!',
        settingsReset: 'Settings reset to default values',
        settingsExported: 'Settings exported',
        settingsImported: 'Settings successfully imported',
        invalidFile: 'Invalid settings file',
        settingsSaved: 'Settings successfully saved!',
        settingsSaveError: 'Error occurred while saving settings'
      }
    }
  }
};