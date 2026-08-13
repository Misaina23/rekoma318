# ✅ QUICK TEST CHECKLIST

**Correction appliquée :** Frontend endpoint login (`/api/auth/login` au lieu de `/api/admin/login`)

---

## 🚀 TEST RAPIDE (5 minutes)

### ÉTAPE 1 : Vérifier le serveur frontend

```
URL: http://localhost:3000
Expected: Page d'accueil REKOMA charge
Status: ✅ ou ❌
```

### ÉTAPE 2 : Aller à la page login

```
URL: http://localhost:3000/admin/login
Expected: Page de connexion s'affiche
Status: ✅ ou ❌
```

### ÉTAPE 3 : Tester la connexion

```
Email: andrianisaina23@gmail.com
Password: 2311saina!
Action: Cliquer "Connexion"

Expected Result:
- ✅ Pas d'erreur 404
- ✅ Connexion réussie
- ✅ Redirect vers /admin/dashboard
- ✅ Nom d'utilisateur dans le header

Status: ✅ CONNECTÉ ou ❌ ERREUR
```

### ÉTAPE 4 : Vérifier les cookies (DevTools)

```
Touche F12 → Application → Cookies → localhost:3000

Expected:
- ✅ accessToken présent
- ✅ refreshToken présent
- ✅ CSRF token si nécessaire

Status: ✅ PRESENT ou ❌ MISSING
```

### ÉTAPE 5 : Vérifier la session

```
DevTools → Console, exécuter:

fetch('https://rekoma318.onrender.com/api/auth/me', {
  credentials: 'include'
})
.then(r => r.json())
.then(d => console.log(d))

Expected:
- ✅ Réponse avec user data
- ✅ Email, role, permissions affichés

Status: ✅ OK ou ❌ ERREUR
```

---

## 📋 RÉSUMÉ CORRECTIONS

| # | Fichier | Avant | Après | Status |
|----|---------|-------|-------|--------|
| 1 | `frontend/lib/api.ts` | `/api/admin/login` | `/api/auth/login` | ✅ FIXÉ |

---

## 🎯 RÉSULTAT ATTENDU

Si tout fonctionne :

```
✅ Page login accessible
✅ Connexion réussie avec credentials de test
✅ Dashboard administrateur accessible
✅ Cookies créés et valides
✅ Session utilisateur active
```

Si problème persiste :

```
❌ Page login ne charge pas → Check frontend server (npm run dev)
❌ Erreur 404 → Vérifier endpoint dans DevTools Network
❌ Erreur de credentials → Vérifier backend API en ligne
❌ Cookies manquants → Vérifier CORS configuration
```

---

## 📞 SUPPORT

Si vous rencontrez un problème :

1. **Ouvrir DevTools (F12)**
2. **Aller à l'onglet Network**
3. **Effectuer la connexion**
4. **Vérifier la requête POST**:
   - URL doit être: `https://rekoma318.onrender.com/api/auth/login`
   - Status doit être: `200 OK` (pas 404)
   - Response doit contenir: user data + tokens

---

**Test Status :** ⏳ **EN ATTENTE DE VALIDATION UTILISATEUR**

Veuillez tester et confirmer que la connexion fonctionne ! 🎉

