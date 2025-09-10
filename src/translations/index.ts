export const translations = {
  hu: {
    // Navigation & Menu
    nav: {
      overview: 'Áttekintés',
      calendar: 'Naptár',
      chat: 'Chat',
      documents: 'Dokumentumok',
      registrar: 'Iktató',
      invoices: 'Számlák',
      attendance: 'Jelenléti',
      familyRelationships: 'Családi Kapcsolatok',
      payroll: 'Bérköltségek',
      settings: 'Beállítások',
      logout: 'Kijelentkezés',
      openProfile: 'Profil megnyitása'
    },

    // Dashboard
    dashboard: {
      greeting: {
        morning: 'Jó Reggelt',
        day: 'Szia',
        evening: 'Jó estét',
        night: 'Jó éjszakát',
        user: 'Felhasználó'
      },
      stats: {
        totalInvoices: 'Összes számla',
        totalAmount: 'Összes összeg',
        thisMonth: 'Ezen a hónapon',
        alapitvany: 'Alapítvány',
        ovoda: 'Óvoda',
        bankTransfer: 'Átutalás',
        cardCash: 'Kártya/Készpénz'
      },
      charts: {
        monthly: 'Havi áttekintés',
        organization: 'Szervezet szerint',
        paymentType: 'Fizetési mód',
        weeklyTrend: 'Heti trend',
        topPartners: 'Top partnerek',
        expenses: 'Kiadások',
        munkaszam: 'Munkaszám elemzés',
        categories: 'Kategóriák'
      }
    },

    // Invoice Upload
    upload: {
      title: 'Számla feltöltés és feldolgozás',
      dragDrop: 'Húzza ide a fájlokat vagy kattintson a tallózáshoz',
      dropFiles: 'Fájlok ejtése...',
      supportedFormats: 'Támogatott formátumok: PDF, JPG, PNG (max. 10MB)',
      scanDocument: 'Dokumentum szkennelése',
      startProcessing: 'Feldolgozás indítása',
      cancel: 'Megszakítás',
      remove: 'Eltávolítás',
      preview: 'Előnézet',
      exportToSheets: 'Exportálás táblázatba',
      processing: 'Feldolgozás...',
      completed: 'Kész',
      error: 'Hiba',
      cancelled: 'Megszakítva',
      uploading: 'Feltöltés...',
      aiProcessing: 'AI feldolgozás...',
      validFiles: 'Kérjük, válasszon érvényes fájlokat (PDF, JPG, PNG, max. 10MB)',
      maxFiles: 'Maximum 85 számla tölthető fel egyszerre',
      addedToQueue: 'számla hozzáadva a feldolgozási sorhoz',
      processingBreak: 'Rövid szünet a feldolgozásban (6. számla után)...',
      retryProcessing: 'Újrapróbálkozás a feldolgozással...',
      scanUploadSuccess: 'Szkennelt számla sikeresen feltöltve',
      scanUploadError: 'Hiba történt a szkennelt számla mentésekor'
    },

    // Mobile Scanner
    scanner: {
      title: 'Dokumentum szkenner',
      detecting: 'Dokumentum keresése...',
      detected: 'Dokumentum észlelve',
      stable: 'Stabil - automatikus rögzítés',
      autoCapturing: 'Automatikus rögzítés...',
      processing: 'Feldolgozás...',
      capture: 'Rögzítés',
      retake: 'Újra',
      save: 'Mentés',
      fileName: 'Fájl név',
      enterFileName: 'Adja meg a fájl nevét',
      adjustEdges: 'Szegélyek beállítása',
      cameraError: 'Kamera hozzáférés megtagadva',
      loadingError: 'Dokumentum szkenner betöltési hiba',
      captureError: 'Rögzítés sikertelen',
      saveError: 'Mentés sikertelen',
      close: 'Bezárás'
    },

    // Common UI Elements
    common: {
      loading: 'Betöltés...',
      saving: 'Mentés...',
      save: 'Mentés',
      cancel: 'Mégse',
      edit: 'Szerkesztés',
      delete: 'Törlés',
      close: 'Bezárás',
      back: 'Vissza',
      next: 'Következő',
      previous: 'Előző',
      search: 'Keresés',
      filter: 'Szűrés',
      export: 'Exportálás',
      import: 'Importálás',
      refresh: 'Frissítés',
      select: 'Kiválasztás',
      all: 'Összes',
      none: 'Nincs',
      year: 'Év',
      month: 'Hónap',
      day: 'Nap',
      today: 'Ma',
      yesterday: 'Tegnap',
      thisWeek: 'Ezen a héten',
      thisMonth: 'Ezen a hónapon',
      thisYear: 'Ezen az éven'
    },

    // Notifications
    notifications: {
      success: 'Sikeres',
      error: 'Hiba',
      warning: 'Figyelmeztetés',
      info: 'Információ'
    },

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
    // Backup Manager
    backup: {
      title: 'Biztonsági mentés kezelő',
      subtitle: 'Automatikus és manuális biztonsági mentések kezelése',
      loading: 'Biztonsági mentés adatok betöltése...',
      autoSchedule: 'Automatikus mentés ütemezése',
      nextBackup: 'Következő mentés',
      frequency: 'Gyakoriság',
      frequencyText: 'Kéthetente hétfőn 02:00-kor',
      noSchedule: 'Nincs beállítva automatikus mentés',
      noScheduleDesc: 'Kattintson a "Beállítás" gombra az automatikus mentések aktiválásához.',
      manualBackup: 'Manuális biztonsági mentés',
      manualDesc: 'Azonnali biztonsági mentés készítése az elmúlt 2 hét számláiról.',
      manualDescDetail: 'A mentés tartalmazza az összes fájlt és metaadatot ZIP formátumban.',
      startBackup: 'Mentés indítása',
      backupRunning: 'Mentés folyamatban...',
      history: 'Mentési előzmények',
      historyEmpty: 'Még nincsenek mentési előzmények',
      historyEmptyDesc: 'Az első biztonsági mentés után itt jelennek meg az előzmények.',
      previousBackups: 'Előzmények',
      refresh: 'Frissítés',
      setup: 'Beállítás',
      status: {
        completed: 'Sikeres',
        failed: 'Sikertelen', 
        inProgress: 'Folyamatban',
        unknown: 'Ismeretlen'
      },
      tableHeaders: {
        date: 'Dátum',
        filename: 'Fájlnév',
        invoices: 'Számlák',
        size: 'Méret'
      },
      errors: {
        loadingData: 'Hiba történt a biztonsági mentés adatok betöltése során',
        startingBackup: 'Manuális biztonsági mentés indítása...',
        unexpectedResponse: 'A biztonsági mentés funkcióhívás váratlan tartalmat adott vissza:',
        backupFailed: 'Biztonsági mentés sikertelen',
        backupError: 'Hiba történt a biztonsági mentés során:',
        setupError: 'Hiba történt az automatikus mentés beállítása során',
        unknownError: 'Ismeretlen hiba'
      },
      success: {
        backupCompleted: 'Biztonsági mentés sikeresen elkészült!',
        setupCompleted: 'Automatikus biztonsági mentés beállítva!'
      },
      description: 'A biztonsági mentések automatikusan feltöltődnek a megadott Google Drive mappába. Minden mentés tartalmazza az elmúlt 2 hét összes számláját és metaadatait ZIP formátumban.'
    },

    // Profile
    profile: {
      title: 'Profil beállítások',
      subtitle: 'Kezelje fiókja adatait és biztonsági beállításait',
      loading: 'Profil betöltése...',
      error: 'Hiba történt',
      errorDesc: 'Nem sikerült betölteni a profil adatokat.',
      basicInfo: 'Alapinformációk',
      security: 'Biztonság',
      unnamed: 'Névtelen felhasználó',
      registeredAt: 'Regisztráció:',
      lastSignIn: 'Utolsó belépés:',
      emailAddress: 'E-mail cím',
      emailNotEditable: 'Az e-mail cím nem módosítható',
      fullName: 'Teljes név',
      namePlaceholder: 'Adja meg a teljes nevét',
      notSpecified: 'Nincs megadva',
      changePassword: 'Jelszó megváltoztatása',
      currentPassword: 'Jelenlegi jelszó',
      newPassword: 'Új jelszó',
      confirmNewPassword: 'Új jelszó megerősítése',
      currentPasswordPlaceholder: 'Adja meg a jelenlegi jelszavát',
      newPasswordPlaceholder: 'Adja meg az új jelszót',
      confirmPasswordPlaceholder: 'Erősítse meg az új jelszót',
      saveChanges: 'Változások mentése',
      errors: {
        nameRequired: 'A név mező nem lehet üres',
        passwordsRequired: 'Minden jelszó mező kitöltése kötelező',
        passwordLength: 'Az új jelszónak legalább 6 karakter hosszúnak kell lennie',
        passwordMismatch: 'Az új jelszavak nem egyeznek',
        currentPasswordIncorrect: 'Jelenlegi jelszó helytelen',
        passwordChangeError: 'Hiba történt a jelszó megváltoztatása során',
        profileUpdateError: 'Hiba történt a profil frissítése során'
      },
      success: {
        profileUpdated: 'Profil sikeresen frissítve!',
        passwordChanged: 'Jelszó sikeresen megváltoztatva!'
      },
      close: 'Bezárás'
    },

    // Invoice List
    invoices: {
      title: 'Számlák',
      loading: 'Számlák betöltése...',
      searchPlaceholder: 'Keresés számlák között...',
      filters: {
        all: 'Összes',
        year: 'Év',
        month: 'Hónap',
        category: 'Kategória', 
        munkaszam: 'Munkaszám',
        organization: 'Szervezet',
        showFilters: 'Szűrők',
        showSort: 'Rendezés',
        sortBy: 'Rendezés',
        sortDirection: 'Irány'
      },
      sortOptions: {
        invoiceDate: 'Számla dátuma',
        uploadedAt: 'Feltöltés dátuma',
        amount: 'Összeg',
        partner: 'Partner'
      },
      tableHeaders: {
        select: 'Kiválasztás',
        invoice: 'Számla',
        partner: 'Partner',
        amount: 'Összeg',
        date: 'Dátum',
        category: 'Kategória',
        munkaszam: 'Munkaszám',
        actions: 'Műveletek'
      },
      actions: {
        view: 'Megtekintés',
        download: 'Letöltés',
        delete: 'Törlés',
        selectAll: 'Összes kiválasztása',
        bulkDownload: 'Kiválasztottak letöltése',
        bulkDelete: 'Kiválasztottak törlése'
      },
      deleteConfirm: {
        title: 'Számla törlése',
        message: 'Biztosan törölni szeretné ezt a számlát?',
        messageDetail: 'Ez a művelet nem visszavonható. A számla fájlja is törlődik a tárolóból.',
        confirm: 'Igen, törlés',
        deleting: 'Törlés...'
      },
      bulkDeleteConfirm: {
        title: 'Tömeges törlés',
        message: 'Biztosan törölni szeretné a kiválasztott számlákat?',
        messageDetail: 'Ez a művelet nem visszavonható. Minden kiválasztott számla fájlja törlődik.',
        confirm: 'Igen, mind törlése'
      },
      empty: {
        title: 'Nincsenek számlák',
        description: 'Még nincsenek feltöltött számlák. Kezdjen egy új számla feltöltésével.'
      },
      notifications: {
        loaded: 'Számlák sikeresen betöltve',
        loadError: 'Hiba történt a számlák betöltése során',
        downloaded: 'Fájl sikeresen letöltve!',
        downloadError: 'Hiba történt a fájl letöltése során:',
        deleted: 'Számla sikeresen törölve az adatbázisból és a tárolóból!',
        deleteError: 'Hiba történt a számla törlése során:',
        bulkDeleted: 'számla sikeresen törölve!',
        bulkDeleteError: 'számla törlése sikertelen volt.',
        bulkDownloaded: 'számla sikeresen letöltve ZIP fájlban!',
        bulkDownloadError: 'Hiba történt a tömeges letöltés során',
        noFileUrl: 'Nincs elérhető fájl URL a számlához',
        fileNotFound: 'Fájl nem található a tárolóban',
        noFilesToDownload: 'Nem sikerült egyetlen fájlt sem letölteni',
        fileDeleteWarning: 'Fájl törlése a tárolóból sikertelen, de az adatbázis rekord törölve lesz',
        pathExtractionError: 'Nem sikerült meghatározni a fájl elérési útját a tárolóban'
      }
    },

    // Payroll Costs
    payroll: {
      title: 'Bérköltség feldolgozás',
      steps: {
        organization: 'Szervezet kiválasztása',
        upload: 'Fájl feltöltés',
        preview: 'Előnézet',
        cashQuestion: 'Készpénzes jövedelem',
        cashPreview: 'Készpénz előnézet',
        confirm: 'Megerősítés'
      },
      selectOrganization: {
        title: 'Válaszd ki a szervezetet',
        subtitle: 'Melyik szervezet bérköltség adatait szeretnéd feldolgozni?'
      },
      upload: {
        title: 'Bérköltség fájl feltöltése',
        description: 'Húzd ide a bérköltség fájlt vagy kattints a tallózáshoz',
        supportedFormats: 'Támogatott formátumok: JPG, PNG, PDF',
        processing: 'Feldolgozás...'
      },
      preview: {
        title: 'Kinyert bérköltség adatok',
        subtitle: 'Ellenőrizd az adatok helyességét'
      },
      cashQuestion: {
        title: 'Készpénzes jövedelem',
        question: 'Van készpénzes jövedelem is ebben a hónapban?',
        yes: 'Igen, van',
        no: 'Nem, nincs'
      },
      cashUpload: {
        title: 'Készpénzes jövedelem fájl',
        description: 'Húzd ide a készpénzes jövedelem fájlt'
      },
      taxUpload: {
        title: 'Adó dokumentum',
        description: 'Húzd ide az adó dokumentumot az adóösszeg meghatározásához'
      },
      summary: {
        title: 'Összesítő',
        payrollRecords: 'Bérköltség tételek:',
        cashRecords: 'Készpénzes tételek:',
        totalPayroll: 'Összes bérköltség:',
        taxAmount: 'Adó összeg:',
        finalTotal: 'Végső összeg:'
      },
      table: {
        employee: 'Alkalmazott',
        projectCode: 'Projektkód',
        amount: 'Összeg',
        date: 'Dátum',
        type: 'Típus',
        actions: 'Műveletek'
      },
      types: {
        rental: 'Bérleti',
        nonRental: 'Nem bérleti',
        cash: 'Készpénz',
        bankTransfer: 'Átutalás'
      },
      monthlyView: {
        title: 'Havi bérköltségek',
        viewRecords: 'Tételek megtekintése',
        downloadFiles: 'Fájlok letöltése'
      },
      actions: {
        next: 'Tovább',
        back: 'Vissza',
        save: 'Mentés',
        saving: 'Mentés...',
        edit: 'Szerkesztés',
        delete: 'Törlés',
        ok: 'Rendben',
        cancel: 'Mégse',
        close: 'Bezárás'
      },
      notifications: {
        extracted: 'Bérköltség adatok sikeresen kinyerve!',
        cashExtracted: 'Készpénzes jövedelem adatok sikeresen kinyerve!',
        taxExtracted: 'Adóadatok sikeresen kinyerve!',
        saved: 'Bérköltség adatok sikeresen mentve!',
        updated: 'Rekord sikeresen frissítve!',
        deleted: 'Rekord sikeresen törölve!',
        summaryDeleted: 'Havi összesítő sikeresen törölve!',
        fileTypeError: 'Csak JPG, PNG és PDF fájlokat lehet feltölteni.',
        noData: 'Nincs menthető adat.',
        noOrganization: 'Válaszd ki a szervezetet a mentéshez.',
        notLoggedIn: 'Nem vagy bejelentkezve',
        processingError: 'Hiba történt a feldolgozás során:',
        saveError: 'Hiba történt a mentés során:',
        loadError: 'Hiba történt az összesítők betöltése során',
        updateError: 'Hiba történt a frissítés során:',
        deleteError: 'Hiba történt a törlés során:',
        fileUploadWarning: 'fájl feltöltése nem sikerült, a mentés folytatódik fájllink nélkül.'
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
    // Navigation & Menu
    nav: {
      overview: 'Overview',
      calendar: 'Calendar',
      chat: 'Chat',
      documents: 'Documents',
      registrar: 'Registrar',
      invoices: 'Invoices',
      attendance: 'Attendance',
      familyRelationships: 'Family Relationships',
      payroll: 'Payroll Costs',
      settings: 'Settings',
      logout: 'Sign Out',
      openProfile: 'Open Profile'
    },

    // Dashboard
    dashboard: {
      greeting: {
        morning: 'Good Morning',
        day: 'Hello',
        evening: 'Good Evening',
        night: 'Good Night',
        user: 'User'
      },
      stats: {
        totalInvoices: 'Total Invoices',
        totalAmount: 'Total Amount',
        thisMonth: 'This Month',
        alapitvany: 'Foundation',
        ovoda: 'Kindergarten',
        bankTransfer: 'Bank Transfer',
        cardCash: 'Card/Cash'
      },
      charts: {
        monthly: 'Monthly Overview',
        organization: 'By Organization',
        paymentType: 'Payment Type',
        weeklyTrend: 'Weekly Trend',
        topPartners: 'Top Partners',
        expenses: 'Expenses',
        munkaszam: 'Work Number Analysis',
        categories: 'Categories'
      }
    },

    // Invoice Upload
    upload: {
      title: 'Invoice Upload and Processing',
      dragDrop: 'Drag files here or click to browse',
      dropFiles: 'Drop files here...',
      supportedFormats: 'Supported formats: PDF, JPG, PNG (max. 10MB)',
      scanDocument: 'Scan Document',
      startProcessing: 'Start Processing',
      cancel: 'Cancel',
      remove: 'Remove',
      preview: 'Preview',
      exportToSheets: 'Export to Sheets',
      processing: 'Processing...',
      completed: 'Completed',
      error: 'Error',
      cancelled: 'Cancelled',
      uploading: 'Uploading...',
      aiProcessing: 'AI Processing...',
      validFiles: 'Please select valid files (PDF, JPG, PNG, max. 10MB)',
      maxFiles: 'Maximum 85 invoices can be uploaded at once',
      addedToQueue: 'invoices added to processing queue',
      processingBreak: 'Short break in processing (after 6th invoice)...',
      retryProcessing: 'Retrying processing...',
      scanUploadSuccess: 'Scanned invoice uploaded successfully',
      scanUploadError: 'Error occurred while saving scanned invoice'
    },

    // Mobile Scanner
    scanner: {
      title: 'Document Scanner',
      detecting: 'Looking for document...',
      detected: 'Document detected',
      stable: 'Stable - auto capture',
      autoCapturing: 'Auto capturing...',
      processing: 'Processing...',
      capture: 'Capture',
      retake: 'Retake',
      save: 'Save',
      fileName: 'File Name',
      enterFileName: 'Enter file name',
      adjustEdges: 'Adjust Edges',
      cameraError: 'Camera access denied',
      loadingError: 'Failed to load document scanner',
      captureError: 'Capture failed',
      saveError: 'Save failed',
      close: 'Close'
    },

    // Common UI Elements
    common: {
      loading: 'Loading...',
      saving: 'Saving...',
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      search: 'Search',
      filter: 'Filter',
      export: 'Export',
      import: 'Import',
      refresh: 'Refresh',
      select: 'Select',
      all: 'All',
      none: 'None',
      year: 'Year',
      month: 'Month',
      day: 'Day',
      today: 'Today',
      yesterday: 'Yesterday',
      thisWeek: 'This Week',
      thisMonth: 'This Month',
      thisYear: 'This Year'
    },

    // Notifications
    notifications: {
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Information'
    },

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
    // Backup Manager
    backup: {
      title: 'Backup Manager',
      subtitle: 'Manage automatic and manual backups',
      loading: 'Loading backup data...',
      autoSchedule: 'Automatic backup schedule',
      nextBackup: 'Next backup',
      frequency: 'Frequency',
      frequencyText: 'Biweekly on Mondays at 02:00',
      noSchedule: 'No automatic backup scheduled',
      noScheduleDesc: 'Click "Setup" to activate automatic backups.',
      manualBackup: 'Manual backup',
      manualDesc: 'Create an immediate backup of invoices from the last 2 weeks.',
      manualDescDetail: 'The backup includes all files and metadata in ZIP format.',
      startBackup: 'Start backup',
      backupRunning: 'Backup in progress...',
      history: 'Backup history',
      historyEmpty: 'No backup history yet',
      historyEmptyDesc: 'History will appear here after the first backup.',
      previousBackups: 'History',
      refresh: 'Refresh',
      setup: 'Setup',
      status: {
        completed: 'Completed',
        failed: 'Failed', 
        inProgress: 'In Progress',
        unknown: 'Unknown'
      },
      tableHeaders: {
        date: 'Date',
        filename: 'Filename',
        invoices: 'Invoices',
        size: 'Size'
      },
      errors: {
        loadingData: 'Error occurred while loading backup data',
        startingBackup: 'Starting manual backup...',
        unexpectedResponse: 'The backup function returned unexpected content:',
        backupFailed: 'Backup failed',
        backupError: 'Error occurred during backup:',
        setupError: 'Error occurred while setting up automatic backup',
        unknownError: 'Unknown error'
      },
      success: {
        backupCompleted: 'Backup completed successfully!',
        setupCompleted: 'Automatic backup set up!'
      },
      description: 'Backups are automatically uploaded to the specified Google Drive folder. Each backup contains all invoices and metadata from the last 2 weeks in ZIP format.'
    },

    // Profile
    profile: {
      title: 'Profile Settings',
      subtitle: 'Manage your account data and security settings',
      loading: 'Loading profile...',
      error: 'Error occurred',
      errorDesc: 'Failed to load profile data.',
      basicInfo: 'Basic Information',
      security: 'Security',
      unnamed: 'Unnamed User',
      registeredAt: 'Registered:',
      lastSignIn: 'Last sign in:',
      emailAddress: 'Email Address',
      emailNotEditable: 'Email address cannot be modified',
      fullName: 'Full Name',
      namePlaceholder: 'Enter your full name',
      notSpecified: 'Not specified',
      changePassword: 'Change Password',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      confirmNewPassword: 'Confirm New Password',
      currentPasswordPlaceholder: 'Enter your current password',
      newPasswordPlaceholder: 'Enter your new password',
      confirmPasswordPlaceholder: 'Confirm your new password',
      saveChanges: 'Save Changes',
      errors: {
        nameRequired: 'Name field cannot be empty',
        passwordsRequired: 'All password fields are required',
        passwordLength: 'New password must be at least 6 characters long',
        passwordMismatch: 'New passwords do not match',
        currentPasswordIncorrect: 'Current password is incorrect',
        passwordChangeError: 'Error occurred while changing password',
        profileUpdateError: 'Error occurred while updating profile'
      },
      success: {
        profileUpdated: 'Profile updated successfully!',
        passwordChanged: 'Password changed successfully!'
      },
      close: 'Close'
    },

    // Invoice List
    invoices: {
      title: 'Invoices',
      loading: 'Loading invoices...',
      searchPlaceholder: 'Search invoices...',
      filters: {
        all: 'All',
        year: 'Year',
        month: 'Month',
        category: 'Category', 
        munkaszam: 'Work Number',
        organization: 'Organization',
        showFilters: 'Filters',
        showSort: 'Sort',
        sortBy: 'Sort by',
        sortDirection: 'Direction'
      },
      sortOptions: {
        invoiceDate: 'Invoice Date',
        uploadedAt: 'Upload Date',
        amount: 'Amount',
        partner: 'Partner'
      },
      tableHeaders: {
        select: 'Select',
        invoice: 'Invoice',
        partner: 'Partner',
        amount: 'Amount',
        date: 'Date',
        category: 'Category',
        munkaszam: 'Work Number',
        actions: 'Actions'
      },
      actions: {
        view: 'View',
        download: 'Download',
        delete: 'Delete',
        selectAll: 'Select All',
        bulkDownload: 'Download Selected',
        bulkDelete: 'Delete Selected'
      },
      deleteConfirm: {
        title: 'Delete Invoice',
        message: 'Are you sure you want to delete this invoice?',
        messageDetail: 'This action cannot be undone. The invoice file will also be deleted from storage.',
        confirm: 'Yes, Delete',
        deleting: 'Deleting...'
      },
      bulkDeleteConfirm: {
        title: 'Bulk Delete',
        message: 'Are you sure you want to delete the selected invoices?',
        messageDetail: 'This action cannot be undone. All selected invoice files will be deleted.',
        confirm: 'Yes, Delete All'
      },
      empty: {
        title: 'No Invoices',
        description: 'No invoices uploaded yet. Start by uploading a new invoice.'
      },
      notifications: {
        loaded: 'Invoices loaded successfully',
        loadError: 'Error occurred while loading invoices',
        downloaded: 'File downloaded successfully!',
        downloadError: 'Error occurred while downloading file:',
        deleted: 'Invoice successfully deleted from database and storage!',
        deleteError: 'Error occurred while deleting invoice:',
        bulkDeleted: 'invoices deleted successfully!',
        bulkDeleteError: 'invoice deletions failed.',
        bulkDownloaded: 'invoices downloaded successfully in ZIP file!',
        bulkDownloadError: 'Error occurred during bulk download',
        noFileUrl: 'No file URL available for invoice',
        fileNotFound: 'File not found in storage',
        noFilesToDownload: 'Failed to download any files',
        fileDeleteWarning: 'File deletion from storage failed, but database record will be deleted',
        pathExtractionError: 'Could not determine file path in storage'
      }
    },

    // Payroll Costs
    payroll: {
      title: 'Payroll Processing',
      steps: {
        organization: 'Select Organization',
        upload: 'File Upload',
        preview: 'Preview',
        cashQuestion: 'Cash Income',
        cashPreview: 'Cash Preview',
        confirm: 'Confirm'
      },
      selectOrganization: {
        title: 'Select Organization',
        subtitle: 'Which organization payroll data would you like to process?'
      },
      upload: {
        title: 'Upload Payroll File',
        description: 'Drag payroll file here or click to browse',
        supportedFormats: 'Supported formats: JPG, PNG, PDF',
        processing: 'Processing...'
      },
      preview: {
        title: 'Extracted Payroll Data',
        subtitle: 'Check the accuracy of the data'
      },
      cashQuestion: {
        title: 'Cash Income',
        question: 'Is there cash income this month as well?',
        yes: 'Yes, there is',
        no: 'No, there isn\'t'
      },
      cashUpload: {
        title: 'Cash Income File',
        description: 'Drag cash income file here'
      },
      taxUpload: {
        title: 'Tax Document',
        description: 'Drag tax document here to determine tax amount'
      },
      summary: {
        title: 'Summary',
        payrollRecords: 'Payroll records:',
        cashRecords: 'Cash records:',
        totalPayroll: 'Total payroll:',
        taxAmount: 'Tax amount:',
        finalTotal: 'Final total:'
      },
      table: {
        employee: 'Employee',
        projectCode: 'Project Code',
        amount: 'Amount',
        date: 'Date',
        type: 'Type',
        actions: 'Actions'
      },
      types: {
        rental: 'Rental',
        nonRental: 'Non-rental',
        cash: 'Cash',
        bankTransfer: 'Bank Transfer'
      },
      monthlyView: {
        title: 'Monthly Payroll',
        viewRecords: 'View Records',
        downloadFiles: 'Download Files'
      },
      actions: {
        next: 'Next',
        back: 'Back',
        save: 'Save',
        saving: 'Saving...',
        edit: 'Edit',
        delete: 'Delete',
        ok: 'OK',
        cancel: 'Cancel',
        close: 'Close'
      },
      notifications: {
        extracted: 'Payroll data extracted successfully!',
        cashExtracted: 'Cash income data extracted successfully!',
        taxExtracted: 'Tax data extracted successfully!',
        saved: 'Payroll data saved successfully!',
        updated: 'Record updated successfully!',
        deleted: 'Record deleted successfully!',
        summaryDeleted: 'Monthly summary deleted successfully!',
        fileTypeError: 'Only JPG, PNG and PDF files can be uploaded.',
        noData: 'No data to save.',
        noOrganization: 'Select organization to save.',
        notLoggedIn: 'You are not logged in',
        processingError: 'Error occurred during processing:',
        saveError: 'Error occurred during save:',
        loadError: 'Error occurred while loading summaries',
        updateError: 'Error occurred during update:',
        deleteError: 'Error occurred during deletion:',
        fileUploadWarning: 'file upload failed, saving continues without file link.'
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